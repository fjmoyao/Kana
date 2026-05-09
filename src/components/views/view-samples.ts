import type { Bill } from "../../types/bill";
import type { Persona } from "../../types/persona";
import type {
  BenchmarkProps,
  BillSummaryProps,
  ChangeAnalysisProps,
  SavingsPlanProps,
} from "../../types/views";

export const sampleBillHistory: Bill[] = [
  {
    source_file: "noviembre 25.pdf",
    billing_period: "noviembre de 2025",
    provider: "EPM",
    currency: "COP",
    city: "Medellín",
    stratum: 5,
    total_due: 453962.7,
    electricity_kwh: 181,
    electricity_cost: 193327.55,
    water_m3: 9,
    water_cost: 82054.82,
    sewer_m3: 9,
    sewer_cost: 59936.47,
    gas_m3: 9.4,
    gas_cost: 35866.64,
    other_charges: 82777.22,
    due_date: "2025-12-18",
    confidence: 1,
  },
  {
    source_file: "diciembre 25.pdf",
    billing_period: "diciembre de 2025",
    provider: "EPM",
    currency: "COP",
    city: "Medellín",
    stratum: 5,
    total_due: 463781.64,
    electricity_kwh: 175,
    electricity_cost: 185986.5,
    water_m3: 10,
    water_cost: 87750.27,
    sewer_m3: 10,
    sewer_cost: 66788.69,
    gas_m3: 12,
    gas_cost: 43776.12,
    other_charges: 79480.06,
    due_date: "2026-01-19",
    confidence: 1,
  },
  {
    source_file: "enero 26.pdf",
    billing_period: "enero de 2026",
    provider: "EPM",
    currency: "COP",
    city: "Medellín",
    stratum: 5,
    total_due: 449230.33,
    electricity_kwh: 186,
    electricity_cost: 192401.73,
    water_m3: 9,
    water_cost: 80467.24,
    sewer_m3: 9,
    sewer_cost: 60970.98,
    gas_m3: 9.4,
    gas_cost: 36338.44,
    other_charges: 79051.94,
    due_date: "2026-02-18",
    confidence: 1,
  },
  {
    source_file: "febrero 26.pdf",
    billing_period: "febrero de 2026",
    provider: "EPM",
    currency: "COP",
    city: "Medellín",
    stratum: 5,
    total_due: 382258.62,
    electricity_kwh: 169,
    electricity_cost: 174243.73,
    water_m3: 6,
    water_cost: 58561.35,
    sewer_m3: 6,
    sewer_cost: 43474.61,
    gas_m3: 6.8,
    gas_cost: 26707.58,
    other_charges: 79271.35,
    due_date: "2026-03-20",
    confidence: 1,
  },
  {
    source_file: "marzo 26.pdf",
    billing_period: "marzo de 2026",
    provider: "EPM",
    currency: "COP",
    city: "Medellín",
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
  },
  {
    source_file: "abril 26.pdf",
    billing_period: "abril de 2026",
    provider: "EPM",
    currency: "COP",
    city: "Medellín",
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
  },
];

export const samplePersonas: Persona[] = [
  {
    id: "P11",
    label: "Laureles home office couple",
    zone: "Laureles",
    stratum: 5,
    home_type: "apartment",
    household_size: 2,
    work_pattern: "both remote",
    usage_profile:
      "multiple monitors, coffee machine, frequent daytime device use",
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
    usage_profile:
      "warm-water comfort prioritized with steady home presence",
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
    usage_profile:
      "frequent hot water, frequent laundry, heavier kitchen use",
    expected_water_m3: [8, 10],
    expected_energy_kwh: [155, 190],
    expected_gas_m3: [7, 10],
  },
];

export const activeSampleBill = sampleBillHistory[5];

export const sampleBillSummaryProps: BillSummaryProps = {
  bill: activeSampleBill,
  biggest_driver: "electricity",
};

export const sampleChangeAnalysisProps: ChangeAnalysisProps = {
  bills: sampleBillHistory.slice(0, 5),
  deltas: [
    {
      service: "electricity",
      previous_value: 169,
      current_value: 131,
      unit: "kWh",
      change_percent: -22.5,
    },
    {
      service: "water",
      previous_value: 6,
      current_value: 8,
      unit: "m³",
      change_percent: 33.3,
    },
    {
      service: "sewer",
      previous_value: 6,
      current_value: 8,
      unit: "m³",
      change_percent: 33.3,
    },
    {
      service: "gas",
      previous_value: 6.8,
      current_value: 6.8,
      unit: "m³",
      change_percent: 0,
    },
    {
      service: "total",
      previous_value: 382258.62,
      current_value: 381239.05,
      unit: "COP",
      change_percent: -0.3,
    },
  ],
  spike_alerts: [
    "Water usage jumped from 6 to 8 m³ in one cycle.",
    "Sewer charges rose in lockstep with the water spike.",
  ],
  explanation:
    "March was cheaper on electricity, but the household gave part of that gain back when water and sewer rebounded from 6 to 8 m³. Gas stayed flat, so the clearest story is a short-term water-use bump rather than a whole-home increase.",
};

export const sampleBenchmarkProps: BenchmarkProps = {
  bill: activeSampleBill,
  matching_personas: samplePersonas,
  comparisons: [
    {
      service: "electricity",
      user_value: 142,
      persona_range: [135, 175],
      status: "within",
    },
    {
      service: "water",
      user_value: 6,
      persona_range: [7, 9],
      status: "below",
    },
    {
      service: "sewer",
      user_value: 6,
      persona_range: [7, 9],
      status: "below",
    },
    {
      service: "gas",
      user_value: 5.9,
      persona_range: [6, 9],
      status: "below",
    },
  ],
};

export const sampleSavingsPlanProps: SavingsPlanProps = {
  recommendations: [
    {
      action: "Audit the third-party and building charges first",
      estimated_savings_cop: 12000,
      difficulty: "effort",
      reasoning:
        "Other charges are still 88.165 COP in April, which makes them the second-largest block on the bill even after utility usage cooled off.",
    },
    {
      action: "Keep electricity pinned near the current 142 kWh level",
      estimated_savings_cop: 9000,
      difficulty: "easy",
      reasoning:
        "Electricity remains the biggest cost driver at 136.531 COP, so small standby and lighting gains still matter most.",
    },
    {
      action: "Protect the lower water baseline from rebounding",
      estimated_savings_cop: 7000,
      difficulty: "medium",
      reasoning:
        "April dropped back to 6 m³ of water after the March spike, so repeating the routines that lowered usage can preserve both water and sewer savings.",
    },
    {
      action: "Trim hot-water demand a little further",
      estimated_savings_cop: 5000,
      difficulty: "medium",
      reasoning:
        "Gas is already down to 5.9 m³, but shorter showers and full-load washing can still shave a little more off next month.",
    },
  ],
};
