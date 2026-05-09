"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { createElement } from "react";
import type { BillSummaryProps } from "../../types/views";
import { BillSummaryCard } from "./bill-summary-card";

export function useBillSummary() {
  useCopilotAction({
    name: "BillSummary",
    description:
      "Displays a bill summary with total due, service breakdown, due-date urgency, and the biggest cost driver.",
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
        ? "Preparing bill summary..."
        : createElement(BillSummaryCard, args as unknown as BillSummaryProps),
    handler: async (args) => args,
  });
}
