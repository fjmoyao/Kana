"use client";

import { BenchmarkCard } from "./benchmark-card";
import { BillSummaryCard } from "./bill-summary-card";
import { ChangeAnalysisCard } from "./change-analysis-card";
import { SavingsPlanCard } from "./savings-plan-card";
import {
  sampleBenchmarkProps,
  sampleBillSummaryProps,
  sampleChangeAnalysisProps,
  sampleSavingsPlanProps,
} from "./view-samples";

export function SampleViewGallery() {
  return (
    <div className="grid gap-4">
      <BillSummaryCard {...sampleBillSummaryProps} />
      <ChangeAnalysisCard {...sampleChangeAnalysisProps} />
      <BenchmarkCard {...sampleBenchmarkProps} />
      <SavingsPlanCard {...sampleSavingsPlanProps} />
    </div>
  );
}
