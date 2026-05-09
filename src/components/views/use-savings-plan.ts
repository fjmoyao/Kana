"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { createElement } from "react";
import type { SavingsPlanProps } from "../../types/views";
import { SavingsPlanCard } from "./savings-plan-card";

export function useSavingsPlan() {
  useFrontendTool({
    name: "show_savings_plan",
    description:
      "Renders a savings plan card with ranked recommendations, estimated monthly COP impact, difficulty level, and reasoning. Call this when the user asks how to save or wants recommendations.",
    parameters: [
      {
        name: "recommendations",
        type: "object[]",
        description:
          "3-5 ranked savings recommendations. Each has: action (string), estimated_savings_cop (number), difficulty ('easy'|'medium'|'effort'), reasoning (string).",
        required: true,
      },
    ],
    render: ({ args, status }) =>
      status === "inProgress"
        ? "Generando plan de ahorro..."
        : createElement(SavingsPlanCard, args as unknown as SavingsPlanProps),
  });
}
