"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSavings, compareUsage, getBiggestDriver, getMatchingPersonas } from "@/lib/insights";
import { useBillStore } from "@/lib/store/bill-store";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type Suggestion = {
  title: string;
  message: string;
};

const BENCHMARK_PATTERN =
  /how do i compare|compare to similar households|similar households|hogares similares|como me comparo|benchmark|comparar con otros hogares/i;
const CHANGES_PATTERN =
  /what changed|que cambio|trends|subio|subió|bajo|bajó|changed from the previous bill/i;
const SAVINGS_PATTERN =
  /how can i save|como ahorrar|save on this bill|ahorro|recommendations|recomendaciones/i;
const SUMMARY_PATTERN =
  /summary|summarize|resumen|show my bill|explicame mi factura|explícame mi factura/i;

function buildWelcomeMessage(hasBills: boolean): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: hasBills
      ? "I can explain your latest bill, compare it with similar households, show what changed, and suggest savings. Try asking: How do I compare to similar households?"
      : "Upload an EPM bill or load sample data, and I’ll walk you through the summary, benchmark, changes, and savings plan.",
  };
}

function formatCop(value: number): string {
  return `COP ${Math.round(value).toLocaleString("en-US")}`;
}

function formatDelta(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function KanaChatSidebar() {
  const bills = useBillStore((state) => state.bills);
  const activeBillIndex = useBillStore((state) => state.activeBillIndex);
  const personas = useBillStore((state) => state.personas);
  const setActiveView = useBillStore((state) => state.setActiveView);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    buildWelcomeMessage(false),
  ]);

  const activeBill = bills[activeBillIndex] ?? null;
  const previousBill = activeBillIndex > 0 ? bills[activeBillIndex - 1] : null;

  useEffect(() => {
    setMessages([buildWelcomeMessage(bills.length > 0)]);
  }, [bills.length, activeBillIndex]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (bills.length === 0) {
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
  }, [bills.length]);

  function pushAssistantMessage(content: string) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
      },
    ]);
  }

  function handlePrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();
    if (!prompt) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
      },
    ]);
    setInput("");
    setIsOpen(true);

    if (!activeBill) {
      pushAssistantMessage(
        "I need a bill first. Upload an EPM PDF or use the sample data, and then I can compare you to similar households, explain what changed, and suggest savings.",
      );
      return;
    }

    if (BENCHMARK_PATTERN.test(prompt)) {
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

      setActiveView("benchmark");
      pushAssistantMessage(
        standout
          ? `For ${activeBill.billing_period}, you match against ${matchingPersonas.length} similar estrato ${activeBill.stratum} households. ${within} services are within range, ${below} are below range, and ${above} are above range. Your clearest difference is ${standout.service}, which is ${standout.status} the persona band. I opened the Similar Households view so you can see the comparison in detail.`
          : `For ${activeBill.billing_period}, you line up closely with ${matchingPersonas.length} similar estrato ${activeBill.stratum} households. All tracked services are within the expected persona bands. I opened the Similar Households view so you can review the detailed benchmark cards.`,
      );
      return;
    }

    if (CHANGES_PATTERN.test(prompt)) {
      setActiveView("changes");

      if (!previousBill) {
        pushAssistantMessage(
          "I only have one bill in view right now, so I can’t calculate a month-over-month change yet. Upload one more billing cycle and I’ll break down what moved.",
        );
        return;
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

      pushAssistantMessage(
        `Compared with ${previousBill.billing_period}, your total bill moved ${formatDelta(totalDelta)} to ${formatCop(activeBill.total_due)}. The strongest service movement this cycle is ${serviceDeltas[0].label}, which changed ${formatDelta(serviceDeltas[0].delta)}. I opened the What Changed view so you can inspect the month-over-month detail.`,
      );
      return;
    }

    if (SAVINGS_PATTERN.test(prompt)) {
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

      setActiveView("savings");
      pushAssistantMessage(
        `The best near-term savings opportunities on ${activeBill.billing_period} are: ${recommendations.map((item) => `${item.action} (${formatCop(item.estimated_savings_cop)}/month)`).join("; ")}. I opened the Savings Plan view so you can see the full ranked list.`,
      );
      return;
    }

    if (SUMMARY_PATTERN.test(prompt)) {
      const biggestDriver = getBiggestDriver(activeBill);
      setActiveView("summary");
      pushAssistantMessage(
        `Your ${activeBill.billing_period} EPM bill totals ${formatCop(activeBill.total_due)}. The biggest driver is ${biggestDriver}, and the bill is split across electricity ${formatCop(activeBill.electricity_cost)}, water ${formatCop(activeBill.water_cost)}, sewer ${formatCop(activeBill.sewer_cost)}, gas ${formatCop(activeBill.gas_cost)}, and other charges ${formatCop(activeBill.other_charges)}. I opened the Bill Summary view for the clean breakdown.`,
      );
      return;
    }

    pushAssistantMessage(
      "This MVP chat is tuned for four reliable flows: bill summary, similar-household comparison, what changed, and savings guidance. Try asking one of those directly and I’ll open the matching view for you.",
    );
  }

  return (
    <>
      {isOpen && (
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Kana</p>
              <p className="text-xs text-zinc-500">
                Deterministic demo copilot for bill summary, benchmark, changes, and savings
              </p>
            </div>
            <button
              className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-white"
                      : "max-w-[85%] rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.message}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  onClick={() => handlePrompt(suggestion.message)}
                  type="button"
                >
                  {suggestion.title}
                </button>
              ))}
            </div>

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handlePrompt(input);
              }}
            >
              <textarea
                className="min-h-[52px] flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 outline-none transition-colors focus:border-blue-300"
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your bill, comparison, changes, or savings..."
                value={input}
              />
              <button
                className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={input.trim().length === 0}
                type="submit"
              >
                Send
              </button>
            </form>
          </div>
        </aside>
      )}

      {!isOpen && (
        <button
          className="fixed bottom-4 right-4 z-40 rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-zinc-800"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Open Chat
        </button>
      )}
    </>
  );
}
