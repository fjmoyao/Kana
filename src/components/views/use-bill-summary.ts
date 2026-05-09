"use client";

import { useComponent } from "@copilotkit/react";
import { BillSummaryCard } from "./bill-summary-card";
import { billSummarySchema } from "./view-schemas";

export function useBillSummary() {
  useComponent({
    name: "BillSummary",
    description:
      "Displays a bill summary with total due, service breakdown, due-date urgency, and the biggest cost driver.",
    parameters: billSummarySchema,
    render: BillSummaryCard,
  });
}
