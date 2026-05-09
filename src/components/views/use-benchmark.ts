"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { createElement } from "react";
import type { BenchmarkProps } from "../../types/views";
import { BenchmarkCard } from "./benchmark-card";

export function useBenchmark() {
  useFrontendTool({
    name: "show_benchmark",
    description:
      "Renders a persona benchmark card comparing the user's bill against similar Medellín households. Shows per-service below/within/above status with visual gauges. Call this when the user asks how they compare.",
    parameters: [
      {
        name: "bill",
        type: "object",
        description: "The parsed EPM bill to benchmark.",
        required: true,
      },
      {
        name: "matching_personas",
        type: "object[]",
        description: "The most relevant Medellín household personas. Each has: id, label, zone, stratum, home_type, household_size, work_pattern, usage_profile.",
        required: true,
      },
      {
        name: "comparisons",
        type: "object[]",
        description: "Per-service comparison results. Each has: service ('electricity'|'water'|'sewer'|'gas'), user_value (number), persona_range ([min, max]), status ('below'|'within'|'above').",
        required: true,
      },
    ],
    render: ({ args, status }) =>
      status === "inProgress"
        ? "Comparando con hogares similares..."
        : createElement(BenchmarkCard, args as unknown as BenchmarkProps),
  });
}
