"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBillStore } from "@/lib/store/bill-store";
import {
  calculateSavings,
  compareUsage,
  getBiggestDriver,
  getMatchingPersonas,
} from "@/lib/insights";
import type { BillService, ChangeAnalysisProps, ServiceDelta } from "@/types/views";
import { BenchmarkCard } from "./benchmark-card";
import { BillSummaryCard } from "./bill-summary-card";
import { ChangeAnalysisCard } from "./change-analysis-card";
import { SavingsPlanCard } from "./savings-plan-card";

const SERVICE_SEQUENCE: Array<{
  key: BillService | "total";
  unit: "kWh" | "m3" | "COP";
  current: (bill: ReturnType<typeof useBillStore.getState>["bills"][number]) => number;
}> = [
  {
    key: "electricity",
    unit: "kWh",
    current: (bill) => bill.electricity_kwh,
  },
  {
    key: "water",
    unit: "m3",
    current: (bill) => bill.water_m3,
  },
  {
    key: "sewer",
    unit: "m3",
    current: (bill) => bill.sewer_m3,
  },
  {
    key: "gas",
    unit: "m3",
    current: (bill) => bill.gas_m3,
  },
  {
    key: "total",
    unit: "COP",
    current: (bill) => bill.total_due,
  },
];

export function GeneratedViewDeck() {
  const bills = useBillStore((state) => state.bills);
  const activeBillIndex = useBillStore((state) => state.activeBillIndex);
  const activeView = useBillStore((state) => state.activeView);
  const setActiveView = useBillStore((state) => state.setActiveView);
  const personas = useBillStore((state) => state.personas);

  const activeBill = bills[activeBillIndex];
  if (!activeBill) return null;

  const matchingPersonas = getMatchingPersonas(
    { stratum: activeBill.stratum },
    personas,
  );
  const comparisons = compareUsage({
    bill: activeBill,
    personas: matchingPersonas,
  });
  const recommendations = calculateSavings({
    bill: activeBill,
    comparisons,
  });
  const changeAnalysis = buildChangeAnalysis(bills, activeBillIndex);

  return (
    <section className="w-full space-y-4">
      <div className="space-y-2 text-left">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">
          Demo Canvas
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Generated views from the parsed bill
            </h2>
            <p className="text-sm text-zinc-500">
              Jump straight into the strongest MVP moments: summary, changes,
              persona benchmark, and savings guidance.
            </p>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {matchingPersonas.length} similar households matched
          </div>
        </div>
      </div>

      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as typeof activeView)}
        className="w-full"
      >
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white/80 p-1"
        >
          <TabsTrigger value="summary">Bill Summary</TabsTrigger>
          <TabsTrigger value="changes">What Changed</TabsTrigger>
          <TabsTrigger value="benchmark">Similar Households</TabsTrigger>
          <TabsTrigger value="savings">Savings Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <BillSummaryCard
            bill={activeBill}
            biggest_driver={getBiggestDriver(activeBill)}
          />
        </TabsContent>

        <TabsContent value="changes">
          <ChangeAnalysisCard {...changeAnalysis} />
        </TabsContent>

        <TabsContent value="benchmark">
          <BenchmarkCard
            bill={activeBill}
            matching_personas={matchingPersonas}
            comparisons={comparisons}
          />
        </TabsContent>

        <TabsContent value="savings">
          <SavingsPlanCard recommendations={recommendations} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function buildChangeAnalysis(
  bills: ReturnType<typeof useBillStore.getState>["bills"],
  activeBillIndex: number,
): ChangeAnalysisProps {
  const activeBill = bills[activeBillIndex];
  const previousBill = bills[activeBillIndex - 1];

  if (!activeBill) {
    return {
      bills: [],
      deltas: [],
      spike_alerts: [],
      explanation: "",
    };
  }

  if (!previousBill) {
    return {
      bills: bills.slice(Math.max(0, activeBillIndex - 5), activeBillIndex + 1),
      deltas: [],
      spike_alerts: ["Upload one more billing cycle to unlock month-over-month analysis."],
      explanation:
        "Kana needs at least two consecutive bills to explain what changed from one cycle to the next.",
    };
  }

  const visibleBills = bills.slice(Math.max(0, activeBillIndex - 5), activeBillIndex + 1);
  const deltas = SERVICE_SEQUENCE.map((service) =>
    buildDelta(service.key, service.unit, service.current(previousBill), service.current(activeBill)),
  );
  const spikeAlerts = deltas
    .filter((delta) => delta.service !== "total" && delta.change_percent >= 15)
    .map((delta) => {
      const label = delta.service === "electricity"
        ? "Electricity"
        : delta.service === "water"
          ? "Water"
          : delta.service === "sewer"
            ? "Sewer"
            : "Gas";
      return `${label} increased ${formatSignedPercent(delta.change_percent)} versus ${previousBill.billing_period}.`;
    });

  const mostSignificant = [...deltas]
    .filter((delta) => delta.service !== "total")
    .sort(
      (left, right) =>
        Math.abs(right.change_percent) - Math.abs(left.change_percent),
    )[0];

  const totalDelta = deltas.find((delta) => delta.service === "total");
  const direction = (totalDelta?.change_percent ?? 0) > 0 ? "up" : "down";
  const serviceLabel = mostSignificant
    ? mostSignificant.service === "electricity"
      ? "electricity"
      : mostSignificant.service === "water"
        ? "water"
        : mostSignificant.service === "sewer"
          ? "sewer"
          : "gas"
    : "usage";

  return {
    bills: visibleBills,
    deltas,
    spike_alerts: spikeAlerts,
    explanation: `Compared with ${previousBill.billing_period}, the total bill is ${direction} ${formatSignedPercent(
      totalDelta?.change_percent ?? 0,
    )}. The clearest movement this cycle is ${serviceLabel}, which shifted ${formatSignedPercent(
      mostSignificant?.change_percent ?? 0,
    )}.`,
  };
}

function buildDelta(
  service: BillService | "total",
  unit: "kWh" | "m3" | "COP",
  previousValue: number,
  currentValue: number,
): ServiceDelta {
  return {
    service,
    previous_value: previousValue,
    current_value: currentValue,
    unit,
    change_percent: percentChange(previousValue, currentValue),
  };
}

function percentChange(previousValue: number, currentValue: number): number {
  if (previousValue === 0) return 0;
  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
