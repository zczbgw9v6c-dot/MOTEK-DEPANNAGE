// Règles métier et persistance du socle v3, issues de l'audit Codex du 15 octobre 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCore, sleep } from "./v3-harness.ts";

const fresh = () => loadCore({ sleepless: true }).CX;
const pickRO = (x: any) => x.S.ros.find((r: any) => !r.claimId && !x.cust(r.customerId).fleet && !x.S.invoices.some((i: any) => i.roId === r.id) && x.roTotals(r).ttc > 0);

test("persistance : un état modifié n'est pas remplacé par la démo le lendemain", async () => {
  const seed = loadCore({ sleepless: true }).CX.S;
  const old = structuredClone(JSON.parse(JSON.stringify(seed)));
  old.day = "2000-01-01";
  old.pristine = false;
  old.customers.push({ id: "C-REEL", name: "Client réel", type: "prive", city: "", phone: "", comms: [], hist: [] });
  const h = loadCore({ cached: old, revision: 7, remote: { state: structuredClone(old), revision: 7 } });
  await sleep(400);
  assert.ok(h.CX.S.customers.some((c: any) => c.id === "C-REEL"), "le client ajouté la veille est conservé");
  assert.equal(h.posts.length, 0, "aucun envoi automatique du jeu de démonstration");
  assert.equal(h.remote.revision, 7);
});

test("persistance : une démonstration intacte d'un autre jour est régénérée (dates réalistes)", async () => {
  const seed = loadCore({ sleepless: true }).CX.S;
  const old = structuredClone(JSON.parse(JSON.stringify(seed)));
  old.day = "2000-01-01";
  assert.equal(old.pristine, true);
  const h = loadCore({ cached: old, revision: 3, remote: { state: structuredClone(old), revision: 3 } });
  await sleep(400);
  assert.notEqual(h.CX.S.day, "2000-01-01");
  assert.ok(h.posts.length >= 1, "la nouvelle démo est envoyée au serveur");
});

test("conflit 409 : les modifications locales sont mises de côté, pas perdues, et peuvent être reprises", async () => {
  const seed = loadCore({ sleepless: true }).CX.S;
  const same = structuredClone(JSON.parse(JSON.stringify(seed)));
  same.pristine = false;
  const h = loadCore({ cached: same, revision: 1, remote: { state: structuredClone(same), revision: 1 } });
  await sleep(50);
  h.CX.S.customers.push({ id: "C-LOCAL", name: "Local", type: "prive", city: "", phone: "", comms: [], hist: [] });
  h.CX.save();
  // pendant le debounce, un autre poste enregistre
  h.remote.state = structuredClone(same);
  h.remote.state.customers.push({ id: "C-REMOTE", name: "Distant", type: "prive", city: "", phone: "", comms: [], hist: [] });
  h.remote.revision = 2;
  await sleep(500);
  assert.ok(h.CX.S.customers.some((c: any) => c.id === "C-REMOTE"), "l'écran montre la version serveur");
  assert.ok(h.CX.sync.conflict, "le conflit est signalé");
  assert.ok(JSON.parse(h.CX.sync.conflict.local).customers.some((c: any) => c.id === "C-LOCAL"), "la version locale est conservée");
  assert.ok(h.values.get("motek-v3:conflict"), "et sauvegardée dans le navigateur");
  h.CX.resolveConflict("local");
  await sleep(400);
  assert.ok(h.remote.state.customers.some((c: any) => c.id === "C-LOCAL"), "reprise : le serveur reçoit la version locale");
  assert.equal(h.CX.sync.conflict, null);
});

test("facturation : passer en facturé n'enregistre aucun paiement et n'invente pas de sortie", () => {
  const x = fresh();
  const r = pickRO(x);
  r.qc = { ok: true, items: {} };
  const before = x.S.payments.length;
  x.setStage(r.id, x.ST.facture);
  assert.equal(r.stage, x.ST.facture);
  assert.equal(x.S.payments.length, before, "aucun paiement automatique");
  assert.equal(r.outAt, null, "la sortie est enregistrée par la remise des clés");
  const inv = x.S.invoices.find((i: any) => i.roId === r.id && i.kind === "client");
  assert.ok(inv && inv.paid === 0);
});

test("qualité : impossible de passer prêt ou facturé sans contrôle validé, sauf dérogation tracée", () => {
  const x = fresh();
  const r = pickRO(x);
  r.tasks.forEach((t: any) => (t.p = 0));
  r.qc = { ok: false, items: {} };
  const res = x.setStage(r.id, x.ST.facture);
  assert.equal(res, null);
  assert.ok(r.stage < x.ST.pret);
  assert.ok(r.tasks.every((t: any) => t.p === 0), "aucune tâche terminée implicitement");
  const ok = x.setStage(r.id, x.ST.pret, { override: "client pressé, retouche planifiée" });
  assert.ok(ok);
  assert.ok(r.history.some((h: any) => /Dérogation/.test(h.text)));
});

test("étapes : le journal garde les retours en arrière", () => {
  const x = fresh();
  const r = x.ro("R1");
  const n = r.stageLog.length;
  x.setStage(r.id, x.ST.demont);
  assert.equal(r.stageLog.length, n + 1);
  assert.equal(r.stageLog[r.stageLog.length - 1].back, true);
});

