import { mkdirSync, existsSync } from "node:fs";
import { writeFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);
import type { IncomingMessage, ServerResponse } from "node:http";
import { Store } from "./store.ts";
import { proposeVoice } from "../src/voice-domain.ts";
export function autohubAPI(databaseFile = ".data/autohub.sqlite") {
  let store: Store | undefined;
  const clients = new Set<ServerResponse>();
  const start = (server: any) => {
    mkdirSync(".data", { recursive: true });
    store ||= new Store(databaseFile);
    const broadcast = () => {
      const state = store!.read();
      for (const client of clients)
        client.write("data: " + JSON.stringify(state) + "\n\n");
    };
    server.middlewares.use(
      async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const path = req.url?.split("?")[0];
        if (!path?.startsWith("/api/")) return next();
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
            return json(200, store!.read());
          if (path === "/api/events" && req.method === "GET") {
            res.writeHead(200, {
              "Content-Type": "text/event-stream",
              Connection: "keep-alive",
            });
            res.write("data: " + JSON.stringify(store!.read()) + "\n\n");
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
          if (path === "/api/voice/propose")
            return json(
              200,
              proposeVoice(
                store!.read().db,
                body.vehicle,
                body.text,
                body.mode,
              ),
            );
          if (path === "/api/change") {
            const result = store!.change(body);
            json(200, result);
            broadcast();
            return;
          }
          return json(404, { error: "Route inconnue." });
        } catch (e) {
          json((e as any).status || 400, { error: (e as Error).message });
        }
      },
    );
    server.httpServer?.once("close", () => {
      for (const c of clients) c.end();
      clients.clear();
      store?.close();
      store = undefined;
    });
  };
  return {
    name: "autohub-local-api",
    configureServer: start,
    configurePreviewServer: start,
  };
}
