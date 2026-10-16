// Règles métier de MOTEK Dépann : équipe réelle, statuts de mission et de camion,
// frais de garde, facture de mission / de garde, synchronisation mandat ↔ facture,
// courriels assureurs, numéros sans collision, cohérence du jeu de démonstration.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDepannage } from "./depannage-harness.ts";

const fresh = () => loadDepannage();
const BUSY = ["Affectée", "En route", "Sur place", "Remorquage"];

test("équipe : quatre dépanneurs nommés, deux personnes au bureau, Joseph gérant", () => {
  const { CX } = fresh();
  assert.equal(CX.S.drivers.map((d: any) => d.first).join(), "Damien,Dylan,Laurent,Trump");
  assert.equal(CX.S.office.map((p: any) => p.first).join(), "Moïse,Florence");
  assert.equal(CX.emp(CX.S.meId).first, "Joseph");
  assert.equal(CX.S.trucks.length, 12);
  assert.equal(CX.S.trucks.filter((t: any) => t.kind === "Panier" && /Hilux/.test(t.brand) && t.year === 2025).length, 5);
  assert.ok(/^\+33 1/.test(CX.S.company.phone), "numéro parisien");
  assert.ok(!JSON.stringify(CX.S.missions).includes("Dépanne "), "pas de « Dan Dépanne » dans les données");
});

test("démo cohérente : chaque camion « en mission » porte une mission active, un dépanneur n'a qu'une mission à la fois", () => {
  const { CX, DEP } = fresh();
  for (const t of CX.S.trucks) {
    const act = CX.S.missions.filter((m: any) => m.truckId === t.id && BUSY.includes(m.status));
    if (t.status === "En mission") assert.equal(act.length, 1, t.name + " en mission sans mission active");
    if (t.status === "Disponible") assert.equal(act.length, 0, t.name + " disponible mais engagé");
    assert.ok(t.status !== "Entretien" || act.length === 0, "camion en entretien engagé");
  }
  for (const d of CX.S.drivers) assert.ok(CX.S.missions.filter((m: any) => m.driverId === d.id && BUSY.includes(m.status)).length <= 1, d.first + " a deux missions");
  assert.equal(DEP.freeDrivers().length, 0, "au départ, tout le monde est en mission");
  assert.equal(CX.S.missions.filter((m: any) => m.status === "Demandée").length, 2);
});

test("démo cohérente : une mission déposée au parc a sa garde, une mission facturée a sa facture, un mandat assureur a une référence", () => {
  const { CX, DEP } = fresh();
  for (const m of CX.S.missions.filter((m: any) => m.status === "Déposée au parc")) {
    const g = CX.S.gardes.find((g: any) => g.id === m.gardeId);
    assert.ok(g && !g.outAt && g.vehicle.plate === m.vehicle.plate, m.no + " déposée sans garde");
  }
  for (const m of CX.S.missions.filter((m: any) => m.status === "Facturée")) assert.ok(CX.S.dinvoices.some((i: any) => i.kind === "mission" && i.srcId === m.id), m.no + " facturée sans facture");
  for (const x of DEP.mandats()) assert.ok(x.ref || x.mandant === "Police municipale", x.no + " mandat sans référence sinistre");
  const slots = CX.S.gardes.filter((g: any) => !g.outAt).map((g: any) => g.slot);
  assert.equal(new Set(slots).size, slots.length, "deux véhicules sur la même place");
  const nos = CX.S.dinvoices.map((i: any) => i.no);
  assert.equal(new Set(nos).size, nos.length, "numéros de facture en double");
});

test("mission : affectation d'un dépanneur libre, refus d'un dépanneur déjà en mission ou d'un camion en entretien", () => {
  const { CX, DEP, toasts } = fresh();
  const waiting = CX.S.missions.find((m: any) => m.status === "Demandée");
  const damien = CX.S.drivers[0], busyTruck = CX.S.trucks.find((t: any) => t.driverId === damien.id);
  assert.equal(DEP.assign(waiting.id, busyTruck.id, damien.id), null, "Damien est déjà en mission");
  assert.ok(toasts.some((t) => /déjà en mission/.test(t)));
  const maint = CX.S.trucks.find((t: any) => t.status === "Entretien");
  assert.equal(DEP.assign(waiting.id, maint.id, damien.id), null, "camion en entretien refusé");
  // Damien termine : il devient libre, son camion aussi.
  const cur = DEP.driverMission(damien.id);
  DEP.setMissionStatus(cur.id, "Terminée");
  assert.equal(busyTruck.status, "Disponible");
  assert.ok(DEP.freeDrivers().some((d: any) => d.id === damien.id));
  assert.ok(DEP.assign(waiting.id, busyTruck.id, damien.id));
  assert.equal(waiting.status, "Affectée");
  assert.equal(busyTruck.status, "En mission", "un camion affecté n'est plus disponible");
  DEP.setMissionStatus(waiting.id, "En route");
  DEP.setMissionStatus(waiting.id, "Sur place");
  assert.ok(waiting.arrivedAt, "heure d'arrivée horodatée");
  assert.equal(DEP.setMissionStatus("inconnue", "Sur place"), null);
});

