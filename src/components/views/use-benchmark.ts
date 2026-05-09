"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import { benchmarkSchema } from "./view-schemas";

export function useBenchmark() {
  useFrontendTool({
    name: "show_benchmark",
    description:
      "Renders a persona benchmark card comparing the user's bill against similar Medellín households. Shows per-service below/within/above status with visual gauges. Call this when the user asks how they compare.",
    parameters: benchmarkSchema,
    followUp: false,
    handler: async (args) => {
      const result = benchmarkSchema.safeParse(args);
      if (!result.success) {
        return "Rendered the benchmark card in the main Kana workspace.";
      }

      const props = result.data;
      useGeneratedViewStore.getState().setActiveView({
        type: "benchmark",
        props,
      });
      return "Rendered the benchmark card in the main Kana workspace.";
    },
  });
}
