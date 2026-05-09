"use client";

import { useBenchmark } from "./use-benchmark";
import { useBillSummary } from "./use-bill-summary";
import { useChangeAnalysis } from "./use-change-analysis";
import { useSavingsPlan } from "./use-savings-plan";

export function RegisterViews() {
  useBillSummary();
  useChangeAnalysis();
  useBenchmark();
  useSavingsPlan();

  return null;
}
