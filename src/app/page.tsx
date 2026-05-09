"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotChatSuggestions } from "@copilotkit/react-core";
import { UploadZone } from "@/components/upload-zone";
import { BillSelector } from "@/components/bill-selector";
import { BillAgentContext } from "@/components/bill-agent-context";
import { ActiveBillSummary } from "@/components/active-bill-summary";
import { useBillStore } from "@/lib/store/bill-store";
import { sampleBills } from "@/lib/sample-data";

function SuggestedPrompts() {
  const bills = useBillStore((s) => s.bills);

  useCopilotChatSuggestions({
    instructions: bills.length > 0
      ? "Suggest questions about the user's uploaded EPM utility bills."
      : "Suggest that the user upload an EPM bill or try sample data.",
    maxSuggestions: 4,
  });

  return null;
}

function EmptyState({ onLoadSample }: { onLoadSample: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <span className="h-px w-12 bg-zinc-200" />
        or
        <span className="h-px w-12 bg-zinc-200" />
      </div>
      <button
        className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        onClick={onLoadSample}
      >
        Try with sample data
      </button>
      <p className="text-xs text-zinc-400">
        Load 6 months of EPM bills instantly
      </p>
    </div>
  );
}

function KanaApp() {
  const bills = useBillStore((s) => s.bills);
  const loadSampleBills = useBillStore((s) => s.loadSampleBills);

  return (
    <>
      <BillAgentContext />
      <SuggestedPrompts />

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <main className="flex w-full max-w-lg flex-col items-center gap-5">
          {/* Hero */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Kana</h1>
            <p className="text-base text-zinc-500 max-w-sm mx-auto">
              Upload your EPM utility bill and get instant insights, trends, and
              savings recommendations.
            </p>
          </div>

          {/* Upload */}
          <div className="w-full">
            <UploadZone />
          </div>

          {/* Empty state */}
          {bills.length === 0 && (
            <EmptyState onLoadSample={() => loadSampleBills(sampleBills)} />
          )}

          {/* Bill selector + summary */}
          {bills.length > 0 && (
            <>
              <BillSelector />
              <ActiveBillSummary />
            </>
          )}

          {/* Footer hint */}
          <p className="text-xs text-zinc-300 pt-4">
            PDF data stays in your browser session and is never stored
          </p>
        </main>
      </div>

      <CopilotSidebar
        defaultOpen={false}
        labels={{
          title: "Kana",
          initial: bills.length > 0
            ? "I can see your bills! Ask me what changed, how you compare to similar households, or how to save."
            : "Hi! Upload an EPM bill or try sample data to get started.",
        }}
      />
    </>
  );
}

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <KanaApp />
    </CopilotKit>
  );
}