test("mission : une mission sans dépanneur ne démarre pas", () => {
  const { CX, DEP } = fresh();
  const waiting = CX.S.missions.find((m: any) => m.status === "Demandée");
  assert.equal(DEP.setMissionStatus(waiting.id, "En route"), null);
  assert.equal(waiting.status, "Demandée");
});

test("parc : frais = jours × tarif + dossier ; statut selon la durée ; dépôt depuis une mission crée la garde et libère le camion", () => {
  const { CX, DEP } = fresh();
  const g = DEP.inPark().find((x: any) => DEP.gardeDays(x) > 10);
  assert.equal(DEP.gardeFees(g), DEP.gardeDays(g) * CX.S.parc.dailyFee + CX.S.parc.adminFee);
  DEP.refreshGardeStatus();
  for (const x of DEP.inPark()) { const d = DEP.gardeDays(x); assert.equal(x.status, d > 60 ? "Abandon présumé" : d > 30 ? "Relance à faire" : "En garde", x.no); }
  const m = CX.S.missions.find((x: any) => x.status === "Remorquage"), truck = DEP.truck(m.truckId);
  const before = DEP.inPark().length;
  const taken = DEP.inPark()[0].slot;
  assert.equal(DEP.depositToParc(m.id, taken.split("-")[0], taken), null, "place déjà occupée refusée");
  const g2 = DEP.depositToParc(m.id, "N3", "N3-36");
  assert.ok(g2 && g2.step === "Non traité" && g2.missionId === m.id && g2.insurance && g2.insurance.status === "À déclarer");
  assert.equal(DEP.inPark().length, before + 1);
  assert.equal(m.status, "Déposée au parc");
  assert.equal(m.gardeId, g2.id);
  assert.equal(truck.status, "Disponible");
  assert.ok(!CX.S.gardes.some((x: any) => x !== g2 && x.no === g2.no), "numéro de garde unique");
});

test("facturation : facturer une mission crée une facture TTC, passe la mission et le mandat en « Facturée » ; pas de doublon", () => {
  const { CX, DEP } = fresh();
  const m = CX.S.missions.find((x: any) => x.status === "Terminée" && x.mandant !== "Particulier");
  const n0 = DEP.invoices().length;
  const i = DEP.invoiceMission(m.id);
  assert.ok(i && i.ttc === Math.round(m.price * 1.2 * 100) / 100, "TTC = HT × 1,2");
  assert.equal(m.status, "Facturée");
  assert.equal(m.insurance.status, "Facturée", "mandat synchronisé");
  assert.equal(DEP.invoices().length, n0 + 1);
  assert.equal(DEP.billMission(m), null, "déjà facturée");
  assert.equal(DEP.invoices().length, n0 + 1);
  const nos = DEP.invoices().map((x: any) => x.no);
  assert.equal(new Set(nos).size, nos.length, "numéros uniques après émission");
  // Encaissement complet → facture payée, mandat payé.
  DEP.payInvoice(i, i.ttc, null, "VIR-1");
  assert.equal(i.status, "Payée");
  assert.equal(m.insurance.status, "Payée");
});

test("facturation : la garde restituée se facture (jours × tarif + dossier) et le paiement sur place solde la facture", () => {
  const { CX, DEP } = fresh();
  const g = DEP.inPark().find((x: any) => x.mandant !== "Particulier" && x.insurance.status === "Accordée");
  g.outAt = CX.now(); g.status = "Restitué"; g.total = DEP.gardeFees(g); g.paid = 0;
  const i = DEP.billGarde(g);
  assert.equal(i.ht, DEP.gardeDays(g) * g.dailyFee + CX.S.parc.adminFee);
  assert.equal(i.lines.length, 2);
  assert.equal(g.insurance.status, "Facturée");
  assert.equal(DEP.billGarde(g), null, "déjà facturée");
  const g2 = DEP.inPark().find((x: any) => x.mandant === "Particulier");
  g2.outAt = CX.now(); g2.status = "Restitué"; g2.total = DEP.gardeFees(g2); g2.paid = Math.round(g2.total * 1.2 * 100) / 100;
  const i2 = DEP.billGarde(g2);
  assert.equal(i2.status, "Payée");
});

