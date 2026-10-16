import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const phase = process.argv[2] || "after",
  port = Number(
    process.env.MOTEK_CAPTURE_PORT || (phase === "before" ? 5174 : 5175),
  );
const out = `docs/revue-1/${phase}`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [name, width, height] of [
  ["desktop", 1440, 1000],
  ["ipad-landscape", 1180, 820],
  ["ipad-portrait", 820, 1180],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  await page.goto(`http://127.0.0.1:${port}/motek/`);
  await page.waitForFunction(() => window.PARC3D?.counts().cars > 0);
  if (phase === "before" && name === "desktop") {
    await Promise.all([
      page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
      page.evaluate(() => CX.reset()).catch(() => {}),
    ]);
    await page.waitForFunction(() => window.PARC3D?.counts().cars > 0);
  }
  await page.evaluate(() => APP.setMode("map"));
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/${name}-parc.png` });
  if (name === "ipad-portrait") {
    await page.evaluate(() => PARC3D.setPlace("N1"));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${out}/${name}-niveau-1.png` });
  }
  for (const mod of phase === "before"
    ? ["dashboard", "missions"]
    : ["dashboard", "planning-dep", "chauffeur", "mandats"]) {
    await page.evaluate(
      (mod) => APP.open(mod, mod === "mandats" ? { tab: "compagnies" } : {}),
      mod,
    );
    if (mod === "chauffeur") {
      const id = await page.evaluate(
        () => CX.S.missions.find((m) => m.status === "En route")?.driverId,
      );
      if (id) await page.locator("[data-driver]").selectOption(id);
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${name}-${mod}.png` });
  }
  await page.close();
}

if (phase === "after") {
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await phone.goto(`http://127.0.0.1:${port}/motek/`);
  await phone.waitForFunction(() => window.DEP?.dayMissions);
  await phone.evaluate(() => APP.open("chauffeur"));
  const id = await phone.evaluate(
    () => CX.S.missions.find((m) => m.status === "En route")?.driverId,
  );
  if (id) await phone.locator("[data-driver]").selectOption(id);
  await phone.waitForTimeout(1000);
  await phone.screenshot({ path: `${out}/phone-chauffeur.png` });
  await phone.close();
}

await browser.close();
