// Vérification navigateur de MOTEK Dépann.
// Prérequis : `npx playwright install chromium`, puis AUTOHUB_DB=.data/verify-dep.sqlite npm run dev
// Usage : node scripts/verify-depannage.mjs [http://127.0.0.1:5173]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const base = process.argv[2] || "http://127.0.0.1:5173";
const out = ".data/verify-depannage";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const step = async (name, fn) => { try { await fn(); results.push([true, name]); console.log("✓ " + name); } catch (e) { results.push([false, name, e.message]); console.log("✗ " + name + " " + e.message.split("\n")[0]); } };
const ev = (fn, arg) => page.evaluate(fn, arg);
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const top = () => ev(() => { const c = document.querySelector("#bo-content"); if (c) c.scrollTop = 0; });

await page.goto(base + "/motek/");
await page.waitForTimeout(2500);
await ev(() => { localStorage.clear(); });
await Promise.all([page.waitForNavigation({ timeout: 20000 }).catch(() => {}), ev(() => { CX.reset(); return true; }).catch(() => {})]);
await page.waitForTimeout(3000);

await step("Parc live 3D : carte par défaut, véhicules gardés et dépôt des camions", async () => {
  await page.waitForFunction(() => window.PARC3D && PARC3D.counts && PARC3D.counts().cars > 0, null, { timeout: 15000 });
  const s = await ev(() => ({ mode: APP.mode, nomap: document.body.classList.contains("no-map"), map: !!document.querySelector("#view-map canvas"), ...PARC3D.counts(), park: DEP.inPark().length, trucks: CX.S.trucks.length }));
  expect(s.mode === "map" && !s.nomap && s.map, "carte 3D affichée par défaut : " + JSON.stringify(s));
  expect(s.cars === Math.min(s.park, 120) && s.trucks === 12, "véhicules du parc et camions dessinés : " + JSON.stringify(s));
  const canvas = await ev(() => { const c = document.querySelector("#scene canvas"); return { w: c.width, cw: c.clientWidth, sw: c.style.width }; });
  expect(canvas.sw && canvas.cw === 1500, "canvas dimensionné à la fenêtre : " + JSON.stringify(canvas));
  await shot("00-parc-live");
  const g = await ev(() => DEP.inPark()[0]);
  await ev((id) => PARC3D.select({ kind: "garde", id }), g.id); await page.waitForTimeout(400);
  expect((await ev(() => document.querySelector("#detail").innerText)).includes(g.vehicle.plate), "fiche du véhicule sélectionné");
  const t = await ev(() => CX.S.trucks[0]);
  await ev((id) => PARC3D.select({ kind: "truck", id }), t.id); await page.waitForTimeout(400);
  expect((await ev(() => document.querySelector("#detail").innerText)).includes(t.name || t.plate), "fiche du camion sélectionné");
  await ev(() => PARC3D.select({ kind: "office" })); await page.waitForTimeout(400);
  expect(/Moïse|Florence/.test(await ev(() => document.querySelector("#detail").innerText)), "fiche du bureau avec Moïse et Florence");
  const steps = await ev(() => { const g = DEP.inPark().find((x) => x.step === "Non traité"); PARC3D.select({ kind: "garde", id: g.id }); document.querySelector('#detail [data-step="Expertise en attente"]').click(); return DEP.garde(g.id).step; });
  expect(steps === "Expertise en attente", "étape du dossier changée depuis la fiche 3D");
  for (const z of ["N2", "DEPOT", "ALL"]) await ev((z) => PARC3D.setPlace(z), z);
  const tabs = await ev(() => [...document.querySelectorAll("#tabs [data-tab]")].map((b) => b.dataset.tab));
  expect(tabs.join() === "relance,new,missions,mails,fleet", "onglets du panneau : " + tabs.join());
  await ev(() => document.querySelector('#tabs [data-tab="fleet"]').click());
  expect((await ev(() => document.querySelectorAll("#blist .ft").length)) === 12, "flotte visuelle dans le panneau");
  expect(/\d+\/\d+/.test(await ev(() => document.querySelector("#track .trk-nav b").textContent)), "défilement des missions en cours");
  const kinds = await ev(() => CX.S.trucks.filter((t) => t.kind === "Panier" && /Hilux/.test(t.brand) && t.year === 2025).length);
  expect(kinds === 5, "cinq paniers Toyota Hilux 2025 : " + kinds);
  await ev(() => APP.setMode("bo")); await page.waitForTimeout(600);
});

