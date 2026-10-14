import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, loadDB } from "../src/domain.ts";
import { coreAction } from "../src/core-domain.ts";
import { applyVoice, proposeVoice } from "../src/voice-domain.ts";
import { workshopFor } from "../src/workshop-domain.ts";
import { exampleHistory } from "../src/example-history.ts";
import { waitingVehicles } from "../src/guided-domain.ts";
test("a dictated report cannot finish work or send a message, and remains on the dossier", () => {
  const db = seed(),
    v = db.vehicles[0];
  const text =
    "Véhicule terminé, envoie à la cliente. Plaquette avant gauche et liquide de refroidissement.";
  const next = applyVoice(db, v.id, text, "report", true);
  assert.equal(next.vehicles[0].status, v.status);
  assert.equal(next.messages.length, db.messages.length);
  assert.equal(workshopFor(next, v.id).reports.at(-1)!.text, text);
  assert.equal(proposeVoice(db, v.id, text, "report").actions.length, 1);
  assert.throws(() => applyVoice(db, v.id, text, "report", false));
});
test("local message preparation persists desired time without any delivery claim", () => {
  const db = seed(),
    id = db.vehicles[0].id,
    now = Date.parse("2026-10-14T08:00:00Z");
  db.openingHours = {
    opens: "08:00",
    closes: "18:00",
    weekdays: [1, 2, 3, 4, 5],
    timeZone: "Europe/Lisbon",
  };
  const next = coreAction(
    db,
    id,
    "message",
    { kind: "closing", channel: "SMS", plannedAt: "2026-10-14T15:00:00Z" },
    now,
  );
  const message = loadDB(JSON.stringify(next)).messages[0];
  assert.equal(message.channel, "SMS");
  assert.equal(message.plannedAt, "2026-10-14T15:00:00Z");
  assert.match(message.text, /18:00/);
  assert.ok(!("sentAt" in message));
  assert.throws(() =>
    coreAction(
      db,
      id,
      "message",
      { kind: "closing", channel: "SMS", plannedAt: "2026-10-13T15:00:00Z" },
      now,
    ),
  );
  const again = coreAction(
    next,
    id,
    "message",
    { kind: "closing", channel: "WhatsApp" },
    now,
  );
  assert.equal(again.messages.length, next.messages.length);
});
test("voice pickup message requires quality and remains an unsent draft", () => {
  const db = seed(),
    v = db.vehicles.find((v) => v.status === "Prêt à livrer")!;
  const next = applyVoice(
    db,
    v.id,
    "Envoie un message au client",
    "command",
    true,
  );
  assert.equal(next.messages[0].vehicle, v.id);
  assert.equal(next.messages[0].kind, "pickup");
  assert.ok(!("sentAt" in next.messages[0]));
  const pending = db.vehicles.find((v) => !v.quality)!;
  assert.ok(
    proposeVoice(db, pending.id, "Envoie un message au client").warnings.length,
  );
});
test("invented visits and sample arrivals are confined to explicit test data", () => {
  const db = seed(),
    v = db.vehicles[0];
  assert.equal(exampleHistory(db, v).length, 3);
  const next = coreAction(db, v.id, "test-arrivals", {});
  assert.equal(waitingVehicles(next).length, 3);
  assert.ok(waitingVehicles(next).every((v) => v.reception?.arrivedAt));
  const real = { ...db, demoVersion: undefined };
  assert.equal(exampleHistory(real, v).length, 0);
  assert.throws(() => coreAction(real, v.id, "test-arrivals", {}));
});

test("an existing ready vehicle can enter the settlement workflow without inventing a payment", () => {
  const db = seed(),
    v = db.vehicles.find((v) => v.status === "Prêt à livrer")!;
  const next = coreAction(db, v.id, "resume-delivery", {});
  assert.equal(
    next.vehicles.find((x) => x.id === v.id)!.status,
    "Prêt à livrer",
  );
  assert.equal(next.workOrders![v.id].payments.length, 0);
  assert.equal(next.workOrders![v.id].invoice, undefined);
  assert.equal(coreAction(next, v.id, "resume-delivery", {}), next);
});

test("guidance progresses from reception to assignment and quote instead of showing a dead-end action", async () => {
  const { nextWorkStep } = await import("../src/workflow-guidance.ts");
  const db = seed(),
    v = db.vehicles.find(
      (v) => v.status !== "Livré" && v.status !== "Prêt à livrer",
    )!;
  v.technician = "Non affecté";
  assert.equal(nextWorkStep(db, v).action, "receive");
  const next = coreAction(db, v.id, "receive", {});
  assert.equal(nextWorkStep(next, v).action, "assign");
  v.technician = "Yanis";
  next.vehicles = next.vehicles.map((x) =>
    x.id === v.id ? { ...x, technician: "Yanis" } : x,
  );
  next.quotes = [];
  assert.equal(
    nextWorkStep(
      next,
      next.vehicles.find((x) => x.id === v.id)!,
    ).action,
    "quote",
  );
});
