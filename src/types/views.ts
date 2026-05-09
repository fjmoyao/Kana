import type { Bill } from "./bill";
import type { Persona } from "./persona";

export type ViewType = "summary" | "change_analysis" | "benchmark" | "savings_plan";

export interface BillSummaryProps {
  bill: Bill;
  biggest_driver: "electricity" | "water" | "sewer" | "gas" | "other";
}

export interface ServiceDelta {
  service: string;
  previous_value: number;
  current_value: number;
  unit: string;
  change_percent: number;
}

export interface ChangeAnalysisProps {
  bills: Bill[];
  deltas: ServiceDelta[];
  spike_alerts: string[];
  explanation: string;
}

export interface ServiceComparison {
  service: string;
  user_value: number;
  persona_range: [number, number];
  status: "below" | "within" | "above";
}

export interface BenchmarkProps {
  bill: Bill;
  matching_personas: Persona[];
  comparisons: ServiceComparison[];
}

export interface Recommendation {
  action: string;
  estimated_savings_cop: number;
  difficulty: "easy" | "medium" | "effort";
  reasoning: string;
}

export interface SavingsPlanProps {
  recommendations: Recommendation[];
}
