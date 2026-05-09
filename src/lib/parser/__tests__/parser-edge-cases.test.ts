import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEpmBill } from "../parse-epm-bill.ts";

test("empty text throws an error", async () => {
  await assert.rejects(
    () => parseEpmBill("", { useClaude: false }),
    { message: /non-empty/ },
  );
});

test("non-EPM text returns a bill with missing provider", async () => {
  const bill = await parseEpmBill(
    "Some random text that is not an EPM bill at all. Invoice #12345.",
    { useClaude: false },
  );
  assert.ok(bill.confidence < 0.5);
});

test("partial EPM bill extracts what it can", async () => {
  const bill = await parseEpmBill(
    `
    Empresas Publicas de Medellin
    Medellín
    Estrato: 4
    Periodo de consumo: marzo de 2026
    Energia electrica consumo 142 kWh valor $ 136.531,30
    Total a pagar $ 200.000,00
  `,
    { useClaude: false },
  );

  assert.equal(bill.provider, "EPM");
  assert.equal(bill.city, "Medellín");
  assert.equal(bill.stratum, 4);
  assert.equal(bill.electricity_kwh, 142);
  assert.ok(bill.confidence > 0);
  assert.ok(bill.confidence < 1);
});

test("spanish accented characters are handled", async () => {
  const bill = await parseEpmBill(
    `
    Empresas Públicas de Medellín
    Período de consumo: febrero de 2026
    Medellín
    Estrato: 3
    Acueducto consumo 7 m3 valor $ 65.000,00
    Alcantarillado consumo 7 m3 valor $ 48.000,00
    Energía eléctrica consumo 160 kWh valor $ 170.000,00
    Gas consumo 8 m3 valor $ 32.000,00
    Otras entidades valor $ 75.000,00
    Total a pagar $ 390.000,00
  `,
    { useClaude: false },
  );

  assert.equal(bill.provider, "EPM");
  assert.equal(bill.city, "Medellín");
  assert.equal(bill.stratum, 3);
  assert.equal(bill.water_m3, 7);
  assert.equal(bill.electricity_kwh, 160);
  assert.ok(bill.confidence >= 0.8);
});
