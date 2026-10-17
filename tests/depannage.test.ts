import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { loadCore } from "./v3-harness.ts";
function fixture() {
  const { CX } = loadCore({ sleepless: true });
  const ctx: any = {
    CX,
    console,
    UI: { toast: () => {} },
    BO: { now: () => {} },
    APP: { register: () => {} },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of [
    "30-missions",
    "32-parc",
    "34-mandats-assurances",
    "35-facturation-depannage",
    "36-commandes-fournisseurs",
  ])
    vm.runInContext(
      readFileSync(
        new URL("../motek/js/" + file + ".js", import.meta.url),
        "utf8",
      ),
      ctx,
    );
  return { CX, D: ctx.DEP };
}
test("dépannage : jeu de démonstration cohérent, places et dépôts reliés", () => {
  const { CX, D } = fixture(),
    s = CX.S;
  assert.equal(s.trucks.length, 12);
  assert.equal(
    s.trucks.filter((t: any) => t.kind === "Panier" && t.year === 2025).length,
    5,
  );
  const active = s.missions.filter(D.activeMission);
  assert.equal(
    new Set(active.map((m: any) => m.truckId).filter(Boolean)).size,
    active.filter((m: any) => m.truckId).length,
  );
  for (const t of s.trucks)
    if (t.status !== "Entretien")
      assert.equal(
        t.status,
        active.some((m: any) => m.truckId === t.id)
          ? "En mission"
          : "Disponible",
      );
  assert.equal(
    new Set(D.inPark().map((g: any) => g.slot)).size,
    D.inPark().length,
  );
  for (const m of s.missions.filter((m: any) => m.status === "Déposée au parc"))
    assert.ok(
      s.gardes.some((g: any) => g.id === m.gardeId && g.missionId === m.id),
    );
  for (const i of D.invoices())
    assert.ok(
      i.srcId && (i.kind === "garde" ? D.garde(i.srcId) : D.mission(i.srcId)),
    );
});
test("dépannage : affectation refuse entretien, camion et chauffeur occupés sans mutation", () => {
  const { CX, D } = fixture(),
    m = CX.S.missions.find((m: any) => m.status === "Demandée"),
    snapshot = JSON.stringify(m),
    busy = CX.S.missions.find((m: any) => m.status === "En route"),
    free = CX.S.trucks.find((t: any) => t.status === "Disponible");
  assert.equal(
    D.assign(m.id, CX.S.trucks.find((t: any) => t.status === "Entretien").id),
    null,
  );
  assert.equal(D.assign(m.id, busy.truckId), null);
  assert.equal(D.assign(m.id, free.id, busy.driverId), null);
  assert.equal(JSON.stringify(m), snapshot);
  assert.ok(D.assign(m.id, free.id));
  assert.equal(free.status, "En mission");
});
test("dépannage : transitions ordonnées, dépôt idempotent et place occupée refusée", () => {
  const { CX, D } = fixture(),
    m = CX.S.missions.find((m: any) => m.status === "Demandée"),
    free = CX.S.trucks.find((t: any) => t.status === "Disponible");
  assert.equal(D.setMissionStatus(m.id, "Terminée"), null);
  D.assign(m.id, free.id);
  for (const status of ["En route", "Sur place", "Remorquage"])
    assert.ok(D.setMissionStatus(m.id, status));
  const at = m.arrivedAt;
  D.setMissionStatus(m.id, "Sur place");
  assert.equal(m.arrivedAt, at);
  const n = D.inPark().length;
  assert.equal(D.depositToParc(m.id, "N1", D.inPark()[0].slot), null);
  assert.equal(D.depositToParc(m.id, "N2", "N2-99"), null);
  const g = D.depositFirstFree(m.id);
  assert.ok(g);
  assert.equal(D.inPark().length, n + 1);
  assert.equal(free.status, "Disponible");
  assert.equal(D.depositFirstFree(m.id).id, g.id);
  assert.equal(D.inPark().length, n + 1);
});
test("dépannage : frais de garde arrêtés à la sortie, tarif nul et reçu persisté", () => {
  const { CX, D } = fixture(),
    g = D.inPark()[0];
  g.dailyFee = 0;
  g.adminFee = 45;
  assert.equal(D.gardeFees(g), 45);
  assert.equal(D.releaseGarde(g.id, { who: "", paid: 0 }), null);
  assert.equal(D.releaseGarde(g.id, { who: "Test", paid: -10 }), null);
  assert.ok(
    D.releaseGarde(g.id, { who: "Test", to: "Propriétaire", paid: 20 }),
  );
  CX.S.parc.adminFee = 999;
  assert.equal(D.gardeFees(g), 45);
  assert.equal(g.release.who, "Test");
  assert.equal(D.releaseGarde(g.id, { who: "Test" }), null);
  const i = D.billGarde(g);
  assert.equal(i.ht, 45);
  assert.equal(i.paid, 20);
  assert.equal(D.billGarde(g), null);
});
test("dépannage : facture créée par le statut et numérotation unique", () => {
  const { CX, D } = fixture(),
    m = CX.S.missions.find((m: any) => m.status === "Terminée");
  assert.ok(D.setMissionStatus(m.id, "Facturée"));
  assert.equal(
    D.invoices().filter((i: any) => i.kind === "mission" && i.srcId === m.id)
      .length,
    1,
  );
  assert.equal(D.billMission(m), null);
  const n = D.invoices().length;
  assert.equal(
    D.billMission(CX.S.missions.find((m: any) => m.status === "En route")),
    null,
  );
  assert.equal(D.invoices().length, n);
  assert.equal(new Set(D.invoices().map((i: any) => i.no)).size, n);
});
test("dépannage : règlement négatif, non fini et trop élevé refusés", () => {
  const { D } = fixture(),
    i = D.invoices().find((i: any) => i.paid === 0);
  for (const a of [-1, NaN, Infinity, i.ttc + 1])
    assert.equal(D.payInvoice(i, a), null);
  assert.equal(i.paid, 0);
  D.payInvoice(i, 10);
  assert.equal(i.paid, 10);
  assert.equal(i.status, "Partiel");
  D.payInvoice(i, i.ttc - 10);
  assert.equal(i.status, "Payée");
  assert.equal(i.payments.length, 2);
});
test("dépannage : acompte rapproché une fois et avoir équilibré sans remboursement fictif", () => {
  const { CX, D } = fixture(),
    m = CX.S.missions.find((m: any) => m.status === "Terminée");
  assert.ok(D.recordDeposit(m.id, 50));
  assert.equal(D.recordDeposit(m.id, 9999), null);
  const i = D.billMission(m);
  assert.equal(i.paid, 50);
  assert.equal(CX.S.depDeposits[0].invoiceId, i.id);
  const balance = D.invoiceBalance(i);
  const c = D.creditInvoice(i.id, balance, "Erreur de tarif");
  assert.ok(c);
  assert.equal(c.ttc, -balance);
  assert.equal(D.invoiceBalance(i), 0);
  assert.equal(i.paid, 50);
  assert.equal(D.creditInvoice(i.id, 1, "Doublon"), null);
  const csv = D.accountingCSV();
  assert.match(csv, /411000/);
  assert.match(csv, /445710/);
  assert.match(csv, /706000/);
});
test("dépannage : courriel contradictoire ou ambigu bloqué et application unique", () => {
  const { CX, D } = fixture(),
    mail = CX.S.insMail[0];
  const copy = { ...mail, id: "bad", ref: CX.S.missions[1].ref };
  assert.ok(D.classifyMail(copy).issue);
  assert.equal(D.applyMail(copy), null);
  assert.equal(copy.handledAt, undefined);
  assert.ok(D.applyMail(mail.id));
  const log = CX.S.agent.log.length;
  assert.equal(D.applyMail(mail.id), null);
  assert.equal(CX.S.agent.log.length, log);
  const mismatch = {
    ...CX.S.insMail[1],
    amount: 99,
    subject: "Accord de prise en charge",
    body: "Nous confirmons la prise en charge pour 100 € HT.",
  };
  assert.match(D.classifyMail(mismatch).issue, /Montant contradictoire/);
});
test("dépannage : annonce de virement ne crée aucun encaissement", () => {
  const { CX, D } = fixture(),
    mail = CX.S.insMail.find((m: any) => m.intent === "paiement"),
    before = JSON.stringify(D.invoices()),
    target = D.classifyMail(mail).target,
    status = target.ins.status;
  assert.ok(D.applyMail(mail));
  assert.equal(target.ins.status, status);
  assert.equal(JSON.stringify(D.invoices()), before);
  assert.match(target.ins.history[0].text, /aucun encaissement/);
});
test("dépannage : commande reçue avant pose et étapes de dossier valides", () => {
  const { CX, D } = fixture(),
    o = CX.S.supplyOrders.find((o: any) => o.status === "À commander");
  D.setOrderStatus(o.id, "Posée");
  assert.equal(o.status, "À commander");
  D.setOrderStatus(o.id, "Commandée");
  D.setOrderStatus(o.id, "Reçue");
  D.setOrderStatus(o.id, "Posée");
  assert.equal(o.status, "Posée");
  D.setOrderStatus(o.id, "Commandée");
  assert.equal(o.status, "Posée");
  const g = D.inPark()[0];
  assert.equal(D.setGardeStep(g.id, "Fantaisie"), null);
  assert.ok(D.setGardeStep(g.id, "Expertise en attente"));
  assert.equal(g.step, "Expertise en attente");
});

