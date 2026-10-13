import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  updateVehicle,
  reservePart,
  loadDB,
  similarCases,
  record,
  zones,
} from "../src/domain.ts";
import { walls, findPath, blocked } from "../src/navigation.ts";
test("quality gate prevents delivery before validation and releases the bay after completion", () => {
  const d = seed();
  assert.throws(
    () => updateVehicle(d, "v1", { status: "Prêt à livrer" }),
    /qualité/,
  );
  assert.throws(() => updateVehicle(d, "v1", { status: "Livré" }), /prêt/);
  const ready = updateVehicle(d, "v1", {
    quality: true,
    status: "Prêt à livrer",
  });
  assert.equal(ready.vehicles[0].bay, null);
  assert.equal(
    updateVehicle(ready, "v1", { status: "Livré" }).vehicles[0].status,
    "Livré",
  );
  assert.equal(ready.audit[0].vehicle, "v1");
});
test("bay occupancy is enforced and unsuccessful assignment does not alter the original", () => {
  const d = seed();
  assert.throws(() => updateVehicle(d, "v1", { bay: 2 }), /occupé/);
  assert.equal(d.vehicles[0].bay, 1);
  assert.equal(updateVehicle(d, "v1", { bay: 8 }).vehicles[0].bay, 8);
});
test("reservations preserve physical stock, reduce availability and reject duplicates or empty stock", () => {
  const d = seed();
  const next = reservePart(d, "v1", "disc");
  assert.equal(next.parts[0].stock, 8);
  assert.equal(next.parts[0].reserved, 1);
  assert.deepEqual(next.vehicles[0].parts, ["disc"]);
  assert.throws(() => reservePart(next, "v1", "disc"), /déjà/);
  assert.throws(() => reservePart(d, "v1", "caliper"), /insuffisant/);
  assert.equal(d.parts[0].reserved, 0);
});
test("saved dossiers, reservations, drafts and audit survive serialization", () => {
  let d = reservePart(seed(), "v1", "pads");
  d = record(
    {
      ...d,
      messages: [
        { id: "message", vehicle: "v1", text: "Brouillon non envoyé" },
      ],
    },
    "v1",
    "Brouillon préparé",
  );
  assert.deepEqual(loadDB(JSON.stringify(d)), d);
  assert.throws(() => loadDB('{"version":2}'), /incompatible/);
});
test("similarity retrieves electrical codes without inventing matches", () => {
  assert.equal(similarCases("P0562 direction intermittente")[0].id, "CAS-001");
  assert.equal(similarCases("vibrations freinage")[0].id, "CAS-002");
  assert.deepEqual(similarCases("xyzzy"), []);
});
test("routes pass through real doorways and never cross a wall", () => {
  for (const zone of zones) {
    const path = findPath([-17, 13], [zone.x, zone.z], walls);
    assert.ok(path.length > 0, zone.id);
    for (const p of path)
      assert.equal(blocked(...p, walls, 0.45), false, zone.id);
    for (let i = 1; i < path.length; i++)
      assert.equal(
        Math.abs(path[i][0] - path[i - 1][0]) +
          Math.abs(path[i][1] - path[i - 1][1]),
        1,
      );
  }
});
test("navigation refuses a destination enclosed by obstacles", () => {
  const enclosure = [{ x: 0, z: 0, w: 3, d: 3 }];
  assert.deepEqual(findPath([-10, 10], [0, 0], enclosure), []);
  assert.equal(blocked(-23, 0, []), true);
});
test("malformed imported records are rejected before they can enter the application", () => {
  const d = seed();
  assert.throws(
    () => loadDB(JSON.stringify({ ...d, vehicles: [{}] })),
    /invalide/,
  );
  assert.throws(
    () =>
      loadDB(
        JSON.stringify({ ...d, parts: [{ ...d.parts[0], reserved: 99 }] }),
      ),
    /invalide/,
  );
});
