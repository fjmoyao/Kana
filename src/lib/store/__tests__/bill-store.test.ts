import assert from "node:assert/strict";
import { test } from "node:test";
import type { Bill } from "../../../types/bill.ts";

const makeBill = (period: string, total: number): Bill => ({
  billing_period: period,
  provider: "EPM",
  currency: "COP",
  city: "Medellín",
  stratum: 5,
  total_due: total,
  electricity_kwh: 150,
  electricity_cost: 160000,
  water_m3: 8,
  water_cost: 70000,
  sewer_m3: 8,
  sewer_cost: 55000,
  gas_m3: 7,
  gas_cost: 30000,
  other_charges: 80000,
  confidence: 1.0,
});

test("bill store — addBill sorts chronologically", async () => {
  const { useBillStore } = await import("../bill-store.ts");
  const store = useBillStore.getState();

  store.loadSampleBills([]);
  store.addBill(makeBill("marzo de 2026", 380000));
  store.addBill(makeBill("enero de 2026", 450000));
  store.addBill(makeBill("febrero de 2026", 382000));

  const bills = useBillStore.getState().bills;
  assert.equal(bills.length, 3);
  assert.equal(bills[0].billing_period, "enero de 2026");
  assert.equal(bills[1].billing_period, "febrero de 2026");
  assert.equal(bills[2].billing_period, "marzo de 2026");
});

test("bill store — getActiveBill returns correct bill", async () => {
  const { useBillStore } = await import("../bill-store.ts");
  const store = useBillStore.getState();

  store.loadSampleBills([]);
  store.addBill(makeBill("enero de 2026", 450000));
  store.addBill(makeBill("febrero de 2026", 382000));
  store.setActive(0);

  const active = useBillStore.getState().getActiveBill();
  assert.ok(active);
  assert.equal(active.billing_period, "enero de 2026");
});

test("bill store — removeBill updates bills and index", async () => {
  const { useBillStore } = await import("../bill-store.ts");
  const store = useBillStore.getState();

  store.loadSampleBills([]);
  store.addBill(makeBill("enero de 2026", 450000));
  store.addBill(makeBill("febrero de 2026", 382000));
  store.addBill(makeBill("marzo de 2026", 380000));
  store.setActive(2);
  store.removeBill(0);

  const state = useBillStore.getState();
  assert.equal(state.bills.length, 2);
  assert.equal(state.bills[0].billing_period, "febrero de 2026");
  assert.ok(state.activeBillIndex <= state.bills.length - 1);
});

test("bill store — loadSampleBills replaces all bills", async () => {
  const { useBillStore } = await import("../bill-store.ts");
  const store = useBillStore.getState();

  store.addBill(makeBill("enero de 2026", 450000));
  store.loadSampleBills([
    makeBill("noviembre de 2025", 454000),
    makeBill("diciembre de 2025", 464000),
  ]);

  const state = useBillStore.getState();
  assert.equal(state.bills.length, 2);
  assert.equal(state.bills[0].billing_period, "noviembre de 2025");
});

test("bill store — getLatestBill returns last bill", async () => {
  const { useBillStore } = await import("../bill-store.ts");
  const store = useBillStore.getState();

  store.loadSampleBills([
    makeBill("enero de 2026", 450000),
    makeBill("abril de 2026", 354000),
  ]);

  const latest = useBillStore.getState().getLatestBill();
  assert.ok(latest);
  assert.equal(latest.billing_period, "abril de 2026");
});

test("bill store — empty store returns null for active/latest", async () => {
  const { useBillStore } = await import("../bill-store.ts");
  useBillStore.getState().loadSampleBills([]);

  const state = useBillStore.getState();
  assert.equal(state.getActiveBill(), null);
  assert.equal(state.getLatestBill(), null);
});
