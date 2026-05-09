"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { createElement } from "react";
import type { SavingsPlanProps } from "../../types/views";
import { SavingsPlanCard } from "./savings-plan-card";

export function useSavingsPlan() {
  useCopilotAction({
    name: "SavingsPlan",
    description:
      "Renders ranked savings actions with estimated monthly impact, difficulty, and household-specific reasoning.",
    parameters: [
      {
        name: "recommendations",
        type: "object[]",
        description:
          "Three to five ranked savings recommendations with COP estimates.",
        required: true,
      },
    ],
    render: ({ args, status }) =>
      status === "inProgress"
        ? "Preparing savings plan..."
        : createElement(SavingsPlanCard, args as unknown as SavingsPlanProps),
    handler: async (args) => args,
  });
}
