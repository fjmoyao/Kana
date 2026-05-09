# Kana MVP Build Guide

This is the step-by-step build guide for the Kana hackathon MVP. It is designed for three developers working in parallel. Each workstream is independent until explicitly noted.

## Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + React 19 | API routes in same deploy, CopilotKit native support |
| Copilot UX | CopilotKit v2 (`@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`) | `useFrontendTool` for agent-triggered UI, readable context for bill state |
| Agent Transport | AG-UI protocol | Streaming bidirectional, built into CopilotKit v2 |
| Generative UI | CopilotKit frontend tools + Open Generative UI/A2UI | Agent updates the main workspace at runtime based on query |
| PDF Parsing | `pdf-parse` | Text extraction from EPM native-text PDFs |
| LLM | Claude API (Anthropic) | Structured extraction, intent detection, savings reasoning |
| Styling | Tailwind CSS + shadcn/ui | Fast, polished components |
| State | Zustand | Lightweight session store for bills and personas |

## Team Split

| Workstream | Owner | Modules |
|---|---|---|
| **WS-A: Frontend & UI Components** | Dev A | M1 (scaffold), M5 (generative UI), M7 (polish) |
| **WS-B: PDF Parsing & Data** | Dev B | M2 (data layer), M3 (parser), M6 (multi-bill state) |
| **WS-C: Agent & Intelligence** | Dev C | M4 (agent orchestration), agent tools, system prompt |
| **Shared** | All | M8 (testing), integration |

## Dependency Graph

```
         M1 Scaffold (Dev A)
              |
     +--------+--------+
     |        |        |
   M5 UI    M2 Data  M4 Agent
  (Dev A)  (Dev B)   (Dev C)
     |        |        |
     |      M3 Parser  |
     |      (Dev B)    |
     |        |        |
     +--------+--------+
              |
        M6 Multi-bill (Dev B)
              |
        M7 Polish (Dev A)
              |
        M8 Testing (All)
```

**Parallel from day one:** After M1 is merged, all three workstreams run independently. They converge when the agent needs to call frontend tools (M4 imports M5 component schemas) and when the agent calls parser functions (M4 imports M3).

**Integration contract:** Each module communicates through the shared types in `src/types/`. Dev B defines the `Bill` and `Persona` interfaces first. Dev A and Dev C code against those interfaces without waiting for the parser or agent to be finished.

---

## Shared Types (define before anything else)

### `src/types/bill.ts`

```ts
export interface Bill {
  billing_period: string;       // "noviembre de 2025"
  provider: string;             // "EPM"
  currency: string;             // "COP"
  city: string;
  stratum: number;              // 1-6
  total_due: number;
  electricity_kwh: number;
  electricity_cost: number;
  water_m3: number;
  water_cost: number;
  sewer_m3: number;
  sewer_cost: number;
  gas_m3: number;
  gas_cost: number;
  other_charges: number;
  due_date?: string;
  confidence: number;           // 0.0-1.0
  source_file?: string;
}
```

### `src/types/persona.ts`

```ts
export interface Persona {
  id: string;                   // "P01"
  label: string;                // "Laureles solo remote worker"
  zone: string;
  stratum: number;
  home_type: string;            // "apartment" | "house" | "mixed-use home"
  household_size: number;
  work_pattern: string;
  usage_profile: string;
  expected_water_m3: [number, number];
  expected_energy_kwh: [number, number];
  expected_gas_m3: [number, number];
}
```

### `src/types/views.ts`

```ts
// The four generative UI view types the agent can render
export type ViewType = "summary" | "change_analysis" | "benchmark" | "savings_plan";

export interface BillSummaryProps {
  bill: Bill;
  biggest_driver: "electricity" | "water" | "sewer" | "gas" | "other";
}

export interface ChangeAnalysisProps {
  bills: Bill[];                // chronologically ordered
  deltas: ServiceDelta[];
  spike_alerts: string[];
  explanation: string;
}

export interface ServiceDelta {
  service: string;
  previous_value: number;
  current_value: number;
  unit: string;                 // "kWh", "m3", "COP"
  change_percent: number;
}

export interface BenchmarkProps {
  bill: Bill;
  matching_personas: Persona[];
  comparisons: ServiceComparison[];
}

export interface ServiceComparison {
  service: string;
  user_value: number;
  persona_range: [number, number];
  status: "below" | "within" | "above";
}

export interface SavingsPlanProps {
  recommendations: Recommendation[];
}

export interface Recommendation {
  action: string;
  estimated_savings_cop: number;
  difficulty: "easy" | "medium" | "effort";
  reasoning: string;
}
```

