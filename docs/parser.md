# EPM Bill Parser

Issue #6 starts the data layer for Kana's PDF-first MVP.

The parser is split into two responsibilities:

- `src/parser/pdfTextExtractor.js` extracts text from `.pdf` or `.txt` inputs.
- `src/parser/epmBillParser.js` maps extracted EPM bill text into Kana's normalized bill state.

## Normalized Output

```json
{
  "source_file": "abril 26.pdf",
  "provider": "EPM",
  "billing_period": "abril de 2026",
  "currency": "COP",
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
npm run parse:epm -- ./bill.txt
```

For PDFs, the extractor tries `pdftotext` first and `mutool` second. If neither is available, pass a `.txt` file with extracted bill text or install one of those tools locally.

## Notes

- Currency parsing accepts Colombian formats such as `$ 354.520,24`.
- Usage parsing supports `kWh`, `m3`, and `m³`.
- If the bill text omits the total but all service costs are present, the parser estimates `total_due` from service totals plus other charges.
