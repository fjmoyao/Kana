"use client";

import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import type { GeneratedView } from "@/lib/store/generated-view-store";
import { BenchmarkCard } from "./benchmark-card";
import { BillSummaryCard } from "./bill-summary-card";
import { ChangeAnalysisCard } from "./change-analysis-card";
import { SavingsPlanCard } from "./savings-plan-card";

export function GeneratedViewPanel() {
  const activeView = useGeneratedViewStore((s) => s.activeView);

  return (
    <section className="w-full max-w-4xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-blue-500">
            AI workspace
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Shared view
          </h2>
        </div>
        <p className="hidden max-w-sm text-right text-xs leading-5 text-zinc-400 sm:block">
          Ask Kana in the sidebar and the generated card appears here.
        </p>
      </div>

      {activeView ? (
        <GeneratedViewContent view={activeView} />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-dashed border-blue-200 bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#ffffff_42%,#f8fafc_100%)] p-6 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
          <p className="text-sm font-medium text-zinc-900">
            Your generated cards will land here.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Try "How do I compare to similar households?", "What changed from
            the previous bill?", or "How can I save on this bill?" in the real
            Copilot sidebar.
          </p>
        </div>
      )}
    </section>
  );
}

function GeneratedViewContent({
  view,
}: {
  view: GeneratedView;
}) {
  switch (view.type) {
    case "summary":
      return <BillSummaryCard {...view.props} />;
    case "change_analysis":
      return <ChangeAnalysisCard {...view.props} />;
    case "benchmark":
      return <BenchmarkCard {...view.props} />;
    case "savings_plan":
      return <SavingsPlanCard {...view.props} />;
  }
}
