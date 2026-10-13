import { useState } from "react";
import {
  Brain,
  MagnifyingGlass,
  ShieldCheck,
  ArrowUpRight,
  FileArrowUp,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { searchDiagnostics, extractDTC } from "./diagnostic-domain";
import { VoiceAssistant } from "./VoiceAssistant";
import { identifyLocal } from "./identification";
import type { DB } from "./domain";
export function Intelligence({
  db,
  onOpen,
  commit,
  onAction,
  initialVehicle,
}: {
  db: DB;
  initialVehicle?: string;
  onOpen: (id: string) => void;
  commit: (fn: (d: DB) => DB, message?: string) => unknown;
  onAction: (id: string, type: string, payload: any) => Promise<boolean>;
}) {
  const [vehicle, setVehicle] = useState(
      initialVehicle ||
        db.vehicles.find((v) => v.present && v.status !== "Livré")?.id ||
        "",
    ),
    [query, setQuery] = useState(
      initialVehicle
        ? (db.vehicles.find((v) => v.id === initialVehicle)?.symptoms || "") +
            " " +
            (db.vehicles.find((v) => v.id === initialVehicle)?.codes || "")
        : "",
    ),
    [identity, setIdentity] = useState(""),
    [source, setSource] = useState(""),
    [voice, setVoice] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const car = db.vehicles.find((v) => v.id === vehicle);
  const results = searchDiagnostics(db, query, vehicle);
  const count = db.diagnosticCases?.length || 0;
  async function report(file: File) {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("Limite de 10 Mo.");
      return;
    }
    setBusy(true);
    try {
      let text = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        const { default: url } =
          await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = url;
        const task = pdfjs.getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
        });
        try {
          const pdf = await task.promise;
          if (pdf.numPages > 5) throw Error("Cinq pages maximum.");
          for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            const data = await page.getTextContent();
            text +=
              data.items
                .filter((i) => "str" in i)
                .map((i) => (i as any).str)
                .join(" ") + "\n";
          }
          if (!text.trim())
            throw Error(
              "PDF image : utilisez AutoHub Scan pour lire le document, puis collez le texte ici.",
            );
        } finally {
          await task.destroy();
        }
      } else if (
        ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("fra", 1, {
          workerPath: "/ocr/worker.min.js",
          corePath: "/ocr",
          langPath: "/ocr",
          workerBlobURL: false,
          cacheMethod: "none",
        });
        try {
          text = (await worker.recognize(file)).data.text;
        } finally {
          await worker.terminate();
        }
      } else if (/\.(txt|csv)$/i.test(file.name)) text = await file.text();
      else throw Error("Formats : PDF texte, TXT, CSV, JPG ou PNG.");
      const codes = extractDTC(text);
      setSource(text);
      setQuery(codes.length ? codes.join(" ") : text.slice(0, 1500));
      if (!codes.length)
        setError(
          "Aucun code DTC standard retrouvé. Examinez le texte ; aucun défaut n’est supposé.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="intelligence-v2">
      <section className="content-card diagnostic">
        <div className="brain-icon">
          <Brain size={32} />
        </div>
        <span className="eyebrow">GARAGE INTELLIGENT · MÉMOIRE DU CRM</span>
        <h2>Expliquez-moi votre cas.</h2>
        <p>
          {count} dossiers techniques fictifs, chacun relié à un véhicule
          enregistré. La recherche repose sur les mots-clés, codes, modèle et
          motorisation renseignée.
        </p>
        <label>
          Véhicule existant
          <select
            aria-label="Véhicule du diagnostic"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            {db.vehicles.map((v) => (
              <option value={v.id} key={v.id}>
                {v.make} {v.model} · {v.plate}
              </option>
            ))}
          </select>
        </label>
        <label>
          Plaque ou VIN
          <input
            aria-label="Identifier le véhicule du diagnostic"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="Recherche interne, aucun lookup externe"
          />
        </label>
        <button
          className="secondary"
          onClick={() => {
            const result = identifyLocal(
              db,
              identity.trim().length === 17
                ? { vin: identity }
                : { plate: identity },
            );
            if (result.matches.length === 1) setVehicle(result.matches[0].id);
            setError(result.message);
          }}
        >
          Retrouver le dossier
        </button>
        <label>
          Symptômes et codes défauts
          <textarea
            aria-label="Symptômes du diagnostic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Démarrage difficile, direction intermittente, P0562…"
          />
        </label>
        <div className="diagnostic-actions">
          <button
            className="secondary"
            onClick={() => {
              if (car) {
                setQuery(car.symptoms + " " + car.codes);
                setSource("Symptômes enregistrés dans le dossier " + car.plate);
              }
            }}
          >
            Utiliser les symptômes du dossier
          </button>
          <button className="secondary" onClick={() => setVoice(!voice)}>
            Dicter / ajouter une note
          </button>
          <label className="diagnostic-upload">
            <FileArrowUp size={18} />
            {busy ? "Lecture locale…" : "Importer OBD / PDF / photo"}
            <input
              aria-label="Rapport diagnostic à lire"
              type="file"
              disabled={busy}
              accept=".pdf,.txt,.csv,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) report(f);
              }}
            />
          </label>
        </div>
        {error && (
          <div className="notice">
            <WarningCircle size={18} />
            {error}
          </div>
        )}
        {source && (
          <details>
            <summary>Texte source de la recherche</summary>
            <pre className="report-source">{source}</pre>
          </details>
        )}
        <div className="subtle-note">
          <ShieldCheck />
          <span>
            Illustrations et cas fictifs. Une correspondance ne confirme pas la
            cause actuelle. Les tests manquants et la documentation applicable
            doivent être validés par un technicien qualifié.
          </span>
        </div>
      </section>
      <section className="case-results">
        <div className="section-head">
          <h3>{results.length} dossiers pertinents</h3>
          <span>Causes, preuves et différences visibles</span>
        </div>
        {results.map(({ case: c, vehicle: v, similarities, differences }) => (
          <article className="case-card" key={c.id}>
            <div>
              <span className="small-chip">
                {c.id} · {c.demo ? "Fictif" : "Dossier local"}
              </span>
              <span className={c.resolved ? "text-green" : "text-amber"}>
                {c.resolved
                  ? "Résolution documentée"
                  : "Diagnostic non confirmé"}
              </span>
            </div>
            <h3>
              {v.make} {v.model} · {c.symptoms}
            </h3>
            <p>
              {new Date(c.at).toLocaleDateString("fr-FR")} ·{" "}
              {v.km.toLocaleString("fr-FR")} km · {c.engine}
            </p>
            <div className="case-comparison">
              <div>
                <h4>Correspondances</h4>
                <ul>
                  {similarities.length ? (
                    similarities.map((s) => <li key={s}>{s}</li>)
                  ) : (
                    <li>
                      Présentation du dossier, sans correspondance recherchée.
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4>Différences</h4>
                <ul>
                  {differences.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h4>Codes et tests du dossier source</h4>
            <p>{c.codes.join(" · ") || "Aucun code consigné."}</p>
            {c.tests.map((t) => (
              <div
                className={"diagnostic-test " + (t.done ? "" : "missing")}
                key={t.name}
              >
                {t.done ? (
                  <CheckCircle size={17} />
                ) : (
                  <WarningCircle size={17} />
                )}
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.result}</small>
                </span>
              </div>
            ))}
            <h4>Hypothèses</h4>
            <ul>
              {c.hypotheses.map((h) => (
                <li key={h.label}>
                  {h.label} — {h.state}
                </li>
              ))}
            </ul>
            <h4>Cause confirmée dans ce cas</h4>
            <p>{c.cause || "Aucune cause confirmée."}</p>
            <h4>Réparation et résultat</h4>
            <p>
              {c.repair} {c.result}
              {c.recurred ? " Retour après réparation enregistré." : ""}
            </p>
            <div className="case-controls">
              <button className="secondary" onClick={() => onOpen(v.id)}>
                <ArrowUpRight size={17} />
                Ouvrir le dossier source
              </button>
              {car && (
                <button
                  className="secondary"
                  onClick={() =>
                    commit(
                      (d) => ({
                        ...d,
                        vehicles: d.vehicles.map((x) =>
                          x.id === car.id
                            ? {
                                ...x,
                                notes:
                                  x.notes +
                                  "\nPiste issue de " +
                                  c.id +
                                  " (fictif) : " +
                                  (c.cause || c.hypotheses[0]?.label) +
                                  ". À vérifier ; ne constitue pas un diagnostic.",
                              }
                            : x,
                        ),
                        audit: [
                          {
                            id: crypto.randomUUID(),
                            vehicle: car.id,
                            at: new Date().toISOString(),
                            action: "Piste diagnostic ajoutée depuis " + c.id,
                          },
                          ...d.audit,
                        ],
                      }),
                      "Piste ajoutée avec sa source et son incertitude.",
                    )
                  }
                >
                  Ajouter la piste au dossier actuel
                </button>
              )}
            </div>
          </article>
        ))}
        {!results.length && (
          <div className="content-card empty">
            <MagnifyingGlass size={35} />
            <h3>Aucun dossier similaire enregistré.</h3>
            <p>
              Aucun diagnostic ni référence n’est inventé pour combler ce
              manque.
            </p>
          </div>
        )}
      </section>
      {voice && car && (
        <div className="diagnostic-voice">
          <VoiceAssistant
            db={db}
            vehicle={car.id}
            mode="report"
            onAction={(type, payload) => onAction(car.id, type, payload)}
            onClose={() => setVoice(false)}
          />
        </div>
      )}
    </section>
  );
}
