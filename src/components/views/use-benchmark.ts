"use client";

import { useComponent } from "@copilotkit/react";
import { BenchmarkCard } from "./benchmark-card";
import { benchmarkSchema } from "./view-schemas";

export function useBenchmark() {
  useComponent({
    name: "Benchmark",
    description:
      "Compares the active bill against matching Medellin household personas and highlights below, within, or above-range services.",
    parameters: benchmarkSchema,
    render: BenchmarkCard,
  });
}
