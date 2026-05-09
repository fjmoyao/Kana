import { z } from "zod";

export const billSchema = z.object({
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

export const personaSchema = z.object({
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

export const serviceDeltaSchema = z.object({
  service: z.enum(["electricity", "water", "sewer", "gas", "other", "total"]),
  previous_value: z.number(),
  current_value: z.number(),
  unit: z.enum(["kWh", "m3", "m³", "COP"]),
  change_percent: z.number(),
});

export const serviceComparisonSchema = z.object({
  service: z.enum(["electricity", "water", "sewer", "gas"]),
  user_value: z.number(),
  persona_range: z.tuple([z.number(), z.number()]),
  status: z.enum(["below", "within", "above"]),
});

export const recommendationSchema = z.object({
  action: z.string(),
  estimated_savings_cop: z.number(),
  difficulty: z.enum(["easy", "medium", "effort"]),
  reasoning: z.string(),
});

export const billSummarySchema = z.object({
  bill: billSchema,
  biggest_driver: z.enum(["electricity", "water", "sewer", "gas", "other"]),
});

export const changeAnalysisSchema = z.object({
  bills: z.array(billSchema),
  deltas: z.array(serviceDeltaSchema),
  spike_alerts: z.array(z.string()),
  explanation: z.string(),
});

export const benchmarkSchema = z.object({
  bill: billSchema,
  matching_personas: z.array(personaSchema),
  comparisons: z.array(serviceComparisonSchema),
});

export const savingsPlanSchema = z.object({
  recommendations: z.array(recommendationSchema),
});
