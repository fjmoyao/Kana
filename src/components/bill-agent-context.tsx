"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useBillStore } from "@/lib/store/bill-store";

export function BillAgentContext() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const activeBill = bills[activeBillIndex] ?? null;
  const personas = useBillStore((s) => s.personas);

  const matchedPersonas = activeBill
    ? personas
        .filter((p) => p.stratum === activeBill.stratum)
        .slice(0, 5)
    : [];

  useCopilotReadable({
    description: "The user's active EPM utility bill.",
    value: activeBill
      ? {
          billing_period: activeBill.billing_period,
          stratum: activeBill.stratum,
          total_due: activeBill.total_due,
          electricity_kwh: activeBill.electricity_kwh,
          electricity_cost: activeBill.electricity_cost,
          water_m3: activeBill.water_m3,
          water_cost: activeBill.water_cost,
          sewer_m3: activeBill.sewer_m3,
          sewer_cost: activeBill.sewer_cost,
          gas_m3: activeBill.gas_m3,
          gas_cost: activeBill.gas_cost,
          other_charges: activeBill.other_charges,
          billCount: bills.length,
        }
      : null,
  });

  return null;
}
