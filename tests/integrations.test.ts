import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../src/domain.ts";
import { matchSighting, noCamera } from "../src/integrations/camera-adapter.ts";
import {
  answerFrequentQuestion,
  intentToRequest,
  noTelephony,
} from "../src/integrations/telephony-adapter.ts";

test("no provider is live by default and adapters are inert", async () => {
  assert.equal(noTelephony.live, false);
  assert.equal(noCamera.live, false);
  await noTelephony.start(() => assert.fail("no event expected"));
  await noCamera.start(() => assert.fail("no sighting expected"));
});

test("plate sightings: sure match, uncertain reading, near plate, unknown and duplicate", () => {
  const db = seed();
  const v = db.vehicles.find((v) => v.status !== "Livré")!;
  const at = new Date().toISOString();
  const sure = matchSighting(db, {
    id: "s1",
    at,
    plate: v.plate.toLowerCase(),
    confidence: 0.95,
    camera: "entrée",
  });
  assert.equal(sure.status, "confirmé");
  assert.equal(sure.vehicle, v.id);
  const unsure = matchSighting(db, {
    id: "s2",
    at,
    plate: v.plate,
    confidence: 0.4,
    camera: "entrée",
  });
  assert.equal(unsure.status, "à valider");
  assert.equal(unsure.vehicle, undefined);
  assert.deepEqual(unsure.candidates, [v.id]);
  const near = matchSighting(db, {
    id: "s3",
    at,
    plate: v.plate.replace(/[0-9]/, "0").replace(/[0-9]$/, "7"),
    confidence: 0.99,
    camera: "entrée",
  });
  assert.notEqual(near.status, "confirmé");
  const unknown = matchSighting(db, {
    id: "s4",
    at,
    plate: "QQ-000-QQ",
    confidence: 0.99,
    camera: "entrée",
  });
  assert.equal(unknown.status, "inconnu");
  const again = matchSighting(
    db,
    { id: "s5", at, plate: v.plate, confidence: 0.99, camera: "entrée" },
    [sure],
  );
  assert.equal(again.status, "doublon");
});

test("telephony: frequent questions never invent hours or readiness, intents map to existing dossiers", () => {
  const db = seed();
  assert.match(
    answerFrequentQuestion(db, "Vous êtes ouverts à quelle heure ?")!,
    /pas encore renseignés/,
  );
  db.openingHours = {
    opens: "08:00",
    closes: "18:00",
    weekdays: [1, 2, 3, 4, 5],
    timeZone: "Europe/Lisbon",
  };
  assert.match(answerFrequentQuestion(db, "horaires ?")!, /08:00 à 18:00/);
  assert.match(
    answerFrequentQuestion(db, "ma voiture est-elle prête ?")!,
    /ne peux pas confirmer/,
  );
  assert.equal(answerFrequentQuestion(db, "bonjour"), null);
  const v = db.vehicles[0];
  const request = intentToRequest(db, {
    callId: "c1",
    caller: { phone: v.phone },
    vehicle: { plate: v.plate },
    request: "bruit au freinage",
    needsHuman: false,
    confidence: "haute",
  });
  assert.equal(request.existingVehicle, v.id);
  assert.equal(request.requiresHumanConfirmation, false);
  const vague = intentToRequest(db, {
    callId: "c2",
    caller: { phone: "00 00" },
    request: "je ne sais pas",
    needsHuman: false,
    confidence: "basse",
  });
  assert.equal(vague.existingVehicle, undefined);
  assert.equal(vague.requiresHumanConfirmation, true);
});
