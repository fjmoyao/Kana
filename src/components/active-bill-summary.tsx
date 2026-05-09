"use client";

import { useBillStore } from "@/lib/store/bill-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const services = [
  { key: "electricity_cost" as const, label: "Electricity", color: "bg-amber-400" },
  { key: "water_cost" as const, label: "Water", color: "bg-blue-400" },
  { key: "sewer_cost" as const, label: "Sewer", color: "bg-slate-400" },
  { key: "gas_cost" as const, label: "Gas", color: "bg-orange-400" },
  { key: "other_charges" as const, label: "Other", color: "bg-zinc-300" },
] as const;

export function ActiveBillSummary() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const bill = bills[activeBillIndex];

  if (!bill) return null;

  const biggest = services.reduce((max, s) =>
    bill[s.key] > bill[max.key] ? s : max,
  );

  return (
    <Card className="w-full max-w-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 capitalize">{bill.billing_period}</p>
        <Badge variant="secondary" className="text-xs">
          Estrato {bill.stratum}
        </Badge>
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight">
          {COP.format(bill.total_due)}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">Total due</p>
      </div>

      <Separator />

      <div className="space-y-2">
        {services.map((s) => {
          const value = bill[s.key];
          const pct = bill.total_due > 0 ? (value / bill.total_due) * 100 : 0;
          return (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="flex-1 text-zinc-600">{s.label}</span>
              <span className="tabular-nums text-zinc-800">
                {COP.format(value)}
              </span>
              <span className="w-10 text-right text-xs text-zinc-400">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-1 text-xs text-zinc-400">
        Biggest driver:{" "}
        <span className="font-medium text-zinc-600">{biggest.label}</span>
      </div>
    </Card>
  );
}