test("dépannage : migration répare les anciennes affectations et reste idempotente", () => {
  const { CX } = fixture(),
    old = JSON.parse(JSON.stringify(CX.S));
  const bad = old.missions.find((m: any) => m.status === "En route"),
    maintenance = old.trucks.find((t: any) => t.status === "Entretien");
  bad.truckId = maintenance.id;
  const billed = old.missions.find((m: any) => m.status === "Terminée");
  billed.status = "Facturée";
  delete old.depDeposits;
  delete old.gardes[0].adminFee;
  delete old.gardes[0].release;
  const migrated = loadCore({ cached: old, sleepless: true }).CX.S;
  assert.equal(
    migrated.missions.find((m: any) => m.id === bad.id).status,
    "Demandée",
  );
  assert.equal(
    migrated.missions.find((m: any) => m.id === bad.id).truckId,
    null,
  );
  assert.equal(
    migrated.missions.find((m: any) => m.id === billed.id).status,
    "Terminée",
  );
  assert.ok(migrated.depDeposits);
  assert.equal(migrated.gardes[0].adminFee, migrated.parc.adminFee);
  assert.equal(migrated.gardes[0].release, null);
  const twice = loadCore({
    cached: JSON.parse(JSON.stringify(migrated)),
    sleepless: true,
  }).CX.S;
  assert.equal(
    JSON.stringify(twice.missions),
    JSON.stringify(migrated.missions),
  );
});

test("dépannage : une compagnie différente et plusieurs dossiers sur une plaque exigent une revue humaine", () => {
  const { CX, D } = fixture(),
    m = CX.S.insMail[0];
  assert.match(
    D.classifyMail({ ...m, from: "gestion@maif-demo.fr" }).issue,
    /Compagnie/,
  );
  const src = CX.S.missions[0];
  CX.S.missions.push({
    ...JSON.parse(JSON.stringify(src)),
    id: "doublon",
    ref: "SIN-99999",
  });
  const mail = {
    subject: "Accord de prise en charge",
    body: "Nous confirmons la prise en charge pour 120 € HT.",
    plate: src.vehicle.plate,
    amount: 120,
  };
  assert.match(D.classifyMail(mail).issue, /ambigu/);
});

test("dépannage : un refus de prise en charge ne facture pas automatiquement l’assureur", () => {
  const { CX, D } = fixture(),
    m = CX.S.missions.find((m: any) => m.status === "Terminée");
  m.insurance = { status: "Refusée", history: [] };
  assert.equal(D.billMission(m), null);
  m.mandant = "Particulier";
  assert.ok(D.billMission(m));
});
