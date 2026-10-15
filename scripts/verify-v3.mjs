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
await page.waitForTimeout(3000);
await ev(() => { localStorage.clear(); });
await ev(() => CX.reset());
await page.waitForTimeout(5000);

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
