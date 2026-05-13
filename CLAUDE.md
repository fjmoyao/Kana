# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kana is an agentic utility copilot for Medellin households. Users upload EPM (Empresas Públicas de Medellín) utility bill PDFs; an agent parses the bill and generates a live UI at runtime — bill breakdowns, trend views, spike alerts, persona comparisons, and savings recommendations. The interface is generated from the uploaded bill and user queries, not served from static pages.

**Stack:** Next.js 16 + CopilotKit 1.57 + Tailwind 4 + Zustand + Node built-in test runner.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (uses --webpack flag)
npm run lint         # ESLint
npm test             # Run all tests (Node built-in test runner, no Jest)
# Run a single test file:
node --experimental-strip-types --experimental-specifier-resolution=node --test src/lib/agent/__tests__/tools.test.ts
```

## Environment Variables

```
ANTHROPIC_API_KEY=          # Required for bill parsing (/api/parse) and agent
ANTHROPIC_MODEL=            # Optional; defaults to claude-haiku-4-5-20251001
```

## Core Concept

- **No fixed dashboard.** The same bill can produce different views (summary, trend, benchmark, savings) depending on what the user asks.
- **Agent-generated UI.** The agent reads the PDF, extracts structured data, and renders the right interface at query time.
- **Medellin-specific context.** Comparisons use 20 synthetic local personas varying by estrato (1–6), home type, occupant count, and usage patterns.

## Architecture

Three layers:

1. **PDF Parser** — `POST /api/parse` calls Claude (structured output) to extract five EPM service categories from raw PDF text. Output matches `src/types/bill.ts`. `src/lib/parser/` contains the extraction logic; `src/lib/server/bill-file-store.ts` manages server-side temp storage.

2. **Agent Layer** — `src/app/api/copilotkit/[[...slug]]/route.ts` uses `@copilotkit/runtime/v2` (`CopilotRuntime` + `BuiltInAgent` + `defineTool`). The agent has four backend tools in `src/lib/agent/tools.ts`: `get_bills`, `get_matching_personas`, `compare_usage`, `calculate_savings`. Bill context is pushed from the client via `useCopilotReadable` in `BillAgentContext`.

3. **UI Layer** — Four view hooks in `src/components/views/use-*.ts` register frontend tools via `useFrontendTool` (not `useCopilotAction`). Each hook maps a tool name (e.g. `show_bill_summary`) to a React component. `RegisterViews` mounts all four hooks as a null-rendering component in `page.tsx`. The agent calls these tools to render cards inline in `CopilotSidebar`.

## Key API Notes

- Frontend provider: `CopilotKit` (from `@copilotkit/react-core`), not `CopilotKitProvider`
- Backend runtime: import from `@copilotkit/runtime/v2` — use `CopilotRuntime`, `BuiltInAgent`, `defineTool`, `createCopilotRuntimeHandler`. The older `copilotRuntimeNextJSAppRouterEndpoint` pattern is not used here.
- Frontend tools: `useFrontendTool` from `@copilotkit/react-core` (the v2 replacement for `useCopilotAction` generative UI)
- Zod schemas are defined twice — once in `src/components/views/view-schemas.ts` (client) and once inline in `src/lib/agent/tools.ts` (server). Keep them in sync with `src/types/bill.ts`.

## Sample Data

`data/sample/epm-bills-summary.json` — Six sanitized EPM bills (Nov 2025–Apr 2026). Each record has `billing_period`, `stratum`, `city`, consumption + cost for water/sewer/energy/gas, `other_entities_cop`, `estimated_total_cop`. Typical ranges: water 6–10 m³, energy 131–186 kWh, gas 5.9–12.0 m³, total 354k–464k COP.

`data/sample/medellin-personas.json` — 20 synthetic households for benchmarking. Each has `id`, `label`, `zone`, `stratum`, `home_type`, `household_size`, `work_pattern`, `usage_profile`, and expected ranges for water/energy/gas.

Raw PDFs must not be committed.

## Demo Flow

1. Upload EPM PDF → agent extracts bill metadata and line items
2. Generated UI shows total due, service totals, key changes
3. User asks "what changed?" → trend cards and explanations
4. User asks "how do I compare?" → persona benchmark cards
5. User asks "how do I save?" → generated action plan
