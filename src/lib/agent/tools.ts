import { defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";
import type { Bill } from "../../types/bill";
import type { Persona } from "../../types/persona";
import type {
  BillService,
  Recommendation,
  ServiceComparison,
} from "../../types/views";

type MatchPersonaInput = {
  stratum: number;
  household_size?: number;
};

type CompareUsageInput = {
  bill: Bill;
  personas: Persona[];
};

type CalculateSavingsInput = {
  bill: Bill;
  comparisons: ServiceComparison[];
};

const fallbackBills: Bill[] = [
  {
    billing_period: "marzo de 2026",
    provider: "EPM",
    currency: "COP",
    city: "Medellin",
    stratum: 5,
    total_due: 381239.05,
    electricity_kwh: 131,
    electricity_cost: 135064.67,
    water_m3: 8,
    water_cost: 73155.81,
    sewer_m3: 8,
    sewer_cost: 55131.65,
    gas_m3: 6.8,
    gas_cost: 30258.71,
    other_charges: 87628.21,
    due_date: "2026-04-18",
    confidence: 1,
    source_file: "marzo 26.pdf",
  },
  {
    billing_period: "abril de 2026",
    provider: "EPM",
    currency: "COP",
    city: "Medellin",
    stratum: 5,
    total_due: 354520.24,
    electricity_kwh: 142,
    electricity_cost: 136531.3,
    water_m3: 6,
    water_cost: 58561.35,
    sewer_m3: 6,
    sewer_cost: 43474.61,
    gas_m3: 5.9,
    gas_cost: 27787.7,
    other_charges: 88165.28,
    due_date: "2026-05-18",
    confidence: 1,
    source_file: "abril 26.pdf",
  },
];

const fallbackPersonas: Persona[] = [
  {
    id: "P11",
    label: "Laureles home office couple",
    zone: "Laureles",
    stratum: 5,
    home_type: "apartment",
    household_size: 2,
    work_pattern: "both remote",
    usage_profile: "multiple monitors and frequent daytime device use",
    expected_water_m3: [6, 8],
    expected_energy_kwh: [165, 205],
    expected_gas_m3: [5, 7],
  },
  {
    id: "P16",
    label: "Conquistadores elder care household",
    zone: "Conquistadores",
    stratum: 5,
    home_type: "apartment",
    household_size: 2,
    work_pattern: "daytime occupancy",
    usage_profile: "steady home presence with warm-water comfort",
    expected_water_m3: [7, 9],
    expected_energy_kwh: [125, 160],
    expected_gas_m3: [7, 10],
  },
  {
    id: "P03",
    label: "Envigado family with child",
    zone: "Envigado",
    stratum: 5,
    home_type: "apartment",
    household_size: 3,
    work_pattern: "mixed",
    usage_profile: "frequent hot water, laundry, and kitchen use",
    expected_water_m3: [8, 10],
    expected_energy_kwh: [155, 190],
    expected_gas_m3: [7, 10],
  },
  {
    id: "P21",
    label: "Belen solo renter",
    zone: "Belen",
    stratum: 4,
    home_type: "apartment",
    household_size: 1,
    work_pattern: "office hours",
    usage_profile: "low daytime occupancy and light cooking",
    expected_water_m3: [3, 5],
    expected_energy_kwh: [85, 125],
    expected_gas_m3: [2, 4],
  },
];

const billSchema = z.object({
  billing_period: z.string(),
  provider: z.string(),
  currency: z.string(),
  city: z.string(),
  stratum: z.number(),
  total_due: z.number(),
  electricity_kwh: z.number(),
  electricity_cost: z.number(),
  water_m3: z.number(),
  water_cost: z.number(),
  sewer_m3: z.number(),
  sewer_cost: z.number(),
  gas_m3: z.number(),
  gas_cost: z.number(),
  other_charges: z.number(),
  due_date: z.string().optional(),
  confidence: z.number(),
  source_file: z.string().optional(),
});

const personaSchema = z.object({
  id: z.string(),
  label: z.string(),
  zone: z.string(),
  stratum: z.number(),
  home_type: z.string(),
  household_size: z.number(),
  work_pattern: z.string(),
  usage_profile: z.string(),
  expected_water_m3: z.tuple([z.number(), z.number()]),
  expected_energy_kwh: z.tuple([z.number(), z.number()]),
  expected_gas_m3: z.tuple([z.number(), z.number()]),
});

const comparisonSchema = z.object({
  service: z.enum(["electricity", "water", "sewer", "gas"]),
  user_value: z.number(),
  persona_range: z.tuple([z.number(), z.number()]),
  status: z.enum(["below", "within", "above"]),
});

export function getBills(): Bill[] {
  return fallbackBills;
}

export function getMatchingPersonas(
  input: MatchPersonaInput,
  availablePersonas: Persona[] = fallbackPersonas,
): Persona[] {
  const exactStratum = availablePersonas.filter(
    (persona) => persona.stratum === input.stratum,
  );
  const candidates = exactStratum.length > 0 ? exactStratum : availablePersonas;

  return [...candidates]
    .sort((a, b) => {
      const householdDeltaA =
        input.household_size === undefined
          ? 0
          : Math.abs(a.household_size - input.household_size);
      const householdDeltaB =
        input.household_size === undefined
          ? 0
          : Math.abs(b.household_size - input.household_size);
      const stratumDeltaA = Math.abs(a.stratum - input.stratum);
      const stratumDeltaB = Math.abs(b.stratum - input.stratum);

      return (
        stratumDeltaA - stratumDeltaB ||
        householdDeltaA - householdDeltaB ||
        a.label.localeCompare(b.label)
      );
    })
    .slice(0, 5);
}

export function compareUsage({
  bill,
  personas,
}: CompareUsageInput): ServiceComparison[] {
  const comparisons: ServiceComparison[] = [];

  comparisons.push(
    compareService(
      "electricity",
      bill.electricity_kwh,
      averageRange(personas.map((persona) => persona.expected_energy_kwh)),
    ),
  );
  comparisons.push(
    compareService(
      "water",
      bill.water_m3,
      averageRange(personas.map((persona) => persona.expected_water_m3)),
    ),
  );
  comparisons.push(
    compareService(
      "sewer",
      bill.sewer_m3,
      averageRange(personas.map((persona) => persona.expected_water_m3)),
    ),
  );
  comparisons.push(
    compareService(
      "gas",
      bill.gas_m3,
      averageRange(personas.map((persona) => persona.expected_gas_m3)),
    ),
  );

  return comparisons;
}

export function calculateSavings({
  bill,
  comparisons,
}: CalculateSavingsInput): Recommendation[] {
  const statusByService = new Map(
    comparisons.map((comparison) => [comparison.service, comparison.status]),
  );
  const recommendations: Recommendation[] = [];

  if (statusByService.get("electricity") !== "below") {
    recommendations.push({
      action: "Run high-load appliances outside peak evening routines and unplug standby electronics.",
      estimated_savings_cop: estimatePercent(bill.electricity_cost, 0.08),
      difficulty: "easy",
      reasoning: `Electricity is ${bill.electricity_kwh} kWh on this bill, with COP ${roundCop(bill.electricity_cost)} charged for energy.`,
    });
  }

  if (
    statusByService.get("water") === "above" ||
    statusByService.get("sewer") === "above" ||
    bill.water_m3 >= 6
  ) {
    recommendations.push({
      action: "Check for toilet leaks and reduce shower time by two minutes per shower.",
      estimated_savings_cop: estimatePercent(
        bill.water_cost + bill.sewer_cost,
        0.1,
      ),
      difficulty: "easy",
      reasoning: `Water/sewer usage is ${bill.water_m3} m3, so each saved m3 lowers both acueducto and alcantarillado charges.`,
    });
  }

  if (statusByService.get("gas") !== "below") {
    recommendations.push({
      action: "Lower water-heater temperature slightly and batch hot-water tasks.",
      estimated_savings_cop: estimatePercent(bill.gas_cost, 0.12),
      difficulty: "medium",
      reasoning: `Gas usage is ${bill.gas_m3} m3, producing COP ${roundCop(bill.gas_cost)} in gas charges.`,
    });
  }

  if (bill.other_charges > 0) {
    recommendations.push({
      action: "Review third-party/other-entities charges and cancel services you no longer use.",
      estimated_savings_cop: estimatePercent(bill.other_charges, 0.05),
      difficulty: "medium",
      reasoning: `Other entities represent COP ${roundCop(bill.other_charges)} of the total bill.`,
    });
  }

  recommendations.push({
    action: "Set a monthly bill review after upload and compare against the previous period before the due date.",
    estimated_savings_cop: estimatePercent(bill.total_due, 0.03),
    difficulty: "effort",
    reasoning: `A 3% avoidable-usage target on COP ${roundCop(bill.total_due)} creates a concrete monthly goal.`,
  });

  return recommendations
    .sort((a, b) => b.estimated_savings_cop - a.estimated_savings_cop)
    .slice(0, 5);
}

export function getBiggestDriver(bill: Bill): BillService {
  const services: Array<[BillService, number]> = [
    ["electricity", bill.electricity_cost],
    ["water", bill.water_cost],
    ["sewer", bill.sewer_cost],
    ["gas", bill.gas_cost],
    ["other", bill.other_charges],
  ];

  return services.reduce((largest, service) =>
    service[1] > largest[1] ? service : largest,
  )[0];
}

export const kanaTools = [
  defineTool({
    name: "get_bills",
    description:
      "Return mocked parsed EPM bills for fallback/demo flows when no uploaded bill context is available.",
    parameters: z.object({}),
    execute: async () => getBills(),
  }),
  defineTool({
    name: "get_matching_personas",
    description:
      "Return the top Medellin household personas matching a bill stratum and optional household size.",
    parameters: z.object({
      stratum: z.number(),
      household_size: z.number().optional(),
    }),
    execute: async (input) => getMatchingPersonas(input),
  }),
  defineTool({
    name: "compare_usage",
    description:
      "Compare a parsed bill against matching personas and return per-service below/within/above statuses.",
    parameters: z.object({
      bill: billSchema,
      personas: z.array(personaSchema),
    }),
    execute: async (input) => compareUsage(input),
  }),
  defineTool({
    name: "calculate_savings",
    description:
      "Return 3-5 grounded savings recommendations with estimated monthly COP impact.",
    parameters: z.object({
      bill: billSchema,
      comparisons: z.array(comparisonSchema),
    }),
    execute: async (input) => calculateSavings(input),
  }),
];

function compareService(
  service: ServiceComparison["service"],
  userValue: number,
  personaRange: [number, number],
): ServiceComparison {
  const [min, max] = personaRange;
  const status =
    userValue < min ? "below" : userValue > max ? "above" : "within";

  return {
    service,
    user_value: userValue,
    persona_range: personaRange,
    status,
  };
}

function averageRange(ranges: Array<[number, number]>): [number, number] {
  if (ranges.length === 0) {
    return [0, 0];
  }

  const totals = ranges.reduce(
    (acc, range) => [acc[0] + range[0], acc[1] + range[1]],
    [0, 0],
  );

  return [
    roundUsage(totals[0] / ranges.length),
    roundUsage(totals[1] / ranges.length),
  ];
}

function estimatePercent(value: number, percent: number): number {
  return Math.max(1000, roundCop(value * percent));
}

function roundCop(value: number): number {
  return Math.round(value);
}

function roundUsage(value: number): number {
  return Math.round(value * 10) / 10;
}
