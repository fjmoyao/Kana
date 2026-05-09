"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useBillStore } from "@/lib/store/bill-store";

export function BillAgentContext() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const activeBill = bills[activeBillIndex] ?? null;
  const billHistory = bills.slice(
    Math.max(0, activeBillIndex - 5),
    activeBillIndex + 1,
  );

  useCopilotReadable({
    description:
      "Kana bill context. Use active_bill for summary, benchmark, and savings. Use bill_history for change analysis. Prefer this client bill data over fallback demo data when present.",
    value: activeBill
      ? {
          active_bill: activeBill,
          bill_history: billHistory,
          bill_count: bills.length,
        }
      : null,
  });

  return null;
}