test("mandats : un courriel d'accord passe le mandat en « Accordée » ; un avis de virement solde la facture liée ; référence inconnue refusée", () => {
  const { CX, DEP, toasts } = fresh();
  const accord = CX.S.insMail.find((x: any) => x.intent === "accord");
  DEP.applyMail(accord.id);
  const x = DEP.mandats().find((y: any) => y.ref === accord.ref);
  assert.equal(x.ins.status, "Accordée");
  assert.ok(accord.handledAt);
  assert.ok(CX.S.agent.log[0].text.includes(x.no));
  // Paiement annoncé sur une garde facturée : on émet d'abord la facture, puis le mail la solde.
  const pay = CX.S.insMail.find((x: any) => x.intent === "paiement");
  const g = DEP.inPark().find((y: any) => y.ref === pay.ref);
  g.outAt = CX.now(); g.status = "Restitué"; g.total = DEP.gardeFees(g);
  const inv = DEP.billGarde(g);
  DEP.applyMail(pay.id);
  assert.equal(g.insurance.status, "Payée");
  assert.equal(inv.status, "Payée", "la facture de garde est soldée par l'avis de virement");
  DEP.applyMail({ id: "zz", ref: "SIN-00000", plate: "ZZ-000-ZZ", intent: "accord" });
  assert.ok(toasts.some((t) => /Dossier introuvable/.test(t)));
});

test("mandats : tableau par compagnie et délai de paiement constaté", () => {
  const { CX, DEP } = fresh();
  const paid = CX.S.dinvoices.find((i: any) => i.status === "Payée" && i.payer !== "Particulier");
  assert.ok(paid, "une facture payée dans la démo");
  const d = DEP.payDelay(paid.payer);
  assert.ok(Number.isInteger(d) && d >= 0, "délai moyen en jours");
  assert.equal(DEP.payDelay("Compagnie inconnue"), null);
});

test("commandes : numéros sans collision après création", () => {
  const { CX, DEP } = fresh();
  const nos = DEP.orders().map((o: any) => +o.no.replace(/\D/g, ""));
  const max = Math.max(...nos);
  // Création directe (comme orderForm) : le prochain numéro dépasse le plus grand existant.
  DEP.orders().unshift({ id: "SOx", no: "CB-" + (max + 1), at: CX.now(), supplierId: "DS1", item: "Batterie test", qty: 1, price: 100, status: "À commander", history: [] });
  const all = DEP.orders().map((o: any) => o.no);
  assert.equal(new Set(all).size, all.length);
  DEP.setOrderStatus("SOx", "Commandée");
  assert.equal(DEP.orders().find((o: any) => o.id === "SOx").status, "Commandée");
});

test("tarifs : grille du dépanneur disponible et modifiable", () => {
  const { CX, DEP } = fresh();
  assert.equal(DEP.priceOf("Accident"), 260);
  assert.equal(DEP.priceOf("Inconnu"), CX.S.tarifs.Autre);
  CX.S.tarifs.Accident = 300;
  assert.equal(DEP.priceOf("Accident"), 300);
});

test("assistant : « qui est libre ? », « où est Damien ? », localisation d'une plaque au parc", () => {
  const { CX, DEP } = fresh();
  assert.match(DEP.ask("qui est libre ?").reply, /Personne n’est libre/);
  assert.match(DEP.ask("où est Damien ?").reply, /Damien est remorquage|Damien est/);
  const g = DEP.inPark()[0];
  const r = DEP.ask("où est la " + g.vehicle.plate + " ?");
  assert.match(r.reply, /place/);
  assert.equal(r.actions.length, 1);
  assert.ok(DEP.ask("blabla").warnings.length);
});

test("migration : une démo intacte seedée avec l'ancienne équipe est régénérée, une base modifiée est conservée", () => {
  const h = fresh();
  const old = structuredClone(JSON.parse(JSON.stringify(h.CX.S)));
  delete old.depSeed; old.drivers = old.drivers.concat([{ id: "D99", first: "Ancien", name: "Ancien" }]);
  const m1 = h.CX.migrate(structuredClone(old));
  assert.equal(m1.drivers.map((d: any) => d.first).join(), "Damien,Dylan,Laurent,Trump", "démo intacte → équipe réelle");
  const real = structuredClone(old); real.pristine = false;
  const m2 = h.CX.migrate(real);
  assert.ok(m2.drivers.some((d: any) => d.id === "D99"), "données réelles conservées");
  assert.ok(m2.tarifs, "la grille tarifaire est ajoutée aux anciens états");
});
