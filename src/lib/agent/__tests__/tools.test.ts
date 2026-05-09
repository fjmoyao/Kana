import assert from "node:assert/strict";
import { test } from "node:test";
import type { Bill } from "../../../types/bill.ts";
import type { Persona } from "../../../types/persona.ts";
import {
  analyzeChanges,
  calculateSavings,
  compareUsage,
  getBiggestDriver,
  getMatchingPersonas,
} from "../tools.ts";

const bill: Bill = {
  billing_period: "abril de 2026",
  provider: "EPM",
  currency: "COP",
  city: "Medellin",
  stratum: 5,
  total_due: 354520.24,
  electricity_kwh: 150,
  electricity_cost: 136531.3,
  water_m3: 11,
  water_cost: 98561.35,
  sewer_m3: 11,
  sewer_cost: 73474.61,
  gas_m3: 5.9,
  gas_cost: 27787.7,
  other_charges: 18165.28,
  confidence: 1,
};

const personas: Persona[] = [
  {
    id: "P11",
    label: "Laureles home office couple",
    zone: "Laureles",
    stratum: 5,
    home_type: "apartment",
    household_size: 2,
    work_pattern: "both remote",
    usage_profile: "device-heavy",
    expected_water_m3: [6, 8],
    expected_energy_kwh: [135, 155],
    expected_gas_m3: [5, 7],
  },
  {
    id: "P03",
    label: "Envigado family with child",
    zone: "Envigado",
    stratum: 5,
    home_type: "apartment",
    household_size: 3,
    work_pattern: "mixed",
    usage_profile: "laundry-heavy",
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
    work_pattern: "office",
    usage_profile: "low occupancy",
    expected_water_m3: [3, 5],
    expected_energy_kwh: [85, 125],
    expected_gas_m3: [2, 4],
  },
];

test("matches personas by stratum before household-size proximity", () => {
  const matches = getMatchingPersonas(
    { stratum: 5, household_size: 3 },
    personas,
  );

  assert.equal(matches.length, 2);
  assert.deepEqual(
    matches.map((persona) => persona.id),
    ["P03", "P11"],
  );
});

test("compares usage against averaged persona ranges", () => {
  const comparisons = compareUsage({ bill, personas: personas.slice(0, 2) });

  assert.deepEqual(
    comparisons.map((comparison) => [
      comparison.service,
      comparison.status,
    ]),
    [
      ["electricity", "within"],
      ["water", "above"],
      ["sewer", "above"],
      ["gas", "below"],
    ],
  );
});

test("calculates savings with grounded COP estimates", () => {
  const comparisons = compareUsage({ bill, personas: personas.slice(0, 2) });
  const recommendations = calculateSavings({ bill, comparisons });

  assert.ok(recommendations.length >= 3);
  assert.ok(recommendations.length <= 5);
  assert.ok(
    recommendations.every(
      (recommendation) => recommendation.estimated_savings_cop >= 1000,
    ),
  );
  assert.ok(
    recommendations.some((recommendation) =>
      recommendation.reasoning.includes("11 m3"),
    ),
  );
});

test("finds the largest service cost driver", () => {
  assert.equal(getBiggestDriver(bill), "electricity");
});

test("analyzes month-over-month changes for the active bill", () => {
  const previousBill: Bill = {
    ...bill,
    billing_period: "marzo de 2026",
    total_due: 300000,
    electricity_kwh: 120,
    water_m3: 8,
    sewer_m3: 8,
    gas_m3: 5,
  };
  const analysis = analyzeChanges({
    bills: [bill, previousBill],
    active_billing_period: "abril de 2026",
  });

  assert.equal(analysis.bills.length, 2);
  assert.equal(analysis.deltas.length, 5);
  assert.deepEqual(
    analysis.deltas.map((delta) => delta.service),
    ["electricity", "water", "sewer", "gas", "total"],
  );
  assert.ok(
    analysis.spike_alerts.some((alert) => alert.includes("Water increased")),
  );
});
