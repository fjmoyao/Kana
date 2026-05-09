import type { Bill } from "../../types/bill";

type NullableBillDraft = {
  [Key in keyof Bill]: Bill[Key] | null;
};

export type ParseEpmBillOptions = {
  sourceFile?: string;
  useClaude?: boolean;
};

const REQUIRED_FIELDS: Array<keyof Bill> = [
  "billing_period",
  "provider",
  "currency",
  "city",
  "stratum",
  "total_due",
  "electricity_kwh",
  "electricity_cost",
  "water_m3",
  "water_cost",
  "sewer_m3",
  "sewer_cost",
  "gas_m3",
  "gas_cost",
  "other_charges",
];

const SERVICE_CONFIGS = [
  {
    aliases: ["acueducto", "agua"],
    usageField: "water_m3",
    costField: "water_cost",
    usageUnit: "m3",
  },
  {
    aliases: ["alcantarillado"],
    usageField: "sewer_m3",
    costField: "sewer_cost",
    usageUnit: "m3",
  },
  {
    aliases: ["energia electrica", "energía eléctrica", "energia", "energía", "electricidad"],
    usageField: "electricity_kwh",
    costField: "electricity_cost",
    usageUnit: "kwh",
  },
  {
    aliases: ["gas"],
    usageField: "gas_m3",
    costField: "gas_cost",
    usageUnit: "m3",
  },
] as const;

const ROW_BOUNDARY_ALIASES = [
  "otras entidades",
  "otros cobros",
  "otros conceptos",
  "total a pagar",
  "valor total a pagar",
  "total factura",
  "total de la factura",
];

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

export async function parseEpmBill(
  rawText: string,
  options: ParseEpmBillOptions = {},
): Promise<Bill> {
  assertRawText(rawText);

  if (options.useClaude !== false && process.env.ANTHROPIC_API_KEY) {
    try {
      return finalizeBill(
        await extractWithClaude(rawText, options.sourceFile),
        rawText,
        options.sourceFile,
      );
    } catch (error) {
      console.warn(`Claude extraction failed; falling back to local parser. ${String(error)}`);
    }
  }

  return finalizeBill(parseLocally(rawText, options.sourceFile), rawText, options.sourceFile);
}

export function parseEpmBillLocally(rawText: string, sourceFile?: string): Bill {
  assertRawText(rawText);
  return finalizeBill(parseLocally(rawText, sourceFile), rawText, sourceFile);
}

function extractionPrompt(rawText: string): string {
  return [
    "Extract a structured Kana Bill object from this Medellin EPM utility bill text.",
    "",
    "EPM service categories and Spanish labels:",
    "- acueducto: water usage in m3 and cost in COP",
    "- alcantarillado: sewer usage in m3 and cost in COP",
    "- energia or energia electrica: electricity usage in kWh and cost in COP",
    "- gas: gas usage in m3 and cost in COP",
    "- otros cobros, otros conceptos, or otras entidades: other charges in COP only",
    "",
    "Spanish/COP formatting rules:",
    "- Colombian currency may use thousands dots and decimal commas, such as $ 354.520,24.",
    "- Decimal usage may use commas, such as 5,9 m3.",
    "- Return numbers as JSON numbers, not formatted strings.",
    "- Preserve billing_period as Spanish text, for example \"abril de 2026\".",
    "",
    "Output must match the Bill TypeScript interface exactly:",
    "billing_period, provider, currency, city, stratum, total_due, electricity_kwh, electricity_cost, water_m3, water_cost, sewer_m3, sewer_cost, gas_m3, gas_cost, other_charges, due_date, confidence, source_file.",
    "",
    "Raw bill text:",
    rawText,
  ].join("\n");
}

