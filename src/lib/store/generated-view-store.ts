import { create } from "zustand";
import type {
  BenchmarkProps,
  BillSummaryProps,
  ChangeAnalysisProps,
  SavingsPlanProps,
  ViewType,
} from "../../types/views.ts";

export type GeneratedView =
  | {
      type: Extract<ViewType, "summary">;
      props: BillSummaryProps;
    }
  | {
      type: Extract<ViewType, "change_analysis">;
      props: ChangeAnalysisProps;
    }
  | {
      type: Extract<ViewType, "benchmark">;
      props: BenchmarkProps;
    }
  | {
      type: Extract<ViewType, "savings_plan">;
      props: SavingsPlanProps;
    };

interface GeneratedViewStore {
  activeView: GeneratedView | null;
  setActiveView: (view: GeneratedView) => void;
  clearActiveView: () => void;
}

export const useGeneratedViewStore = create<GeneratedViewStore>((set) => ({
  activeView: null,
  setActiveView: (view) => set({ activeView: view }),
  clearActiveView: () => set({ activeView: null }),
}));
