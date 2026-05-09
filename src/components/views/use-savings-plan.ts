"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { createElement } from "react";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import { SavingsPlanCard } from "./savings-plan-card";
import { savingsPlanSchema } from "./view-schemas";

export function useSavingsPlan() {
  useFrontendTool({
    name: "show_savings_plan",
    description:
      "Renders a savings plan card with ranked recommendations, estimated monthly COP impact, difficulty level, and reasoning. Call this when the user asks how to save or wants recommendations.",
    parameters: savingsPlanSchema,
    followUp: false,
    handler: async (args) => {
      const result = savingsPlanSchema.safeParse(args);
      if (!result.success) {
        return "Rendered the savings plan in the main Kana workspace.";
      }

      const props = result.data;
      useGeneratedViewStore.getState().setActiveView({
        type: "savings_plan",
        props,
      });
      return "Rendered the savings plan in the main Kana workspace.";
    },
    render: ({ args, status }) => {
      if (status === "inProgress") return "Generando plan de ahorro...";

      const result = savingsPlanSchema.safeParse(args);
      return result.success
        ? createElement(SavingsPlanCard, result.data)
        : null;
    },
  });
}
