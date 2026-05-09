import type { Bill } from "../../types/bill";
import type {
  BillService,
  ServiceComparison,
  ServiceDelta,
} from "../../types/views";

export const SERVICE_META: Record<
  BillService,
  {
    label: string;
    accent: string;
    fill: string;
    surface: string;
    ink: string;
  }
> = {
  electricity: {
    label: "Energía",
    accent: "#d97706",
    fill: "#f59e0b",
    surface: "#fffbeb",
    ink: "#78350f",
  },
  water: {
    label: "Agua",
    accent: "#2563eb",
    fill: "#60a5fa",
    surface: "#eff6ff",
    ink: "#1d4ed8",
  },
  sewer: {
    label: "Alcantarillado",
    accent: "#475569",
    fill: "#94a3b8",
    surface: "#f8fafc",
    ink: "#334155",
  },
  gas: {
    label: "Gas",
    accent: "#ea580c",
    fill: "#fb923c",
    surface: "#fff7ed",
    ink: "#9a3412",
  },
  other: {
    label: "Otros",
    accent: "#6b7280",
    fill: "#d1d5db",
    surface: "#f9fafb",
    ink: "#374151",
  },
};

const COP_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const INTEGER_FORMATTER = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

type BillFieldMap = {
  cost: keyof Bill;
  usage?: keyof Bill;
  unit?: "kWh" | "m3" | "m³";
};

const SERVICE_FIELDS: Record<BillService, BillFieldMap> = {
  electricity: {
    cost: "electricity_cost",
    usage: "electricity_kwh",
    unit: "kWh",
  },
  water: {
    cost: "water_cost",
    usage: "water_m3",
    unit: "m³",
  },
  sewer: {
    cost: "sewer_cost",
    usage: "sewer_m3",
    unit: "m³",
  },
  gas: {
    cost: "gas_cost",
    usage: "gas_m3",
    unit: "m³",
  },
  other: {
    cost: "other_charges",
  },
};

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatCop(value: number) {
  return COP_FORMATTER.format(value);
}

export function formatUsage(value: number, unit: "kWh" | "m3" | "m³") {
  if (unit === "kWh") {
    return `${INTEGER_FORMATTER.format(value)} ${unit}`;
  }

  return `${DECIMAL_FORMATTER.format(value)} m³`;
}

export function formatValue(value: number, unit: "kWh" | "m3" | "m³" | "COP") {
  if (unit === "COP") {
    return formatCop(value);
  }

  return formatUsage(value, unit);
}

export function formatSignedValue(value: number, unit: "kWh" | "m3" | "m³" | "COP") {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);

  return `${sign}${formatValue(absoluteValue, unit)}`;
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function getServiceBreakdown(bill: Bill) {
  const total =
    bill.electricity_cost +
    bill.water_cost +
    bill.sewer_cost +
    bill.gas_cost +
    bill.other_charges;

  return (Object.keys(SERVICE_FIELDS) as BillService[]).map((service) => {
    const mapping = SERVICE_FIELDS[service];
    const cost = Number(bill[mapping.cost] ?? 0);
    const usage = mapping.usage ? Number(bill[mapping.usage] ?? 0) : null;

    return {
      service,
      cost,
      usage,
      unit: mapping.unit ?? null,
      share: total > 0 ? (cost / total) * 100 : 0,
    };
  });
}

export function getBiggestDriverLabel(service: BillService) {
  return SERVICE_META[service]?.label ?? service;
}

export function getDueState(dueDate?: string) {
  if (!dueDate) {
    return null;
  }

  const parsed = new Date(dueDate);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(parsed);
  due.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilDue < 3) {
    return {
      label: "Urgente",
      description: `${Math.max(daysUntilDue, 0)} días`,
      className: "bg-rose-100 text-rose-700 border-rose-200",
    };
  }

  if (daysUntilDue < 7) {
    return {
      label: "Próximo",
      description: `${daysUntilDue} días`,
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "A tiempo",
    description: `${daysUntilDue} días`,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
}

export function getDeltaTone(changePercent: number) {
  if (changePercent > 0) {
    return "text-rose-600";
  }

  if (changePercent < 0) {
    return "text-emerald-600";
  }

  return "text-slate-500";
}

export function getDeltaDirection(changePercent: number) {
  if (changePercent > 0) {
    return "up";
  }

  if (changePercent < 0) {
    return "down";
  }

  return "flat";
}

export function getTrendValues(bills: Bill[], service: ServiceDelta["service"]) {
  switch (service) {
    case "electricity":
      return bills.map((bill) => bill.electricity_kwh);
    case "water":
      return bills.map((bill) => bill.water_m3);
    case "sewer":
      return bills.map((bill) => bill.sewer_m3);
    case "gas":
      return bills.map((bill) => bill.gas_m3);
    case "other":
      return bills.map((bill) => bill.other_charges);
    case "total":
      return bills.map((bill) => bill.total_due);
    default:
      return [];
  }
}

export function sparklinePoints(values: number[], width = 112, height = 34) {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export function comparisonPosition(comparison: ServiceComparison) {
  const [min, max] = comparison.persona_range;
  const span = Math.max(max - min, 1);
  const lowerBound = Math.max(0, min - span * 0.5);
  const upperBound = max + span * 0.5;

  return {
    min,
    max,
    lowerBound,
    upperBound,
    position:
      ((comparison.user_value - lowerBound) / (upperBound - lowerBound)) * 100,
    bandStart: ((min - lowerBound) / (upperBound - lowerBound)) * 100,
    bandWidth: ((max - min) / (upperBound - lowerBound)) * 100,
  };
}

export function getComparisonTone(status: ServiceComparison["status"]) {
  switch (status) {
    case "below":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "above":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-sky-100 text-sky-700 border-sky-200";
  }
}

export function getComparisonLabel(status: ServiceComparison["status"]) {
  switch (status) {
    case "below":
      return "Below average";
    case "above":
      return "Above average";
    default:
      return "Within range";
  }
}

export function getDifficultyTone(difficulty: "easy" | "medium" | "effort") {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-orange-100 text-orange-700 border-orange-200";
  }
}
