// Vérification navigateur de l’interface MOTEK v3 (motek/).
// Prérequis : `npx playwright install chromium` (une fois), puis un serveur lancé sur
// une base isolée : AUTOHUB_DB=.data/verify-v3.sqlite npm run dev
// Usage : node scripts/verify-v3.mjs [http://127.0.0.1:5173]
// Les captures sont écrites dans .data/verify-v3/. Sortie non nulle en cas d’échec.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:5173";
const out = ".data/verify-v3";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({
  viewport: { width: 1500, height: 1000 },
  httpCredentials: process.env.MOTEK_DEMO_PASSWORD ? { username: process.env.MOTEK_DEMO_USER || "motek", password: process.env.MOTEK_DEMO_PASSWORD } : undefined,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push([true, name]); console.log("✓ " + name); }
  catch (e) { results.push([false, name, e.message]); console.log("✗ " + name + " " + e.message.split("\n")[0]); }
};
const ev = (fn, arg) => page.evaluate(fn, arg);
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const top = () => ev(() => { const c = document.querySelector("#bo-content"); if (c) c.scrollTop = 0; });

await page.goto(base + "/motek/");
// La scène 3D charge beaucoup de modules en développement : on attend la fin du chargeur
// avant de réinitialiser, sinon la requête de réinitialisation reste en file derrière les téléchargements.
await page.waitForFunction(() => { const i = document.querySelector("#intro"); return i && getComputedStyle(i).opacity === "0"; }, null, { timeout: 45000 }).catch(() => {});
await ev(() => { localStorage.clear(); });
await Promise.all([page.waitForNavigation({ timeout: 45000 }).catch(() => {}), ev(() => { CX.reset(); return true; }).catch(() => {})]);
await page.waitForTimeout(4000);

await step("Atelier live épuré : un seul indicateur, panneaux selon la zone", async () => {
  const s = await ev(() => ({ kpi: [...document.querySelectorAll("#view-map .kpi")].map((k) => getComputedStyle(k).display), board: document.querySelector("#view-map .board").className, track: document.querySelector("#track").className, ztag: document.querySelector("#ztag").textContent }));
  expect(s.kpi[0] !== "none" && s.kpi[1] === "none" && s.kpi[2] === "none", "indicateurs : " + s.kpi.join(","));
  expect(/hid/.test(s.board) && /hid/.test(s.track), "panneaux masqués en vue d’ensemble");
  // La scène 3D se charge de façon asynchrone : on réessaie jusqu’à ce que la zone réponde.
  let a;
  for (let i = 0; i < 12; i++) {
    await ev(() => APP.showInMap("map", "Z-atelier"));
    await page.waitForTimeout(1000);
    if ((await ev(() => document.querySelector("#ztag").textContent)) === "AT") break;
  }
  a = await ev(() => ({ board: document.querySelector("#view-map .board").className, track: document.querySelector("#track").className, ztag: document.querySelector("#ztag").textContent }));
  expect(a.ztag === "AT" && !/hid/.test(a.board) && !/hid/.test(a.track), "atelier : postes + suivi attendus (" + JSON.stringify(a) + ")");
  await ev(() => { document.querySelector("#intro").style.display = "none"; });
  await shot("01-atelier-live");
});

await step("Activités : profil centre auto masque Peinture et Sinistres, persiste après rechargement", async () => {
  await ev(() => { APP.setMode("bo"); APP.open("settings"); });
  await page.waitForTimeout(500);
  await ev(() => { document.querySelector('[data-profile="centre"]').click(); document.querySelector("[data-save]").click(); });
  await page.waitForTimeout(800);
  let nav = await page.locator(".bo-nav").innerText();
  expect(!/Peinture|Sinistres/.test(nav) && /Agent IA/.test(nav), "navigation centre auto : " + nav.replace(/\n+/g, " | ").slice(0, 160));
  await page.reload();
  await page.waitForTimeout(3000);
  expect((await ev(() => CX.S.company.profile)) === "centre", "profil non persisté");
  await ev(() => { APP.setMode("bo"); APP.open("settings"); });
  await page.waitForTimeout(500);
  await ev(() => { document.querySelector('[data-profile="concession"]').click(); document.querySelector("[data-save]").click(); });
  await page.waitForTimeout(800);
  nav = await page.locator(".bo-nav").innerText();
  expect(/Showroom/.test(nav) && /Peinture/.test(nav), "navigation concession : " + nav.replace(/\n+/g, " | ").slice(0, 160));
  await top(); await shot("02-parametres-activites");
});

