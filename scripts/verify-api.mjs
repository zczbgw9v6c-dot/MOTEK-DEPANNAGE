import { createServer } from "node:http";
import { mkdtemp, rm, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { autohubAPI } from "../server/plugin.ts";
const folder = await mkdtemp(join(tmpdir(), "autohub-api-"));
const handlers = [];
const server = createServer((req, res) =>
  handlers[0](req, res, () => {
    res.statusCode = 404;
    res.end();
  }),
);
const plugin = autohubAPI(join(folder, "state.sqlite"));
plugin.configureServer({
  middlewares: { use: (fn) => handlers.push(fn) },
  httpServer: server,
});
await access(join(folder, "state.sqlite"));
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const root = "http://127.0.0.1:" + server.address().port;
const result = [];
const ctrl = new AbortController();
try {
  let state = await (await fetch(root + "/api/state")).json();
  assert.equal(state.db.vehicles.length, 60);
  assert.equal(state.db.parts.length, 50);
  result.push("HTTP state: coherent 60 dossiers / 50 parts");
  const stream = await fetch(root + "/api/events", { signal: ctrl.signal });
  const reader = stream.body.getReader();
  let buffer = "";
  const readEvent = async () => {
    for (;;) {
      if (buffer.includes("\n\n")) {
        const index = buffer.indexOf("\n\n"),
          message = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (message.startsWith("data: ")) return JSON.parse(message.slice(6));
      }
      const chunk = await reader.read();
      if (chunk.done) throw Error("Flux interrompu");
      buffer += new TextDecoder().decode(chunk.value);
    }
  };
  const initial = await readEvent();
  assert.equal(initial.revision, 0);
  const change = {
    requestId: crypto.randomUUID(),
    revision: 0,
    type: "start",
    vehicle: "v1",
    payload: {},
  };
  const response = await fetch(root + "/api/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  });
  assert.equal(response.status, 200);
  state = await response.json();
  assert.ok(state.db.workshop.v1.runningSince);
  const event = await readEvent();
  assert.equal(event.revision, 1);
  result.push("SSE: second client receives the persisted action");
  const duplicate = await (
    await fetch(root + "/api/change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    })
  ).json();
  assert.equal(duplicate.revision, 1);
  const stale = await fetch(root + "/api/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...change,
      requestId: crypto.randomUUID(),
      type: "pause",
    }),
  });
  assert.equal(stale.status, 409);
  result.push("Duplicate request and concurrent edit guarded");
  const proposal = await (
    await fetch(root + "/api/voice/propose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: "v1",
        text: "Il me manque un étrier avant droit pour la BMW. Mets l’intervention en pause et préviens le responsable.",
        mode: "command",
      }),
    })
  ).json();
  assert.deepEqual(
    proposal.actions.map((a) => a.type),
    ["pause", "piece", "alert"],
  );
  result.push("Structured voice proposal via HTTP");
  const caps = await (await fetch(root + "/api/speech/capabilities")).json();
  assert.equal(caps.local, true);
  if (caps.available) {
    const audio = await readFile(".data/test-command.aiff");
    const response = await fetch(root + "/api/speech/transcribe", {
      method: "POST",
      headers: { "Content-Type": "audio/aiff" },
      body: audio,
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(/étrier/i.test(data.text));
    assert.equal(data.local, true);
    result.push(
      "Synthetic French audio transcribed through local HTTP pipeline",
    );
  }
  await writeFile(
    "research/verification-api-v2.json",
    JSON.stringify(
      { at: new Date().toISOString(), isolated: true, checks: result },
      null,
      2,
    ),
  );
  console.log(result.join("\n"));
} finally {
  ctrl.abort();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(folder, { recursive: true, force: true });
}
