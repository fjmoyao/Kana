"use client";

import { useComponent } from "@copilotkit/react-core/v2/headless";
import { SavingsPlanCard } from "./savings-plan-card";
import { savingsPlanSchema } from "./view-schemas";

export function useSavingsPlan() {
  useComponent({
    name: "SavingsPlan",
    description:
      "Renders ranked savings actions with estimated monthly impact, difficulty, and household-specific reasoning.",
    parameters: savingsPlanSchema,
    render: SavingsPlanCard,
  });
}
