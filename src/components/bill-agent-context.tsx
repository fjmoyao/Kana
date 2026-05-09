"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useBillStore } from "@/lib/store/bill-store";

export function BillAgentContext() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const personas = useBillStore((s) => s.personas);

  useCopilotReadable({
    description:
      "All uploaded utility bills from EPM Medellín, sorted chronologically. " +
      "Each bill contains consumption and cost for electricity, water, sewer, gas, and other charges. " +
      "Use these bills to answer user questions about their utility usage, trends, and comparisons.",
    value: {
      bills,
      activeBillIndex,
      billCount: bills.length,
      activeBill: bills[activeBillIndex] ?? null,
    },
  });

  useCopilotReadable({
    description:
      "Synthetic household personas from Medellín for benchmarking. " +
      "Each persona has expected usage ranges for water, energy, and gas. " +
      "Use these to compare the user's bills against similar households.",
    value: personas,
  });

  return null;
}
