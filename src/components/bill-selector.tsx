"use client";

import { useBillStore } from "@/lib/store/bill-store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function BillSelector() {
  const bills = useBillStore((s) => s.bills);
  const activeBillIndex = useBillStore((s) => s.activeBillIndex);
  const setActive = useBillStore((s) => s.setActive);
  const removeBill = useBillStore((s) => s.removeBill);

  if (bills.length === 0) return null;

  return (
    <div className="w-full max-w-lg space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500">Your Bills</h2>
        <Badge variant="secondary">
          {bills.length} bill{bills.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {bills.map((bill, i) => (
          <Card
            key={`${bill.billing_period}-${i}`}
            className={`relative flex-shrink-0 cursor-pointer px-3 py-2 transition-colors ${
              i === activeBillIndex
                ? "border-blue-500 bg-blue-50"
                : "hover:border-zinc-400"
            }`}
            onClick={() => setActive(i)}
          >
            <button
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] text-zinc-500 hover:bg-red-200 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                removeBill(i);
              }}
              aria-label={`Remove ${bill.billing_period}`}
            >
              x
            </button>
            <p className="text-xs font-medium capitalize">
              {bill.billing_period}
            </p>
            <p className="text-[11px] text-zinc-500">
              {COP.format(bill.total_due)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
