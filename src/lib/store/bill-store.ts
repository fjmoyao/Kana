import { create } from "zustand";
import type { Bill } from "../../types/bill.ts";
import type { Persona } from "../../types/persona.ts";
import { personas as samplePersonas } from "../sample-data.ts";

export type DemoView = "summary" | "changes" | "benchmark" | "savings";

interface BillStore {
  bills: Bill[];
  activeBillIndex: number;
  activeView: DemoView;
  personas: Persona[];
  addBill: (bill: Bill) => void;
  setActive: (index: number) => void;
  setActiveView: (view: DemoView) => void;
  getActiveBill: () => Bill | null;
  removeBill: (index: number) => void;
  getBillHistory: () => Bill[];
  getLatestBill: () => Bill | null;
  loadSampleBills: (bills: Bill[]) => void;
}

const MONTH_ORDER = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function billSortKey(bill: Bill): number {
  const lower = bill.billing_period.toLowerCase();
  const yearMatch = lower.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 0;
  const monthIndex = MONTH_ORDER.findIndex((m) => lower.includes(m));
  return year * 100 + (monthIndex >= 0 ? monthIndex : 99);
}

export const useBillStore = create<BillStore>((set, get) => ({
  bills: [],
  activeBillIndex: 0,
  activeView: "benchmark",
  personas: samplePersonas,

  addBill: (bill) =>
    set((state) => {
      const updated = [...state.bills, bill].sort(
        (a, b) => billSortKey(a) - billSortKey(b),
      );
      return {
        bills: updated,
        activeBillIndex: updated.length - 1,
        activeView: "benchmark",
      };
    }),

  setActive: (index) => set({ activeBillIndex: index, activeView: "benchmark" }),

  setActiveView: (view) => set({ activeView: view }),

  getActiveBill: () => {
    const { bills, activeBillIndex } = get();
    return bills[activeBillIndex] ?? null;
  },

  removeBill: (index) =>
    set((state) => {
      const updated = state.bills.filter((_, i) => i !== index);
      return {
        bills: updated,
        activeBillIndex: Math.min(state.activeBillIndex, updated.length - 1),
        activeView: "benchmark",
      };
    }),

  getBillHistory: () => get().bills,

  getLatestBill: () => {
    const { bills } = get();
    return bills.length > 0 ? bills[bills.length - 1] : null;
  },

  loadSampleBills: (bills) =>
    set({
      bills: [...bills].sort((a, b) => billSortKey(a) - billSortKey(b)),
      activeBillIndex: bills.length - 1,
      activeView: "benchmark",
    }),
}));