await step("Profil dépanneur : navigation sans modules atelier", async () => {
  const s = await ev(() => ({ nav: document.querySelector(".bo-nav").innerText.replace(/\n+/g, " | "), profile: CX.S.company.profile, name: CX.S.company.name }));
  for (const l of ["Missions", "Camions & équipe", "Parc de gardiennage", "Assureurs & mandats", "Commandes fournisseurs", "Facturation", "Agent IA", "Ma tournée", "Paramètres"]) expect(s.nav.includes(l), "module manquant : " + l);
  for (const l of ["Clients & véhicules"]) expect(!s.nav.includes(l), "module garage visible : " + l);
  expect(/Joseph/.test(await ev(() => document.querySelector("header .user .un").textContent)), "utilisateur Joseph");
  for (const l of ["Ordres de réparation", "Peinture", "Showroom", "Poste technicien", "Planning atelier"]) expect(!s.nav.includes(l), "module atelier visible : " + l);
  expect(s.profile === "depannage" && /Dan Dépann/.test(s.name), "profil et société");
  await top(); await shot("01-tableau-de-bord");
});

await step("Tableau de bord : quatre chiffres, les quatre dépanneurs, assistant", async () => {
  const k = await ev(() => [...document.querySelectorAll(".kpis.hero4 .kpi .lb")].map((x) => x.textContent));
  for (const l of ["Missions en cours", "Dépanneurs libres", "Véhicules au parc", "À encaisser"]) expect(k.includes(l), "indicateur manquant : " + l);
  const drv = await ev(() => [...document.querySelectorAll(".drivers .drv .drv-h b")].map((x) => x.textContent.trim()));
  expect(drv.join() === "Damien,Dylan,Laurent,Trump", "les quatre dépanneurs : " + drv.join());
  expect((await ev(() => document.querySelectorAll(".drivers .drv.busy").length)) === 4, "tous en mission au départ");
  await page.fill("[data-voice] [data-vq]", "Qui est libre ?"); await ev(() => document.querySelector("[data-voice] [data-vgo]").click()); await page.waitForTimeout(300);
  expect(/libre/.test(await ev(() => document.querySelector("[data-vout]").textContent)), "l’assistant répond sur les dépanneurs");
  const plate = await ev(() => DEP.inPark()[0].vehicle.plate);
  await page.fill("[data-voice] [data-vq]", "Où est la " + plate + " ?"); await ev(() => document.querySelector("[data-voice] [data-vgo]").click()); await page.waitForTimeout(300);
  expect(/place/.test(await ev(() => document.querySelector("[data-vout]").textContent)), "l’assistant localise un véhicule au parc");
  await page.fill("[data-voice] [data-vq]", "Camions disponibles"); await ev(() => document.querySelector("[data-voice] [data-vgo]").click()); await page.waitForTimeout(300);
  expect(/disponible/.test(await ev(() => document.querySelector("[data-vout]").textContent)), "camions disponibles");
});

