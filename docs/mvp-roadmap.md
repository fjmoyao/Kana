# Kana MVP Roadmap

## Product thesis

Kana starts with the most universal utility data source in the world: the bill.

For the hackathon, that means a user can upload an EPM PDF and immediately get a runtime-generated interface that explains what they paid, what changed, how they compare, and what they should do next.

## Scope decisions

These are the product decisions the repo should reflect:

- `PDF-first`
  The MVP starts with uploaded bills, not Gmail or smart meters.
- `Electricity-led, multi-utility`
  Electricity is the main story, but water, sewer, and gas are part of the same household experience.
- `Medellin-first`
  The first parser and benchmark logic should be grounded in EPM bills and local personas.
- `Generative UI first`
  The agent should choose the interface based on the bill and the user's question.

## MVP requirements

### Input

- upload one or more EPM PDF bills
- parse bill text from native PDF text or OCR fallback

### Normalized bill state

Each bill should be converted into a consistent internal structure:

- `billing_period`
- `provider`
- `currency`
- `total_due`
- `electricity_kwh`
- `electricity_cost`
- `water_m3`
- `water_cost`
- `sewer_m3`
- `sewer_cost`
- `gas_m3`
- `gas_cost`
- `other_charges`
- `due_date`
- `confidence`

### Runtime-generated UI

The agent should be able to produce at least four interface payloads:

1. `summary`
2. `change_analysis`
3. `benchmark`
4. `savings_plan`

## Recommended hackathon stack

### Frontend

- `Next.js` or `React`
- `CopilotKit` for copilot and agent integration

### Agent transport

- `AG-UI`

### Generative UI protocol

- `A2UI`

### Optional tool layer

- `MCP`
  Use only if it helps expose clean actions such as `parse_bill`, `compare_household`, or `simulate_savings`.

## Official references

- [CopilotKit docs](https://docs.copilotkit.ai)
- [AG-UI docs](https://docs.ag-ui.com/)
- [A2UI](https://a2ui.org/)

## Suggested architecture

1. `Upload flow`
   User uploads one or more PDF bills.
2. `Bill parser`
   Server extracts and normalizes bill data.
3. `Bill memory`
   Parsed bills are stored as a simple session state or lightweight database record.
4. `Agent orchestration`
   The agent receives the normalized bill data plus the current user question.
5. `UI generation`
   The agent returns text plus a structured UI payload for the frontend to render.

## Build plan

### Step 1: Bill parsing

- load the uploaded PDF
- extract text
- map fields into a stable schema
- test against the sample data already in the repo

### Step 2: State and prompts

- define the normalized bill object
- define the persona lookup shape
- write prompts for the four core views

### Step 3: Generative UI transport

- wire the frontend to CopilotKit
- connect AG-UI events
- render A2UI payloads for the four views

### Step 4: Demo polish

- make the first view visually strong
- ensure each user question triggers a visibly different interface
- keep the story focused on real uploaded data

## Team split

If working as a team, a practical split is:

- `Person 1`: PDF parsing and schema normalization
- `Person 2`: agent prompts, comparison logic, and savings logic
- `Person 3`: frontend, CopilotKit, AG-UI, A2UI rendering
- `Person 4`: sample data, personas, demo script, and submission copy

## Roadmap beyond the hackathon

### Near-term

- better anomaly detection
- support for more billing templates
- user-adjustable household assumptions
- stronger savings simulations

### Mid-term

- meter or portal integrations where available
- more countries and utility providers
- provider-specific bill packs

### Long-term

- household and SMB product modes
- tariff optimization
- dispute support and bill audit workflows
