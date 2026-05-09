import type { Bill } from "../types/bill.ts";
import type { Persona } from "../types/persona.ts";
import rawBills from "../../data/sample/epm-bills-summary.json" with { type: "json" };
import rawPersonas from "../../data/sample/medellin-personas.json" with { type: "json" };

export const sampleBills: Bill[] = rawBills.map((b) => ({
  billing_period: b.billing_period,
  provider: "EPM",
  currency: "COP",
  city: b.city,
  stratum: b.stratum,
  total_due: b.estimated_total_cop,
  electricity_kwh: b.energy_kwh,
  electricity_cost: b.energy_cop,
  water_m3: b.water_m3,
  water_cost: b.water_cop,
  sewer_m3: b.sewer_m3,
  sewer_cost: b.sewer_cop,
  gas_m3: b.gas_m3,
  gas_cost: b.gas_cop,
  other_charges: b.other_entities_cop,
  confidence: 1.0,
  source_file: b.source_file,
}));

export const personas: Persona[] = rawPersonas as Persona[];
