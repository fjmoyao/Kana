# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kana is an agentic utility copilot for Medellin households. Users upload EPM (Empresas Públicas de Medellín) utility bill PDFs; an agent parses the bill and generates a live UI at runtime — bill breakdowns, trend views, spike alerts, persona comparisons, and savings recommendations. The interface is generated from the uploaded bill and user queries, not served from static pages.

**Status:** Greenfield hackathon project — no application code exists yet.

## Core Concept

- **No fixed dashboard.** The same bill can produce different views (summary, trend, benchmark, savings) depending on what the user asks.
- **Agent-generated UI.** The agent reads the PDF, extracts structured data, and renders the right interface at query time.
- **Medellin-specific context.** Comparisons use 20 synthetic local personas varying by estrato (1–6), home type, occupant count, and usage patterns.

## Architecture (to build)

Three layers:

1. **PDF Parser** — Extracts five EPM service categories (water, sewer, energy, gas, other charges) from uploaded bill PDFs. Output shape matches `data/sample/epm-bills-summary.json`.

2. **Agent Layer** — Receives parsed bill + user query, selects which UI components to render, and returns structured component specs. The agent decides the view; it does not serve static pages.

3. **UI Layer** — Renders components at query time from agent output. Component types: bill summary, trend cards, persona benchmark cards, savings action plan, spike alerts.

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
