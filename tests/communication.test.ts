import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  updateVehicle,
  loadDB,
  bayPosition,
  vehiclePosition,
} from "../src/domain.ts";
import { prepareClientMessage } from "../src/communication-domain.ts";
import { saveQuote } from "../src/quote-domain.ts";

test("pickup draft follows quality validation, is idempotent, and has no send state", () => {
  const db = seed();
  assert.throws(() => prepareClientMessage(db, "v1", "pickup"), /qualité/);
  const next = updateVehicle(db, "v1", {
    quality: true,
    status: "Prêt à livrer",
  });
  assert.equal(next.messages.length, db.messages.length + 1);
  assert.equal(prepareClientMessage(next, "v1", "pickup"), next);
  assert.match(next.messages[0].text, /GH-482-LP/);
  assert.ok(!("sent" in next.messages[0]));
});
test("submitted quote prepares correct rounded TTC without approving customer consent", () => {
  const db = seed();
  const next = saveQuote(db, {
    id: "quote-outbox",
    vehicle: "v1",
    vat: 20,
    state: "À valider",
    at: new Date().toISOString(),
    lines: [
      { id: "line", label: "Remplacement freins", quantity: 1, unitPrice: 100 },
    ],
  });
  assert.match(next.messages[0].text, /120,00/);
  assert.match(next.messages[0].text, /confirmer votre accord/);
  assert.equal(
    next.quotes!.find((q) => q.id === "quote-outbox")!.state,
    "À valider",
  );
  assert.equal(next.vehicles[0].status, db.vehicles[0].status);
});

test("dealership layout survives serialization and rejects invalid workshop dimensions", () => {
  const db = seed();
  db.dealership = {
    leftBrand: "Citroën",
    rightBrand: "Renault",
    waitingRoom: false,
    workshopSpacing: 7,
  };
  assert.equal(loadDB(JSON.stringify(db)).dealership!.waitingRoom, false);
  assert.deepEqual(bayPosition(8, db.dealership), [7, -61]);
  const positions = db.vehicles
    .filter((v) => v.present !== false && v.status !== "Livré")
    .map((v) => vehiclePosition(v, db.vehicles, db.dealership));
  assert.equal(new Set(positions.map((p) => p.join(","))).size, 14);
  db.dealership.workshopSpacing = 100;
  assert.throws(() => loadDB(JSON.stringify(db)));
});
