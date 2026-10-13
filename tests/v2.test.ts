import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seed, loadDB, vehiclePosition } from "../src/domain.ts";
import { dashboard, isPresent } from "../src/dashboard-domain.ts";
import { team } from "../src/team-data.ts";
import {
  planningAlerts,
  moveAppointment,
  nextAvailable,
  overlaps,
} from "../src/planning-domain.ts";
import { searchDiagnostics } from "../src/diagnostic-domain.ts";
import { proposeVoice, applyVoice } from "../src/voice-domain.ts";
import { Store } from "../server/store.ts";
const command =
  "Il me manque un étrier avant droit pour la BMW. Mets l’intervention en pause et préviens le responsable.";
test("V2 counts and fourteen non-overlapping physical vehicles agree across all modules", () => {
  const db = seed(),
    d = dashboard(db);
  assert.equal(db.vehicles.length, 60);
  assert.equal(team.length, 8);
  assert.equal(d.present.length, 14);
  assert.equal(d.ready.length, 4);
  assert.equal(d.accepted.length, 5);
  assert.equal(db.parts.length, 50);
  assert.equal(db.diagnosticCases?.length, 15);
  assert.ok(d.ready.every((v) => d.present.includes(v)));
  const positions = d.present.map((v) => vehiclePosition(v, db.vehicles));
  assert.equal(new Set(positions.map((p) => p.join(","))).size, 14);
  assert.ok(
    positions.every(([x, z]) => x > -22 && x < 22 && z > -18 && z < 30),
  );
  assert.equal(new Set(db.parts.map((p) => p.id)).size, 50);
  assert.ok(
    db.parts.every(
      (p) =>
        p.stock >= p.reserved && p.reserved >= 0 && p.ref.startsWith("DEMO-"),
    ),
  );
  assert.deepEqual(loadDB(JSON.stringify(db)), db);
});
test("every diagnostic is linked to a CRM record and unconfirmed cases have no invented cause", () => {
  const db = seed();
  const results = searchDiagnostics(db, "");
  assert.equal(results.length, 15);
  for (const r of results) {
    assert.equal(r.case.vehicleId, r.vehicle.id);
    assert.ok(r.case.tests.length >= 2);
    if (!r.case.resolved) assert.equal(r.case.cause, null);
  }
  assert.ok(
    searchDiagnostics(db, "P0562 direction intermittente", "v4").length > 0,
  );
});
test("planning blocks conflicting reassignment and suggests a recorded free interval", () => {
  const db = seed();
  const a = db.appointments!.find((a) => a.vehicle === "v1")!,
    b = db.appointments!.find((a) => a.vehicle === "v5")!;
  assert.ok(overlaps(a, b));
  assert.throws(
    () => moveAppointment(db, a.id, { technician: b.technician }),
    /déjà/,
  );
  assert.throws(
    () => moveAppointment(db, a.id, { technician: "Kader" }),
    /compétence/,
  );
  assert.throws(
    () => moveAppointment(db, a.id, { resource: b.resource }),
    /réservé/,
  );
  const slot = nextAvailable(db, a, Date.parse(a.start));
  assert.ok(slot);
  const candidate = { ...a, start: slot! };
  assert.ok(
    !db.appointments!.some(
      (b) =>
        b.id !== a.id &&
        b.state !== "Terminé" &&
        (b.technician === a.technician || b.resource === a.resource) &&
        overlaps(candidate, b),
    ),
  );
});
test("voice proposes structured actions, requires confirmation and never creates supplier orders", () => {
  const db = seed();
  const p = proposeVoice(db, "v1", command);
  assert.deepEqual(
    p.actions.map((a) => a.type),
    ["pause", "piece", "alert"],
  );
  assert.equal(
    p.actions.find((a) => a.type === "piece")?.part,
    "caliper-right",
  );
  assert.throws(
    () => applyVoice(db, "v1", command, "command", false),
    /Confirmez/,
  );
  const next = applyVoice(db, "v1", command, "command", true);
  assert.equal(next.orders.length, db.orders.length);
  assert.equal(next.workshop?.v1.blocked, true);
  assert.ok(dashboard(next).blocked.some((v) => v.id === "v1"));
  assert.ok(next.alerts?.some((a) => a.vehicle === "v1"));
  assert.equal(
    proposeVoice(
      db,
      "v3",
      "Il me faut deux disques avant pour la Golf.",
    ).actions.find((a) => a.type === "piece")?.quantity,
    2,
  );
  assert.equal(
    proposeVoice(db, "v1", "Ne mets pas en pause.").actions.length,
    0,
  );
});
test("SQLite persists the complete fifteen-step workshop workflow across reopen and validates concurrency", () => {
  const folder = mkdtempSync(join(tmpdir(), "autohub-store-"));
  const file = join(folder, "state.sqlite");
  let store = new Store(file, () => seed());
  let state = store.read();
  let clock = Date.parse("2026-10-13T09:00:00Z");
  const send = (type: string, payload: any = {}) =>
    (state = store.change(
      {
        requestId: crypto.randomUUID(),
        revision: state.revision,
        type,
        vehicle: "v1",
        payload,
      },
      clock,
    ));
  try {
    send("start");
    const began = state.db.workshop!.v1.runningSince;
    clock += 120000;
    const startKey = crypto.randomUUID();
    const before = state.revision;
    const repeated = store.change(
      { requestId: startKey, revision: before, type: "start", vehicle: "v1" },
      clock,
    );
    assert.equal(repeated.db.workshop!.v1.runningSince, began);
    assert.deepEqual(
      store.change(
        { requestId: startKey, revision: before, type: "start", vehicle: "v1" },
        clock,
      ),
      repeated,
    );
    state = repeated;
    store.close();
    store = new Store(file);
    state = store.read();
    assert.equal(state.db.workshop!.v1.runningSince, began);
    send("voice", { text: command, mode: "command", confirmed: true });
    assert.equal(state.db.workshop!.v1.runningSince, null);
    assert.equal(state.db.workshop!.v1.blocked, true);
    assert.ok(
      state.db.appointments!.find((a) => a.vehicle === "v1")?.state ===
        "En pause",
    );
    const r = state.db.workshop!.v1.requests[0];
    assert.throws(
      () => send("approve", { requestId: r.id, compatibilityConfirmed: false }),
      /compatibilité/,
    );
    assert.throws(
      () => send("approve", { requestId: r.id, compatibilityConfirmed: true }),
      /Stock/,
    );
    const incoming = {
      ...state.db,
      parts: state.db.parts.map((p) =>
        p.id === "caliper-right" ? { ...p, stock: 2 } : p,
      ),
    };
    send("snapshot", { db: incoming });
    send("approve", { requestId: r.id, compatibilityConfirmed: true });
    assert.equal(
      state.db.parts.find((p) => p.id === "caliper-right")!.reserved,
      1,
    );
    clock += 180000;
    send("start");
    assert.equal(state.db.workshop!.v1.blocked, false);
    assert.equal(state.db.workshop!.v1.idleElapsed, 180);
    const checked = {
      ...state.db,
      workshop: {
        ...state.db.workshop,
        v1: {
          ...state.db.workshop!.v1,
          checks: { repair: true, safety: true, test: true },
        },
      },
    };
    send("snapshot", { db: checked });
    clock += 60000;
    send("finish");
    assert.equal(state.db.vehicles[0].status, "Contrôle qualité");
    assert.equal(state.db.vehicles[0].bay, null);
    assert.equal(
      state.db.appointments!.find((a) => a.vehicle === "v1")!.state,
      "Terminé",
    );
    assert.equal(state.db.workshop!.v1.runningSince, null);
    const ready = {
      ...state.db,
      vehicles: state.db.vehicles.map((v) =>
        v.id === "v1"
          ? { ...v, quality: true, status: "Prêt à livrer" as const }
          : v,
      ),
    };
    send("snapshot", { db: ready });
    assert.equal(dashboard(state.db).ready.length, 5);
    assert.equal(dashboard(state.db).present.length, 14);
    assert.ok(state.db.audit.length >= 8);
    assert.throws(
      () =>
        store.change(
          {
            requestId: crypto.randomUUID(),
            revision: 0,
            type: "pause",
            vehicle: "v1",
          },
          clock,
        ),
      /changé/,
    );
    store.close();
    store = new Store(file);
    assert.equal(dashboard(store.read().db).ready.length, 5);
  } finally {
    store.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
test("French transcription uncertainty is surfaced before applying a pause", () => {
  const p = proposeVoice(
    seed(),
    "v1",
    "Il me manque un étrier avant droit pour la BMW, mais l'intervention empose et prévient le responsable.",
  );
  assert.deepEqual(
    p.actions.map((a) => a.type),
    ["pause", "piece", "alert"],
  );
  assert.ok(p.warnings.some((w) => w.includes("incertaine")));
});
test("a negative description of an incident is not mistaken for a negated command", () => {
  const p = proposeVoice(
    seed(),
    "v1",
    "La vis de fixation est cassée et je ne peux pas remonter l’étrier.",
    "issue",
  );
  assert.ok(p.actions.some((a) => a.type === "issue"));
  assert.equal(p.conflict, false);
});
test("server refuses a quality-gate bypass even if the client sends a full snapshot", () => {
  const store = new Store(":memory:", () => seed());
  try {
    const s = store.read();
    const forged = {
      ...s.db,
      vehicles: s.db.vehicles.map((v) =>
        v.id === "v1"
          ? {
              ...v,
              status: "Prêt à livrer" as const,
              bay: null,
              quality: false,
            }
          : v,
      ),
    };
    assert.throws(
      () =>
        store.change({
          revision: s.revision,
          requestId: crypto.randomUUID(),
          type: "snapshot",
          payload: { db: forged },
        }),
      /qualité/,
    );
    assert.equal(store.read().revision, 0);
  } finally {
    store.close();
  }
});