---

## Module 1: Project Scaffold (Dev A)

**Branch:** `feat/scaffold`
**Goal:** Running Next.js app with CopilotKit wired end-to-end.

| Step | Command / Task |
|---|---|
| 1.1 | `npx create-next-app@latest . --typescript --tailwind --app --src-dir` (run inside repo root) |
| 1.2 | `npm install @copilotkit/react @copilotkit/core @copilotkit/runtime @copilotkit/agent` |
| 1.3 | `npx shadcn@latest init` then add: `card button badge tabs progress separator` |
| 1.4 | `npm install zustand zod pdf-parse @anthropic-ai/sdk` |
| 1.5 | Create `src/app/api/copilotkit/[[...slug]]/route.ts` with a BuiltInAgent placeholder |
| 1.6 | Wrap `layout.tsx` with `<CopilotKitProvider runtimeUrl="/api/copilotkit">` |
| 1.7 | Add `<CopilotSidebar>` to `page.tsx` |
| 1.8 | Create `.env.local` with `ANTHROPIC_API_KEY` (add `.env.local` to `.gitignore`) |
| 1.9 | Create `src/types/bill.ts`, `src/types/persona.ts`, `src/types/views.ts` from the schemas above |
| 1.10 | Copy `data/sample/*.json` imports into `src/lib/sample-data.ts` with typed re-exports |

**Done when:** `npm run dev` serves the app, CopilotSidebar appears, agent responds "Hello from Kana."

**Merge to main before other modules start.** All three devs branch from this.

---

## Module 2: Data Layer (Dev B)

**Branch:** `feat/data-layer`
**Depends on:** M1 merged

| Step | Task | Files |
|---|---|---|
| 2.1 | Create upload zone component (drag-and-drop, accepts `.pdf`, single or multi-file) | `src/components/upload-zone.tsx` |
| 2.2 | Create upload API route: receives PDF as FormData, stores buffer in memory (Map keyed by ID), returns file ID | `src/app/api/upload/route.ts` |
| 2.3 | Create Zustand bill store: `bills: Bill[]`, `activeBillIndex: number`, `addBill()`, `setActive()`, `personas: Persona[]` | `src/lib/store/bill-store.ts` |
| 2.4 | Wire upload zone to store: on successful parse, `addBill()` is called and UI updates | `src/components/upload-zone.tsx` |

**Done when:** user drags a PDF, gets back a file ID, store holds the result.

---

## Module 3: PDF Parser (Dev B)

**Branch:** `feat/pdf-parser`
**Depends on:** M1 merged (for types), M2 (for upload route)

| Step | Task | Files |
|---|---|---|
| 3.1 | Create text extractor: `pdf-parse` receives buffer, returns raw text string | `src/lib/parser/extract-text.ts` |
| 3.2 | Create EPM bill parser: sends raw text to Claude API with a structured extraction prompt. Prompt specifies the five service categories by their Spanish field names in EPM bills. Returns `Bill` object. | `src/lib/parser/parse-epm-bill.ts` |
| 3.3 | Compute `confidence`: 1.0 if all fields found, degrade by 0.1 per missing field | inside `parse-epm-bill.ts` |
| 3.4 | Create a parse API route that chains extract + parse and returns `Bill` JSON | `src/app/api/parse/route.ts` |
| 3.5 | Wire upload route to auto-call parse after receiving PDF | update `src/app/api/upload/route.ts` |
| 3.6 | Write tests: validate the six sample bills produce correct field ranges | `src/lib/parser/__tests__/parse-epm-bill.test.ts` |

**Done when:** upload a PDF, get back a validated `Bill` JSON matching the schema.

---

## Module 4: Agent Orchestration (Dev C)

**Branch:** `feat/agent`
**Depends on:** M1 merged (for types and CopilotKit wiring)

Dev C works against the shared types and mocked bill data until M3 is ready.

