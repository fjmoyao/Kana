# Kana — Demo Script (2 min)

## INTRO (0:00 – 0:15)

> "Kana is a utility copilot for households. Upload your utilities bill and an AI agent generates interactive UI on the fly — summaries, trends, household comparisons, and savings plans. Not a static dashboard — the interface is generated based on what you ask."

**[Show: Kana landing page]**

---

## DEMO — Upload (0:15 – 0:30)

> "Load six months of real EPM bills with one click."

**[Action: click "Try with sample data"]**

> "The parser extracts water, sewer, electricity, gas, and other charges. You see the bill selector and a full cost breakdown."

**[Show: BillSelector + ActiveBillSummary on the page]**

---

## DEMO — Generative UI (0:30 – 1:30)

> "Open the chat. Ask for a summary."

**[Action: type "Summarize my bill" — BillSummary card renders inline]**

> "The agent renders a React component inside the chat — total due, service breakdown, biggest cost driver. Not text — actual UI."

**[Action: type "How do I compare to similar households?"]**

> "It benchmarks your usage against synthetic Medellin personas filtered by stratum. Each service shows below, within, or above range."

**[Show: Benchmark card with gauges and persona cards]**

**[Action: type "How can I save?"]**

> "Ranked savings recommendations with estimated monthly COP impact, difficulty, and reasoning grounded in your bill."

**[Show: SavingsPlan card]**

**[Action: switch bill in selector, type "What changed?"]**

> "Change analysis with per-service deltas, sparklines, spike alerts, and an agent explanation."

**[Show: ChangeAnalysis card]**

---

## TECH & TEAM (1:30 – 1:50)

> "Built with Next.js 15, CopilotKit v2 for generative UI, Claude via Anthropic API, Zustand, and Zod. 26 automated tests. Three developers working in parallel across eight modules with four integration checkpoints."

---

## NEXT STEPS (1:50 – 2:00)

> "Next: automatic spike alerts, WhatsApp integration, support for more cities, and persistent bill history. This is Kana — your utility copilot."

---

## Recording Tips

- Pre-load sample data before recording
- If chat is slow, record in takes and edit
- Keep the sidebar visible when showing generative UI