await step("Showroom : fiches, réservation, vente, nouveau véhicule", async () => {
  await ev(() => APP.open("showroom"));
  await page.waitForTimeout(600);
  const n = await ev(() => document.querySelectorAll(".fleet.showroom .kcar").length);
  expect(n >= 8, "cartes véhicule : " + n);
  await shot("03-showroom");
  await ev(() => document.querySelector('[data-v="SR-1"]').click()); await page.waitForTimeout(400);
  await ev(() => document.querySelector("[data-reserve]").click()); await page.waitForTimeout(400);
  await ev(() => { document.querySelector('[name="customerId"]').value = "C2"; document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(600);
  expect((await ev(() => CX.S.showroom[0].status)) === "Réservé", "réservation");
  await ev(() => document.querySelector('[data-v="SR-1"]').click()); await page.waitForTimeout(400);
  await ev(() => document.querySelector("[data-sell]").click()); await page.waitForTimeout(400);
  await ev(() => { document.querySelector('[name="soldPrice"]').value = "16500"; document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(600);
  const v = await ev(() => CX.S.showroom[0]);
  expect(v.status === "Vendu" && v.soldPrice === 16500, "vente");
  await ev(() => document.querySelector("[data-new]").click()); await page.waitForTimeout(400);
  await ev(() => { const set = (k, x) => { document.querySelector(`[name="${k}"]`).value = x; }; set("make", "Kia"); set("model", "Niro"); set("km", "15000"); set("price", "22900"); set("hands", "1"); set("year", "2023"); document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(600);
  expect((await ev(() => CX.S.showroom[0].make)) === "Kia", "nouveau véhicule");
});

await step("Garage intelligent : cas similaires, scan carte grise, lecture de plaque", async () => {
  await ev(() => APP.open("intelligence")); await page.waitForTimeout(600);
  await page.fill("[data-q]", "voyant ABS"); await page.waitForTimeout(700);
  const first = await ev(() => document.querySelector(".bo-page .card.mt .card-b b").textContent);
  expect(/Yaris/.test(first), "cas ABS attendu en tête : " + first);
  await ev(() => document.querySelector('[data-tab="scan"]').click()); await page.waitForTimeout(400);
  await ev(() => document.querySelector('[data-demo="texte"]').click()); await page.waitForTimeout(6000);
  const f = await ev(() => [...document.querySelectorAll("[data-fv]")].map((i) => i.value));
  expect(f[0] === "DEMO-002" && f[4] === "RENAULT" && f[7] === "VF1AAAAA123456789", "champs carte grise : " + f.join("|"));
  await ev(() => document.querySelector("[data-ident]").click()); await page.waitForTimeout(400);
  expect(/inconnu/i.test(await ev(() => document.querySelector(".form-note.mt").textContent)), "identification locale : inconnu attendu");
  await ev(() => { document.querySelector("[data-sp]").value = "MB-118-CC"; document.querySelector("[data-sight]").click(); }); await page.waitForTimeout(400);
  expect(!!(await ev(() => document.querySelector("[data-sight-checkin]"))), "lecture de plaque sûre : dossier confirmé attendu");
  await top(); await shot("04-garage-intelligent-scan");
});

await step("Assistant vocal : chiffres, localisation, pièce manquante confirmée", async () => {
  await ev(() => document.querySelector('[data-tab="vocal"]').click()); await page.waitForTimeout(400);
  const ask = async (q) => { await page.fill("[data-vtext]", q); await ev(() => document.querySelector("[data-analyze]").click()); await page.waitForTimeout(400); return ev(() => ({ reply: document.querySelector(".card.mt .card-b .row span") ? document.querySelector(".card.mt .card-b .row span").textContent : "", acts: document.querySelectorAll("[data-act-i]").length })); };
  let r = await ask("Combien de véhicules sur site ?");
  expect(/véhicules sur site/.test(r.reply), "chiffres du jour : " + r.reply);
  r = await ask("Où est la Golf MB-118-CC ?");
  expect(/OR-24817/.test(r.reply) && r.acts === 1, "localisation : " + r.reply);
  r = await ask("Pièce manquante étrier avant droit pour OR 24821");
  expect(r.acts === 1, "proposition pièce manquante");
  const before = await ev(() => CX.ro("R2").tasks.length);
  await ev(() => document.querySelector("[data-confirm]").click()); await page.waitForTimeout(500);
  const after = await ev(() => ({ n: CX.ro("R2").tasks.length, last: CX.ro("R2").tasks.slice(-1)[0].l, log: CX.S.agent.log[0].kind }));
  expect(after.n === before + 1 && /étrier/.test(after.last) && after.log === "voice", "tâche ajoutée après confirmation");
  await top(); await shot("05-assistant-vocal");
});

await step("Agent IA : suggestions (relance devis, entretien, CT) et message préparé", async () => {
  await ev(() => APP.open("agent")); await page.waitForTimeout(800);
  const kinds = await ev(() => AGENT.suggest().map((x) => x.kind));
  for (const k of ["ready", "quote", "service", "ct", "invoice"]) expect(kinds.includes(k), "suggestion manquante : " + k);
  await top(); await shot("06-agent-ia");
  await ev(() => { const b = [...document.querySelectorAll("[data-run]")].find((x) => x.closest(".todo").textContent.includes("entretien")); b.click(); }); await page.waitForTimeout(500);
  const body = await ev(() => document.querySelector('[name="body"]').value);
  expect(/dernière (vidange|révision)/i.test(body), "message d’entretien : " + body.slice(0, 80));
  await shot("07-agent-message");
  await ev(() => document.querySelector("[data-ok]").click()); await page.waitForTimeout(500);
  expect((await ev(() => CX.S.agent.log[0].kind)) === "agent", "journal de l’agent");
});

await step("Facturation sans encaissement, remise des clés refusée puis acceptée après paiement", async () => {
  const id = await ev(() => { const r = CX.S.ros.find((x) => x.stage === CX.ST.pret && !x.outAt && !CX.cust(x.customerId).fleet && !x.claimId) || CX.S.ros.find((x) => x.stage === CX.ST.pret && !x.outAt); r.qc = { ok: true, items: {} }; return r.id; });
  await ev((id) => { APP.setMode("bo"); APP.open("ros", { id }); }, id); await page.waitForTimeout(600);
  const before = await ev(() => CX.S.payments.length);
  await ev(() => document.querySelector("[data-deliver]").click()); await page.waitForTimeout(400);
  const okBtn = await page.$("[data-ok]"); if (okBtn) { await ev(() => document.querySelector("[data-ok]").click()); await page.waitForTimeout(500); }
  let r = await ev((id) => ({ stage: CX.ro(id).stage, out: CX.ro(id).outAt, inv: CX.S.invoices.filter((i) => i.roId === id && i.kind !== "acompte").length, pay: CX.S.payments.length }), id);
  expect(r.inv >= 1 && r.pay === before && !r.out, "factures émises sans paiement ni sortie : " + JSON.stringify(r));
  // après l'émission, la remise demande un paiement ou un crédit motivé
  await page.waitForTimeout(300);
  const hasCredit = await page.$('[name="credit"]');
  if (hasCredit) { await ev(() => document.querySelector("[data-close]").click()); await page.waitForTimeout(200); }
  await ev((id) => { const inv = CX.S.invoices.find((i) => i.roId === id && i.payerType === "customer" && i.kind !== "acompte"); CX.payInvoice(inv.id, null, "Carte", false, { date: "2026-10-10" }); }, id);
  await ev(() => APP.refresh()); await page.waitForTimeout(400);
  await ev(() => document.querySelector("[data-deliver]").click()); await page.waitForTimeout(300);
  await ev(() => document.querySelector("[data-ok]").click()); await page.waitForTimeout(500);
  r = await ev((id) => ({ out: CX.ro(id).outAt, date: CX.S.payments[0].date }), id);
  expect(!!r.out && r.date === "2026-10-10", "remise des clés après paiement, date de valeur conservée : " + JSON.stringify(r));
  await shot("08-remise-des-cles");
});

await step("Message client : brouillon sans trace, déclaration manuelle tracée", async () => {
  const id = await ev(() => { const r = CX.S.ros.find((x) => x.stage === CX.ST.pret && !x.notified); return r ? r.id : null; });
  expect(id, "un dossier prêt non prévenu");
  await ev((id) => BO.notifyReady(id), id); await page.waitForTimeout(400);
  await ev(() => document.querySelector("[data-draft]").click()); await page.waitForTimeout(300);
  expect((await ev((id) => CX.ro(id).notified, id)) === false, "brouillon : client toujours non prévenu");
  await ev((id) => BO.notifyReady(id), id); await page.waitForTimeout(400);
  await ev(() => { document.querySelector('[name="to"]').value = ""; document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(200);
  expect(!!(await page.$(".mdl-bg")), "destinataire vide refusé");
  await ev(() => { document.querySelector('[name="to"]').value = "+33 6 12 34 56 78"; document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(400);
  const c = await ev((id) => { const r = CX.ro(id); const m = CX.cust(r.customerId).comms[0]; return { notified: r.notified, status: m.status, to: m.to }; }, id);
  expect(c.notified && c.status === "manuel" && /33 6/.test(c.to), "déclaration manuelle tracée : " + JSON.stringify(c));
});

await step("Photos : enregistrées sur le serveur, hors de l’état partagé", async () => {
  await ev(() => { APP.setMode("bo"); APP.open("ros", { id: "R1", tab: "photos" }); }); await page.waitForTimeout(600);
  const inputs = await page.$$("[data-ph-file]");
  await inputs[0].setInputFiles("public/demo/carte-grise-fictive-photo.png"); await page.waitForTimeout(2500);
  const r = await ev(() => { const p = CX.ro("R1").photos.filter((x) => x.url || x.src); return { n: p.length, url: p[0] && p[0].url, src: !!(p[0] && p[0].src), size: JSON.stringify(CX.S).length }; });
  expect(r.n >= 1 && /^\/api\/v3\/photos\/[0-9a-f]{32}$/.test(r.url || "") && !r.src, "photo stockée par le serveur : " + JSON.stringify(r));
  const img = await page.evaluate(async (u) => { const x = await fetch(u); return [x.status, x.headers.get("content-type")]; }, r.url);
  expect(img[0] === 200 && /image\/jpeg/.test(img[1]), "photo servie : " + img.join(" "));
});

await step("Tablette : barre de lieux et recherche accessibles, rail de navigation, mode gants", async () => {
  await page.setViewportSize({ width: 820, height: 1100 });
  await ev(() => APP.setMode("map")); await page.waitForTimeout(600);
  const m = await ev(() => ({ ctl: getComputedStyle(document.querySelector("#view-map .ctl")).display, places: [...document.querySelectorAll(".ctl [data-place]")].filter((b) => b.offsetParent !== null).length, search: getComputedStyle(document.querySelector("header .search")).display, h: document.querySelector("#tourBtn").getBoundingClientRect().height }));
  expect(m.ctl !== "none" && m.places >= 7 && m.search !== "none" && m.h >= 44, "atelier live tablette : " + JSON.stringify(m));
  await ev(() => { APP.setMode("bo"); APP.open("dashboard"); }); await page.waitForTimeout(500);
  const nav = await ev(() => ({ w: document.querySelector(".bo-nav").getBoundingClientRect().width, labels: [...document.querySelectorAll(".bo-nav a span")].filter((x) => x.offsetParent !== null).length, items: document.querySelectorAll(".bo-nav a").length }));
  expect(nav.w < 100 && nav.labels === 0 && nav.items > 5, "rail de navigation : " + JSON.stringify(nav));
  await shot("09-tablette");
  await ev(() => APP.setGloves(true)); await page.waitForTimeout(300);
  const g = await ev(() => ({ on: document.body.classList.contains("gants"), btn: Math.round(document.querySelector("#bo-content .btn").getBoundingClientRect().height), saved: localStorage.getItem("motek-gants") }));
  expect(g.on && g.btn >= 48 && g.saved === "1", "mode gants : " + JSON.stringify(g));
  await shot("10-gants");
  await ev(() => APP.setGloves(false));
  await page.setViewportSize({ width: 1500, height: 1000 });
});

await step("Modales : focus initial, piège Tab et retour du focus", async () => {
  await ev(() => { APP.open("crm"); }); await page.waitForTimeout(500);
  await ev(() => { const b = document.querySelector('#bo-content [data-new], #bo-content .btn.pri'); b.id = "opener-test"; b.focus(); b.click(); }); await page.waitForTimeout(300);
  const f1 = await ev(() => ({ inDialog: !!document.activeElement.closest(".mdl"), tag: document.activeElement.tagName, labelled: !!document.querySelector(".mdl[aria-labelledby]") }));
  expect(f1.inDialog && f1.labelled, "focus initial dans la boîte : " + JSON.stringify(f1));
  for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
  expect(await ev(() => !!document.activeElement.closest(".mdl")), "le focus reste dans la boîte après 40 Tab");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  expect((await ev(() => document.activeElement && document.activeElement.id)) === "opener-test", "focus rendu au bouton d’origine");
});

await step("Tableau de bord gérant : journée du garage, assistant intégré, heure réelle", async () => {
  await ev(() => { APP.setMode("bo"); APP.open("dashboard"); }); await page.waitForTimeout(600);
  const k = await ev(() => [...document.querySelectorAll(".kpis.today .kpi .lb")].map((x) => x.textContent));
  for (const l of ["Rendez-vous du jour", "Interventions en cours", "Postes libres", "Livrés aujourd’hui", "Devis en attente", "Paiements à confirmer"]) expect(k.includes(l), "indicateur manquant : " + l);
  expect(!!(await page.$(".kpis.manager")) && !!(await page.$(".flow2 .phase")) && !!(await page.$("[data-voice] [data-vq]")), "chiffres gérant, flux par phase et assistant intégré");
  await page.fill("[data-voice] [data-vq]", "Où est la Golf MB-118-CC ?"); await ev(() => document.querySelector("[data-voice] [data-vgo]").click()); await page.waitForTimeout(400);
  expect(/OR-24817/.test(await ev(() => document.querySelector("[data-vout]").textContent)), "réponse de l’assistant sur le tableau de bord");
  const clock = await ev(() => ({ app: CX.util.hm(CX.util.nowMin()), real: new Date().getHours() * 60 + new Date().getMinutes() }));
  const [hh, mm] = clock.app.split(":").map(Number);
  expect(Math.abs(hh * 60 + mm - clock.real) <= 2, "heure réelle : " + JSON.stringify(clock));
  await top(); await shot("11-tableau-de-bord");
});

await step("Poste technicien : tâches, pièce manquante reçue au magasin, envoi au contrôle qualité", async () => {
  await ev(() => APP.open("tech")); await page.waitForTimeout(500);
  await ev(() => document.querySelector('[data-tech="E3"]').click()); await page.waitForTimeout(500);
  const first = await ev(() => { const b = document.querySelector("[data-part]"); return b ? b.dataset.part : null; });
  expect(first, "un dossier affiché pour le technicien");
  await ev(() => document.querySelector("[data-part]").click()); await page.waitForTimeout(300);
  await ev(() => { document.querySelector("[data-pl]").value = "disques et plaquettes AV"; document.querySelector("[data-pq]").value = "2"; document.querySelector("[data-ok]").click(); }); await page.waitForTimeout(500);
  const q = await ev((id) => ({ n: CX.S.partRequests.filter((x) => x.roId === id && x.status === "À servir").length, task: CX.ro(id).tasks.some((t) => /plaquettes AV/.test(t.l)), badge: document.querySelector('.bo-nav [data-mod="parts"] em') && document.querySelector('.bo-nav [data-mod="parts"] em').textContent }), first);
  expect(q.n === 1 && q.task, "demande de pièce créée et tâche ajoutée : " + JSON.stringify(q));
  await top(); await shot("12-poste-technicien");
  await ev(() => APP.open("parts")); await page.waitForTimeout(500);
  expect(!!(await page.$(".counter [data-serve]")), "la demande apparaît au comptoir magasin");
  await ev(() => document.querySelector(".counter [data-serve]").click()); await page.waitForTimeout(400);
  const served = await ev((id) => ({ s: CX.S.partRequests[0].status, task: CX.ro(id).tasks.find((t) => /plaquettes AV/.test(t.l)) }), first);
  expect(served.s === "Servi" && served.task.p === 1, "pièce servie et tâche cochée : " + JSON.stringify(served));
  // dictée de tâches en saisie texte (plusieurs tâches)
  await ev(() => APP.open("tech")); await page.waitForTimeout(400);
  await ev(() => document.querySelector("[data-addt]").click()); await page.waitForTimeout(300);
  const before = await ev((id) => CX.ro(id).tasks.length, first);
  await page.fill("[data-tt]", "équilibrage et remontage des pneus, remplacement de la lunette arrière, contrôle des niveaux");
  await ev(() => document.querySelector("[data-ok]").click()); await page.waitForTimeout(400);
  expect((await ev((id) => CX.ro(id).tasks.length, first)) === before + 3, "trois tâches ajoutées depuis une phrase");
});

await step("Prise en main : visite ouverte depuis l’en-tête, huit étapes", async () => {
  await ev(() => document.querySelector("#helpbtn").click()); await page.waitForTimeout(300);
  expect(/Bienvenue/.test(await ev(() => document.querySelector("[data-tour] h2").textContent)), "première étape");
  for (let i = 0; i < 7; i++) { await ev(() => document.querySelector("[data-next]").click()); await page.waitForTimeout(80); }
  await shot("13-prise-en-main");
  expect(/C’est parti/.test(await ev(() => document.querySelector("[data-next]").textContent)), "dernière étape");
  await ev(() => document.querySelector("[data-next]").click()); await page.waitForTimeout(200);
  expect(!(await page.$(".mdl-bg")), "visite fermée");
});

await step("Persistance serveur : l’état est partagé entre deux pages", async () => {
  const p2 = await browser.newPage({ httpCredentials: process.env.MOTEK_DEMO_PASSWORD ? { username: process.env.MOTEK_DEMO_USER || "motek", password: process.env.MOTEK_DEMO_PASSWORD } : undefined });
  await p2.goto(base + "/motek/"); await p2.waitForTimeout(3000);
  const make = await p2.evaluate(() => CX.S.showroom[0].make);
  expect(make === "Kia", "page B voit le véhicule ajouté : " + make);
  await p2.close();
});

await browser.close();
const failed = results.filter((r) => !r[0]);
if (errors.length) console.log("Erreurs de page : " + errors.slice(0, 3).join(" | "));
console.log(`\n${results.length - failed.length}/${results.length} étapes réussies · captures dans ${out}/`);
if (failed.length || errors.length) process.exit(1);
