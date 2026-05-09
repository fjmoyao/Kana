import { calculateSavings, compareUsage, getBiggestDriver, getMatchingPersonas } from "./insights.ts";
import type { Bill } from "../types/bill.ts";
import type { Persona } from "../types/persona.ts";
import type { DemoView } from "./store/bill-store";

type Suggestion = {
  title: string;
  message: string;
};

type DeterministicChatResult = {
  reply: string;
  view: DemoView | null;
};

const BENCHMARK_PATTERN =
  /how do i compare|compare to similar households|similar households|hogares similares|como me comparo|benchmark|comparar con otros hogares/i;
const CHANGES_PATTERN =
  /what changed|que cambio|trends|subio|subió|bajo|bajó|changed from the previous bill/i;
const SAVINGS_PATTERN =
  /how can i save|como ahorrar|save on this bill|ahorro|recommendations|recomendaciones/i;
const SUMMARY_PATTERN =
  /summary|summarize|resumen|show my bill|explicame mi factura|explícame mi factura/i;

export function buildWelcomeCopy(hasBills: boolean): string {
  return hasBills
    ? "I can explain your latest bill, compare it with similar households, show what changed, and suggest savings. Try asking: How do I compare to similar households?"
    : "Upload an EPM bill or load sample data, and I’ll walk you through the summary, benchmark, changes, and savings plan.";
}

export function getDeterministicSuggestions(hasBills: boolean): Suggestion[] {
  if (!hasBills) {
    return [
      {
        title: "Subir mi factura EPM",
        message: "How do I upload my EPM bill?",
      },
      {
        title: "Ver datos de ejemplo",
        message: "Show me what I can do with sample data.",
      },
      {
        title: "Como funciona",
        message: "How does Kana analyze an EPM utility bill?",
      },
    ];
  }

  return [
    {
      title: "Comparar con otros hogares",
      message: "How do I compare to similar households?",
    },
    {
      title: "Que cambio este mes",
      message: "What changed from the previous bill?",
    },
    {
      title: "Como ahorrar",
      message: "How can I save on this bill?",
    },
    {
      title: "Explicame mi factura",
      message: "Summarize my latest bill.",
    },
  ];
}

export function getDeterministicChatReply({
  prompt,
  bills,
  activeBillIndex,
  personas,
}: {
  prompt: string;
  bills: Bill[];
  activeBillIndex: number;
  personas: Persona[];
}): DeterministicChatResult {
  const trimmedPrompt = prompt.trim();
  const activeBill = bills[activeBillIndex] ?? null;
  const previousBill = activeBillIndex > 0 ? bills[activeBillIndex - 1] : null;

  if (!activeBill) {
    return {
      reply:
        "I need a bill first. Upload an EPM PDF or use the sample data, and then I can compare you to similar households, explain what changed, and suggest savings.",
      view: null,
    };
  }

  if (BENCHMARK_PATTERN.test(trimmedPrompt)) {
    const matchingPersonas = getMatchingPersonas(
      { stratum: activeBill.stratum },
      personas,
    );
    const comparisons = compareUsage({
      bill: activeBill,
      personas: matchingPersonas,
    });
    const within = comparisons.filter((item) => item.status === "within").length;
    const below = comparisons.filter((item) => item.status === "below").length;
    const above = comparisons.filter((item) => item.status === "above").length;
    const standout = comparisons.find((item) => item.status !== "within");

    return {
      view: "benchmark",
      reply: standout
        ? `For ${activeBill.billing_period}, you match against ${matchingPersonas.length} similar estrato ${activeBill.stratum} households. ${within} services are within range, ${below} are below range, and ${above} are above range. Your clearest difference is ${standout.service}, which is ${standout.status} the persona band. I opened the Similar Households view so you can see the comparison in detail.`
        : `For ${activeBill.billing_period}, you line up closely with ${matchingPersonas.length} similar estrato ${activeBill.stratum} households. All tracked services are within the expected persona bands. I opened the Similar Households view so you can review the detailed benchmark cards.`,
    };
  }

  if (CHANGES_PATTERN.test(trimmedPrompt)) {
    if (!previousBill) {
      return {
        view: "changes",
        reply:
          "I only have one bill in view right now, so I can’t calculate a month-over-month change yet. Upload one more billing cycle and I’ll break down what moved.",
      };
    }

    const totalDelta =
      previousBill.total_due === 0
        ? 0
        : ((activeBill.total_due - previousBill.total_due) / previousBill.total_due) * 100;
    const serviceDeltas = [
      {
        label: "electricity",
        delta:
          previousBill.electricity_kwh === 0
            ? 0
            : ((activeBill.electricity_kwh - previousBill.electricity_kwh) / previousBill.electricity_kwh) * 100,
      },
      {
        label: "water",
        delta:
          previousBill.water_m3 === 0
            ? 0
            : ((activeBill.water_m3 - previousBill.water_m3) / previousBill.water_m3) * 100,
      },
      {
        label: "sewer",
        delta:
          previousBill.sewer_m3 === 0
            ? 0
            : ((activeBill.sewer_m3 - previousBill.sewer_m3) / previousBill.sewer_m3) * 100,
      },
      {
        label: "gas",
        delta:
          previousBill.gas_m3 === 0
            ? 0
            : ((activeBill.gas_m3 - previousBill.gas_m3) / previousBill.gas_m3) * 100,
      },
    ].sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));

    return {
      view: "changes",
      reply: `Compared with ${previousBill.billing_period}, your total bill moved ${formatDelta(totalDelta)} to ${formatCop(activeBill.total_due)}. The strongest service movement this cycle is ${serviceDeltas[0].label}, which changed ${formatDelta(serviceDeltas[0].delta)}. I opened the What Changed view so you can inspect the month-over-month detail.`,
    };
  }

  if (SAVINGS_PATTERN.test(trimmedPrompt)) {
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
    }).slice(0, 3);

    return {
      view: "savings",
      reply: `The best near-term savings opportunities on ${activeBill.billing_period} are: ${recommendations.map((item) => `${item.action} (${formatCop(item.estimated_savings_cop)}/month)`).join("; ")}. I opened the Savings Plan view so you can see the full ranked list.`,
    };
  }

  if (SUMMARY_PATTERN.test(trimmedPrompt)) {
    const biggestDriver = getBiggestDriver(activeBill);
    return {
      view: "summary",
      reply: `Your ${activeBill.billing_period} EPM bill totals ${formatCop(activeBill.total_due)}. The biggest driver is ${biggestDriver}, and the bill is split across electricity ${formatCop(activeBill.electricity_cost)}, water ${formatCop(activeBill.water_cost)}, sewer ${formatCop(activeBill.sewer_cost)}, gas ${formatCop(activeBill.gas_cost)}, and other charges ${formatCop(activeBill.other_charges)}. I opened the Bill Summary view for the clean breakdown.`,
    };
  }

  return {
    view: null,
    reply:
      "This MVP chat is tuned for four reliable flows: bill summary, similar-household comparison, what changed, and savings guidance. Try asking one of those directly and I’ll open the matching view for you.",
  };
}

function formatCop(value: number): string {
  return `COP ${Math.round(value).toLocaleString("en-US")}`;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
