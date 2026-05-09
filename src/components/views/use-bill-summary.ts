"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { createElement } from "react";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import { BillSummaryCard } from "./bill-summary-card";
import { billSummarySchema } from "./view-schemas";

export function useBillSummary() {
  useFrontendTool({
    name: "show_bill_summary",
    description:
      "Renders a bill summary card showing total due, service breakdown, and biggest cost driver. Call this when the user asks for a summary or first uploads a bill.",
    parameters: billSummarySchema,
    followUp: false,
    handler: async (args) => {
      const result = billSummarySchema.safeParse(args);
      if (!result.success) {
        return "Rendered the bill summary in the main Kana workspace.";
      }

      const props = result.data;
      useGeneratedViewStore.getState().setActiveView({
        type: "summary",
        props,
      });
      return "Rendered the bill summary in the main Kana workspace.";
    },
    render: ({ args, status }) => {
      if (status === "inProgress") return "Preparando resumen...";

      const result = billSummarySchema.safeParse(args);
      return result.success
        ? createElement(BillSummaryCard, result.data)
        : null;
    },
  });
}
