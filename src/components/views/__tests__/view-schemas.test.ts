import assert from "node:assert/strict";
import { test } from "node:test";
import {
  billSummarySchema,
  changeAnalysisSchema,
  benchmarkSchema,
  savingsPlanSchema,
} from "../view-schemas.ts";
import {
  sampleBillSummaryProps,
  sampleChangeAnalysisProps,
  sampleBenchmarkProps,
  sampleSavingsPlanProps,
} from "../view-samples.ts";

test("BillSummary schema validates sample props", () => {
  const result = billSummarySchema.safeParse(sampleBillSummaryProps);
  assert.ok(result.success, `Validation errors: ${JSON.stringify(result.error?.issues)}`);
});

test("ChangeAnalysis schema validates sample props", () => {
  const result = changeAnalysisSchema.safeParse(sampleChangeAnalysisProps);
  assert.ok(result.success, `Validation errors: ${JSON.stringify(result.error?.issues)}`);
});

test("Benchmark schema validates sample props", () => {
  const result = benchmarkSchema.safeParse(sampleBenchmarkProps);
  assert.ok(result.success, `Validation errors: ${JSON.stringify(result.error?.issues)}`);
});

test("SavingsPlan schema validates sample props", () => {
  const result = savingsPlanSchema.safeParse(sampleSavingsPlanProps);
  assert.ok(result.success, `Validation errors: ${JSON.stringify(result.error?.issues)}`);
});

test("BillSummary schema rejects invalid biggest_driver", () => {
  const invalid = { ...sampleBillSummaryProps, biggest_driver: "nuclear" };
  const result = billSummarySchema.safeParse(invalid);
  assert.ok(!result.success);
});

test("Recommendation difficulty must be easy/medium/effort", () => {
  const invalid = {
    recommendations: [
      {
        action: "Test",
        estimated_savings_cop: 1000,
        difficulty: "impossible",
        reasoning: "test",
      },
    ],
  };
  const result = savingsPlanSchema.safeParse(invalid);
  assert.ok(!result.success);
});

test("ServiceComparison status must be below/within/above", () => {
  const invalid = {
    bill: sampleBenchmarkProps.bill,
    matching_personas: sampleBenchmarkProps.matching_personas,
    comparisons: [
      {
        service: "electricity",
        user_value: 150,
        persona_range: [110, 145],
        status: "unknown",
      },
    ],
  };
  const result = benchmarkSchema.safeParse(invalid);
  assert.ok(!result.success);
});
