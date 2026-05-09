"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { createElement } from "react";
import type { ChangeAnalysisProps } from "../../types/views";
import { ChangeAnalysisCard } from "./change-analysis-card";

export function useChangeAnalysis() {
  useCopilotAction({
    name: "ChangeAnalysis",
    description:
      "Shows month-over-month service deltas, sparkline trends, spike alerts, and an agent explanation.",
    parameters: [
      {
        name: "bills",
        type: "object[]",
        description: "Chronologically ordered parsed EPM bills.",
        required: true,
      },
      {
        name: "deltas",
        type: "object[]",
        description: "Per-service changes between the previous and active bill.",
        required: true,
      },
      {
        name: "spike_alerts",
        type: "string[]",
        description: "Notable increases or anomalies to highlight.",
        required: true,
      },
      {
        name: "explanation",
        type: "string",
        description: "Short explanation grounded in the bill data.",
        required: true,
      },
    ],
    render: ({ args, status }) =>
      status === "inProgress"
        ? "Preparing change analysis..."
        : createElement(
            ChangeAnalysisCard,
            args as unknown as ChangeAnalysisProps,
          ),
    handler: async (args) => args,
  });
}