test("remise des clés : refusée tant que le solde client est dû, acceptée après paiement ou crédit motivé", () => {
  const x = fresh();
  const r = pickRO(x);
  r.qc = { ok: true, items: {} };
  x.setStage(r.id, x.ST.facture);
  assert.equal(x.deliver(r.id), null, "solde dû");
  const inv = x.S.invoices.find((i: any) => i.roId === r.id && i.kind === "client");
  x.payInvoice(inv.id, inv.amount, "Carte", true, { date: "2026-10-10" });
  assert.equal(x.S.payments[0].date, "2026-10-10", "date de valeur conservée");
  assert.ok(x.deliver(r.id));
  assert.ok(r.outAt);
  const y = fresh();
  const r2 = pickRO(y);
  r2.qc = { ok: true, items: {} };
  y.setStage(r2.id, y.ST.facture);
  assert.ok(y.deliver(r2.id, { credit: "paiement en 3 fois accepté" }));
  assert.ok(r2.history.some((h: any) => /solde dû/.test(h.text)));
});

test("devis accepté : figé face aux changements de tarifs", () => {
  const x = fresh();
  const q = x.roQuote(x.ro("R10"));
  x.setQuoteStatus(q.id, "Accordé");
  const before = x.quoteTotals(q).ttc;
  x.S.company.rates.T1 *= 2; x.S.company.rates.T2 *= 2; x.S.company.rates.T3 *= 2; x.S.company.tvaRate = 0.1;
  assert.equal(x.quoteTotals(q).ttc, before);
  const draft = x.S.quotes.find((z: any) => z.status === "Brouillon");
  if (draft) assert.notEqual(x.quoteTotals(draft).ttc, x.quoteTotalsRaw ? undefined : null);
});

test("acompte payé après la facture finale : imputé, pas de double créance", () => {
  const x = fresh();
  const r = pickRO(x);
  const total = x.roTotals(r).ttc;
  const d = x.createDeposit(r.id, 100);
  const finals = x.ensureInvoices(r.id);
  assert.equal(finals[0].amount, total);
  x.payInvoice(d.id, 100, "Espèces", true);
  const fin = x.S.invoices.find((i: any) => i.roId === r.id && i.kind === "client");
  assert.equal(fin.paid, 100);
  assert.ok(fin.deposits && fin.deposits[0].invoiceId === d.id);
});

test("stock : réservations ventilées par dossier et consommation", () => {
  const x = fresh();
  const p = x.S.parts[0];
  p.reserved = 0; p.qty = 0; p.reservations = [];
  const [r1, r2] = x.S.ros.slice(0, 2);
  for (const r of [r1, r2]) { const o = x.saveOrder({ roId: r.id, status: "Commandée", supplierId: x.S.suppliers[0].id, lines: [{ partId: p.id, qty: 2, ref: p.ref, label: p.name }] }); x.receiveOrder(o.id); }
  assert.equal(p.qty, 4); assert.equal(p.reserved, 4);
  assert.deepEqual(p.reservations.map((z: any) => [z.roId, z.qty]), [[r1.id, 2], [r2.id, 2]]);
  x.releasePart(p.id, r1.id, 2);
  assert.equal(p.qty, 2); assert.equal(p.reserved, 2);
  assert.deepEqual(p.reservations.map((z: any) => z.roId), [r2.id]);
});

test("progression : recalculée quand des tâches sont rouvertes", () => {
  const x = fresh();
  const r = x.ro("R16");
  r.tasks = [{ l: "a", p: 0 }, { l: "b", p: 0 }];
  r.prog = 0;
  x.setTask(r.id, 0, 1); x.setTask(r.id, 1, 1);
  const done = r.prog;
  x.setTask(r.id, 0, 0); x.setTask(r.id, 1, 0);
  assert.ok(r.prog < done, "la jauge redescend");
  assert.equal(r.prog, x.progressOf(r));
});

test("qualité : la validation ne fabrique pas de photos", () => {
  const x = fresh();
  const r = x.ro("R16");
  r.photos = []; r.qc = { items: {} };
  x.qcDecision(r.id, true, "");
  assert.equal(r.photos.length, 0);
});

test("communications : un brouillon ne marque pas le client prévenu, une déclaration manuelle garde sa provenance", () => {
  const x = fresh();
  const r = x.S.ros.find((z: any) => z.stage === x.ST.pret) || pickRO(x);
  r.stage = x.ST.pret; r.notified = false;
  x.notifyCustomer(r.id, "SMS", "Véhicule prêt", { status: "brouillon", to: "+33600000000", body: "texte" });
  assert.equal(r.notified, false);
  const e = x.notifyCustomer(r.id, "SMS", "Véhicule prêt", { to: "+33600000000", body: "texte complet" });
  assert.equal(e.status, "manuel"); assert.equal(e.text, "texte complet"); assert.equal(e.to, "+33600000000");
  assert.equal(r.notified, true);
  assert.ok(r.history[0].text.includes("déclaré envoyé"));
});
