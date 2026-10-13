import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const bytes = await readFile("public/models/spectral-gt.glb");
const license = await readFile("public/models/spectral-license.txt", "utf8");
if (!license.includes("CC0")) throw Error("Licence manquante.");
if (
  bytes.readUInt32LE(0) !== 0x46546c67 ||
  bytes.readUInt32LE(8) !== bytes.length
)
  throw Error("GLB invalide.");
const g = JSON.parse(
  bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
);
if (g.buffers.some((b) => b.uri) || g.images?.some((i) => i.uri))
  throw Error("Ressource externe non autorisée.");
const triangles = Math.round(
  g.meshes
    .flatMap((m) => m.primitives)
    .reduce(
      (n, p) => n + g.accessors[p.indices ?? p.attributes.POSITION].count / 3,
      0,
    ),
);
const manifest = JSON.parse(
  await readFile("public/models/manifest.json", "utf8"),
);
const entry = {
  id: "spectral-gt",
  kind: "vehicle",
  name: "Spectral GT RS · coupé détaillé non marqué",
  make: "Création originale, sans marque attestée",
  model: "Spectral GT RS",
  category: "sedan",
  source: "https://github.com/JaronKBragg7337/spectral-gt-rs",
  creator: "JaronKBragg7337",
  license: "CC0-1.0",
  licenseStatus: "verified",
  verifiedAt: "2026-10-13",
  licenseProof: "/models/spectral-license.txt",
  commercial: true,
  redistribution: true,
  noAI: false,
  attribution:
    "JaronKBragg7337 — Spectral GT RS (CC0). Ne pas impliquer un soutien de l’auteur.",
  format: "GLB",
  triangles,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  status: "imported",
  validation: "Header, length, embedded resources, SHA-256. Visual QA pending.",
  url: "/models/spectral-gt.glb",
  preview: "/models/previews/spectral-gt.png",
  generic: true,
  enabled: true,
  frontAxis: "positiveX",
};
manifest.entries = [
  ...manifest.entries.filter((a) => a.id !== entry.id),
  entry,
];
manifest.stats = {
  ...manifest.stats,
  referenced: manifest.entries.length,
  licensesVerified: manifest.entries.filter(
    (a) => a.licenseStatus === "verified",
  ).length,
  downloaded: manifest.entries.filter((a) => a.status === "imported").length,
  genericVehiclesImported: manifest.entries.filter(
    (a) => a.status === "imported" && a.kind === "vehicle",
  ).length,
  knownBrandModelsImported: 0,
};
await writeFile(
  "public/models/manifest.json",
  JSON.stringify(manifest, null, 2),
);
console.log({
  imported: entry.id,
  triangles,
  bytes: bytes.length,
  knownBrandModelsImported: 0,
});
