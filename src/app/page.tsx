"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="flex flex-1 items-center justify-center">
        <main className="flex flex-col items-center gap-6 text-center px-8">
          <h1 className="text-4xl font-bold tracking-tight">Kana</h1>
          <p className="text-lg text-zinc-600 max-w-md">
            Turn your utility bills into insights. Upload an EPM bill to get
            started.
          </p>
        </main>
      </div>
      <CopilotSidebar
        defaultOpen
        labels={{
          title: "Kana",
          initial: "Hi! Upload an EPM bill to get started, or ask me anything about your utilities.",
        }}
      />
    </CopilotKit>
  );
}
