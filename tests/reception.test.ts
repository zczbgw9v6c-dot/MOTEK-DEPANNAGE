import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, loadDB } from "../src/domain.ts";
import { receiveClient, receptionLabel } from "../src/reception-domain.ts";
import { waitingVehicles } from "../src/guided-domain.ts";
test("reception records presence without changing vehicle repair status or duplicating data", () => {
  const db = seed();
  delete db.demoVersion;
  const v = db.vehicles.find(
    (v) => v.present !== false && v.status !== "Livré",
  )!;
  assert.equal(waitingVehicles(db).length, 0);
  const arrived = receiveClient(db, v.id, "waiting", "2026-10-14T10:00:00Z");
  assert.equal(waitingVehicles(arrived)[0].id, v.id);
  assert.equal(
    receptionLabel(
      arrived.vehicles.find((x) => x.id === v.id)!,
      Date.parse("2026-10-14T10:15:00Z"),
    ),
    "En attente · 15 min",
  );
  const received = receiveClient(
    arrived,
    v.id,
    "received",
    "2026-10-14T10:15:00Z",
  );
  assert.equal(received.vehicles.length, db.vehicles.length);
  assert.equal(received.vehicles.find((x) => x.id === v.id)!.status, v.status);
  assert.equal(
    received.vehicles.find((x) => x.id === v.id)!.reception!.arrivedAt,
    "2026-10-14T10:00:00Z",
  );
  assert.equal(receiveClient(received, v.id, "received"), received);
  const restored = loadDB(JSON.stringify(received));
  assert.equal(
    restored.vehicles.find((x) => x.id === v.id)!.reception!.state,
    "received",
  );
  assert.equal(
    waitingVehicles(receiveClient(received, v.id, "left")).length,
    0,
  );
});
test("presence requires a recorded arrival even in the test dataset", () => {
  const db = seed();
  assert.equal(waitingVehicles(db).length, 0);
  const v = db.vehicles.find(
    (v) => v.present !== false && v.status !== "Livré",
  )!;
  const arrived = receiveClient(db, v.id, "waiting");
  assert.equal(waitingVehicles(arrived).length, 1);
  assert.equal(waitingVehicles(receiveClient(arrived, v.id, "left")).length, 0);
  assert.throws(() => receiveClient(db, "unknown", "waiting"));
});

test("reception snapshot is accepted by SQLite and malformed presence is rejected", async () => {
  const { Store } = await import("../server/store.ts");
  const store = new Store(":memory:", () => seed());
  try {
    const before = store.read();
    const next = receiveClient(
      before.db,
      "v11",
      "received",
      "2026-10-14T10:15:00Z",
    );
    store.change({
      requestId: "reception-test-1",
      revision: before.revision,
      type: "snapshot",
      payload: { db: next },
    });
    assert.equal(
      store.read().db.vehicles.find((v) => v.id === "v11")!.reception!.state,
      "received",
    );
    const malformed = JSON.parse(JSON.stringify(next));
    malformed.vehicles[0].reception = {
      state: "waiting",
      arrivedAt: "invalid",
    };
    assert.throws(() => loadDB(JSON.stringify(malformed)));
    assert.equal(store.read().revision, before.revision + 1);
  } finally {
    store.sql.close();
  }
});
