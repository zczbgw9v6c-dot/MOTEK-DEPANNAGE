import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/domain.ts";
import { zoneSummary } from "../src/zone-summary.ts";
import { zoneVehicles } from "../src/guided-domain.ts";
test("floating zone counts follow the same records as their panels", () => {
  const db = seed();
  assert.equal(
    zoneSummary(db, "atelier").count,
    zoneVehicles(db, "atelier").length,
  );
  assert.equal(zoneSummary(db, "livraison").count, 4);
  const ready = db.vehicles.find((v) => v.status === "Prêt à livrer")!;
  ready.status = "Livré";
  assert.equal(zoneSummary(db, "livraison").count, 3);
  assert.equal(zoneSummary(db, "stock").count, db.parts.length);
});
test("bodywork never displays all workshop cars or invents a progress percentage", () => {
  const db = seed();
  const v = db.vehicles.find(
    (v) => v.present !== false && v.status !== "Livré",
  )!;
  v.department = "Carrosserie";
  const expected = db.vehicles.filter(
    (v) =>
      v.present !== false &&
      v.status !== "Livré" &&
      ["Carrosserie", "Peinture"].includes(v.department || ""),
  );
  assert.equal(zoneSummary(db, "carrosserie").count, expected.length);
  assert.deepEqual(zoneVehicles(db, "carrosserie"), expected);
  delete db.demoVersion;
  assert.equal(zoneSummary(db, "attente").count, 0);
  assert.equal(zoneSummary(db, "showroom").count, 0);
});

test("zone labels do not overlap or escape the canvas when rooms project together", async () => {
  const { layoutZoneMarkers } = await import("../src/marker-layout.ts");
  const input = Array.from({ length: 9 }, (_, i) => ({
    id: String(i),
    x: 400,
    y: 300,
    visible: true,
  }));
  const output = layoutZoneMarkers(input, 1000, 650).filter((p) => p.visible);
  assert.equal(output.length, 9);
  for (let i = 0; i < output.length; i++) {
    const p = output[i];
    assert.ok(p.x >= 76 && p.x <= 924 && p.y >= 123 && p.y <= 638);
    for (const q of output.slice(i + 1))
      assert.ok(Math.abs(p.x - q.x) >= 158 || Math.abs(p.y - q.y) >= 62);
  }
});
