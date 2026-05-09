import { create } from "zustand";
import type {
  BenchmarkProps,
  BillSummaryProps,
  ChangeAnalysisProps,
  SavingsPlanProps,
  ViewType,
} from "../../types/views.ts";
import type { OpenGenerativeUIContent } from "../open-generative-ui.ts";

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
    }
  | {
      type: "open_generated";
      props: {
        content: OpenGenerativeUIContent;
      };
    };

interface GeneratedViewStore {
  activeView: GeneratedView | null;
  setActiveView: (view: GeneratedView) => void;
  setOpenGeneratedView: (content: OpenGenerativeUIContent) => void;
  clearActiveView: () => void;
}

export const useGeneratedViewStore = create<GeneratedViewStore>((set) => ({
  activeView: null,
  setActiveView: (view) => set({ activeView: view }),
  setOpenGeneratedView: (content) =>
    set({ activeView: { type: "open_generated", props: { content } } }),
  clearActiveView: () => set({ activeView: null }),
}));
