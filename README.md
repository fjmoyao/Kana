# Kana

Kana is a PDF-first utility copilot that turns an uploaded bill into a live, agent-generated interface.

For the hackathon MVP, Kana focuses on EPM bills from Medellin and uses electricity as the lead story while still understanding water, sewer, and gas. Instead of a fixed dashboard, the agent reads the bill, understands the user's question, and renders the right UI at runtime.

## MVP

The MVP should do five things well:

- accept one or more uploaded EPM PDF bills
- extract structured data for electricity, water, sewer, gas, and other charges
- generate different UI views at runtime instead of showing a fixed dashboard
- compare the user's bill against recent history and similar Medellin households
- produce practical savings guidance grounded in the uploaded bills

## Core demo views

Kana should support these four generative UI moments:

1. `Bill Summary`
   Total due, due date, service totals, and biggest cost driver.
2. `What Changed`
   Month-over-month changes in electricity, water, gas, and total bill.
3. `You vs Similar Households`
   Benchmark against synthetic Medellin households with similar profiles.
4. `Savings Plan`
   The most actionable next steps for lowering the next bill.

## Why this fits the hackathon

Kana is built for a generative UI hackathon, not for a chatbot demo.

- the user uploads a real bill
- the agent decides what interface to render next
- the same bill can produce different interfaces depending on the question
- the product would be weaker as plain text chat or a static dashboard

## Hackathon stack

The recommended stack for this project is:

- `CopilotKit` for the React application shell and agent-native UX
- `AG-UI` for agent-to-frontend transport and event flow
- `A2UI` for runtime-generated interface payloads
- `MCP` only where it clearly helps expose parsing or comparison tools

This keeps the project aligned with the protocols and kits highlighted by the hackathon.

## What is not in the MVP

To keep the scope honest and shippable, the MVP does not depend on:

- Gmail ingestion
- smart meter or real-time device access
- multi-country bill support
- switching utility providers

Kana is `PDF-first` today and `meter-ready` later.

## Roadmap

### Phase 1: Hackathon MVP

- upload EPM PDFs
- parse bill data into a normalized schema
- support the four core generative views
- use local sample bills plus synthetic Medellin personas

### Phase 2: Better utility intelligence

- stronger anomaly detection
- projected next-bill simulations
- editable assumptions like household size or work-from-home profile
- improved evidence and confidence display for extracted fields

### Phase 3: Broader platform

- more utilities and more cities
- country-specific bill packs
- optional utility portal sync or meter integrations where available
- household and business modes

## Data included in the repo

The repository includes sanitized sample inputs for prototyping:

- [`data/sample/epm-bills-summary.json`](data/sample/epm-bills-summary.json)
- [`data/sample/medellin-personas.json`](data/sample/medellin-personas.json)

Raw personal PDFs are intentionally not committed.

## Build docs

- [`docs/hackathon-brief.md`](docs/hackathon-brief.md)
- [`docs/mvp-roadmap.md`](docs/mvp-roadmap.md)

## References

- [CopilotKit docs](https://docs.copilotkit.ai)
- [AG-UI docs](https://docs.ag-ui.com/)
- [A2UI](https://a2ui.org/)
