"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useBillStore } from "@/lib/store/bill-store";

export function BillAgentContext() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const personas = useBillStore((s) => s.personas);
  const activeBill = bills[activeBillIndex] ?? null;
  const recentBills = bills.slice(Math.max(0, activeBillIndex - 2), activeBillIndex + 1);

  useCopilotReadable({
    description:
      "Current bill context plus a lightweight recent history window for month-over-month explanations.",
    value: {
      activeBillIndex,
      billCount: bills.length,
      activeBill,
      recentBills: recentBills.map((bill) => ({
        billing_period: bill.billing_period,
        total_due: bill.total_due,
        electricity_kwh: bill.electricity_kwh,
        water_m3: bill.water_m3,
        sewer_m3: bill.sewer_m3,
        gas_m3: bill.gas_m3,
        other_charges: bill.other_charges,
        due_date: bill.due_date ?? null,
        stratum: bill.stratum,
      })),
    },
  });

  useCopilotReadable({
    description:
      "Persona benchmark catalog summary. Use get_matching_personas for the full matching records instead of relying on this summary.",
    value: {
      personaCount: personas.length,
      activeBillStratum: activeBill?.stratum ?? null,
      matchingPersonaHint: activeBill
        ? personas.filter((persona) => persona.stratum === activeBill.stratum).length
        : personas.length,
    },
  });

  return null;
}
