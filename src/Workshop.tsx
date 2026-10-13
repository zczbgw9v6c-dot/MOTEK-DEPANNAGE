import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { VoiceAssistant } from "./VoiceAssistant";
import { serverNow } from "./api";
import {
  Play,
  Pause,
  Package,
  WarningCircle,
  Camera,
  NotePencil,
  CheckCircle,
  QrCode,
  ArrowRight,
  Car,
  Clock,
  Key,
  ArrowLeft,
} from "@phosphor-icons/react";
import { type DB, type Vehicle } from "./domain";
import {
  workshopFor,
  elapsedSeconds,
  toggleWork,
  finishWork,
  patchWorkshop,
  requestPart,
} from "./workshop-domain";
type Commit = (fn: (db: DB) => DB, message?: string) => void;
export function Workshop({
  db,
  selected,
  onSelect,
  commit,
  onOpen3D,
  onAction,
}: {
  db: DB;
  selected: string | null;
  onSelect: (id: string) => void;
  commit: Commit;
  onOpen3D: (id: string) => void;
  onAction: (type: string, payload: any) => Promise<boolean>;
}) {
  const car = db.vehicles.find((v) => v.id === selected);
  const state = car ? workshopFor(db, car.id) : null;
  const [action, setAction] = useState(""),
    [text, setText] = useState(""),
    [qr, setQR] = useState(""),
    [now, setNow] = useState(serverNow()),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    setAction("");
    setText("");
    setQR("");
    setError("");
  }, [selected]);
  async function showQR(v: Vehicle) {
    setQR(
      await QRCode.toDataURL(
        `${location.origin}${location.pathname}#ordre=${encodeURIComponent(v.id)}`,
        { width: 240, margin: 2, errorCorrectionLevel: "M" },
      ),
    );
  }
  async function photo(file: File, v: Vehicle) {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisissez une photo JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Photo trop lourde : limite 15 Mo.");
      return;
    }
    if (workshopFor(db, v.id).photos.length >= 3) {
      setError("Trois photos maximum par dossier dans ce prototype local.");
      return;
    }
    setUploading(true);
    try {
      const image = await createImageBitmap(file);
      const c = document.createElement("canvas");
      const ratio = Math.min(1, 900 / Math.max(image.width, image.height));
      c.width = Math.round(image.width * ratio);
      c.height = Math.round(image.height * ratio);
      c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
      image.close();
      const data = c.toDataURL("image/jpeg", 0.7);
      commit(
        (d) =>
          patchWorkshop(
            d,
            v.id,
            {
              photos: [
                ...workshopFor(d, v.id).photos,
                { id: crypto.randomUUID(), data, at: new Date().toISOString() },
              ],
            },
            "Photo atelier ajoutée, original et métadonnées non conservés",
          ),
        "Photo ajoutée au dossier local.",
      );
    } catch {
      setError("La photo n’a pas pu être lue.");
    } finally {
      setUploading(false);
    }
  }
  if (!car || !state)
    return (
      <section className="content-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">MODE TECHNICIEN · 2D</span>
            <h2>Quel véhicule prenez-vous en charge ?</h2>
          </div>
          <span className="small-chip">
            Grandes commandes · sans 3D obligatoire
          </span>
        </div>
        <div className="workshop-picker">
          {db.vehicles
            .filter((v) => v.status !== "Livré")
            .map((v) => (
              <button key={v.id} onClick={() => onSelect(v.id)}>
                <Car size={32} />
                <div>
                  <strong>
                    {v.make} {v.model}
                  </strong>
                  <span>{v.plate}</span>
                  <small>
                    {v.technician} · {v.status}
                  </small>
                </div>
                <ArrowRight size={24} />
              </button>
            ))}
        </div>
      </section>
    );
  const seconds = elapsedSeconds(state, now);
  const time = `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((seconds / 60) % 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return (
    <section className="workshop-screen">
      <div className="workshop-top">
        <button className="secondary" onClick={() => onSelect("")}>
          <ArrowLeft />
          Autre véhicule
        </button>
        <div>
          <h2>
            {car.make} {car.model}
          </h2>
          <span className="plate">{car.plate}</span>
          <span>{car.status}</span>
        </div>
        <button className="secondary" onClick={() => showQR(car)}>
          <QrCode size={21} />
          QR dossier
        </button>
      </div>
      <div className="workshop-summary">
        <span>
          <Clock size={22} />
          <strong>{time}</strong>
          {state.runningSince ? "En cours" : "En pause"}
        </span>
        <span>
          <Key size={22} />
          {state.keyLocation}
        </span>
        <span>{car.technician}</span>
      </div>
      <div className="workshop-job">
        <strong>Travail demandé</strong>
        <p>{car.symptoms}</p>
        <span>
          {car.estimatedMinutes || 60} min prévues ·{" "}
          {state.blocked ? "Intervention bloquée" : car.status} · Temps de pause
          :{" "}
          {Math.floor(
            ((state.idleElapsed || 0) +
              (state.pausedSince
                ? Math.max(
                    0,
                    Math.floor((now - Date.parse(state.pausedSince)) / 1000),
                  )
                : 0)) /
              60,
          )}{" "}
          min
        </span>
      </div>
      <div className="workshop-actions">
        <button
          className={
            state.runningSince ? "work-action pause" : "work-action start"
          }
          onClick={() =>
            state.runningSince ? setAction("pause") : onAction("start", {})
          }
          disabled={[
            "Prêt à livrer",
            "Livré",
            "Contrôle qualité",
            "Devis à valider",
          ].includes(car.status)}
        >
          {state.runningSince ? <Pause size={34} /> : <Play size={34} />}
          <strong>{state.runningSince ? "Mettre en pause" : "Démarrer"}</strong>
          <span>Chronométrer l’intervention</span>
        </button>
        <button
          className="work-action"
          onClick={() => setAction(action === "piece" ? "" : "piece")}
        >
          <Package size={34} />
          <strong>Demander une pièce</strong>
          <span>Stock et réservations</span>
        </button>
        <button
          className="work-action"
          onClick={() => {
            setAction(action === "issue" ? "" : "issue");
            setText("");
          }}
        >
          <WarningCircle size={34} />
          <strong>Signaler un problème</strong>
          <span>Tracer un blocage</span>
        </button>
        <label className="work-action photo-action">
          <Camera size={34} />
          <strong>{uploading ? "Ajout en cours…" : "Ajouter une photo"}</strong>
          <span>Trois photos locales maximum</span>
          <input
            aria-label="Ajouter une photo atelier"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) photo(f, car);
              e.target.value = "";
            }}
          />
        </label>
        <button
          className="work-action"
          onClick={() => {
            setAction(action === "report" ? "" : "report");
            setText("");
          }}
        >
          <NotePencil size={34} />
          <strong>Dicter un compte rendu</strong>
          <span>Voix locale ou saisie courte</span>
        </button>
        <button
          className="work-action finish"
          onClick={() => onAction("finish", {})}
          disabled={car.status !== "En intervention"}
        >
          <CheckCircle size={34} />
          <strong>Terminer les travaux</strong>
          <span>Après les trois contrôles</span>
        </button>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {["piece", "issue", "report"].includes(action) && (
        <VoiceAssistant
          db={db}
          vehicle={car.id}
          mode={action}
          onAction={onAction}
          onClose={() => setAction("")}
        />
      )}
      {action === "pause" && (
        <div className="content-card pause-choices">
          <h3>Motif de pause</h3>
          {["Pause manuelle", "Attente de pièce", "Attente de décision"].map(
            (reason) => (
              <button
                className="secondary"
                key={reason}
                onClick={async () => {
                  if (await onAction("pause", { reason })) setAction("");
                }}
              >
                {reason}
              </button>
            ),
          )}
        </div>
      )}
      {action === "piece" && (
        <div className="content-card">
          <h3>Sélection manuelle de pièce</h3>
          <div className="part-request-grid">
            {db.parts.map((p) => (
              <button
                className="secondary"
                key={p.id}
                disabled={state.requests.some((r) => r.part === p.id)}
                onClick={() => onAction("request", { part: p.id, quantity: 1 })}
              >
                <strong>{p.name}</strong>
                <span>
                  {p.stock - p.reserved} disponibles · {p.ref}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="workshop-detail">
        <div className="content-card">
          <h3>Checklist de fin de travaux</h3>
          {(
            [
              ["repair", "Les opérations prévues sont réalisées"],
              ["safety", "Les contrôles de sécurité ont été effectués"],
              ["test", "Les tests après réparation sont consignés"],
            ] as const
          ).map(([key, label]) => (
            <label className="check-label" key={key}>
              <input
                type="checkbox"
                checked={state.checks[key]}
                onChange={(e) =>
                  commit((d) =>
                    patchWorkshop(
                      d,
                      car.id,
                      {
                        checks: {
                          ...workshopFor(d, car.id).checks,
                          [key]: e.target.checked,
                        },
                      },
                      "Checklist : " + label,
                    ),
                  )
                }
              />
              {label}
            </label>
          ))}
          <label>
            Emplacement des clés
            <input
              aria-label="Emplacement des clés"
              key={car.id}
              defaultValue={state.keyLocation}
              onBlur={(e) => {
                if (e.target.value !== state.keyLocation)
                  commit((d) =>
                    patchWorkshop(
                      d,
                      car.id,
                      { keyLocation: e.target.value },
                      "Emplacement des clés mis à jour",
                    ),
                  );
              }}
            />
          </label>
          <p className="warning-small">
            La checklist prépare le contrôle final ; elle ne valide pas
            automatiquement la qualité. Le chronomètre continue jusqu’à Pause,
            même si l’onglet est fermé.
          </p>
          <button className="secondary full" onClick={() => onOpen3D(car.id)}>
            Ouvrir le dossier et la vue 3D
            <ArrowRight />
          </button>
        </div>
        <div className="content-card">
          <h3>Suivi du dossier</h3>
          {state.requests.map((r) => (
            <div className="workshop-log" key={r.id}>
              <Package />
              <span>
                <strong>{db.parts.find((p) => p.id === r.part)?.name}</strong>
                <small>{r.state}</small>
              </span>
            </div>
          ))}
          {state.issues.map((i) => (
            <div className="workshop-log issue" key={i.id}>
              <WarningCircle />
              <span>
                {i.text}
                <small>{new Date(i.at).toLocaleString("fr-FR")}</small>
              </span>
            </div>
          ))}
          {state.reports.map((r) => (
            <div className="workshop-log" key={r.id}>
              <NotePencil />
              <span>
                {r.text}
                <small>{new Date(r.at).toLocaleString("fr-FR")}</small>
              </span>
            </div>
          ))}
          <div className="workshop-photos">
            {state.photos.map((p) => (
              <img
                key={p.id}
                src={p.data}
                alt={
                  "Photo atelier du " +
                  new Date(p.at).toLocaleDateString("fr-FR")
                }
              />
            ))}
          </div>
          {!state.requests.length &&
            !state.issues.length &&
            !state.reports.length &&
            !state.photos.length && (
              <p className="empty">
                Les demandes, problèmes, comptes rendus et photos apparaîtront
                ici.
              </p>
            )}
        </div>
      </div>
      {qr && (
        <div className="qr-panel">
          <div>
            <h3>QR de l’ordre de réparation</h3>
            <p>
              Uniquement l’identifiant du dossier, sans client, plaque ou VIN.
              Ce code ne donne aucun droit d’accès.
            </p>
            <p className="warning-small">
              Prototype local : le dossier doit déjà exister dans le navigateur
              qui ouvre le lien. Un téléphone ne peut pas consulter ce serveur
              sur son propre localhost.
            </p>
            <button className="secondary" onClick={() => setQR("")}>
              Masquer le QR
            </button>
          </div>
          <img src={qr} alt="QR code du dossier atelier" />
        </div>
      )}
    </section>
  );
}
