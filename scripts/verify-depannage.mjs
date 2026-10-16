// Vérification navigateur de MOTEK Dépannage.
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

await step("Profil dépanneur : back-office direct, navigation sans modules atelier", async () => {
  const s = await ev(() => ({ mode: APP.mode, nomap: document.body.classList.contains("no-map"), nav: document.querySelector(".bo-nav").innerText.replace(/\n+/g, " | "), profile: CX.S.company.profile, name: CX.S.company.name }));
  expect(s.mode === "bo" && s.nomap, "mode back-office sans carte : " + JSON.stringify(s));
  for (const l of ["Missions", "Flotte & chauffeurs", "Parc de gardiennage", "Sinistres & assurances", "Facturation", "Agent IA"]) expect(s.nav.includes(l), "module manquant : " + l);
  for (const l of ["Ordres de réparation", "Peinture", "Showroom", "Poste technicien", "Planning atelier"]) expect(!s.nav.includes(l), "module atelier visible : " + l);
  expect(s.profile === "depannage" && /Dan Dépanne/.test(s.name), "profil et société");
  await top(); await shot("01-tableau-de-bord");
});

await step("Tableau de bord : journée du dépanneur et assistant", async () => {
  const k = await ev(() => [...document.querySelectorAll(".kpis.today .kpi .lb")].map((x) => x.textContent));
  for (const l of ["Missions en attente", "Camions sur la route", "Camions disponibles", "Véhicules au parc", "Terminées aujourd’hui", "Gardes à relancer"]) expect(k.includes(l), "indicateur manquant : " + l);
  const plate = await ev(() => DEP.inPark()[0].vehicle.plate);
  await page.fill("[data-voice] [data-vq]", "Où est la " + plate + " ?"); await ev(() => document.querySelector("[data-voice] [data-vgo]").click()); await page.waitForTimeout(300);
  expect(/place/.test(await ev(() => document.querySelector("[data-vout]").textContent)), "l’assistant localise un véhicule au parc");
  await page.fill("[data-voice] [data-vq]", "Camions disponibles"); await ev(() => document.querySelector("[data-voice] [data-vgo]").click()); await page.waitForTimeout(300);
  expect(/disponible/.test(await ev(() => document.querySelector("[data-vout]").textContent)), "camions disponibles");
});

await step("Missions : création, affectation, sur place, remorquage, dépôt au parc, facturation", async () => {
  await ev(() => APP.open("missions")); await page.waitForTimeout(500);
  const n0 = await ev(() => CX.S.missions.length);
  await ev(() => document.querySelector("[data-new]").click()); await page.waitForTimeout(300);
  await ev(() => { const set = (k, v) => { document.querySelector(`[name="${k}"]`).value = v; }; set("address", "8 rue de Paradis, 75010 Paris"); set("plate", "ZZ-999-ZZ"); set("make", "Renault"); set("model", "Clio"); set("cname", "Test Client"); set("cphone", "+33 6 00 00 00 00"); document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(400);
  const m = await ev(() => CX.S.missions[0]);
  expect((await ev(() => CX.S.missions.length)) === n0 + 1 && m.status === "Demandée" && m.vehicle.plate === "ZZ-999-ZZ", "mission créée");
  await ev((id) => DEP.assign(id, CX.S.trucks.find((t) => t.status === "Disponible").id), m.id);
  await ev((id) => DEP.setMissionStatus(id, "En route"), m.id);
  await ev((id) => DEP.setMissionStatus(id, "Sur place"), m.id);
  await ev((id) => DEP.setMissionStatus(id, "Remorquage"), m.id);
  const st1 = await ev((id) => ({ s: DEP.mission(id).status, truck: DEP.truck(DEP.mission(id).truckId).status, arrived: !!DEP.mission(id).arrivedAt }), m.id);
  expect(st1.s === "Remorquage" && st1.truck === "En mission" && st1.arrived, "suivi de mission : " + JSON.stringify(st1));
  const before = await ev(() => DEP.inPark().length);
  await ev((id) => DEP.depositToParc(id, "N2", "N2-39"), m.id);
  const st2 = await ev((id) => ({ s: DEP.mission(id).status, parked: DEP.inPark().length, truck: DEP.truck(DEP.mission(id).truckId).status, g: DEP.inPark().find((g) => g.slot === "N2-39") }), m.id);
  expect(st2.s === "Déposée au parc" && st2.parked === before + 1 && st2.truck === "Disponible" && st2.g && st2.g.vehicle.plate === "ZZ-999-ZZ", "dépôt au parc : " + JSON.stringify({ s: st2.s, parked: st2.parked, truck: st2.truck }));
  await ev((id) => DEP.setMissionStatus(id, "Facturée"), m.id);
  expect((await ev((id) => DEP.mission(id).status, m.id)) === "Facturée", "facturée");
  await ev(() => APP.refresh()); await page.waitForTimeout(400);
  await top(); await shot("02-missions");
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
  const f = await ev(() => ({ cards: document.querySelectorAll(".fleet .kcar").length, drivers: document.querySelectorAll(".techs .techbtn").length }));
  expect(f.cards === 12 && f.drivers === 12, "flotte : " + JSON.stringify(f));
  await shot("04-flotte");
  await ev(() => APP.open("agent")); await page.waitForTimeout(500);
  const kinds = await ev(() => AGENT.suggest().map((x) => x.title));
  expect(kinds.some((t) => /Relancer|Abandon/.test(t)) && kinds.some((t) => /Facturer MI-/.test(t)), "suggestions dépannage : " + kinds.slice(0, 4).join(" | "));
  expect(!kinds.some((t) => /entretien · |Contrôle technique/.test(t)), "pas de suggestions atelier");
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
