# Kana

Kana is a PDF-first utility copilot that turns an uploaded household bill into a live, agent-generated interface.

For the hackathon MVP, Kana is demonstrated on real EPM bills from Medellin and uses electricity as the lead story while still understanding water, sewer, and gas. Instead of a fixed dashboard, the agent reads the bill, understands the user's question, and renders the right UI at runtime.

## Local Development

Run the app from the Next.js project root:

```bash
cd repo-pr2
git fetch origin
git switch main
git pull --ff-only
npm install
npm run dev
```

Open `http://localhost:3000`.

If you need to test from another device on the same network, expose the dev server:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then open the printed network URL, for example `http://192.168.x.x:3000`.

## Environment

Create `.env.local` for local secrets. The parser works without Claude for clean EPM sample-style PDFs by falling back to the deterministic local parser, but Claude improves structured extraction:

```bash
ANTHROPIC_API_KEY=...
```

Optional model overrides:

```bash
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
KANA_CHAT_MODEL=claude-haiku-4-5-20251001
```

Do not commit `.env`, `.env.local`, or raw personal PDFs. The repo ignores `*.pdf` and keeps only sanitized JSON sample data.

## Smoke Test

After starting `npm run dev`, verify the main demo path:

1. Open `http://localhost:3000`.
2. Drop or browse for an EPM PDF bill in the upload zone.
3. Confirm the UI changes from `Parsing...` to `Parsed`.
4. Confirm a bill summary appears with the parsed billing period, total due, and service breakdown.

To verify the API directly with a local PDF:

```bash
curl -i -F "file=@/absolute/path/to/bill.pdf;type=application/pdf" \
  http://localhost:3000/api/upload
```

The response should be `200 OK` with a `bill` object containing fields such as `billing_period`, `total_due`, `electricity_kwh`, `water_m3`, and `confidence`.

## Checks

Run these before opening or merging a PR:

```bash
npm test
npm run lint
npm run build
```

## MVP

The MVP should do five things well:

- accept one or more uploaded EPM PDF bills
- extract structured data for electricity, water, sewer, gas, and other charges
- generate different UI views at runtime instead of showing a fixed dashboard
- compare the user's bill against recent history and similar households
- produce practical savings guidance grounded in the uploaded bills

## Core demo views

Kana should support these four generative UI moments:

1. `Bill Summary`
   Total due, due date, service totals, and biggest cost driver.
2. `What Changed`
   Month-over-month changes in electricity, water, gas, and total bill.
3. `You vs Similar Households`
   Benchmark against synthetic households with similar profiles.
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

The current demo is grounded in EPM bills from Medellin, but the product story is broader: a universal bill-to-interface workflow that can expand across providers and countries.

## Roadmap

### Phase 1: Hackathon MVP

- upload EPM PDFs
- parse bill data into a normalized schema
- support the four core generative views
- use local sample bills plus synthetic household personas

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
