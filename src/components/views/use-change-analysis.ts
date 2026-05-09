"use client";

import { useComponent } from "@copilotkit/react-core/v2/headless";
import { ChangeAnalysisCard } from "./change-analysis-card";
import { changeAnalysisSchema } from "./view-schemas";

export function useChangeAnalysis() {
  useComponent({
    name: "ChangeAnalysis",
    description:
      "Shows month-over-month service deltas, sparkline trends, spike alerts, and an agent explanation.",
    parameters: changeAnalysisSchema,
    render: ChangeAnalysisCard,
  });
}
