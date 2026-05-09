"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import { changeAnalysisSchema } from "./view-schemas";

export function useChangeAnalysis() {
  useFrontendTool({
    name: "show_change_analysis",
    description:
      "Renders a change analysis card with month-over-month deltas, sparkline trends, spike alerts, and an explanation. Call this when the user asks what changed or about trends.",
    parameters: changeAnalysisSchema,
    followUp: false,
    handler: async (args) => {
      const result = changeAnalysisSchema.safeParse(args);
      if (!result.success) {
        return "Rendered the change analysis in the main Kana workspace.";
      }

      const props = result.data;
      useGeneratedViewStore.getState().setActiveView({
        type: "change_analysis",
        props,
      });
      return "Rendered the change analysis in the main Kana workspace.";
    },
  });
}
