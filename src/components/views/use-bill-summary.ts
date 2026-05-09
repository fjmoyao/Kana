"use client";

import { useFrontendTool } from "@copilotkit/react-core";
import { createElement } from "react";
import type { BillSummaryProps } from "../../types/views";
import { BillSummaryCard } from "./bill-summary-card";

export function useBillSummary() {
  useFrontendTool({
    name: "show_bill_summary",
    description:
      "Renders a bill summary card showing total due, service breakdown, and biggest cost driver. Call this when the user asks for a summary or first uploads a bill.",
    parameters: [
      {
        name: "bill",
        type: "object",
        description: "The parsed EPM bill to summarize.",
        required: true,
      },
      {
        name: "biggest_driver",
        type: "string",
        enum: ["electricity", "water", "sewer", "gas", "other"],
        description: "The service with the largest cost on the bill.",
        required: true,
      },
    ],
    render: ({ args, status }) =>
      status === "inProgress"
        ? "Preparando resumen..."
        : createElement(BillSummaryCard, args as unknown as BillSummaryProps),
  });
}
