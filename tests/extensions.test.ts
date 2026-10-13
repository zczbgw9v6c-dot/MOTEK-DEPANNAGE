import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { seed, loadDB, type Quote } from "../src/domain.ts";
import {
  toggleWork,
  finishWork,
  patchWorkshop,
  workshopFor,
  requestPart,
  duplicateVehicle,
} from "../src/workshop-domain.ts";
import {
  extractRegistration,
  validVIN,
  identifyLocal,
} from "../src/identification.ts";
import { quoteTotals, saveQuote, approveQuote } from "../src/quote-domain.ts";
test("start/pause tracks duration and excludes time paused", () => {
  const start = Date.parse("2026-10-13T01:00:00Z");
  let d = toggleWork(seed(), "v1", start);
  assert.equal(
    workshopFor(d, "v1").runningSince,
    new Date(start).toISOString(),
  );
  d = toggleWork(d, "v1", start + 120000);
  assert.equal(workshopFor(d, "v1").elapsed, 120);
  assert.equal(workshopFor(d, "v1").runningSince, null);
  d = toggleWork(d, "v1", start + 600000);
  d = toggleWork(d, "v1", start + 630000);
  assert.equal(workshopFor(d, "v1").elapsed, 150);
  assert.equal(seed().workshop, undefined);
});
test("workshop refuses work without technician or before quote approval", () => {
  const d = seed();
  assert.throws(() => toggleWork(d, "v3"), /statut/);
  d.vehicles[0].technician = "Non affecté";
  assert.throws(() => toggleWork(d, "v1"), /technicien/);
});
test("completion requires checklist and routes to human quality review", () => {
  let d = toggleWork(seed(), "v1");
  assert.throws(() => finishWork(d, "v1"), /contrôle/);
  d = patchWorkshop(
    d,
    "v1",
    { checks: { repair: true, safety: true, test: true } },
    "Checklist",
  );
  d = finishWork(d, "v1");
  assert.equal(d.vehicles[0].status, "Contrôle qualité");
  assert.equal(d.vehicles[0].quality, false);
  assert.equal(workshopFor(d, "v1").runningSince, null);
  assert.deepEqual(loadDB(JSON.stringify(d)), d);
});
test("missing part creates a waiting request without fictitious stock or external order", () => {
  const d = requestPart(seed(), "v1", "caliper");
  assert.equal(workshopFor(d, "v1").requests[0].state, "En attente magasin");
  assert.equal(d.parts.find((p) => p.id === "caliper")?.stock, 0);
  assert.equal(d.orders.length, 0);
  assert.throws(() => requestPart(d, "v1", "caliper"), /déjà/);
});
test("duplicate detection separates countries, normalizes plates and checks VIN independently", () => {
  const d = seed();
  const candidate = { ...d.vehicles[0], id: "new", plate: "gh 482 lp" };
  assert.equal(duplicateVehicle(d, candidate)?.id, "v1");
  assert.equal(duplicateVehicle(d, { ...candidate, country: "PT" }), undefined);
  d.vehicles[0].vin = "VF1AAAAA123456789";
  assert.equal(
    duplicateVehicle(d, {
      ...candidate,
      plate: "other",
      country: "PT",
      vin: "VF1AAAAA123456789",
    })?.id,
    "v1",
  );
});
test("registration parser requires explicit labels and never invents a missing VIN or model", () => {
  const fields = extractRegistration(
    "A : DEMO-002\nC.1 : TITULAIRE FICTIF\nD.1 : RENAULT\nD.3 : CLIO\nE : VF1AAAAA123456789",
    "pdf_text",
  );
  assert.equal(fields.find((f) => f.code === "E")?.value, "VF1AAAAA123456789");
  assert.equal(fields.find((f) => f.code === "C.1")?.value, "TITULAIRE FICTIF");
  assert.ok(
    fields.every((f) => f.confirmed === false && f.confidence === null),
  );
  const empty = extractRegistration(
    "Une Renault imaginée, moteur diesel, modèle inconnu",
    "ocr_local",
  );
  assert.ok(empty.every((f) => !f.value));
  assert.equal(
    extractRegistration("E : INVALID-VIN", "ocr_local").find(
      (f) => f.code === "E",
    )?.value,
    "",
  );
});
test("internal identification handles missing, malformed and conflicting data honestly", () => {
  const d = seed();
  assert.equal(identifyLocal(d, { plate: "UNKNOWN" }).state, "not_found");
  assert.equal(
    identifyLocal(d, { vin: "INVALID" }).state,
    "needs_confirmation",
  );
  assert.equal(validVIN("VF1AAAAA123456789"), true);
  assert.equal(validVIN("VF1AAAAI123456789"), false);
  d.vehicles[0].vin = "VF1AAAAA123456789";
  d.vehicles[1].vin = "VF1BBBBB123456789";
  assert.equal(
    identifyLocal(d, { plate: d.vehicles[0].plate, vin: d.vehicles[1].vin })
      .state,
    "conflict",
  );
});
test("quote totals, human approval and immutable approved quotes", () => {
  const q: Quote = {
    id: "q1",
    vehicle: "v3",
    lines: [
      { id: "l1", label: "Opération fictive", quantity: 2, unitPrice: 78 },
      { id: "l2", label: "Autre ligne fictive", quantity: 1, unitPrice: 46 },
    ],
    vat: 20,
    state: "À valider",
    at: new Date().toISOString(),
  };
  assert.deepEqual(quoteTotals(q), { ht: 202, tax: 40.4, total: 242.4 });
  let d = saveQuote(seed(), q);
  d = approveQuote(d, q.id);
  assert.equal(d.quotes?.[0].state, "Validé");
  assert.equal(d.vehicles.find((v) => v.id === "v3")?.status, "Diagnostic");
  assert.throws(() => saveQuote(d, { ...q, vat: 0 }), /validé/);
  assert.throws(
    () =>
      saveQuote(seed(), { ...q, lines: [{ ...q.lines[0], unitPrice: -1 }] }),
    /Vérifiez/,
  );
  assert.deepEqual(loadDB(JSON.stringify(d)), d);
});
test("all ten published GLBs match their hashes and embed their image data", () => {
  const manifest = JSON.parse(
    readFileSync("public/models/manifest.json", "utf8"),
  );
  const assets = manifest.entries.filter((e: any) => e.status === "imported");
  assert.equal(assets.length, 10);
  assert.equal(manifest.stats.knownBrandModelsImported, 0);
  for (const a of assets) {
    const bytes = readFileSync("public" + a.url);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), a.sha256);
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const json = JSON.parse(
      bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
    );
    assert.ok(
      json.images.every((i: any) => !i.uri && i.bufferView !== undefined),
    );
    assert.equal(a.licenseStatus, "verified");
    assert.equal(a.generic, true);
  }
});
test("restoration rejects malformed workshop and quote extensions", () => {
  const d = seed();
  assert.throws(
    () =>
      loadDB(JSON.stringify({ ...d, workshop: { v1: { elapsed: "bad" } } })),
    /invalide/,
  );
  assert.throws(() => loadDB(JSON.stringify({ ...d, quotes: {} })), /invalide/);
  assert.throws(
    () =>
      loadDB(
        JSON.stringify({
          ...d,
          quotes: [{ id: "x", vehicle: "missing", lines: [] }],
        }),
      ),
    /invalide/,
  );
});
test("failed storage write does not acknowledge a persisted change", async () => {
  const { persistDB, STORAGE_KEY } = await import("../src/persistence.ts");
  let stored = "previous data";
  const full = {
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  assert.throws(() => persistDB(seed(), full), /refusée/);
  assert.equal(stored, "previous data");
  persistDB(seed(), {
    setItem: (key, value) => {
      assert.equal(key, STORAGE_KEY);
      stored = value;
    },
  });
  assert.equal(JSON.parse(stored).version, 1);
});
