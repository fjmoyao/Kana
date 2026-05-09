"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { createElement } from "react";
import type { ChangeAnalysisProps } from "../../types/views";
import { ChangeAnalysisCard } from "./change-analysis-card";

export function useChangeAnalysis() {
  useFrontendTool({
    name: "show_change_analysis",
    description:
      "Renders a change analysis card with month-over-month deltas, sparkline trends, spike alerts, and an explanation. Call this when the user asks what changed or about trends.",
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
        description: "Per-service changes between the previous and active bill. Each delta has: service (string), previous_value (number), current_value (number), unit ('kWh'|'m3'|'COP'), change_percent (number).",
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
        ? "Analizando cambios..."
        : createElement(
            ChangeAnalysisCard,
            args as unknown as ChangeAnalysisProps,
          ),
  });
}