| Step | Task | Files |
|---|---|---|
| 4.1 | Write system prompt: Kana's role, available view types, intent-to-view mapping rules, COP formatting, Spanish billing terms | `src/lib/agent/system-prompt.ts` |
| 4.2 | Define agent tool: `get_bills` — returns all parsed bills from session context | `src/lib/agent/tools.ts` |
| 4.3 | Define agent tool: `get_matching_personas` — filters personas by stratum and household size, returns top matches | `src/lib/agent/tools.ts` |
| 4.4 | Define agent tool: `compare_usage` — takes a bill + personas, returns `ServiceComparison[]` | `src/lib/agent/tools.ts` |
| 4.5 | Define agent tool: `calculate_savings` — takes bill + comparisons, returns `Recommendation[]` ranked by estimated savings | `src/lib/agent/tools.ts` |
| 4.6 | Register agent in the CopilotRuntime route with system prompt and tools | update `route.ts` |
| 4.7 | Add intent detection: map natural language queries to view types. "resumen" / "summary" -> `summary`, "que cambio" / "what changed" -> `change_analysis`, "como me comparo" / "compare" -> `benchmark`, "como ahorro" / "save" -> `savings_plan` | inside system prompt |
| 4.8 | Wire `useAgentContext` in main page to push bill store state to agent | update `page.tsx` |

**Done when:** agent receives a query, calls the right tools, and returns structured data matching the view prop types.

---

## Module 5: Generative UI Components (Dev A)

**Branch:** `feat/generative-ui`
**Depends on:** M1 merged (for types and CopilotKit)

Dev A builds components against the shared types and hardcoded sample data. They are registered with CopilotKit frontend tools so the agent can update the shared main-page workspace from chat.

### 5.1 Bill Summary Card

```
File: src/components/views/bill-summary-card.tsx
Hook: src/components/views/use-bill-summary.ts
```

| Element | Detail |
|---|---|
| Total due | Large COP-formatted number |
| Due date | With urgency color |
| Service breakdown | Horizontal stacked bar: energy, water, sewer, gas, other |
| Biggest driver | Highlighted badge |
| Period | Billing month label |

### 5.2 Change Analysis Card

```
File: src/components/views/change-analysis-card.tsx
Hook: src/components/views/use-change-analysis.ts
```

| Element | Detail |
|---|---|
| Deltas | Per-service: +/- value with unit and percentage |
| Sparklines | Mini trend lines per service across available months |
| Spike alert | Red badge if any service >20% increase |
| Explanation | Agent-generated text block |

### 5.3 Persona Benchmark Card

```
File: src/components/views/benchmark-card.tsx
Hook: src/components/views/use-benchmark.ts
```

| Element | Detail |
|---|---|
| Usage gauge | Per-service bar showing user value within persona range |
| Top 3 personas | Cards with label, zone, profile description |
| Status badges | "Below average" / "Within range" / "Above average" per service |

### 5.4 Savings Plan Card

```
File: src/components/views/savings-plan-card.tsx
Hook: src/components/views/use-savings-plan.ts
```

| Element | Detail |
|---|---|
| Action cards | 3-5 recommendations ranked by savings potential |
| Estimated savings | COP/month per action |
| Difficulty badge | Easy / Medium / Effort |
| Reasoning | Personalized explanation tied to actual usage |

### Registration Pattern

Each view has a `use-*.ts` file that calls `useFrontendTool`. Tool handlers update `GeneratedViewPanel`; the chat stays a control surface instead of duplicating the generated UI:

```ts
import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";

export function useBillSummary() {
  useFrontendTool({
    name: "show_bill_summary",
    description: "Displays a bill summary with total due, service breakdown, and biggest cost driver",
    parameters: z.object({ /* matches BillSummaryProps */ }),
    followUp: false,
    handler: async (props) => {
      useGeneratedViewStore.getState().setActiveView({
        type: "summary",
        props,
      });
      return "Rendered the bill summary in the main Kana workspace.";
    },
  });
}
```

All four `use-*` hooks are called from a single `src/components/views/register-views.tsx` component mounted once in the layout.

**Done when:** each card renders correctly with hardcoded sample data and is registered as a CopilotKit component.

---

## Module 6: Multi-Bill & State (Dev B)

**Branch:** `feat/multi-bill`
**Depends on:** M2, M3

