import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { loadCore } from "./v3-harness.ts";
function fixture() {
  const { CX } = loadCore({ sleepless: true });
  const ctx: any = {
    CX,
    URL,
    URLSearchParams,
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
    "39-commercial-depannage",
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

test("tableau de bord : l'assistant répond sur un dépanneur et sur « qui est libre ? »", () => {
  const { CX, D } = fixture();
  const ctx: any = { CX, DEP: D, console, APP: { register() {}, open() {} }, UI: {}, BO: {} };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL("../motek/js/33-tableau-de-bord-depannage.js", import.meta.url), "utf8"), ctx);
  const s = CX.S, busy = ["Affectée", "En route", "Sur place", "Remorquage"];
  const free = s.drivers.filter((d: any) => !s.missions.some((m: any) => m.driverId === d.id && busy.includes(m.status)));
  const r = D.ask("qui est libre ?");
  assert.equal(D.freeDrivers().length, free.length);
  if (free.length) assert.match(r.reply, new RegExp(free[0].first));
  else assert.match(r.reply, /Personne/);
  const dylan = D.ask("où est Dylan ?");
  assert.match(dylan.reply, /^Dylan/);
  assert.ok(D.ask("où est Damien ?").warnings.length, "un prénom inconnu n'est pas inventé");
});

test("équipe confirmée : trois dépanneurs, deux administratifs et aucun Damien", () => {
  const { CX } = fixture();
  assert.deepEqual(
    Array.from(CX.S.drivers, (d: any) => d.first),
    ["Dylan", "Laurent", "Trump"],
  );
  assert.deepEqual(
    Array.from(CX.S.office, (d: any) => d.first),
    ["Moïse", "Florence"],
  );
  assert.ok(!CX.S.staff.some((e: any) => e.first === "Damien"));
  const old = JSON.parse(JSON.stringify(CX.S));
  old.staff.find((e: any) => e.role === "mag").first = "Damien";
  const migrated = loadCore({ cached: old, sleepless: true }).CX.S;
  assert.ok(!migrated.staff.some((e: any) => e.first === "Damien"));
});

test("catalogue : prix TTC sourcés et confirmation obligatoire avant facturation", () => {
  const { CX, D } = fixture();
  assert.equal(CX.S.serviceCatalog.length, 14);
  const battery = CX.S.serviceCatalog.find(
    (s: any) => s.id === "depannage-batterie",
  );
  assert.equal(battery.variants[0].fromTtc, 70);
  assert.ok(battery.issue.includes("80"));
  assert.equal(CX.S.commercial.departments.length, 9);
  const m = CX.S.missions.find((m: any) => m.status === "Terminée");
  m.priceConfirmed = false;
  const before = CX.S.dinvoices.length;
  assert.equal(D.billMission(m), null);
  assert.equal(CX.S.dinvoices.length, before);
});

test("réinitialisation : le catalogue et les migrations sont disponibles immédiatement", async () => {
  const { CX } = loadCore({ sleepless: true });
  await CX.reset();
  assert.equal(CX.S.serviceCatalog.length, 14);
  assert.equal(CX.S.office.length, 2);
  assert.ok(CX.S.marketing);
  assert.ok(CX.S.gardes.every((g: any) => g.rateStatus === "demo-unconfirmed"));
});

test("commercial : brouillon sans chiffres inventés, budget total, validation et export distincts", () => {
  const { CX, D } = fixture(),
    C = D.commercial;
  const c = C.draft({
    serviceId: "depannage-batterie",
    department: "75",
    channel: "google",
    budget: 50,
    days: 5,
  });
  assert.equal(c.dailyPlan, 10);
  assert.equal(c.metrics, null);
  assert.equal(c.status, "Brouillon");
  assert.ok(c.social.includes("Prix sur devis"));
  assert.ok(c.headlines.every((h: string) => h.length <= 30));
  assert.ok(c.descriptions.every((h: string) => h.length <= 90));
  assert.equal(new URL(c.url).searchParams.get("utm_campaign"), c.id);
  assert.throws(() =>
    C.draft({
      serviceId: c.serviceId,
      department: "99",
      channel: "meta",
      budget: 50,
      days: 5,
    }),
  );
  assert.throws(() => C.draft({ ...c, budget: Infinity }));
  C.validate(c);
  assert.equal(c.status, "Validé pour export");
  C.metrics(c, {
    spend: 65,
    clicks: 22,
    source: "Relevé Google du 17 octobre",
  });
  assert.equal(c.metrics.spend, 65); // conserver un dépassement réel, sans le masquer
  assert.equal(CX.S.marketing.leads.length, 0); // les clics ne sont pas des contacts identifiés
});

test("commercial : contact valide, suivi manuel et tarif validé sans modifier les missions", () => {
  const { CX, D } = fixture(),
    C = D.commercial;
  assert.throws(() =>
    C.addLead({
      name: "Test",
      serviceId: "depannage-batterie",
      department: "75",
      source: "Appel",
    }),
  );
  const l = C.addLead({
    name: "Contact test",
    phone: "0600000000",
    serviceId: "depannage-batterie",
    department: "75",
    source: "Appel reçu",
  });
  C.leadStage(l, "À rappeler");
  assert.equal(l.status, "À rappeler");
  assert.throws(() => C.leadStage(l, "Contacté automatiquement"));
  const prices = JSON.stringify(CX.S.missions.map((m: any) => m.price));
  C.approveService(CX.S.serviceCatalog[0], {
    amount: 95,
    note: "Validé par Joseph pour intervention standard ; hors accès difficile.",
  });
  assert.equal(JSON.stringify(CX.S.missions.map((m: any) => m.price)), prices);
  const c = C.draft({
    serviceId: CX.S.serviceCatalog[0].id,
    department: "75",
    channel: "meta",
    budget: 50,
    days: 5,
  });
  assert.ok(c.social.includes("95 € TTC"));
  assert.ok(c.social.includes("selon conditions"));
});