async function extractWithClaude(rawText: string, sourceFile?: string): Promise<Partial<Bill>> {
  const anthropicModule = await import("@anthropic-ai/sdk");
  const Anthropic = anthropicModule.default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    max_tokens: 1200,
    temperature: 0,
    tools: [
      {
        name: "record_bill",
        description: "Record the structured EPM bill fields.",
        input_schema: billJsonSchema(),
      },
    ],
    tool_choice: { type: "tool", name: "record_bill" },
    messages: [
      {
        role: "user",
        content: extractionPrompt(rawText),
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return the required record_bill tool output.");
  }

  return {
    ...(toolUse.input as Partial<Bill>),
    source_file: sourceFile ?? (toolUse.input as Partial<Bill>).source_file,
  };
}

function parseLocally(rawText: string, sourceFile?: string): Partial<Bill> {
  const text = normalizeWhitespace(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const draft: Partial<Bill> = {
    source_file: sourceFile,
    provider: parseProvider(text) ?? undefined,
    billing_period: parseBillingPeriod(text, sourceFile) ?? undefined,
    currency: "COP",
    city: parseCity(text) ?? undefined,
    stratum: parseStratum(text) ?? undefined,
    total_due: parseLabeledMoney(text, [
      "total a pagar",
      "valor total a pagar",
      "total factura",
      "total de la factura",
    ]) ?? undefined,
    other_charges: parseOtherCharges(lines) ?? undefined,
    due_date: parseDueDate(text) ?? undefined,
  };

  for (const service of SERVICE_CONFIGS) {
    const serviceResult = parseService(lines, service);
    draft[service.usageField] = serviceResult.usage ?? undefined;
    draft[service.costField] = serviceResult.cost ?? undefined;
  }

  return draft;
}

function finalizeBill(draft: Partial<Bill>, rawText: string, sourceFile?: string): Bill {
  const merged: NullableBillDraft = {
    source_file: draft.source_file ?? sourceFile ?? null,
    provider: draft.provider ?? parseProvider(rawText) ?? "EPM",
    billing_period: draft.billing_period ?? parseBillingPeriod(rawText, sourceFile),
    currency: draft.currency ?? "COP",
    city: draft.city ?? parseCity(rawText),
    stratum: draft.stratum ?? parseStratum(rawText),
    total_due: coerceNullableNumber(draft.total_due),
    electricity_kwh: coerceNullableNumber(draft.electricity_kwh),
    electricity_cost: coerceNullableNumber(draft.electricity_cost),
    water_m3: coerceNullableNumber(draft.water_m3),
    water_cost: coerceNullableNumber(draft.water_cost),
    sewer_m3: coerceNullableNumber(draft.sewer_m3),
    sewer_cost: coerceNullableNumber(draft.sewer_cost),
    gas_m3: coerceNullableNumber(draft.gas_m3),
    gas_cost: coerceNullableNumber(draft.gas_cost),
    other_charges: coerceNullableNumber(draft.other_charges),
    due_date: draft.due_date ?? parseDueDate(rawText),
    confidence: 0,
  };

  if (merged.total_due == null) {
    merged.total_due = estimateTotalDue(merged);
  }

  merged.confidence = scoreConfidence(merged);

  return merged as Bill;
}

function scoreConfidence(record: NullableBillDraft): number {
  const missingCount = REQUIRED_FIELDS.filter((field) => record[field] == null).length;
  return Math.max(0, Number((1 - missingCount * 0.1).toFixed(1)));
}

function parseProvider(text: string): string | null {
  return /\b(epm|empresas publicas de medellin|empresas publicas de medellín)\b/i.test(
    stripAccents(text),
  )
    ? "EPM"
    : null;
}

function parseCity(text: string): string | null {
  return /\bmedell[ií]n\b/i.test(text) ? "Medellín" : null;
}

function parseStratum(text: string): number | null {
  const match = stripAccents(text).match(/\bestrato\s*:?\s*([1-6])\b/i);
  return match ? Number(match[1]) : null;
}

function parseBillingPeriod(text: string, sourceFile?: string): string | null {
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

  return sourceFile ? inferPeriodFromFilename(sourceFile) : null;
}

function parseDueDate(text: string): string | undefined {
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

  return undefined;
}

function parseService(
  lines: string[],
  service: (typeof SERVICE_CONFIGS)[number],
): { usage: number | null; cost: number | null } {
  let best = { usage: null as number | null, cost: null as number | null, score: 0 };

  lines.forEach((line, index) => {
    const folded = stripAccents(line).toLowerCase();
    if (!service.aliases.some((alias) => stripAccents(alias).toLowerCase() === folded || folded.includes(stripAccents(alias).toLowerCase()))) {
      return;
    }

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

function serviceBlock(lines: string[], startIndex: number, currentService: (typeof SERVICE_CONFIGS)[number]): string[] {
  const block = [lines[startIndex]];

  for (let index = startIndex + 1; index < Math.min(lines.length, startIndex + 5); index += 1) {
    if (hasServiceAlias(lines[index], currentService) || hasRowBoundary(lines[index])) break;
    block.push(lines[index]);
  }

  return block;
}

function hasServiceAlias(line: string, excludedService?: { aliases?: readonly string[] }): boolean {
  const folded = stripAccents(line).toLowerCase();
  return SERVICE_CONFIGS.some((service) => {
    if (service === excludedService) return false;
    return service.aliases.some((alias) => folded.includes(stripAccents(alias).toLowerCase()));
  });
}

function hasRowBoundary(line: string): boolean {
  const folded = stripAccents(line).toLowerCase();
  return ROW_BOUNDARY_ALIASES.some((alias) => folded.includes(alias));
}

function parseUsage(text: string, unit: "m3" | "kwh"): number | null {
  const folded = stripAccents(text).toLowerCase();
  const unitPattern = unit === "kwh" ? "k\\s*w\\s*h|kwh" : "m\\s*3|m3|m³";
  const pattern = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${unitPattern})\\b`, "i");
  const match = folded.match(pattern);
  return match ? parseLocaleNumber(match[1]) : null;
}

function parseOtherCharges(lines: string[]): number | null {
  const aliases = ["otras entidades", "otros cobros", "otros conceptos", "entidades", "aseo"];
  let best: number | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const folded = stripAccents(lines[index]).toLowerCase();
    if (!aliases.some((alias) => folded.includes(alias))) continue;
    const block = [lines[index]];

    for (let offset = index + 1; offset < Math.min(lines.length, index + 4); offset += 1) {
      if (hasRowBoundary(lines[offset]) || hasServiceAlias(lines[offset])) break;
      block.push(lines[offset]);
    }

    const value = largestMoneyValue(block.join(" "), { minimum: 1000 });
    if (value != null) best = Math.max(best ?? 0, value);
  }

  return best;
}

function parseLabeledMoney(text: string, labels: string[]): number | null {
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

function largestMoneyValue(text: string, options: { minimum?: number } = {}): number | null {
  const minimum = options.minimum ?? 0;
  const values = extractMoneyValues(text).filter((value) => value >= minimum);
  return values.length ? Math.max(...values) : null;
}

function extractMoneyValues(text: string): number[] {
  const moneyMatches = text.matchAll(
    /(?:\$|cop\s*)?\s*(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}(?:[.,]\d{1,2})?)/gi,
  );
  return Array.from(moneyMatches, (match) => parseLocaleNumber(match[1])).filter(
    (value): value is number => Number.isFinite(value),
  );
}

function parseLocaleNumber(value: string | number | null | undefined): number | null {
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
    normalized = raw.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".");
  } else if (hasComma || hasDot) {
    const separator = hasComma ? "," : ".";
    const [head, tail] = raw.split(separator);
    normalized = tail && tail.length === 3 && head.length <= 3 ? head + tail : raw.replace(separator, ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSpanishDate(text: string): string | null {
  const match = text.match(
    /\b(\d{1,2})\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(20\d{2})\b/i,
  );
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = MONTHS_ES.get(match[2].toLowerCase());
  return month ? `${match[3]}-${month}-${day}` : null;
}

function parseNumericDate(text: string): string | null {
  const match = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (!match) return null;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function formatSpanishPeriod(value: string): string {
  const match = stripAccents(value)
    .toLowerCase()
    .match(
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de)?\s+(20\d{2})\b/i,
    );
  return match ? `${match[1]} de ${match[2]}` : value.trim();
}

function inferPeriodFromFilename(sourceFile: string): string | null {
  const match = stripAccents(sourceFile)
    .toLowerCase()
    .match(
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{2}|\d{4})\b/i,
    );
  if (!match) return null;
  const year = match[2].length === 2 ? `20${match[2]}` : match[2];
  return `${match[1]} de ${year}`;
}

function estimateTotalDue(record: NullableBillDraft): number | null {
  const parts = [
    record.electricity_cost,
    record.water_cost,
    record.sewer_cost,
    record.gas_cost,
    record.other_charges,
  ].filter((value): value is number => typeof value === "number");

  return parts.length >= 3 ? roundMoney(parts.reduce((sum, value) => sum + value, 0)) : null;
}

function coerceNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return parseLocaleNumber(value);
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function billJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      billing_period: { type: "string" },
      provider: { type: "string" },
      currency: { type: "string" },
      city: { type: "string" },
      stratum: { type: "number" },
      total_due: { type: "number" },
      electricity_kwh: { type: "number" },
      electricity_cost: { type: "number" },
      water_m3: { type: "number" },
      water_cost: { type: "number" },
      sewer_m3: { type: "number" },
      sewer_cost: { type: "number" },
      gas_m3: { type: "number" },
      gas_cost: { type: "number" },
      other_charges: { type: "number" },
      due_date: { type: "string" },
      confidence: { type: "number" },
      source_file: { type: "string" },
    },
    required: REQUIRED_FIELDS,
  } as const;
}

function assertRawText(rawText: string): void {
  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    throw new Error("parseEpmBill requires non-empty extracted bill text.");
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
