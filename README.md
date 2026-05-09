# Kana

Kana is a Medellin-first utility copilot that turns an uploaded EPM bill into a live, agent-generated interface.

Instead of a fixed dashboard, Kana reads a user's PDF bill and renders the exact UI needed at runtime: service breakdowns, month-over-month changes, spike detection, savings recommendations, and "you vs similar households" comparisons using synthetic Medellin personas.

## What we're building

- PDF upload for EPM utility bills
- Bill parsing into structured water, sewer, energy, gas, and other-charge data
- Runtime-generated UI instead of static pages
- Local benchmark comparisons against similar Medellin households
- Personalized recommendations to help reduce next month's bill

## Why this fits the hackathon

Kana is not a chatbot with a dashboard attached. The agent sees the uploaded bill, understands the user's question, and generates the interface in real time. The same bill can produce different experiences: a summary view, a trend view, a benchmark view, or a savings workflow.

## Current sample data

The repo includes a sanitized summary dataset derived from six recent EPM bills from November 2025 through April 2026:

- [`data/sample/epm-bills-summary.json`](data/sample/epm-bills-summary.json)
- [`data/sample/medellin-personas.json`](data/sample/medellin-personas.json)

Raw personal PDFs are intentionally not committed to the repository.

## Demo flow

1. Upload an EPM bill PDF.
2. Generate a bill summary with total due and service-level costs.
3. Ask what changed and render month-over-month consumption views.
4. Compare the household against similar Medellin personas.
5. Show the actions most likely to lower the next bill.

## Product one-liner

Kana helps Medellin households understand and lower their utility bills through agent-generated interfaces built from uploaded EPM PDFs.
