import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
const names = [
  "react",
  "react-dom",
  "three",
  "@phosphor-icons/react",
  "@fontsource/dm-sans",
  "pdfjs-dist",
  "tesseract.js",
  "tesseract.js-core",
  "qrcode",
];
await mkdir("public/licenses", { recursive: true });
const entries = [];
for (const name of names) {
  const base = "node_modules/" + name;
  const p = JSON.parse(await readFile(base + "/package.json", "utf8"));
  const files = (await readdir(base)).filter((f) =>
    /^license(?:\.|$)|^ofl(?:\.|$)/i.test(f),
  );
  for (const f of files)
    await copyFile(
      base + "/" + f,
      "public/licenses/" + name.replaceAll("/", "-").replace("@", "") + "-" + f,
    );
  entries.push({
    name,
    version: p.version,
    license: p.license,
    files: files.map(
      (f) =>
        "/licenses/" + name.replaceAll("/", "-").replace("@", "") + "-" + f,
    ),
  });
}
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt",
  "public/ocr/worker-license.txt",
);
await writeFile(
  "public/licenses/dependencies.json",
  JSON.stringify(entries, null, 2),
);
console.log("Licences des dépendances conservées.");
