// Serveur de production : fichiers construits (dist/) + API SQLite + SSE, dans un seul
// processus Node. Utilisé pour l’hébergement ; en développement, Vite joue ce rôle.
//
//   PORT                port d’écoute (défaut 8080)
//   AUTOHUB_DB          fichier SQLite (défaut .data/autohub.sqlite)
//   MOTEK_DEMO_PASSWORD si défini, accès protégé par mot de passe (HTTP Basic)
//   MOTEK_DEMO_USER     identifiant associé (défaut "motek")
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createApiHandler } from "./plugin.ts";

const port = Number(process.env.PORT || 8080);
const distDir = resolve("dist");
const password = process.env.MOTEK_DEMO_PASSWORD || "";
const user = process.env.MOTEK_DEMO_USER || "motek";
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};
if (!existsSync(join(distDir, "index.html"))) {
  console.error(
    "dist/index.html introuvable : lancez `npm run build` d’abord.",
  );
  process.exit(1);
}
process.env.NODE_ENV = process.env.NODE_ENV || "production";
const api = createApiHandler();
// Une erreur inattendue ne doit pas arrêter le serveur de tous les postes.
process.on("unhandledRejection", (e) => console.error("Erreur non gérée :", e));
process.on("uncaughtException", (e) => console.error("Exception non gérée :", e));
const server = createServer(async (req, res) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "same-origin");
  if (password) {
    const header = req.headers.authorization || "";
    const expected =
      "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
    if (header !== expected) {
      res.writeHead(401, {
        "WWW-Authenticate":
          'Basic realm="MOTEK démonstration", charset="UTF-8"',
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(
        "Accès réservé : identifiant et mot de passe de démonstration requis.",
      );
      return;
    }
  }
  const path = (req.url || "/").split("?")[0];
  if (path.startsWith("/api/")) return api(req, res);
  // L’application MOTEK (motek/) est l’interface par défaut ; l’ancienne
  // interface reste disponible sur /index.html.
  if (path === "/") {
    res.writeHead(302, { Location: "/motek/" });
    res.end();
    return;
  }
  // Fichiers statiques, avec repli sur index.html pour l’application.
  let decoded = "";
  try {
    decoded = decodeURIComponent(path);
  } catch (e) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Adresse mal formée.");
    return;
  }
  const safe = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let file = join(distDir, safe);
  // Un dossier (ex. /motek/) sert son propre index.html ; sinon repli sur l’application.
  if (file.startsWith(distDir) && existsSync(file) && statSync(file).isDirectory())
    file = join(file, "index.html");
  if (
    !file.startsWith(distDir) ||
    !existsSync(file) ||
    statSync(file).isDirectory()
  )
    file = join(distDir, "index.html");
  const type = types[extname(file)] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": file.endsWith("index.html")
      ? "no-store"
      : safe.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600",
  });
  createReadStream(file).on("error", () => { if (!res.headersSent) res.writeHead(500); res.end(); }).pipe(res);
});
server.listen(port, "0.0.0.0", () => {
  console.log(
    `MOTEK en écoute sur le port ${port} · base ${process.env.AUTOHUB_DB || ".data/autohub.sqlite"} · ${password ? "accès protégé par mot de passe" : "ATTENTION : aucun mot de passe défini"}`,
  );
});
const shutdown = () => {
  api.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
