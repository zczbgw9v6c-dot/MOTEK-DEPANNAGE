import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, loadDB } from "../src/domain.ts";
import {
  showroomCars,
  waitingVehicles,
  zoneVehicles,
  todaysOrders,
  awaitingOrders,
} from "../src/guided-domain.ts";
test("guided zones separate workshop, delivery, waiting and showroom inventory", () => {
  const db = seed();
  assert.equal(zoneVehicles(db, "atelier").length, 6);
  assert.equal(zoneVehicles(db, "livraison").length, 4);
  assert.equal(zoneVehicles(db, "parking").length, 4);
  assert.equal(waitingVehicles(db).length, 0);
  assert.equal(showroomCars(db).filter((v) => v.available).length, 3);
  assert.equal(
    db.vehicles.filter((v) => v.present !== false && v.status !== "Livré")
      .length,
    14,
  );
});
test("real garages do not acquire simulated people or commercial inventory", () => {
  const db = seed();
  delete db.demoVersion;
  assert.deepEqual(waitingVehicles(db), []);
  assert.deepEqual(showroomCars(db), []);
});
test("today means the Lisbon calendar day; undated orders are never silently dated", () => {
  const db = seed();
  db.orders = [
    {
      id: "today",
      part: db.parts[0].id,
      quantity: 1,
      status: "À valider",
      at: "2026-10-13T23:30:00Z",
    },
    {
      id: "yesterday",
      part: db.parts[0].id,
      quantity: 1,
      status: "Reçue",
      at: "2026-10-13T21:00:00Z",
    },
    { id: "unknown", part: db.parts[0].id, quantity: 1, status: "À valider" },
  ];
  assert.deepEqual(
    todaysOrders(db, new Date("2026-10-14T00:15:00+01:00")).map((o) => o.id),
    ["today"],
  );
  assert.deepEqual(
    awaitingOrders(db).map((o) => o.id),
    ["today", "unknown"],
  );
  assert.deepEqual(loadDB(JSON.stringify(db)).orders, db.orders);
  db.orders[0].at = "bad-date";
  assert.throws(() => loadDB(JSON.stringify(db)));
});