| Step | Task | Files |
|---|---|---|
| 6.1 | Update bill store to support ordered bill history | `src/lib/store/bill-store.ts` |
| 6.2 | Add bill selector UI: tabs or dropdown showing billing periods | `src/components/bill-selector.tsx` |
| 6.3 | Wire `useAgentContext` to push full `bills[]` to agent on every change | `page.tsx` |
| 6.4 | Update change analysis logic to work across all available months | agent tools |

**Done when:** uploading 3+ bills shows multi-month trends.

---

## Module 7: Polish (Dev A)

**Branch:** `feat/polish`
**Depends on:** M5, integration with M4

| Step | Task |
|---|---|
| 7.1 | Landing page: hero text, upload zone, sample screenshot |
| 7.2 | Loading skeletons during PDF parse |
| 7.3 | Empty states before any bill is uploaded |
| 7.4 | CopilotSidebar branding: welcome message, suggested prompts ("What changed?", "How do I compare?", "How can I save?") |
| 7.5 | "Try with sample data" button that loads all six sample bills without PDF upload |
| 7.6 | Responsive: sidebar on desktop, bottom sheet on mobile |

---

## Module 8: Testing & Integration (All)

**Branch:** `feat/testing`
**Depends on:** all modules

| Test | Owner | What |
|---|---|---|
| Parser accuracy | Dev B | Six sample bills produce valid `Bill` objects with correct ranges |
| Agent routing | Dev C | Four core queries route to correct view types |
| Component render | Dev A | All four view components render without errors |
| End-to-end flow | All | Upload -> summary -> "what changed" -> "compare" -> "save" |
| Error handling | All | Invalid PDF, empty PDF, non-EPM bill degrade gracefully |

---

## File Structure

```
src/
  app/
    page.tsx                              # Landing + upload zone + CopilotSidebar
    layout.tsx                            # CopilotKitProvider wrapper
    api/
      copilotkit/[[...slug]]/route.ts     # CopilotRuntime + agent
      upload/route.ts                     # PDF upload endpoint
      parse/route.ts                      # PDF parse endpoint
  components/
    upload-zone.tsx                       # Drag-and-drop PDF upload
    bill-selector.tsx                     # Multi-bill tabs
    views/
      register-views.tsx                  # Mounts all frontend tool hooks
      bill-summary-card.tsx               # View: summary
      use-bill-summary.ts
      change-analysis-card.tsx            # View: trends
      use-change-analysis.ts
      benchmark-card.tsx                  # View: personas
      use-benchmark.ts
      savings-plan-card.tsx               # View: actions
      use-savings-plan.ts
  lib/
    parser/
      extract-text.ts                     # PDF buffer -> raw text
      parse-epm-bill.ts                   # Raw text -> Bill (via Claude)
      __tests__/
        parse-epm-bill.test.ts
    agent/
      system-prompt.ts                    # Agent system prompt
      tools.ts                            # Agent tool definitions
    store/
      bill-store.ts                       # Zustand store
    sample-data.ts                        # Typed re-export of sample JSON
  types/
    bill.ts
    persona.ts
    views.ts
data/
  sample/
    epm-bills-summary.json
    medellin-personas.json
```

---

## Integration Checkpoints

These are the moments where workstreams must sync:

| Checkpoint | Who | What to verify |
|---|---|---|
| **C1: Types agreed** | All | `bill.ts`, `persona.ts`, `views.ts` are final and merged in M1 |
| **C2: Parser returns Bill** | B + C | Dev C can call the parse API and receive a valid `Bill` |
| **C3: Components accept props** | A + C | Dev C can call frontend tools and Dev A's components render in the main workspace |
| **C4: Full loop** | All | Upload -> parse -> agent -> generative UI -> user sees cards |

---

## Timeline (3 devs, 2 days)

| Time | Dev A (Frontend) | Dev B (Data & Parser) | Dev C (Agent) |
|---|---|---|---|
| **Day 1 AM** | M1: scaffold, install deps, CopilotKit wiring, shared types | Review types, plan parser | Review types, plan agent prompt |
| **Day 1 PM** | M5: build all four view components with hardcoded data | M2 + M3: upload zone, text extraction, EPM parser | M4: system prompt, tools, intent detection |
| **Day 2 AM** | Integration: wire components to agent (C3) | M6: multi-bill state, bill selector | Integration: wire tools to parser output (C2) |
| **Day 2 PM** | M7: polish, landing page, responsive | M8: parser tests, error handling | M8: agent tests, full loop (C4) |
