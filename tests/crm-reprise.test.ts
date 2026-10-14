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
