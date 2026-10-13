import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = process.cwd();
if (path.basename(root) !== "CRM 3D GARAGE")
  throw Error("Importer uniquement depuis la racine AutoHub.");
const original = path.join(root, "research/catalogue/kenney-original");
const license = await readFile(path.join(original, "License.txt"), "utf8");
if (!license.includes("CC0"))
  throw Error("La licence CC0 originale est nécessaire.");
const names = [
  "sedan",
  "sedan-sports",
  "suv",
  "suv-luxury",
  "hatchback-sports",
  "van",
  "delivery",
  "delivery-flat",
  "truck",
  "truck-flat",
];
const entries = [];
const failures = [];
await mkdir("public/models/previews", { recursive: true });
await copyFile(
  path.join(original, "License.txt"),
  "public/models/kenney-license.txt",
);
for (const name of names) {
  try {
    const originalBytes = await readFile(
      path.join(original, "Models/GLB format", name + ".glb"),
    );
    let bytes = originalBytes;
    if (
      bytes.readUInt32LE(0) !== 0x46546c67 ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length
    )
      throw Error("GLB structure invalid");
    const gltf = JSON.parse(
      bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
    );
    if ((gltf.buffers || []).some((b) => b.uri))
      throw Error("External buffers are not allowed");
    let binary = bytes.subarray(28 + bytes.readUInt32LE(12));
    for (const image of gltf.images || []) {
      if (!image.uri) continue;
      if (image.uri !== "Textures/colormap.png")
        throw Error("Unapproved image resource");
      const png = await readFile(
        path.join(original, "Models/GLB format", image.uri),
      );
      const offset = binary.length;
      binary = Buffer.concat([
        binary,
        png,
        Buffer.alloc((4 - (png.length % 4)) % 4),
      ]);
      gltf.bufferViews ||= [];
      image.bufferView = gltf.bufferViews.length;
      gltf.bufferViews.push({
        buffer: 0,
        byteOffset: offset,
        byteLength: png.length,
      });
      image.mimeType = "image/png";
      delete image.uri;
    }
    gltf.buffers[0].byteLength = binary.length;
    let json = Buffer.from(JSON.stringify(gltf));
    json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
    const header = Buffer.alloc(20);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + json.length + binary.length, 8);
    header.writeUInt32LE(json.length, 12);
    header.writeUInt32LE(0x4e4f534a, 16);
    const bh = Buffer.alloc(8);
    bh.writeUInt32LE(binary.length, 0);
    bh.writeUInt32LE(0x004e4942, 4);
    bytes = Buffer.concat([header, json, bh, binary]);
    const triangles = (gltf.meshes || [])
      .flatMap((m) => m.primitives)
      .reduce(
        (n, p) =>
          n +
          (p.mode === undefined || p.mode === 4
            ? gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3
            : 0),
        0,
      );
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await writeFile("public/models/" + name + ".glb", bytes);
    await copyFile(
      path.join(original, "Previews", name + ".png"),
      "public/models/previews/" + name + ".png",
    );
    entries.push({
      id: "kenney-" + name,
      kind: "vehicle",
      name: name.replaceAll("-", " "),
      make: "Générique",
      model: name,
      category: name.startsWith("suv")
        ? "suv"
        : name.includes("hatch")
          ? "hatch"
          : "sedan",
      source: "https://kenney.nl/assets/car-kit",
      creator: "Kenney",
      license: "CC0-1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      licenseStatus: "verified",
      verifiedAt: "2026-10-13",
      licenseProof: "/models/kenney-license.txt",
      commercial: true,
      redistribution: true,
      noAI: false,
      attribution: "Kenney — Car Kit 3.1 (CC0)",
      format: "GLB",
      triangles: Math.round(triangles),
      bytes: bytes.length,
      sha256,
      status: "imported",
      validation:
        "GLB structure, embedded resources and SHA-256; no antivirus available",
      url: "/models/" + name + ".glb",
      preview: "/models/previews/" + name + ".png",
      generic: true,
      enabled: true,
    });
  } catch (error) {
    failures.push({ name, error: String(error) });
  }
}
const csv = await readFile("research/catalogue/catalogue-source.csv", "utf8");
for (const [i, line] of csv
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .entries()) {
  const [type, name, source, license, triangles] = line.split(",");
  entries.push({
    id: "source-" + i,
    kind: type === "vehicule" ? "vehicle" : "mechanical",
    name,
    make: name.startsWith("BMW")
      ? "BMW"
      : name.startsWith("Mercedes")
        ? "Mercedes"
        : "Illustration mécanique",
    model: name,
    source,
    creator: null,
    license,
    licenseStatus: "license_review_required",
    verifiedAt: null,
    commercial: null,
    redistribution: null,
    noAI: license.includes("NoAI"),
    format: null,
    triangles: Number(triangles),
    bytes: 0,
    sha256: null,
    status: "not_downloaded",
    url: null,
    preview: null,
    generic: type !== "vehicule",
    enabled: false,
  });
}
const manifest = {
  version: 1,
  generatedAt: "2026-10-13",
  entries,
  failures,
  stats: {
    referenced: entries.length,
    licensesVerified: entries.filter((e) => e.licenseStatus === "verified")
      .length,
    downloaded: entries.filter((e) => e.status === "imported").length,
    knownBrandModelsImported: 0,
    genericVehiclesImported: entries.filter((e) => e.status === "imported")
      .length,
    externalModelsAwaitingReview: 10,
  },
};
await writeFile(
  "public/models/manifest.json",
  JSON.stringify(manifest, null, 2),
);
await writeFile(
  "research/catalogue/import-report.json",
  JSON.stringify({ stats: manifest.stats, failures }, null, 2),
);
console.log(JSON.stringify(manifest.stats));
if (failures.length) process.exitCode = 1;
