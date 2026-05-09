"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useBillStore } from "@/lib/store/bill-store";

export function BillAgentContext() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const personas = useBillStore((s) => s.personas);
  const activeBill = bills[activeBillIndex] ?? null;
  const previousBill =
    activeBillIndex > 0 ? bills[activeBillIndex - 1] : null;

  useCopilotReadable({
    description:
      "Compact parsed bill context for the latest household-specific answer.",
    value: {
      billCount: bills.length,
      activeBillIndex,
      activeBill: activeBill
        ? {
            billing_period: activeBill.billing_period,
            total_due: activeBill.total_due,
            stratum: activeBill.stratum,
            electricity_kwh: activeBill.electricity_kwh,
            electricity_cost: activeBill.electricity_cost,
            water_m3: activeBill.water_m3,
            water_cost: activeBill.water_cost,
            sewer_m3: activeBill.sewer_m3,
            sewer_cost: activeBill.sewer_cost,
            gas_m3: activeBill.gas_m3,
            gas_cost: activeBill.gas_cost,
            other_charges: activeBill.other_charges,
          }
        : null,
      previousBill: previousBill
        ? {
            billing_period: previousBill.billing_period,
            total_due: previousBill.total_due,
            electricity_kwh: previousBill.electricity_kwh,
            water_m3: previousBill.water_m3,
            sewer_m3: previousBill.sewer_m3,
            gas_m3: previousBill.gas_m3,
          }
        : null,
    },
  });

  useCopilotReadable({
    description:
      "Persona benchmark summary. Use get_matching_personas to fetch the matching households when needed.",
    value: {
      personaCount: personas.length,
      activeBillStratum: activeBill?.stratum ?? null,
    },
  });

  return null;
}
