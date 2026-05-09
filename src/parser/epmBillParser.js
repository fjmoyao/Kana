const MONTHS_ES = new Map([
  ["enero", "01"],
  ["febrero", "02"],
  ["marzo", "03"],
  ["abril", "04"],
  ["mayo", "05"],
  ["junio", "06"],
  ["julio", "07"],
  ["agosto", "08"],
  ["septiembre", "09"],
  ["setiembre", "09"],
  ["octubre", "10"],
  ["noviembre", "11"],
  ["diciembre", "12"],
]);

const SERVICE_CONFIGS = [
  {
    name: "water",
    aliases: ["acueducto", "agua"],
    usageField: "water_m3",
    costField: "water_cost",
    usageUnit: "m3",
  },
  {
    name: "sewer",
    aliases: ["alcantarillado"],
    usageField: "sewer_m3",
    costField: "sewer_cost",
    usageUnit: "m3",
  },
  {
    name: "electricity",
    aliases: ["energia electrica", "energia", "electricidad"],
    usageField: "electricity_kwh",
    costField: "electricity_cost",
    usageUnit: "kwh",
  },
  {
    name: "gas",
    aliases: ["gas"],
    usageField: "gas_m3",
    costField: "gas_cost",
    usageUnit: "m3",
  },
];

const ROW_BOUNDARY_ALIASES = [
  "otras entidades",
  "otros cobros",
  "otros conceptos",
  "total a pagar",
  "valor total a pagar",
  "total factura",
  "total de la factura",
];

export function parseEpmBillText(rawText, options = {}) {
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error("parseEpmBillText requires non-empty extracted bill text.");
  }

  const text = normalizeWhitespace(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const parsed = {
    source_file: options.sourceFile ?? null,
    provider: parseProvider(text),
    billing_period: parseBillingPeriod(text, options.sourceFile),
    currency: "COP",
    total_due: parseLabeledMoney(text, [
      "total a pagar",
      "valor total a pagar",
      "total factura",
      "total de la factura",
    ]),
    electricity_kwh: null,
    electricity_cost: null,
    water_m3: null,
    water_cost: null,
    sewer_m3: null,
    sewer_cost: null,
    gas_m3: null,
    gas_cost: null,
    other_charges: parseOtherCharges(lines),
    due_date: parseDueDate(text),
    confidence: 0,
  };

  for (const service of SERVICE_CONFIGS) {
    const serviceResult = parseService(lines, service);
    parsed[service.usageField] = serviceResult.usage;
    parsed[service.costField] = serviceResult.cost;
  }

  if (parsed.total_due == null) {
    parsed.total_due = estimateTotalDue(parsed);
  }

  parsed.confidence = scoreConfidence(parsed);

  return parsed;
}

export function normalizeBillRecord(record) {
  return {
    source_file: record.source_file ?? null,
    provider: record.provider ?? "EPM",
    billing_period: record.billing_period ?? null,
    currency: record.currency ?? "COP",
    total_due: coerceNullableNumber(record.total_due),
    electricity_kwh: coerceNullableNumber(record.electricity_kwh),
    electricity_cost: coerceNullableNumber(record.electricity_cost),
    water_m3: coerceNullableNumber(record.water_m3),
    water_cost: coerceNullableNumber(record.water_cost),
    sewer_m3: coerceNullableNumber(record.sewer_m3),
    sewer_cost: coerceNullableNumber(record.sewer_cost),
    gas_m3: coerceNullableNumber(record.gas_m3),
    gas_cost: coerceNullableNumber(record.gas_cost),
    other_charges: coerceNullableNumber(record.other_charges),
    due_date: record.due_date ?? null,
    confidence: coerceNullableNumber(record.confidence) ?? 0,
  };
}

function parseProvider(text) {
  return /\b(epm|empresas publicas de medellin|empresas publicas de medellín)\b/i.test(
    stripAccents(text),
  )
    ? "EPM"
    : null;
}

function parseBillingPeriod(text, sourceFile) {
  const normalized = stripAccents(text).toLowerCase();
  const labeledPatterns = [
    /periodo\s+(?:facturado|de\s+facturacion|de\s+consumo)\s*:?\s*([a-z]+(?:\s+de)?\s+\d{4})/i,
    /mes\s+(?:facturado|de\s+consumo)\s*:?\s*([a-z]+(?:\s+de)?\s+\d{4})/i,
  ];

  for (const pattern of labeledPatterns) {
    const match = normalized.match(pattern);
    if (match) return formatSpanishPeriod(match[1]);
  }

  const looseMonth = normalized.match(
    /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de)?\s+(20\d{2})\b/i,
  );
  if (looseMonth) return `${looseMonth[1]} de ${looseMonth[2]}`;

  if (sourceFile) {
    const inferred = inferPeriodFromFilename(sourceFile);
    if (inferred) return inferred;
  }

  return null;
}

function parseDueDate(text) {
  const normalized = stripAccents(text).toLowerCase();
  const dateLabels = [
    "fecha limite de pago",
    "fecha de pago oportuno",
    "pago oportuno",
    "pagar hasta",
    "vence",
  ];

  for (const label of dateLabels) {
    const index = normalized.indexOf(label);
    if (index === -1) continue;
    const window = normalized.slice(index, index + 140);
    const isoDate = parseSpanishDate(window) ?? parseNumericDate(window);
    if (isoDate) return isoDate;
  }

  return null;
}

