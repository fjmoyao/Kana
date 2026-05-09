"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { UploadZone } from "@/components/upload-zone";
import { useBillStore } from "@/lib/store/bill-store";
import { sampleBills } from "@/lib/sample-data";
import { Badge } from "@/components/ui/badge";

function KanaApp() {
  const bills = useBillStore((s) => s.bills);
  const loadSampleBills = useBillStore((s) => s.loadSampleBills);

  return (
    <>
      <div className="flex flex-1 items-center justify-center">
        <main className="flex flex-col items-center gap-6 text-center px-8 max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight">Kana</h1>
          <p className="text-lg text-zinc-600">
            Turn your utility bills into insights. Upload an EPM bill to get
            started.
          </p>
          <UploadZone />
          {bills.length > 0 && (
            <Badge variant="secondary">
              {bills.length} bill{bills.length !== 1 ? "s" : ""} loaded
            </Badge>
          )}
          {bills.length === 0 && (
            <button
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              onClick={() => loadSampleBills(sampleBills)}
            >
              Or try with sample data
            </button>
          )}
        </main>
      </div>
      <CopilotSidebar
        defaultOpen
        labels={{
          title: "Kana",
          initial:
            "Hi! Upload an EPM bill to get started, or ask me anything about your utilities.",
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
