# EPM Bill Parser

Issue #6 starts the data layer for Kana's PDF-first MVP.

The parser is split into two responsibilities:

- `src/lib/parser/extract-text.ts` extracts text from a PDF `Buffer` with `pdf-parse`.
- `src/lib/parser/parse-epm-bill.ts` maps extracted EPM bill text into Kana's normalized `Bill` object.
- `src/app/api/parse/route.ts` parses a previously uploaded file by `{ fileId }`.
- `src/app/api/upload/route.ts` stores the uploaded PDF and returns the parsed `Bill` in the upload response.

## Normalized Output

```json
{
  "source_file": "abril 26.pdf",
  "provider": "EPM",
  "billing_period": "abril de 2026",
  "currency": "COP",
  "city": "Medellín",
  "stratum": 5,
  "total_due": 354520.24,
  "electricity_kwh": 142,
  "electricity_cost": 136531.3,
  "water_m3": 6,
  "water_cost": 58561.35,
  "sewer_m3": 6,
  "sewer_cost": 43474.61,
  "gas_m3": 5.9,
  "gas_cost": 27787.7,
  "other_charges": 88165.28,
  "due_date": "2026-05-18",
  "confidence": 1
}
```

## Local Usage

```bash
npm test
```

Production PDF extraction uses `pdf-parse`. Structured bill extraction uses Claude via `@anthropic-ai/sdk` when `ANTHROPIC_API_KEY` is available, with a deterministic local parser fallback used for tests and clean sample verification.

## Notes

- Currency parsing accepts Colombian formats such as `$ 354.520,24`.
- Usage parsing supports `kWh`, `m3`, and `m³`.
- If the bill text omits the total but all service costs are present, the parser estimates `total_due` from service totals plus other charges.
- Confidence starts at `1.0` and degrades by `0.1` for each missing required field.
