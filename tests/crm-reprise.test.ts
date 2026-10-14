import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/domain.ts";
import { coreAction } from "../src/core-domain.ts";
import { emptyWorkshop } from "../src/workshop-domain.ts";
import { nextWorkStep } from "../src/workflow-guidance.ts";

function fixture() {
  const db = seed();
  db.appointments = [];
  for (const v of db.vehicles) {
    v.bay = null;
    db.workshop![v.id] = emptyWorkshop();
  }
  return db;
}

test("assignment refuses a technician whose timer already runs on another vehicle", () => {
  const db = fixture();
  const [busy, target] = db.vehicles;
  Object.assign(busy, { status: "En intervention", technician: "Yanis" });
  db.workshop![busy.id] = {
    ...emptyWorkshop(),
    runningSince: new Date().toISOString(),
  };
  Object.assign(target, {
    status: "Réception",
    technician: "Non affecté",
    department: "Mécanique",
  });
  const opened = coreAction(db, target.id, "receive", {});
  assert.throws(
    () =>
      coreAction(opened, target.id, "assign", {
        technician: "Yanis",
        bay: null,
      }),
    /intervention active/,
  );
  // Same technician is still allowed once his timer is paused.
  opened.workshop![busy.id] = { ...emptyWorkshop(), runningSince: null };
  const assigned = coreAction(opened, target.id, "assign", {
    technician: "Yanis",
    bay: null,
  });
  assert.equal(
    assigned.vehicles.find((v) => v.id === target.id)!.technician,
    "Yanis",
  );
});

test("a vehicle already in progress without a work order is guided to open its follow-up, not to a reception step", () => {
  const db = fixture();
  const v = db.vehicles.find((v) => v.status === "En intervention")!;
  delete db.workOrders;
  const step = nextWorkStep(db, v);
  assert.equal(step.action, "open");
  // Opening the follow-up must not declare the client present at reception.
  const opened = coreAction(db, v.id, "open", {});
  assert.equal(
    opened.vehicles.find((x) => x.id === v.id)!.reception,
    undefined,
  );
  assert.ok(opened.workOrders![v.id]);
  assert.match(step.label, /suivi des travaux/i);
  const fresh = db.vehicles.find((v) => v.status === "Réception") || v;
  fresh.status = "Réception";
  assert.equal(nextWorkStep(db, fresh).label, "Prendre en charge");
});

test("a refused quote is frozen, never billed, and the vehicle leaves the quote-pending status", async () => {
  const { saveQuote, rejectQuote, approveQuote } =
    await import("../src/quote-domain.ts");
  const db = fixture();
  const v = db.vehicles[1];
  v.status = "Devis à valider";
  db.quotes = [];
  const quote = {
    id: "q-refus",
    vehicle: v.id,
    at: new Date().toISOString(),
    state: "À valider" as const,
    vat: 20,
    lines: [{ id: "l", label: "Disques", quantity: 1, unitPrice: 100 }],
  };
  let next = saveQuote(db, quote);
  next = rejectQuote(next, "q-refus", "trop cher");
  assert.equal(next.quotes!.find((q) => q.id === "q-refus")!.state, "Refusé");
  assert.equal(next.vehicles.find((x) => x.id === v.id)!.status, "Diagnostic");
  assert.throws(() => approveQuote(next, "q-refus"));
  assert.throws(() => saveQuote(next, { ...quote, state: "Brouillon" }));
  assert.throws(() => rejectQuote(next, "q-refus"));
  assert.ok(next.audit.some((a) => /trop cher/.test(a.action)));
  // A new version can still be composed and accepted.
  const again = saveQuote(next, { ...quote, id: "q-v2" });
  assert.equal(
    approveQuote(again, "q-v2").quotes!.find((q) => q.id === "q-v2")!.state,
    "Validé",
  );
});

test("opening a bodywork work order lists the preparation, repair, paint and control steps", () => {
  const db = fixture();
  const v = db.vehicles[2];
  Object.assign(v, { status: "Réception", department: "Carrosserie" });
  const opened = coreAction(db, v.id, "open", {});
  const labels = opened.workOrders![v.id].tasks.map((t) => t.label);
  assert.equal(labels.length, 5);
  assert.match(labels[1], /Préparation/);
  assert.match(labels[3], /Peinture/);
  const mech = db.vehicles[3];
  Object.assign(mech, { status: "Réception", department: "Mécanique" });
  assert.equal(
    coreAction(db, mech.id, "open", {}).workOrders![mech.id].tasks.length,
    1,
  );
});
