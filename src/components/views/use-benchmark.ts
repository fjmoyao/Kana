"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { createElement } from "react";
import type { BenchmarkProps } from "../../types/views";
import { BenchmarkCard } from "./benchmark-card";

export function useBenchmark() {
  useCopilotAction({
    name: "Benchmark",
    description:
      "Compares the active bill against matching Medellin household personas and highlights below, within, or above-range services.",
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
        description: "The most relevant Medellin household personas.",
        required: true,
      },
      {
        name: "comparisons",
        type: "object[]",
        description: "Per-service comparison results.",
        required: true,
      },
    ],
    render: ({ args, status }) =>
      status === "inProgress"
        ? "Preparing benchmark..."
        : createElement(BenchmarkCard, args as unknown as BenchmarkProps),
    handler: async (args) => args,
  });
}
