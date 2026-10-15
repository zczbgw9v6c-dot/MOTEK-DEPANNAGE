import { test } from "node:test";
import assert from "node:assert/strict";
import { V3Store, validateState } from "../server/v3-store.ts";
import { loadCore } from "./v3-harness.ts";

const valid = () => JSON.parse(JSON.stringify(loadCore({ sleepless: true }).CX.S));

test("serveur : la révision est obligatoire et un document arbitraire est refusé", () => {
  const st = new V3Store(":memory:");
  const s1 = st.write(valid(), 0);
  assert.equal(s1.revision, 1);
  assert.throws(() => st.write({ garbage: true }, 1), /refusé/);
  assert.throws(() => st.write(valid(), undefined), /Révision manquante/);
  assert.throws(() => st.write(valid(), 0), /changé sur un autre écran/);
  assert.equal(st.read().revision, 1);
  st.close();
});

test("serveur : identifiants en double, photos externes et règlements incohérents sont refusés", () => {
  const a = valid(); a.customers.push({ ...a.customers[0] });
  assert.match(validateState(a) || "", /double/);
  const b = valid(); b.ros[0].photos = [{ id: "x", l: "l", k: "avant", src: 'x" onerror="alert(1)' }];
  assert.match(validateState(b) || "", /photo/);
  const c = valid(); c.ros[0].photos = [{ id: "x", l: "l", k: "avant", src: "data:image/jpeg;base64,/9j/4AAQ" }];
  assert.equal(validateState(c), null);
  const d = valid(); d.invoices[0].paid = d.invoices[0].amount + 5;
  assert.match(validateState(d) || "", /règlement/);
});

test("serveur : la réinitialisation conserve l'ancienne version et la restauration la remet en place", () => {
  const st = new V3Store(":memory:");
  const v = valid(); v.company.name = "Garage Test";
  st.write(v, 0);
  st.reset();
  assert.equal(st.read().state, null);
  assert.equal(st.history()[0].revision, 1);
  const back = st.restore(1);
  assert.equal((back.state as any).company.name, "Garage Test");
  st.close();
});
