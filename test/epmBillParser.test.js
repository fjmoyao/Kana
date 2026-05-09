import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parseEpmBillText } from "../src/parser/epmBillParser.js";

test("parses normalized EPM bill fields from extracted text", async () => {
  const fixture = await readFile(new URL("./fixtures/epm-april-2026.txt", import.meta.url), "utf8");
  const parsed = parseEpmBillText(fixture, { sourceFile: "abril 26.pdf" });

  assert.equal(parsed.provider, "EPM");
  assert.equal(parsed.billing_period, "abril de 2026");
  assert.equal(parsed.currency, "COP");
  assert.equal(parsed.due_date, "2026-05-18");
  assert.equal(parsed.water_m3, 6);
  assert.equal(parsed.water_cost, 58561.35);
  assert.equal(parsed.sewer_m3, 6);
  assert.equal(parsed.sewer_cost, 43474.61);
  assert.equal(parsed.electricity_kwh, 142);
  assert.equal(parsed.electricity_cost, 136531.3);
  assert.equal(parsed.gas_m3, 5.9);
  assert.equal(parsed.gas_cost, 27787.7);
  assert.equal(parsed.other_charges, 88165.28);
  assert.equal(parsed.total_due, 354520.24);
  assert.equal(parsed.confidence, 1);
});

test("infers billing period from source file when text does not expose it", () => {
  const parsed = parseEpmBillText(
    "EPM\nAcueducto 9 m3 $ 82.054,82\nEnergia 181 kWh $ 193.327,55",
    { sourceFile: "noviembre 25.pdf" },
  );

  assert.equal(parsed.billing_period, "noviembre de 2025");
});

test("estimates total due from service and other charges when total label is absent", () => {
  const parsed = parseEpmBillText(`
    EPM
    Acueducto 6 m3 $ 58.561,35
    Alcantarillado 6 m3 $ 43.474,61
    Energia electrica 142 kWh $ 136.531,30
    Gas 5,9 m3 $ 27.787,70
    Otras entidades $ 88.165,28
  `);

  assert.equal(parsed.total_due, 354520.24);
});
