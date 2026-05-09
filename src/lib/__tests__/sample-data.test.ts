import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

test("sample bills JSON has 6 records with required fields", async () => {
  const raw = JSON.parse(
    await readFile(
      new URL("../../../data/sample/epm-bills-summary.json", import.meta.url),
      "utf8",
    ),
  ) as Record<string, unknown>[];

  assert.equal(raw.length, 6);

  const requiredFields = [
    "source_file",
    "billing_period",
    "city",
    "stratum",
    "water_m3",
    "water_cop",
    "sewer_m3",
    "sewer_cop",
    "energy_kwh",
    "energy_cop",
    "gas_m3",
    "gas_cop",
    "other_entities_cop",
    "estimated_total_cop",
  ];

  for (const record of raw) {
    for (const field of requiredFields) {
      assert.ok(
        field in record,
        `Missing field "${field}" in record ${record.source_file}`,
      );
    }
  }
});

test("sample bills values are within expected ranges", async () => {
  const raw = JSON.parse(
    await readFile(
      new URL("../../../data/sample/epm-bills-summary.json", import.meta.url),
      "utf8",
    ),
  ) as Array<{
    water_m3: number;
    energy_kwh: number;
    gas_m3: number;
    estimated_total_cop: number;
  }>;

  for (const r of raw) {
    assert.ok(r.water_m3 >= 6 && r.water_m3 <= 10, `water_m3 out of range: ${r.water_m3}`);
    assert.ok(r.energy_kwh >= 131 && r.energy_kwh <= 186, `energy_kwh out of range: ${r.energy_kwh}`);
    assert.ok(r.gas_m3 >= 5.9 && r.gas_m3 <= 12, `gas_m3 out of range: ${r.gas_m3}`);
    assert.ok(
      r.estimated_total_cop >= 354000 && r.estimated_total_cop <= 464000,
      `total out of range: ${r.estimated_total_cop}`,
    );
  }
});

test("personas JSON has 20 records with expected ranges", async () => {
  const raw = JSON.parse(
    await readFile(
      new URL("../../../data/sample/medellin-personas.json", import.meta.url),
      "utf8",
    ),
  ) as Array<{
    id: string;
    stratum: number;
    expected_water_m3: [number, number];
    expected_energy_kwh: [number, number];
    expected_gas_m3: [number, number];
  }>;

  assert.equal(raw.length, 20);

  for (const p of raw) {
    assert.ok(p.stratum >= 1 && p.stratum <= 6, `Invalid stratum: ${p.stratum}`);
    assert.ok(p.expected_water_m3[0] < p.expected_water_m3[1], `Invalid water range for ${p.id}`);
    assert.ok(p.expected_energy_kwh[0] < p.expected_energy_kwh[1], `Invalid energy range for ${p.id}`);
    assert.ok(p.expected_gas_m3[0] < p.expected_gas_m3[1], `Invalid gas range for ${p.id}`);
  }
});
