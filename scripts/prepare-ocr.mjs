import { copyFile, readdir, mkdir, access } from "node:fs/promises";
await mkdir("public/ocr", { recursive: true });
await access("public/ocr/fra.traineddata.gz");
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  "public/ocr/worker.min.js",
);
for (const file of await readdir("node_modules/tesseract.js-core"))
  if (/^tesseract-core.*\.(js|wasm)$/.test(file))
    await copyFile(
      "node_modules/tesseract.js-core/" + file,
      "public/ocr/" + file,
    );
await copyFile(
  "node_modules/tesseract.js-core/LICENSE",
  "public/ocr/engine-license.txt",
);
console.log("Moteur OCR préparé pour un traitement intégralement local.");
