import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parseEpmBill } from "../parse-epm-bill.ts";
import type { Bill } from "../../../types/bill.ts";

const sampleBills = JSON.parse(
  await readFile(new URL("../../../../data/sample/epm-bills-summary.json", import.meta.url), "utf8"),
) as Array<{
  source_file: string;
  billing_period: string;
  city: string;
  stratum: number;
  water_m3: number;
  water_cop: number;
  sewer_m3: number;
  sewer_cop: number;
  energy_kwh: number;
  energy_cop: number;
  gas_m3: number;
  gas_cop: number;
  other_entities_cop: number;
  estimated_total_cop: number;
}>;

test("parses all six sample bills into required Bill fields", async () => {
  const parsedBills: Bill[] = [];

  for (const sample of sampleBills) {
    const bill = await parseEpmBill(sampleToExtractedText(sample), {
      sourceFile: sample.source_file,
      useClaude: false,
    });

    parsedBills.push(bill);
    assertRequiredFields(bill);
    assert.equal(bill.provider, "EPM");
    assert.equal(bill.currency, "COP");
    assert.equal(bill.billing_period, sample.billing_period);
    assert.equal(bill.city, sample.city);
    assert.equal(bill.stratum, sample.stratum);
    assert.equal(bill.water_m3, sample.water_m3);
    assert.equal(bill.electricity_kwh, sample.energy_kwh);
    assert.equal(bill.gas_m3, sample.gas_m3);
    assert.ok(bill.confidence >= 0.8);
  }

  assert.equal(parsedBills.length, 6);
  assertRange(parsedBills.map((bill) => bill.water_m3), 6, 10);
  assertRange(parsedBills.map((bill) => bill.electricity_kwh), 131, 186);
  assertRange(parsedBills.map((bill) => bill.gas_m3), 5.9, 12);
  assertRange(parsedBills.map((bill) => bill.total_due), 354000, 464000);
});

test("confidence degrades by 0.1 per missing required field", async () => {
  const bill = await parseEpmBill(
    `
    Empresas Publicas de Medellin
    Periodo de consumo: abril de 2026
    Medellín
    Estrato: 5
    Acueducto consumo 6 m3 valor $ 58.561,35
    Energia electrica consumo 142 kWh valor $ 136.531,30
  `,
    { useClaude: false },
  );

  assert.equal(bill.confidence, 0.4);
});

function sampleToExtractedText(sample: (typeof sampleBills)[number]): string {
  return `
    Empresas Publicas de Medellin E.S.P.
    Factura de servicios publicos domiciliarios
    Ciudad: ${sample.city}
    Estrato: ${sample.stratum}
    Periodo de consumo: ${sample.billing_period}

    Detalle de cobros
    Acueducto consumo ${formatUsage(sample.water_m3)} m3 valor $ ${formatCop(sample.water_cop)}
    Alcantarillado consumo ${formatUsage(sample.sewer_m3)} m3 valor $ ${formatCop(sample.sewer_cop)}
    Energia electrica consumo ${formatUsage(sample.energy_kwh)} kWh valor $ ${formatCop(sample.energy_cop)}
    Gas consumo ${formatUsage(sample.gas_m3)} m3 valor $ ${formatCop(sample.gas_cop)}
    Otras entidades valor $ ${formatCop(sample.other_entities_cop)}

    Total a pagar $ ${formatCop(sample.estimated_total_cop)}
  `;
}

function assertRequiredFields(bill: Bill): void {
  const required: Array<keyof Bill> = [
    "billing_period",
    "provider",
    "currency",
    "city",
    "stratum",
    "total_due",
    "electricity_kwh",
    "electricity_cost",
    "water_m3",
    "water_cost",
    "sewer_m3",
    "sewer_cost",
    "gas_m3",
    "gas_cost",
    "other_charges",
    "confidence",
  ];

  for (const field of required) {
    assert.notEqual(bill[field], null, `${field} should be present`);
    assert.notEqual(bill[field], undefined, `${field} should be present`);
  }
}

function assertRange(values: number[], min: number, max: number): void {
  assert.ok(Math.min(...values) >= min);
  assert.ok(Math.max(...values) <= max);
}

function formatUsage(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