await step("Missions : création, affectation d’un dépanneur, sur place, remorquage, dépôt au parc, facture réelle", async () => {
  await ev(() => APP.open("missions")); await page.waitForTimeout(500);
  const n0 = await ev(() => CX.S.missions.length);
  await ev(() => document.querySelector("[data-new]").click()); await page.waitForTimeout(300);
  await ev(() => { const set = (k, v) => { document.querySelector(`[name="${k}"]`).value = v; }; set("address", "8 rue de Paradis, 75010 Paris"); set("plate", "ZZ-999-ZZ"); set("make", "Renault"); set("model", "Clio"); set("cname", "Test Client"); set("cphone", "+33 6 00 00 00 00"); document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(400);
  const m = await ev(() => CX.S.missions[0]);
  expect((await ev(() => CX.S.missions.length)) === n0 + 1 && m.status === "Demandée" && m.vehicle.plate === "ZZ-999-ZZ", "mission créée");
  expect((await ev((id) => DEP.assign(id, CX.S.trucks.find((t) => t.status === "Disponible").id, "D1"), m.id)) === null, "Damien est déjà en mission : affectation refusée");
  await ev(() => { const cur = DEP.driverMission("D1"); DEP.setMissionStatus(cur.id, "Terminée"); });
  expect((await ev(() => DEP.freeDrivers().map((d) => d.first).join())) === "Damien", "Damien libéré");
  await ev((id) => DEP.assign(id, DEP.truckOfDriver("D1").id, "D1"), m.id);
  await ev((id) => DEP.setMissionStatus(id, "En route"), m.id);
  await ev((id) => DEP.setMissionStatus(id, "Sur place"), m.id);
  await ev((id) => DEP.setMissionStatus(id, "Remorquage"), m.id);
  const st1 = await ev((id) => ({ s: DEP.mission(id).status, truck: DEP.truck(DEP.mission(id).truckId).status, arrived: !!DEP.mission(id).arrivedAt }), m.id);
  expect(st1.s === "Remorquage" && st1.truck === "En mission" && st1.arrived, "suivi de mission : " + JSON.stringify(st1));
  const before = await ev(() => DEP.inPark().length);
  await ev((id) => DEP.depositToParc(id, "N2", "N2-39"), m.id);
  const st2 = await ev((id) => ({ s: DEP.mission(id).status, parked: DEP.inPark().length, truck: DEP.truck(DEP.mission(id).truckId).status, g: DEP.inPark().find((g) => g.slot === "N2-39") }), m.id);
  expect(st2.s === "Déposée au parc" && st2.parked === before + 1 && st2.truck === "Disponible" && st2.g && st2.g.vehicle.plate === "ZZ-999-ZZ", "dépôt au parc : " + JSON.stringify({ s: st2.s, parked: st2.parked, truck: st2.truck }));
  const inv0 = await ev(() => DEP.invoices().length);
  await ev((id) => DEP.invoiceMission(id), m.id);
  const fac = await ev((id) => ({ st: DEP.mission(id).status, n: DEP.invoices().length, inv: DEP.invoiceOf("mission", id) }), m.id);
  expect(fac.st === "Facturée" && fac.n === inv0 + 1 && fac.inv && fac.inv.payer === "AXA", "facturée avec une vraie facture : " + JSON.stringify({ st: fac.st, n: fac.n }));
  await ev(() => APP.refresh()); await page.waitForTimeout(400);
  await top(); await shot("02-missions");
  // Planning du jour : une ligne par dépanneur, les demandes en attente, affectation par dépôt.
  await ev(() => APP.open("missions", { tab: "journee" })); await page.waitForTimeout(400);
  const tl = await ev(() => ({ rows: document.querySelectorAll(".tl-row[data-drop]").length, wait: document.querySelectorAll(".tl-wait .tlb").length, blocks: document.querySelectorAll(".tlb").length }));
  expect(tl.rows === 4 && tl.blocks > tl.wait && tl.wait >= 1, "planning du jour : " + JSON.stringify(tl));
  const freeD = await ev(() => (DEP.freeDrivers()[0] || {}).id);
  if (freeD) { const w = await ev(() => CX.S.missions.find((m) => m.status === "Demandée").id); await ev(([mid, did]) => { const tr = DEP.truckOfDriver(did); DEP.assign(mid, tr.id, did); DEP.setMissionStatus(mid, "En route"); }, [w, freeD]); expect((await ev((id) => DEP.mission(id).status, w)) === "En route", "demande envoyée au dépanneur libre depuis le planning"); }
  await shot("02b-planning-journee");
  await ev(() => APP.open("missions", { tab: "cards" })); await page.waitForTimeout(300);
});

await step("Parc : plan des niveaux, statuts selon la durée, sortie avec frais", async () => {
  await ev(() => APP.open("parc")); await page.waitForTimeout(500);
  const p = await ev(() => ({ slots: document.querySelectorAll(".parc-grid .slot").length, busy: document.querySelectorAll(".parc-grid .slot.busy").length, rel: DEP.inPark().filter((g) => g.status === "Relance à faire").length, ab: DEP.inPark().filter((g) => g.status === "Abandon présumé").length }));
  expect(p.slots === 40 && p.busy > 0 && p.rel > 0 && p.ab > 0, "plan et statuts : " + JSON.stringify(p));
  await top(); await shot("03-parc");
  const g = await ev(() => { const g = DEP.inPark().find((x) => DEP.gardeDays(x) > 10); return { id: g.id, days: DEP.gardeDays(g), fees: DEP.gardeFees(g) }; });
  expect(g.fees === g.days * 18 + 45, "frais = jours × 18 + 45 : " + JSON.stringify(g));
  await ev((id) => APP.open("parc", { id }), g.id); await page.waitForTimeout(400);
  await ev(() => document.querySelector("[data-out]").click()); await page.waitForTimeout(300);
  await ev(() => { document.querySelector('[name="who"]').value = "M. Test"; document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(400);
  const o = await ev((id) => ({ out: !!DEP.garde(id).outAt, status: DEP.garde(id).status, total: DEP.garde(id).total }), g.id);
  expect(o.out && o.status === "Restitué" && o.total === g.fees, "sortie enregistrée : " + JSON.stringify(o));
});

await step("Flotte et agent IA : camions, chauffeurs, suggestions dépannage", async () => {
  await ev(() => APP.open("fleet")); await page.waitForTimeout(400);
  const f = await ev(() => ({ cards: document.querySelectorAll(".fleet .kcar").length, icons: document.querySelectorAll(".fleet .kcar svg.tic").length }));
  expect(f.cards === 12 && f.icons === 12, "flotte avec pictogrammes par type : " + JSON.stringify(f));
  await ev(() => APP.open("fleet", { tab: "chauffeurs" })); await page.waitForTimeout(300);
  expect((await ev(() => document.querySelectorAll(".drivers .drv").length)) === 4, "quatre dépanneurs");
  await ev(() => APP.open("fleet", { tab: "bureau" })); await page.waitForTimeout(300);
  expect((await ev(() => document.querySelectorAll(".staff").length)) === 3, "bureau : Joseph + Moïse + Florence");
  await shot("04-flotte");
  await ev(() => APP.open("agent")); await page.waitForTimeout(500);
  const kinds = await ev(() => AGENT.suggest().map((x) => x.title));
  const comp = await ev(() => { APP.open("mandats", { tab: "compagnies" }); return new Promise((r) => setTimeout(() => r(document.querySelector("#bo-content").innerText), 300)); });
  expect(/Impayés/i.test(comp) && /Délai de paiement/i.test(comp), "tableau par compagnie");
  await ev(() => APP.open("agent"));
  expect(kinds.some((t) => /Relancer|Abandon/.test(t)) && kinds.some((t) => /Facturer MI-/.test(t)), "suggestions dépannage : " + kinds.slice(0, 4).join(" | "));
  expect(!kinds.some((t) => /entretien · |Contrôle technique/.test(t)), "pas de suggestions atelier");
});

await step("Mandats & assurances : statuts, demande de prise en charge, boîte mail simulée", async () => {
  await ev(() => APP.open("mandats")); await page.waitForTimeout(500);
  const m = await ev(() => ({ n: DEP.mandats().length, mails: CX.S.insMail.length }));
  expect(m.n > 5 && m.mails >= 4, "mandats et courriels : " + JSON.stringify(m));
  const first = await ev(() => { const x = DEP.mandats().find((x) => x.ins.status === "À déclarer"); return x && x.id; });
  expect(first, "un mandat à déclarer");
  await ev((id) => DEP.setMandatStatus(id, "Prise en charge demandée"), first);
  expect((await ev((id) => DEP.mandats().find((x) => x.id === id).ins.status, first)) === "Prise en charge demandée", "statut changé");
  const mail = await ev(() => CX.S.insMail.find((x) => !x.handledAt && x.intent === "accord"));
  expect(mail, "un courriel d’accord à traiter");
  await ev((id) => DEP.applyMail(id), mail.id); await page.waitForTimeout(300);
  const after = await ev((id) => { const ml = CX.S.insMail.find((x) => x.id === id); const md = DEP.mandats().find((x) => x.ref === ml.ref || (x.vehicle && x.vehicle.plate === ml.plate)); return { handled: !!ml.handledAt, status: md && md.ins.status }; }, mail.id);
  expect(after.handled && after.status === "Accordée", "courriel appliqué : " + JSON.stringify(after));
  await ev(() => APP.open("mandats", { tab: "mail" })); await page.waitForTimeout(400);
  await top(); await shot("05-mandats");
});

await step("Facturation dépanneur : libellés métier, facture de mission, encaissement", async () => {
  await ev(() => APP.open("invoices")); await page.waitForTimeout(500);
  const t = await ev(() => document.querySelector("#bo-content").innerText);
  expect(/Gardiennage|Remorquage|Dépannage/.test(t) && !/bas de caisse|grêle|Peinture/.test(t), "libellés de dépannage, pas de carrosserie");
  const m = await ev(() => CX.S.missions.find((x) => x.status === "Terminée" || x.status === "Déposée au parc"));
  const inv = await ev((id) => { const i = DEP.billMission(DEP.mission(id)); return { no: i.no, ttc: i.ttc, lines: i.lines.map((l) => l.label), st: DEP.mission(id).status }; }, m.id);
  expect(inv.ttc > 0 && inv.st === "Facturée" && /Remorquage|Dépannage|intervention/.test(inv.lines[0]), "facture de mission : " + JSON.stringify(inv));
  await ev((no) => { const i = DEP.invoices().find((x) => x.no === no); DEP.payInvoice(i, i.ttc, null, "VIR-TEST"); }, inv.no);
  expect((await ev((no) => DEP.invoices().find((x) => x.no === no).status, inv.no)) === "Payée", "encaissement");
  await ev(() => APP.refresh()); await page.waitForTimeout(400); await top(); await shot("06-facturation");
});

await step("Commandes fournisseurs : besoin batterie → commande → e-mail au fournisseur → posée", async () => {
  await ev(() => APP.open("supply")); await page.waitForTimeout(500);
  const n0 = await ev(() => DEP.orders().length);
  await ev(() => { const m = CX.S.missions.find((x) => /batterie/i.test(x.kind)); DEP.orderForm(null, { item: "Batterie 12 V 70 Ah L3 (Golf, 308)", plate: m.vehicle.plate, missionId: m.id, price: 119 }); }); await page.waitForTimeout(300);
  await ev(() => document.querySelector("[data-ok]").click()); await page.waitForTimeout(300);
  const o = await ev(() => DEP.orders()[0]);
  expect((await ev(() => DEP.orders().length)) === n0 + 1 && o.status === "À commander", "commande créée");
  await ev((id) => DEP.sendOrder("DS1", [id]), o.id); await page.waitForTimeout(300);
  const body = await ev(() => document.querySelector('.mdl textarea, .mdl [name="body"]') ? (document.querySelector('.mdl textarea, .mdl [name="body"]').value) : "");
  expect(/Batterie 12 V 70 Ah/.test(body) && /Claude Vellefaux/.test(body), "bon de commande préparé");
  await ev(() => document.querySelector(".mdl [data-send], .mdl [data-ok]").click()); await page.waitForTimeout(300);
  expect((await ev((id) => DEP.orders().find((x) => x.id === id).status, o.id)) === "Commandée", "commande envoyée");
  await ev((id) => { DEP.setOrderStatus(id, "Reçue"); DEP.setOrderStatus(id, "Posée"); }, o.id);
  expect((await ev((id) => DEP.orders().find((x) => x.id === id).status, o.id)) === "Posée", "batterie posée");
  await ev(() => APP.refresh()); await page.waitForTimeout(300); await top(); await shot("07-commandes");
});

await step("Agent IA : courriels classés, relances, WhatsApp tracé", async () => {
  await ev(() => APP.open("agent", { tab: "mail" })); await page.waitForTimeout(500);
  const t = await ev(() => document.querySelector("#bo-content").innerText);
  expect(/Payés|Accordés|Pièces demandées|Refus/.test(t) && /Relances à faire/.test(t), "classement des courriels et relances");
  await ev(() => APP.open("agent", { tab: "wa" })); await page.waitForTimeout(400);
  const n0 = await ev(() => CX.S.waMsgs.length);
  await ev(() => { const g = DEP.inPark().find((x) => x.owner.phone); DEP.whatsapp({ phone: g.owner.phone, name: g.owner.name, plate: g.vehicle.plate, kind: "recuperer", gardeId: g.id }); }); await page.waitForTimeout(300);
  const txt = await ev(() => document.querySelector(".mdl [data-txt]").value);
  expect(/Claude Vellefaux/.test(txt) && /récupérer/.test(txt), "message WhatsApp préparé");
  await ev(() => document.querySelector(".mdl [data-sent]").click()); await page.waitForTimeout(300);
  expect((await ev(() => CX.S.waMsgs.length)) === n0 + 1, "message tracé");
  await top(); await shot("08-agent");
});

await step("Ma tournée (téléphone) : le dépanneur voit sa mission et avance d’un bouton", async () => {
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await ph.goto(base + "/motek/#bo/tournee"); await ph.waitForTimeout(2200);
  await ph.evaluate(() => { localStorage.setItem("motek-tour-done", "1"); APP.open("tournee", { who: "D2" }); }); await ph.waitForTimeout(500);
  const t = await ph.evaluate(() => document.querySelector("#bo-content").innerText);
  expect(/Dylan/.test(t) && /Sur place|En route|Remorquage|Affectée|Libre/.test(t), "écran du dépanneur : " + t.slice(0, 80));
  const st0 = await ph.evaluate(() => (DEP.driverMission("D2") || {}).status);
  expect(st0 === "Sur place", "Dylan est sur place : " + st0);
  await ph.evaluate(() => document.querySelector('[data-st="Remorquage"]').click()); await ph.waitForTimeout(400);
  expect((await ph.evaluate(() => DEP.driverMission("D2").status)) === "Remorquage", "bouton « Je remorque »");
  const overflow = await ph.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(!overflow, "pas de défilement horizontal sur téléphone");
  await ph.screenshot({ path: `${out}/09-ma-tournee-telephone.png` });
  await ph.close();
});

await step("iPad : tableau de bord en portrait et en paysage sans débordement", async () => {
  for (const [w, h, n] of [[1180, 820, "10-ipad-paysage"], [834, 1194, "11-ipad-portrait"]]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(base + "/motek/#bo/dashboard"); await p.waitForTimeout(2000);
    await p.evaluate(() => localStorage.setItem("motek-tour-done", "1"));
    const o = await p.evaluate(() => ({ x: document.querySelector("#bo-content").scrollWidth > document.querySelector("#bo-content").clientWidth + 1, drv: document.querySelectorAll(".drivers .drv").length }));
    expect(!o.x && o.drv === 4, n + " : " + JSON.stringify(o));
    await p.screenshot({ path: `${out}/${n}.png` });
    await p.close();
  }
});

await step("Prise en main : visite page par page", async () => {
  // Les pages téléphone / iPad ont modifié l’état : on recharge pour repartir d’une carte à jour.
  await page.goto(base + "/motek/#bo/dashboard"); await page.waitForTimeout(2200);
  await page.reload(); await page.waitForTimeout(2200);
  await ev(() => TOUR.open(0)); await page.waitForTimeout(800);
  expect((await ev(() => APP.mode)) === "map" && !!(await ev(() => document.querySelector(".coach"))), "première étape sur la carte");
  for (let k = 0; k < 4; k++) { await ev(() => document.querySelector(".coach [data-next]").click()); await page.waitForTimeout(500); }
  expect((await ev(() => APP.mode)) === "bo" && (await ev(() => APP.current)) === "dashboard", "cinquième étape sur le tableau de bord");
  await ev(() => TOUR.close(true));
  expect(!(await ev(() => document.querySelector(".coach"))), "carte fermée");
});

await step("Persistance : l’état est partagé entre deux pages", async () => {
  const p2 = await browser.newPage(); await p2.goto(base + "/motek/"); await p2.waitForTimeout(2500);
  expect((await p2.evaluate(() => CX.S.missions.some((m) => m.vehicle.plate === "ZZ-999-ZZ"))), "page B voit la mission créée");
  await p2.close();
});

await browser.close();
const failed = results.filter((r) => !r[0]);
if (errors.length) console.log("Erreurs de page : " + errors.slice(0, 3).join(" | "));
console.log(`\n${results.length - failed.length}/${results.length} étapes réussies · captures dans ${out}/`);
if (failed.length || errors.length) process.exit(1);
