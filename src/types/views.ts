import type { Bill } from "./bill";
import type { Persona } from "./persona";

export type ViewType =
  | "summary"
  | "change_analysis"
  | "benchmark"
  | "savings_plan";

export type BillService =
  | "electricity"
  | "water"
  | "sewer"
  | "gas"
  | "other";

export interface BillSummaryProps {
  bill: Bill;
  biggest_driver: BillService;
}

export interface ChangeAnalysisProps {
  bills: Bill[];
  deltas: ServiceDelta[];
  spike_alerts: string[];
  explanation: string;
}

export interface ServiceDelta {
  service: BillService | "total";
  previous_value: number;
  current_value: number;
  unit: "kWh" | "m3" | "m³" | "COP";
  change_percent: number;
}

export interface BenchmarkProps {
  bill: Bill;
  matching_personas: Persona[];
  comparisons: ServiceComparison[];
}

export interface ServiceComparison {
  service: Exclude<BillService, "other">;
  user_value: number;
  persona_range: [number, number];
  status: "below" | "within" | "above";
}

export interface SavingsPlanProps {
  recommendations: Recommendation[];
}

export interface Recommendation {
  action: string;
  estimated_savings_cop: number;
  difficulty: "easy" | "medium" | "effort";
  reasoning: string;
}
