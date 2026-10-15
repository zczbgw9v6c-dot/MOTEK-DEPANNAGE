import { mkdirSync, existsSync } from "node:fs";
import { writeFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);
import type { IncomingMessage, ServerResponse } from "node:http";
import { Store } from "./store.ts";
import { V3Store } from "./v3-store.ts";
import { proposeVoice } from "../src/voice-domain.ts";
type Handler = ((
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void>) & {
  close: () => void;
};
/** Gestionnaire HTTP de l’API (état, SSE, changements, voix) partagé entre Vite et le serveur de production. */
export function createApiHandler(
  databaseFile = process.env.AUTOHUB_DB || ".data/autohub.sqlite",
): Handler {
  mkdirSync(".data", { recursive: true });
  const store = new Store(databaseFile);
  const v3 = new V3Store(databaseFile);
  const clients = new Set<ServerResponse>();
  const v3clients = new Set<ServerResponse>();
  const v3broadcast = (snapshot: { revision: number }) => {
    // Seule la révision circule ; chaque écran recharge l’état s’il est en retard.
    for (const client of v3clients)
      client.write(
        "data: " + JSON.stringify({ revision: snapshot.revision }) + "\n\n",
      );
  };
  const broadcast = () => {
    const state = store.read();
    for (const client of clients)
      client.write("data: " + JSON.stringify(state) + "\n\n");
  };
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const path = req.url?.split("?")[0] || "";
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const json = (code: number, value: any) => {
      res.statusCode = code;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(value));
    };
    try {
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return json(403, { error: "Origine non autorisée." });
      if (path === "/api/speech/capabilities" && req.method === "GET")
        return json(200, {
          available:
            existsSync(".speech-venv/bin/python3") &&
            existsSync(".data/speech-model/model.bin"),
          local: true,
        });
      if (path === "/api/state" && req.method === "GET")
        return json(200, store.read());
      if (path === "/api/v3/state" && req.method === "GET")
        return json(200, { ...v3.read(), serverNow: Date.now() });
      if (path === "/api/v3/history" && req.method === "GET")
        return json(200, { versions: v3.history() });
      if (path === "/api/v3/events" && req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
        });
        res.write(
          "data: " + JSON.stringify({ revision: v3.read().revision }) + "\n\n",
        );
        v3clients.add(res);
        const heartbeat = setInterval(() => res.write(": ping\n\n"), 15000);
        res.on("close", () => {
          clearInterval(heartbeat);
          v3clients.delete(res);
        });
        return;
      }
      if (path === "/api/events" && req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
        });
        res.write("data: " + JSON.stringify(store.read()) + "\n\n");
        clients.add(res);
        const heartbeat = setInterval(() => res.write(": ping\n\n"), 15000);
        res.on("close", () => {
          clearInterval(heartbeat);
          clients.delete(res);
        });
        return;
      }
      if (req.method !== "POST")
        return json(405, { error: "Méthode non autorisée." });
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 24 * 1024 * 1024)
          return json(413, { error: "Requête trop volumineuse." });
        chunks.push(Buffer.from(chunk));
      }
      const bytesBuffer = Buffer.concat(chunks);
      if (path === "/api/speech/transcribe") {
        if (bytesBuffer.length > 8 * 1024 * 1024)
          return json(413, { error: "Audio trop volumineux." });
        if (
          !existsSync(".speech-venv/bin/python3") ||
          !existsSync(".data/speech-model/model.bin")
        )
          return json(503, {
            error:
              "Installez la reconnaissance locale avec npm run speech:setup.",
          });
        mkdirSync(".data/audio", { recursive: true, mode: 0o700 });
        const filename = ".data/audio/" + crypto.randomUUID() + ".audio";
        await writeFile(filename, bytesBuffer, { mode: 0o600 });
        try {
          const { stdout } = await execute(
            ".speech-venv/bin/python3",
            ["server/transcribe.py", filename],
            { timeout: 90000, maxBuffer: 1024 * 1024 },
          );
          return json(200, JSON.parse(stdout.trim()));
        } finally {
          await unlink(filename).catch(() => {});
        }
      }
      const body = JSON.parse(bytesBuffer.toString());
      if (path === "/api/v3/state") {
        const snapshot = v3.write(
          body.state,
          Number.isInteger(body.revision) ? body.revision : undefined,
        );
        json(200, {
          revision: snapshot.revision,
          updatedAt: snapshot.updatedAt,
          serverNow: Date.now(),
        });
        v3broadcast(snapshot);
        return;
      }
      if (path === "/api/v3/reset") {
        // Réservé à la démonstration : interdit en production sauf MOTEK_ALLOW_RESET=1.
        if (process.env.NODE_ENV === "production" && process.env.MOTEK_ALLOW_RESET !== "1")
          return json(403, { error: "Réinitialisation désactivée sur ce serveur (MOTEK_ALLOW_RESET)." });
        v3.reset();
        json(200, { revision: 0 });
        v3broadcast({ revision: 0 });
        return;
      }
      if (path === "/api/v3/restore") {
        if (!Number.isInteger(body.revision)) return json(400, { error: "Révision requise." });
        const snapshot = v3.restore(body.revision);
        json(200, { revision: snapshot.revision });
        v3broadcast(snapshot);
        return;
      }
      if (path === "/api/voice/propose")
        return json(
          200,
          proposeVoice(store.read().db, body.vehicle, body.text, body.mode),
        );
      if (path === "/api/change") {
        const result = store.change(body);
        json(200, result);
        broadcast();
        return;
      }
      return json(404, { error: "Route inconnue." });
    } catch (e) {
      json((e as any).status || 400, { error: (e as Error).message });
    }
  };
  return Object.assign(handler, {
    close() {
      for (const c of clients) c.end();
      for (const c of v3clients) c.end();
      clients.clear();
      v3clients.clear();
      store.close();
      v3.close();
    },
  });
}
export function autohubAPI(databaseFile?: string) {
  let api: Handler | undefined;
  const start = (server: any) => {
    api ||= createApiHandler(databaseFile);
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.split("?")[0]?.startsWith("/api/")) return next();
        return api!(req, res);
      },
    );
    server.httpServer?.once("close", () => {
      api?.close();
      api = undefined;
    });
  };
  return {
    name: "autohub-local-api",
    configureServer: start,
    configurePreviewServer: start,
  };
}
