export interface Bill {
  billing_period: string;
  provider: string;
  currency: string;
  city: string;
  stratum: number;
  total_due: number;
  electricity_kwh: number;
  electricity_cost: number;
  water_m3: number;
  water_cost: number;
  sewer_m3: number;
  sewer_cost: number;
  gas_m3: number;
  gas_cost: number;
  other_charges: number;
  due_date?: string;
  confidence: number;
  source_file?: string;
}
