import { useState } from "react";
import type { DB, Vehicle } from "./domain";
import { receiveClient, receptionLabel } from "./reception-domain";
import { quoteTotals } from "./quote-domain";
import { workshopFor } from "./workshop-domain";
const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const date = (s?: string) =>
  s ? new Date(s).toLocaleString("fr-FR") : "Non renseignée";
export function WaitingClient({
  db,
  vehicle: v,
  commit,
  onVehicle,
  onQuotes,
  onWorkshop,
  onClose,
  initialDetailed = false,
  onReceptionAction,
}: {
  onReceptionAction: (
    state: "waiting" | "received" | "left",
  ) => Promise<boolean>;
  initialDetailed?: boolean;
  db: DB;
  vehicle: Vehicle;
  commit: (fn: (db: DB) => DB, message?: string) => Promise<boolean>;
  onVehicle: () => void;
  onQuotes: () => void;
  onWorkshop: () => void;
  onClose: () => void;
}) {
  const [detailed, setDetailed] = useState(initialDetailed),
    [tab, setTab] = useState("Vue d’ensemble");
  const [busy, setBusy] = useState(false),
    [draft, setDraft] = useState("");
  const quotes = (db.quotes || []).filter((q) => q.vehicle === v.id);
  const invoices = (db.invoices || []).filter((i) => i.vehicle === v.id);
  const appointments = (db.appointments || [])
    .filter((a) => a.vehicle === v.id && a.state !== "Terminé")
    .sort((a, b) => a.start.localeCompare(b.start));
  const work = workshopFor(db, v.id),
    events = db.audit.filter((a) => a.vehicle === v.id);
  async function receive(state: "waiting" | "received" | "left") {
    setBusy(true);
    try {
      await onReceptionAction(state);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="panel-top">
        <strong>{detailed ? "DOSSIER CLIENT" : "ACCUEIL · CLIENT"}</strong>
        <button
          className="icon-button"
          aria-label="Fermer la fiche client"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="guided-context waiting-client">
        <header className="client-identity">
          <button
            className="client-avatar"
            aria-label="Ouvrir le dossier client complet"
            onClick={() => setDetailed(true)}
          >
            {v.client
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </button>
          <div>
            <h2>{v.client}</h2>
            <span className="reception-badge">{receptionLabel(v)}</span>
          </div>
        </header>
        <p>
          {v.make} {v.model} · <strong>{v.plate}</strong>
        </p>
        <div className="reception-checks">
          <span>
            Contrôles atelier renseignés :{" "}
            {Object.values(work.checks).filter(Boolean).length} /{" "}
            {Object.keys(work.checks).length}
          </span>
          <progress
            aria-label="Contrôles atelier renseignés"
            max={Object.keys(work.checks).length}
            value={Object.values(work.checks).filter(Boolean).length}
          />
        </div>
        {!v.reception && (
          <p className="warning-small">Arrivée non enregistrée.</p>
        )}
        {detailed && (
          <nav className="client-tabs" aria-label="Dossier client">
            {[
              "Vue d’ensemble",
              "Véhicule",
              "Interventions",
              "Devis",
              "Documents",
            ].map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
        )}
        {(!detailed || tab === "Vue d’ensemble") && (
          <>
            <dl className="client-facts">
              <dt>Téléphone</dt>
              <dd>{v.phone || "Non renseigné"}</dd>
              <dt>Email</dt>
              <dd>{v.email || "Non renseigné"}</dd>
              <dt>Arrivée du client</dt>
              <dd>{date(v.reception?.arrivedAt)}</dd>
              <dt>Motif de visite</dt>
              <dd>{v.symptoms || "Non renseigné"}</dd>
              <dt>État du véhicule</dt>
              <dd>{v.status}</dd>
              <dt>Technicien</dt>
              <dd>{v.technician}</dd>
            </dl>
            <div className="client-actions">
              <button
                className="primary"
                disabled={busy || v.reception?.state === "received"}
                onClick={() => receive("received")}
              >
                Prendre en charge
              </button>
              <button className="secondary" onClick={onVehicle}>
                Voir le véhicule
              </button>
              {v.phone && (
                <a
                  className="secondary"
                  href={`tel:${v.phone.replace(/[^+\d]/g, "")}`}
                >
                  Appeler
                </a>
              )}
              <button className="secondary" onClick={onQuotes}>
                Créer / consulter un devis
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  receive(v.reception?.state === "left" ? "waiting" : "left")
                }
              >
                {v.reception?.state === "left"
                  ? "Enregistrer l’arrivée"
                  : "Client parti"}
              </button>
            </div>
            <details>
              <summary>Préparer un SMS · envoi non configuré</summary>
              <textarea
                aria-label="Brouillon SMS"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Bonjour ${v.client}, concernant votre ${v.make} ${v.model}…`}
              />
              <p>
                Aucun message n’est envoyé. Brouillon temporaire, à copier
                manuellement.
              </p>
            </details>
            {detailed && (
              <>
                <h3>Rendez-vous enregistrés</h3>
                {appointments.length ? (
                  appointments.map((a) => (
                    <p key={a.id}>
                      {date(a.start)} · {a.department} · {a.state}
                    </p>
                  ))
                ) : (
                  <p>Aucun rendez-vous enregistré.</p>
                )}
                <h3>Factures</h3>
                {invoices.length ? (
                  invoices.map((i) => (
                    <p key={i.id}>
                      {i.id} · {euro(i.total)} · {i.state}
                      {i.demo ? " · Démonstration" : ""}
                    </p>
                  ))
                ) : (
                  <p>Aucune facture enregistrée.</p>
                )}
                <p className="warning-small">
                  Historique de fidélité et regroupement de plusieurs véhicules
                  par identité client : non renseignés. Ce dossier conserve son
                  lien avec le véhicule existant.
                </p>
              </>
            )}
          </>
        )}
        {detailed && tab === "Véhicule" && (
          <>
            <dl className="client-facts">
              <dt>Modèle</dt>
              <dd>
                {v.make} {v.model}
              </dd>
              <dt>VIN</dt>
              <dd>{v.vin || "Non renseigné"}</dd>
              <dt>Année</dt>
              <dd>{v.year}</dd>
              <dt>Kilométrage</dt>
              <dd>{v.km.toLocaleString("fr-FR")} km</dd>
              <dt>Motorisation</dt>
              <dd>{v.engine || "Non renseignée"}</dd>
            </dl>
            <button className="primary full" onClick={onVehicle}>
              Ouvrir le véhicule en 3D
            </button>
          </>
        )}
        {detailed && tab === "Interventions" && (
          <>
            <h3>{v.status}</h3>
            <p>{v.symptoms}</p>
            <button className="primary full" onClick={onWorkshop}>
              Ouvrir l’intervention et ses actions
            </button>
            <h3>Historique enregistré</h3>
            {events.length ? (
              events.slice(0, 30).map((a) => (
                <article className="guided-item" key={a.id}>
                  <strong>{a.action}</strong>
                  <small>{date(a.at)}</small>
                </article>
              ))
            ) : (
              <p>Aucun événement enregistré.</p>
            )}
          </>
        )}
        {(!detailed || tab === "Devis") && (
          <>
            <h3>Devis du dossier</h3>
            {quotes.length ? (
              quotes.map((q) => (
                <button
                  className="guided-item full"
                  key={q.id}
                  onClick={onQuotes}
                >
                  <strong>
                    {q.id} · {q.state}
                  </strong>
                  <span>{euro(quoteTotals(q).total)} TTC</span>
                </button>
              ))
            ) : (
              <p>Aucun devis enregistré.</p>
            )}
          </>
        )}
        {detailed && tab === "Documents" && (
          <>
            <h3>Photographies de l’intervention</h3>
            <div className="client-photos">
              {work.photos.map((p) => (
                <a
                  href={p.data}
                  download={`intervention-${v.plate}-${p.id}.jpg`}
                  key={p.id}
                >
                  <img src={p.data} alt={`Intervention du ${date(p.at)}`} />
                </a>
              ))}
            </div>
            {!work.photos.length && <p>Aucune photographie enregistrée.</p>}
            <p>
              Carte grise, assurance et documents signés : aucun fichier
              disponible dans ce module.
            </p>
          </>
        )}
        {!detailed && (
          <button className="primary full" onClick={() => setDetailed(true)}>
            Ouvrir le dossier complet
          </button>
        )}
        {detailed && (
          <button className="secondary full" onClick={() => setDetailed(false)}>
            Revenir à la fiche synthétique
          </button>
        )}
      </div>
    </>
  );
}
