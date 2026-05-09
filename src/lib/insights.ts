import { sampleBills, personas as samplePersonas } from "@/lib/sample-data";
import type { Bill } from "@/types/bill";
import type { Persona } from "@/types/persona";
import type {
  BillService,
  Recommendation,
  ServiceComparison,
} from "@/types/views";

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

export function getBills(): Bill[] {
  return sampleBills;
}

export function getMatchingPersonas(
  input: MatchPersonaInput,
  availablePersonas: Persona[] = samplePersonas,
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
