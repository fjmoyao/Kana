# Kana

**Agentic utility-bill copilot for Medellín households.**

Upload an EPM bill PDF and ask Kana anything — it reads the bill, reasons over it with Claude, and generates the right visual interface on the spot. There is no fixed dashboard; the UI is produced at query time by the AI.

---

## The problem

EPM bills pack five services (energy, water, sewer, gas, other charges) into a dense PDF that most households receive but can't meaningfully interpret. People open the bill, see the total, and close it. They don't know:

- Which service drove a spike this month
- Whether their usage is high or low relative to similar households in the same stratum
- Which habits would actually move the needle before the next billing cycle

The gap is not information — it's all there in the PDF. The gap is context, comparison, and a human-shaped explanation.

---

## What Kana does

Kana turns a static PDF into a live, conversational analysis in seconds — no manual data entry, no spreadsheets.

| Ask Kana | What you get |
|----------|-------------|
| *"Muéstrame el resumen"* | Bill summary card — total due, service breakdown, biggest cost driver |
| *"¿Qué cambió este mes?"* | Trend cards — month-over-month deltas, spike alerts, short explanation |
| *"¿Cómo me comparo con hogares similares?"* | Benchmark cards — your usage vs. 20 synthetic Medellín personas matched by stratum and household size |
| *"¿Cómo puedo ahorrar?"* | Savings plan — ranked recommendations with estimated COP impact per action |

The same bill produces different interfaces depending on what you ask. The AI decides which views to render.

---

## How generative AI is used

Kana uses Claude (Anthropic) in two distinct roles:

### 1. Structured PDF extraction

When a bill PDF is uploaded, the raw text is sent to Claude using **forced tool use** — Claude is constrained to return exactly the `Bill` schema (15 fields: service usage in physical units + costs in COP). This is more reliable than regex alone because EPM bill layouts vary and use Spanish locale formatting (`354.520,24 COP`, `5,9 m³`). A local regex parser runs as fallback when no API key is present.

### 2. Conversational agent with generative UI

A CopilotKit `BuiltInAgent` backed by Claude receives:
- The active parsed bill as readable context (`useCopilotReadable`)
- Four **backend tools** to compute derived data: `get_matching_personas`, `compare_usage`, `calculate_savings`, `get_bills`
- Four **frontend tools** it can call to render React components inline in the chat: `show_bill_summary`, `show_change_analysis`, `show_benchmark`, `show_savings_plan`

The agent decides which views to render based on the user's question. This is **generative UI** — the interface is assembled by the model at runtime from a registered component palette, not served from static routes.

---

## Architecture

```
Upload PDF
    │
    ▼
POST /api/parse ──► Claude (forced tool use → Bill schema)
    │                   └── local regex fallback if no API key
    ▼
Zustand store (client state)
    │
    ├─► useCopilotReadable ──► injects bill into agent context
    │
    └─► user chat message
            │
            ▼
    POST /api/copilotkit
    CopilotRuntime + BuiltInAgent (Claude)
            │
            ├─► backend tools: compute personas / comparisons / savings
            │
            └─► frontend tools: render React cards inline in CopilotSidebar
```

**Key files:**

| Path | Role |
|------|------|
| `src/lib/parser/parse-epm-bill.ts` | PDF text → structured `Bill` (Claude primary, regex fallback) |
| `src/app/api/copilotkit/[[...slug]]/route.ts` | CopilotKit runtime endpoint |
| `src/lib/agent/tools.ts` | Four agent-callable computation tools |
| `src/lib/agent/system-prompt.ts` | Agent instructions: when to call which view tool |
| `src/components/views/use-*.ts` | Frontend tool registrations — maps tool name to React component |
| `src/components/bill-agent-context.tsx` | Pushes bill data into agent context via `useCopilotReadable` |
| `src/lib/store/bill-store.ts` | Zustand store — bills, active bill, personas |
| `data/sample/` | 6 sanitized EPM bills (Nov 2025–Apr 2026) + 20 Medellín personas |

---

## Running locally

```bash
# Node >= 20 required
npm install

# Required for PDF parsing and the agent
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# Optional: override the model used by the agent (default: claude-haiku-4-5-20251001)
# ANTHROPIC_MODEL=claude-sonnet-4-6

npm run dev     # http://localhost:3000
npm test        # 27 unit tests, no API key needed
npm run build   # production build
```

> The app works without an API key using the **"Try with sample data"** button — the local regex parser handles extraction and the agent falls back to demo bills. Full PDF upload requires `ANTHROPIC_API_KEY`.

---

## Tests

27 tests, zero external dependencies, using Node's built-in test runner:

| Suite | What it covers |
|-------|---------------|
| `parse-epm-bill` | All 6 sample bills parse correctly; confidence scoring |
| `parser-edge-cases` | Empty input, non-EPM text, partial bills, Spanish accents/locale numbers |
| `tools` | Persona matching by stratum, usage comparison, savings calculation, cost driver detection |
| `sample-data` | JSON integrity — field presence and value ranges for bills and personas |
| `view-schemas` | Zod schema validation for all four view payload types |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| AI — PDF extraction | Anthropic SDK · Claude 3.5 Sonnet · forced tool use |
| AI — agent | CopilotKit 1.57 · `BuiltInAgent` · Claude Haiku |
| Generative UI | CopilotKit `useFrontendTool` |
| State | Zustand 5 |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 |
| Testing | Node built-in test runner |

---

## What's not in scope (yet)

- Gmail or email ingestion
- Real-time meter / smart device access
- Multi-provider or multi-country support

Kana is **PDF-first today**, platform-ready later.

---

## Sample data

- [`data/sample/epm-bills-summary.json`](data/sample/epm-bills-summary.json) — 6 sanitized EPM bills. Typical ranges: water 6–10 m³, energy 131–186 kWh, gas 5.9–12.0 m³, total 354k–464k COP.
- [`data/sample/medellin-personas.json`](data/sample/medellin-personas.json) — 20 synthetic Medellín households varying by stratum (1–6), home type, occupant count, and usage pattern.

Raw personal PDFs are not committed to this repo.
