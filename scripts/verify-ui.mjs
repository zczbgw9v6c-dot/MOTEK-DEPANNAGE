// Parcours client complet dans un vrai navigateur (Chromium via Playwright).
// Prérequis : serveur lancé sur une base isolée, par exemple
//   AUTOHUB_DB=.data/verify-ui.sqlite npm run dev
// puis : node scripts/verify-ui.mjs [http://127.0.0.1:5173]
// Le script crée un dossier fictif ZZ-UI-xx et le mène jusqu’à la remise des clés.
import { chromium } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:5173";
const plate = "ZZ-UI-" + String(Date.now() % 1000).padStart(3, "0");
const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failures = [];
page.on("pageerror", (e) => failures.push("Erreur page : " + e.message));
const toast = () =>
  page.evaluate(() => document.querySelector(".toast")?.textContent || "");
const step = async (label, fn) => {
  try {
    await fn();
    console.log("✓", label);
  } catch (e) {
    failures.push(label + " → " + e.message.split("\n")[0]);
    console.log("✗", label, e.message.split("\n")[0]);
  }
};
const primary = () => page.locator(".core-toolbar button.primary").first();
const openDossier = async () => {
  await page.locator("aside.sidebar nav").getByText("Accueil", { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByPlaceholder("Plaque, client, téléphone…").fill(plate);
  await page.waitForTimeout(300);
  await page.locator(".core-filters button").click();
  await page.locator(".core-car").first().click();
  await page.waitForTimeout(400);
};
const expectToastNot = async (pattern) => {
  const t = await toast();
  if (pattern.test(t)) throw Error("toast : " + t);
};
await page.goto(base);
await page.waitForTimeout(3000);
await step("Réception d’un nouveau dossier", async () => {
  await page.getByRole("button", { name: /Nouvelle réception/ }).click();
  const f = page.locator("form.modal");
  await f.locator("input[name=client]").fill("Client Vérification UI");
  await f.locator("input[name=phone]").fill("06 00 00 00 99");
  await f.locator("input[name=plate]").fill(plate);
  await f.locator("input[name=make]").fill("Renault");
  await f.locator("input[name=model]").fill("Clio vérification");
  await f.locator("textarea[name=symptoms]").fill("Bruit de freinage · test automatisé");
  await f.locator("input[name=clientWaiting]").check();
  await f.getByRole("button", { name: "Créer la réception" }).click();
  await page.waitForTimeout(1200);
  await expectToastNot(/existe déjà|complet|Vérifiez/);
});
await step("Affectation d’un technicien disponible", async () => {
  await openDossier();
  if ((await primary().innerText()) !== "Choisir le technicien")
    throw Error("étape attendue : Choisir le technicien, vu " + (await primary().innerText()));
  await primary().click();
  const options = await page.locator("select[name=tech] option").allInnerTexts();
  const free = options.find((o) => o !== "Non affecté" && !o.includes("en intervention"));
  await page.locator("select[name=tech]").selectOption({ label: free });
  await page.getByRole("button", { name: "Confirmer l’affectation" }).click();
  await page.waitForTimeout(900);
  await expectToastNot(/intervention active|incompatible|invalide/);
});
await step("Devis composé, soumis puis accepté", async () => {
  await openDossier();
  await primary().click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Créer le devis/ }).click();
  await page.getByRole("button", { name: "Ajouter une ligne" }).click();
  await page.getByLabel("Libellé ligne 1").fill("Plaquettes avant");
  await page.getByLabel("Prix ligne 1").fill("120");
  await page.getByRole("button", { name: "Soumettre à validation" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Enregistrer l’accord client" }).click();
  await page.waitForTimeout(900);
});
await step("Intervention : démarrage, travail coché, checklist, fin", async () => {
  await openDossier();
  await primary().click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /Démarrer/ }).click();
  await page.waitForTimeout(900);
  await expectToastNot(/déjà une intervention|Affectez|devis/);
  const task = page.locator(".core-task input").first();
  if (!(await task.isChecked())) await task.click();
  await page.waitForTimeout(700);
  for (const l of [
    "Les opérations prévues sont réalisées",
    "Les contrôles de sécurité ont été effectués",
    "Les tests après réparation sont consignés",
  ]) {
    await page.getByLabel(l).click();
    await page.waitForTimeout(700);
    if (!(await page.getByLabel(l).isChecked())) throw Error("case non enregistrée : " + l);
  }
  await page.getByRole("button", { name: /Terminer les travaux/ }).click();
  await page.waitForTimeout(900);
  await expectToastNot(/Cochez|Complétez/);
});
await step("Contrôle final, décompte, paiement partiel puis solde", async () => {
  await openDossier();
  await primary().click(); // Valider le contrôle final
  await page.waitForTimeout(900);
  await primary().click(); // ouvre Devis et paiement
  await page.getByRole("button", { name: "Établir le décompte" }).click();
  await page.waitForTimeout(900);
  for (const [amount, ref] of [["50", "UI-1"], ["94", "UI-2"]]) {
    await page.locator("input[name=amount]").fill(amount);
    await page.locator("input[name=reference]").fill(ref);
    await page.getByRole("button", { name: "Confirmer le règlement reçu" }).click();
    await page.waitForTimeout(900);
    await expectToastNot(/Vérifiez|existe déjà/);
  }
});
await step("Contact, horaires, créneau hors ouverture refusé, créneau valide", async () => {
  await openDossier();
  await primary().click();
  await page.locator("input[name=note]").fill("Client prévenu par téléphone");
  await page.getByRole("button", { name: "Consigner le contact" }).click();
  await page.waitForTimeout(800);
  await page.locator("details", { hasText: "Horaires du garage" }).locator("summary").last().click();
  await page.getByRole("button", { name: "Confirmer les horaires du garage" }).click();
  await page.waitForTimeout(800);
  const pad = (x) => String(x).padStart(2, "0");
  const fmt = (d, h) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${h}`;
  const d = new Date(Date.now() + 86400000);
  while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1);
  const slot = page.locator("input[name=at][required]");
  await slot.fill(fmt(d, "23:30"));
  await page.getByRole("button", { name: "Enregistrer le créneau" }).click();
  await page.waitForTimeout(800);
  if (!/hors ouverture/.test(await toast())) throw Error("créneau nocturne accepté");
  await slot.fill(fmt(d, "10:00"));
  await page.getByRole("button", { name: "Enregistrer le créneau" }).click();
  await page.waitForTimeout(800);
  await expectToastNot(/hors ouverture|futur/);
});
await step("Remise des clés et dossier clôturé après rechargement", async () => {
  await openDossier();
  await primary().click();
  await page.locator("input[name=keys]").click();
  await page.getByRole("button", { name: "Confirmer la livraison" }).click();
  await page.waitForTimeout(900);
  await page.reload();
  await page.waitForTimeout(2500);
  await openDossier();
  if ((await primary().innerText()) !== "Dossier clôturé") throw Error("dossier non clôturé après rechargement");
});
await browser.close();
if (failures.length) {
  console.error("\nÉchecs :\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("\nParcours complet vérifié dans le navigateur pour " + plate + ".");
