import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { extractRegistration } from "../src/identification.ts";
globalThis.DOMMatrix ||= DOMMatrix;
globalThis.ImageData ||= ImageData;
globalThis.Path2D ||= Path2D;
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const results = [];
const get = (fields, code) => fields.find((f) => f.code === code)?.value;
const nativeTask = pdfjs.getDocument({
  data: new Uint8Array(
    await readFile("public/demo/carte-grise-fictive-texte.pdf"),
  ),
  useSystemFonts: true,
});
const nativePDF = await nativeTask.promise;
const page = await nativePDF.getPage(1);
const content = await page.getTextContent();
let text = "",
  lastY = null;
for (const item of content.items) {
  if (!("str" in item)) continue;
  if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) text += "\n";
  text += item.str + " ";
  if (item.hasEOL) text += "\n";
  lastY = item.transform[5];
}
const fields = extractRegistration(text, "pdf_text");
assert.equal(get(fields, "A"), "DEMO-002");
assert.equal(get(fields, "D.1"), "RENAULT");
assert.equal(get(fields, "D.3"), "CLIO");
assert.equal(get(fields, "E"), "VF1AAAAA123456789");
const view = page.getViewport({ scale: 1.5 });
const nativeCanvas = createCanvas(
  Math.round(view.width),
  Math.round(view.height),
);
await page.render({
  canvas: nativeCanvas,
  canvasContext: nativeCanvas.getContext("2d"),
  viewport: view,
}).promise;
await writeFile(
  "research/carte-grise-fictive-texte-preview.png",
  nativeCanvas.toBuffer("image/png"),
);
await nativeTask.destroy();
results.push({
  input: "PDF texte fictif",
  method: "PDF.js text extraction",
  fieldsVerified: ["A", "D.1", "D.3", "E"],
  result: "pass",
});
console.log("PDF texte : quatre champs vérifiés.");
const worker = await createWorker("fra", 1, {
  langPath: path.resolve("public/ocr"),
  cacheMethod: "none",
});
try {
  for (const [name, filename] of [
    ["Photo fictive", "carte-grise-fictive-photo.png"],
    ["PDF scanné fictif", "carte-grise-fictive-scan.pdf"],
  ]) {
    let image = await readFile("public/demo/" + filename);
    if (filename.endsWith(".pdf")) {
      const task = pdfjs.getDocument({
        data: new Uint8Array(image),
        useSystemFonts: true,
      });
      const pdf = await task.promise;
      try {
        const page = await pdf.getPage(1);
        const view = page.getViewport({ scale: 1.8 });
        const canvas = createCanvas(
          Math.round(view.width),
          Math.round(view.height),
        );
        await page.render({
          canvas,
          canvasContext: canvas.getContext("2d"),
          viewport: view,
        }).promise;
        image = canvas.toBuffer("image/png");
      } finally {
        await task.destroy();
      }
    }
    const result = await worker.recognize(image);
    const fields = extractRegistration(result.data.text, "ocr_local");
    await writeFile(
      "research/" + filename.replace(/\.(png|pdf)$/, ".ocr.txt"),
      result.data.text,
    );
    for (const [code, expected] of [
      ["A", "DEMO-002"],
      ["D.1", "RENAULT"],
      ["D.3", "CLIO"],
      ["E", "VF1AAAAA123456789"],
    ])
      assert.equal(get(fields, code), expected, `${name} ${code}`);
    results.push({
      input: name,
      method: "Tesseract French local OCR",
      fieldsVerified: ["A", "D.1", "D.3", "E"],
      result: "pass",
    });
    console.log(name + " : quatre champs vérifiés.");
  }
} finally {
  await worker.terminate();
}
await writeFile(
  "research/verification-scan.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      scope:
        "Engine integration with fictitious clean fixtures. Browser file chooser verification blocked; does not establish accuracy on real cards.",
      results,
    },
    null,
    2,
  ),
);