function parseService(lines, service) {
  let best = { usage: null, cost: null, score: 0 };

  lines.forEach((line, index) => {
    const folded = stripAccents(line).toLowerCase();
    if (!service.aliases.some((alias) => folded.includes(alias))) return;

    const window = serviceBlock(lines, index, service).join(" ");
    const usage = parseUsage(window, service.usageUnit);
    const cost = largestMoneyValue(window, { minimum: 1000 });
    const score = Number(usage != null) + Number(cost != null);

    if (score > best.score) {
      best = { usage, cost, score };
    }
  });

  return { usage: best.usage, cost: best.cost };
}

function serviceBlock(lines, startIndex, currentService) {
  const block = [lines[startIndex]];

  for (let index = startIndex + 1; index < Math.min(lines.length, startIndex + 5); index += 1) {
    if (hasServiceAlias(lines[index], currentService) || hasRowBoundary(lines[index])) break;
    block.push(lines[index]);
  }

  return block;
}

function hasServiceAlias(line, excludedService) {
  const folded = stripAccents(line).toLowerCase();
  return SERVICE_CONFIGS.some((service) => {
    if (service.name === excludedService.name) return false;
    return service.aliases.some((alias) => folded.includes(alias));
  });
}

function hasRowBoundary(line) {
  const folded = stripAccents(line).toLowerCase();
  return ROW_BOUNDARY_ALIASES.some((alias) => folded.includes(alias));
}

function parseUsage(text, unit) {
  const folded = stripAccents(text).toLowerCase();
  const unitPattern = unit === "kwh" ? "k\\s*w\\s*h|kwh" : "m\\s*3|m3|m³";
  const pattern = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${unitPattern})\\b`, "i");
  const match = folded.match(pattern);
  return match ? parseLocaleNumber(match[1]) : null;
}

function parseOtherCharges(lines) {
  const aliases = [
    "otras entidades",
    "otros cobros",
    "otros conceptos",
    "entidades",
    "aseo",
  ];

  let best = null;
  for (let index = 0; index < lines.length; index += 1) {
    const folded = stripAccents(lines[index]).toLowerCase();
    if (!aliases.some((alias) => folded.includes(alias))) continue;
    const block = [lines[index]];
    for (let offset = index + 1; offset < Math.min(lines.length, index + 4); offset += 1) {
      if (hasRowBoundary(lines[offset]) || hasServiceAlias(lines[offset], { name: null })) break;
      block.push(lines[offset]);
    }
    const value = largestMoneyValue(block.join(" "), {
      minimum: 1000,
    });
    if (value != null) best = Math.max(best ?? 0, value);
  }
  return best;
}

function parseLabeledMoney(text, labels) {
  const folded = stripAccents(text).toLowerCase();
  for (const label of labels) {
    const index = folded.indexOf(label);
    if (index === -1) continue;
    const window = text.slice(index, index + 160);
    const value = largestMoneyValue(window, { minimum: 1000 });
    if (value != null) return value;
  }
  return null;
}

function largestMoneyValue(text, options = {}) {
  const minimum = options.minimum ?? 0;
  const values = extractMoneyValues(text).filter((value) => value >= minimum);
  return values.length ? Math.max(...values) : null;
}

function extractMoneyValues(text) {
  const moneyMatches = text.matchAll(
    /(?:\$|cop\s*)?\s*(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}(?:[.,]\d{1,2})?)/gi,
  );
  return Array.from(moneyMatches, (match) => parseLocaleNumber(match[1])).filter(
    (value) => Number.isFinite(value),
  );
}

function parseLocaleNumber(value) {
  if (value == null) return null;
  const raw = String(value).trim().replace(/\s/g, "");
  if (!raw) return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const hasComma = lastComma !== -1;
  const hasDot = lastDot !== -1;

  let normalized = raw;
  if (hasComma && hasDot) {
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = raw
      .replaceAll(thousandsSeparator, "")
      .replace(decimalSeparator, ".");
  } else if (hasComma || hasDot) {
    const separator = hasComma ? "," : ".";
    const [head, tail] = raw.split(separator);
    normalized =
      tail && tail.length === 3 && head.length <= 3
        ? head + tail
        : raw.replace(separator, ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSpanishDate(text) {
  const match = text.match(
    /\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(20\d{2})\b/i,
  );
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = MONTHS_ES.get(match[2].toLowerCase());
  return month ? `${match[3]}-${month}-${day}` : null;
}

function parseNumericDate(text) {
  const match = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (!match) return null;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function formatSpanishPeriod(value) {
  const match = stripAccents(value)
    .toLowerCase()
    .match(
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de)?\s+(20\d{2})\b/i,
    );
  return match ? `${match[1]} de ${match[2]}` : value.trim();
}

function inferPeriodFromFilename(sourceFile) {
  const match = stripAccents(sourceFile)
    .toLowerCase()
    .match(
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{2}|\d{4})\b/i,
    );
  if (!match) return null;
  const year = match[2].length === 2 ? `20${match[2]}` : match[2];
  return `${match[1]} de ${year}`;
}

function estimateTotalDue(record) {
  const parts = [
    record.electricity_cost,
    record.water_cost,
    record.sewer_cost,
    record.gas_cost,
    record.other_charges,
  ].filter((value) => typeof value === "number");

  return parts.length >= 3 ? roundMoney(parts.reduce((sum, value) => sum + value, 0)) : null;
}

function scoreConfidence(record) {
  const checks = [
    record.provider,
    record.billing_period,
    record.total_due,
    record.electricity_kwh,
    record.electricity_cost,
    record.water_m3,
    record.water_cost,
    record.sewer_m3,
    record.sewer_cost,
    record.gas_m3,
    record.gas_cost,
  ];
  const score = checks.filter((value) => value != null).length / checks.length;
  return Number(score.toFixed(2));
}

function coerceNullableNumber(value) {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function stripAccents(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
