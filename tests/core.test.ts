import { test } from "node:test";
import assert from "node:assert/strict";
import { Store } from "../server/store.ts";
import { seed, loadDB } from "../src/domain.ts";
import { saveQuote, approveQuote } from "../src/quote-domain.ts";
import { emptyWorkshop, patchWorkshop } from "../src/workshop-domain.ts";
import {
  deliveryBlocks,
  orderProgress,
  orderBalance,
} from "../src/core-domain.ts";
function fixture() {
  const db = seed();
  db.appointments = [];
  db.quotes = [];
  for (const v of db.vehicles) {
    v.bay = null;
    db.workshop![v.id] = emptyWorkshop();
  }
  Object.assign(db.vehicles[0], {
    status: "Réception",
    present: true,
    technician: "Non affecté",
    department: "Mécanique",
    quality: false,
  });
  return db;
}
test("Core: reception to delivery persists a real work order, quote, work, manual settlement and keys", () => {
  const store = new Store(":memory:", fixture);
  let now = Date.parse("2026-10-14T09:00:00Z");
  const send = (type: string, payload: any = {}) =>
    store.change(
      {
        requestId: crypto.randomUUID(),
        revision: store.read().revision,
        type,
        vehicle: "v1",
        payload,
      },
      (now += 60000),
    );
  try {
    send("core.arrival");
    send("core.receive");
    const id = store.read().db.workOrders!.v1.id;
    send("core.receive");
    assert.equal(store.read().db.workOrders!.v1.id, id);
    assert.equal(orderProgress(store.read().db, "v1").percent, 0);
    send("core.assign", { technician: "Yanis", bay: 2 });
    let d = store.read().db;
    d = saveQuote(d, {
      id: "q-core",
      vehicle: "v1",
      at: new Date(now).toISOString(),
      state: "À valider",
      vat: 20,
      lines: [
        {
          id: "l1",
          label: "Disque avant et pose",
          quantity: 1,
          unitPrice: 100,
        },
      ],
    });
    d = approveQuote(d, "q-core");
    send("snapshot", { db: d });
    send("start");
    assert.throws(() => send("finish"), /travaux/);
    send("core.task", {
      task: store.read().db.workOrders!.v1.tasks[0].id,
      done: true,
    });
    assert.equal(orderProgress(store.read().db, "v1").percent, 100);
    send("snapshot", {
      db: patchWorkshop(
        store.read().db,
        "v1",
        { checks: { repair: true, safety: true, test: true } },
        "Contrôles cochés",
      ),
    });
    send("finish");
    send("core.quality");
    assert.ok(deliveryBlocks(store.read().db, "v1").length > 0);
    send("core.invoice", { quote: "q-core" });
    assert.equal(orderBalance(store.read().db.workOrders!.v1), 12000);
    send("core.payment", { cents: 5000, method: "Carte", reference: "recu-1" });
    assert.throws(
      () => send("core.deliver", { keysConfirmed: true }),
      /Règlement/,
    );
    send("core.payment", { cents: 7000, method: "Carte", reference: "recu-2" });
    send("core.contact", {
      channel: "Téléphone",
      note: "Client joint, récupération convenue",
    });
    send("core.pickup", { at: "2026-10-14T16:00:00Z" });
    assert.equal(deliveryBlocks(store.read().db, "v1").length, 0);
    assert.throws(() => send("core.deliver", {}), /clés/);
    send("core.deliver", { keysConfirmed: true });
    const out = loadDB(JSON.stringify(store.read().db));
    assert.equal(out.vehicles[0].status, "Livré");
    assert.equal(out.vehicles[0].present, false);
    assert.equal(orderBalance(out.workOrders!.v1), 0);
    assert.ok(out.workOrders!.v1.deliveredAt);
    assert.ok(out.messages.every((m) => !("sentAt" in m)));
    assert.throws(
      () =>
        send("core.payment", { cents: 1, reference: "r3", method: "Carte" }),
      /clôturé/,
    );
  } finally {
    store.sql.close();
  }
});
test("Core: no stock promise, no invented work percentage and financial snapshot bypass refused", () => {
  const store = new Store(":memory:", fixture);
  const send = (type: string, payload: any = {}) =>
    store.change({
      requestId: crypto.randomUUID(),
      revision: store.read().revision,
      type,
      vehicle: "v1",
      payload,
    });
  try {
    assert.equal(orderProgress(store.read().db, "v1").percent, null);
    send("core.open");
    const before = store.read();
    const forged = structuredClone(before.db);
    forged.workOrders!.v1.payments = [
      {
        id: "p1",
        cents: 9000,
        reference: "fake",
        method: "Carte",
        at: new Date().toISOString(),
      },
    ];
    assert.throws(() => send("snapshot", { db: forged }), /actions Core/);
    assert.equal(store.read().revision, before.revision);
    assert.throws(
      () =>
        send("core.payment", {
          cents: 100,
          reference: "invalid",
          method: "Carte",
        }),
      /montant/,
    );
    send("request", { part: before.db.parts[0].id, quantity: 1 });
    assert.equal(
      store.read().db.parts[0].reserved,
      before.db.parts[0].reserved,
    );
    assert.ok(store.read().db.workshop!.v1.requests.length);
    assert.equal(store.read().db.orders.length, before.db.orders.length);
  } finally {
    store.sql.close();
  }
});

test("Core: confirmed opening hours refuse an after-closing pickup and retain the previous proposal", () => {
  const store = new Store(":memory:", fixture);
  const now = Date.parse("2026-10-14T08:00:00Z");
  const send = (type: string, payload: any = {}) =>
    store.change(
      {
        requestId: crypto.randomUUID(),
        revision: store.read().revision,
        type,
        vehicle: "v1",
        payload,
      },
      now,
    );
  try {
    send("core.open");
    send("core.hours", {
      opens: "08:00",
      closes: "18:00",
      weekdays: [1, 2, 3, 4, 5],
    });
    send("core.pickup", { at: "2026-10-14T16:45:00Z" });
    assert.throws(
      () => send("core.pickup", { at: "2026-10-14T17:30:00Z" }),
      /hors ouverture/,
    );
    assert.equal(
      store.read().db.workOrders!.v1.pickupAt,
      "2026-10-14T16:45:00.000Z",
    );
    assert.throws(
      () => send("core.pickup", { at: "2026-10-18T10:00:00Z" }),
      /hors ouverture/,
    );
    assert.throws(() => send("start"), /devis accepté/);
  } finally {
    store.sql.close();
  }
});
