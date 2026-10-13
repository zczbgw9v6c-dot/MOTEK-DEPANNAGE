import { useEffect, useRef, useState } from "react";
import {
  Scan,
  FileArrowUp,
  ArrowClockwise,
  CheckCircle,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  extractRegistration,
  validVIN,
  type FieldEvidence,
} from "./identification";
import type { Worker } from "tesseract.js";
export function ScanPanel({
  onApply,
  onClose,
}: {
  onApply: (fields: FieldEvidence[]) => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [raw, setRaw] = useState(""),
    [fields, setFields] = useState<FieldEvidence[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [rotation, setRotation] = useState(0),
    [zoom, setZoom] = useState(1);
  const worker = useRef<Worker | null>(null),
    mounted = useRef(true),
    canvas = useRef<HTMLCanvasElement | null>(null),
    source = useRef<FieldEvidence["source"]>("manual");
  useEffect(
    () => () => {
      mounted.current = false;
      worker.current?.terminate();
    },
    [],
  );
  async function load(next: File) {
    if (busy) return;
    setError("");
    setFields([]);
    setRaw("");
    setRotation(0);
    setZoom(1);
    setPreview("");
    setFile(next);
    if (next.size > 15 * 1024 * 1024) {
      setError("Limite de 15 Mo. Utilisez un document plus léger.");
      setFile(null);
      return;
    }
    setBusy(true);
    setProgress("Ouverture du document…");
    try {
      if (
        next.type === "application/pdf" ||
        next.name.toLowerCase().endsWith(".pdf")
      ) {
        const pdfjs = await import("pdfjs-dist");
        const { default: workerURL } =
          await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = workerURL;
        const task = pdfjs.getDocument({
          data: new Uint8Array(await next.arrayBuffer()),
        });
        const pdf = await task.promise;
        if (pdf.numPages > 5) {
          await task.destroy();
          throw Error("Limite de cinq pages par document dans ce prototype.");
        }
        let text = "";
        let first: HTMLCanvasElement | null = null;
        try {
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            let previousY: number | null = null;
            for (const item of content.items) {
              if (!("str" in item)) continue;
              const y = item.transform[5];
              if (previousY !== null && Math.abs(y - previousY) > 3)
                text += "\n";
              text += item.str + " ";
              if (item.hasEOL) text += "\n";
              previousY = y;
            }
            text += "\n";
            if (p === 1) {
              const view = page.getViewport({ scale: 1.8 });
              first = document.createElement("canvas");
              first.width = view.width;
              first.height = view.height;
              await page.render({ canvas: first, viewport: view }).promise;
            }
          }
        } finally {
          await task.destroy();
        }
        canvas.current = first;
        if (first) setPreview(first.toDataURL("image/png"));
        setRaw(text.trim());
        source.current = text.trim().length > 20 ? "pdf_text" : "ocr_local";
        setProgress(
          text.trim().length > 20
            ? "Texte PDF extrait · cliquez sur Analyser."
            : "PDF image · OCR sur la première page uniquement.",
        );
      } else if (
        ["image/png", "image/jpeg", "image/webp"].includes(next.type)
      ) {
        const bitmap = await createImageBitmap(next);
        const c = document.createElement("canvas");
        const ratio = Math.min(1, 2500 / Math.max(bitmap.width, bitmap.height));
        c.width = Math.round(bitmap.width * ratio);
        c.height = Math.round(bitmap.height * ratio);
        c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
        bitmap.close();
        canvas.current = c;
        setPreview(c.toDataURL("image/png"));
        source.current = "ocr_local";
        setProgress("Photo ouverte · cliquez sur Analyser.");
      } else {
        throw Error(
          "Formats pris en charge : PDF, JPG, PNG et WebP. HEIC nécessite une conversion préalable.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function analyze() {
    setError("");
    setBusy(true);
    try {
      let text = raw;
      if (source.current === "ocr_local" && canvas.current) {
        setProgress("Initialisation de l’OCR local…");
        const { createWorker } = await import("tesseract.js");
        if (!worker.current) {
          const initialized = await createWorker("fra", 1, {
            workerPath: "/ocr/worker.min.js",
            corePath: "/ocr",
            langPath: "/ocr",
            workerBlobURL: false,
            cacheMethod: "none",
            logger: (m) => {
              if (mounted.current)
                setProgress(
                  m.status === "recognizing text"
                    ? `Lecture locale · ${Math.round(m.progress * 100)} %`
                    : "Chargement du moteur local…",
                );
            },
          });
          if (!mounted.current) {
            await initialized.terminate();
            return;
          }
          worker.current = initialized;
        }
        const original = canvas.current;
        const c = document.createElement("canvas");
        const swap = rotation % 180 !== 0;
        c.width = swap ? original.height : original.width;
        c.height = swap ? original.width : original.height;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(original, -original.width / 2, -original.height / 2);
        const result = await worker.current.recognize(c);
        if (!mounted.current) return;
        text = result.data.text;
        setRaw(text);
      }
      if (!text.trim())
        throw Error(
          "Aucun texte lisible. Reprenez la photo ou saisissez les champs manuellement.",
        );
      const parsed = extractRegistration(text, source.current);
      setFields(parsed);
      setProgress(
        "Extraction terminée · toutes les valeurs restent à vérifier.",
      );
    } catch (e) {
      setError("Lecture non aboutie : " + (e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const confirmed = fields.filter((f) => f.confirmed && f.value);
  return (
    <section className="scan-panel">
      <div className="section-head">
        <div>
          <span className="eyebrow">AUTOHUB SCAN · LOCAL</span>
          <h3>Lire une carte grise française</h3>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Fermer le scan
        </button>
      </div>
      <div className="subtle-note">
        <ShieldCheck />
        <span>
          Le document reste dans ce navigateur. Aucune copie de l’original n’est
          enregistrée dans le dossier. Le titulaire C.1 ne remplace jamais
          automatiquement le client.
        </span>
      </div>
      <div className="scan-examples">
        <span>Essayer avec des données fictives :</span>
        {[
          [
            "PDF texte fictif",
            "carte-grise-fictive-texte.pdf",
            "application/pdf",
          ],
          [
            "PDF scanné fictif",
            "carte-grise-fictive-scan.pdf",
            "application/pdf",
          ],
          ["Photo fictive", "carte-grise-fictive-photo.png", "image/png"],
        ].map(([label, name, type]) => (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            key={name}
            onClick={async () => {
              try {
                const response = await fetch("/demo/" + name);
                if (!response.ok) throw Error();
                await load(new File([await response.blob()], name, { type }));
              } catch {
                setError(
                  "Exemple indisponible. Choisissez votre propre document.",
                );
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="scan-upload">
        <FileArrowUp size={25} />
        <span>{file?.name || "Choisir un PDF ou une photo"}</span>
        <input
          aria-label="Document à scanner"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) load(f);
          }}
        />
      </label>
      <div className="scan-columns">
        <div>
          <div className="scan-tools">
            <button
              type="button"
              className="secondary"
              disabled={!preview || busy}
              onClick={() => {
                setRotation((rotation + 90) % 360);
                setFields([]);
              }}
            >
              <ArrowClockwise />
              90°
            </button>
            <label>
              Zoom
              <input
                aria-label="Zoom du document"
                type="range"
                min=".5"
                max="2"
                step=".1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="document-preview">
            {preview ? (
              <img
                src={preview}
                style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
                alt="Document original à vérifier"
              />
            ) : (
              <p>Le document original apparaîtra ici.</p>
            )}
          </div>
          <label>
            Texte extrait ou saisi manuellement
            <textarea
              aria-label="Texte du document"
              value={raw}
              disabled={busy}
              onChange={(e) => {
                setRaw(e.target.value);
                source.current = "manual";
                setFields([]);
              }}
              placeholder={"A : AA-123-BB\nD.1 : RENAULT\nD.3 : CLIO\nE : …"}
            />
          </label>
          <button
            type="button"
            className="primary"
            disabled={busy || (!preview && !raw)}
            onClick={analyze}
          >
            <Scan size={18} />
            {busy ? "Traitement local…" : "Analyser le document"}
          </button>
          <p className="scan-progress" role="status">
            {progress}
          </p>
          {error && (
            <p className="warning-small" role="alert">
              <WarningCircle />
              {error}
            </p>
          )}
        </div>
        <div className="scan-fields">
          <h4>Champs proposés · à confirmer</h4>
          <p>
            Seules les lignes portant un code explicite sont proposées. Les
            valeurs absentes restent à compléter. Les coordonnées de zone ne
            sont pas encore calculées.
          </p>
          {fields.map((f, i) => (
            <div
              className={"scan-field " + (f.confirmed ? "confirmed" : "")}
              key={f.code}
            >
              <label>
                {f.code} · {f.label}
                <input
                  aria-label={"Champ " + f.code}
                  value={f.value}
                  placeholder="À compléter"
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              value: e.target.value,
                              confirmed: false,
                              corrected: true,
                              reviewedAt: null,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              {f.raw && <small>Lu : {f.raw}</small>}
              <label className="check-label">
                <input
                  aria-label={"Confirmer " + f.code}
                  type="checkbox"
                  checked={f.confirmed}
                  disabled={!f.value || (f.code === "E" && !validVIN(f.value))}
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              confirmed: e.target.checked,
                              reviewedAt: e.target.checked
                                ? new Date().toISOString()
                                : null,
                            }
                          : x,
                      ),
                    )
                  }
                />
                Vérifié sur le document
              </label>
            </div>
          ))}
          {!fields.length && (
            <p className="empty">
              Analysez le document pour proposer des champs.
            </p>
          )}
          <button
            type="button"
            className="primary full"
            disabled={!confirmed.length || busy}
            onClick={() => onApply(confirmed)}
          >
            <CheckCircle size={18} />
            Appliquer {confirmed.length} champs confirmés
          </button>
          <p className="warning-small">
            Prototype français uniquement. La motorisation, la finition et les
            références de pièces ne sont pas déduites.
          </p>
        </div>
      </div>
    </section>
  );
}
