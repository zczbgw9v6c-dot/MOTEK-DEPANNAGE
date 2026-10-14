import { nextWorkStep } from "./workflow-guidance";
import {
  Car,
  Wrench,
  Armchair,
  Key,
  UserCircle,
  Microphone,
} from "@phosphor-icons/react";
import { VoiceAssistant } from "./VoiceAssistant";
import { MessageComposer } from "./MessageComposer";
import { exampleHistory } from "./example-history";
import { useRef, useState } from "react";
import type { DB, Vehicle } from "./domain";
import { technicians } from "./domain";
import { orderProgress, orderBalance, deliveryBlocks } from "./core-domain";
import { waitingVehicles } from "./guided-domain";
import { workshopFor } from "./workshop-domain";
import { quoteTotals } from "./quote-domain";
import { DeliveryDeadline } from "./DeliveryDeadline";
const money = (c: number) =>
  (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
export function CurrentWork({
  db,
  vehicle: v,
  showTasks = true,
}: {
  db: DB;
  vehicle: Vehicle;
  showTasks?: boolean;
}) {
  const o = db.workOrders?.[v.id],
    s = workshopFor(db, v.id),
    p = orderProgress(db, v.id);
  return (
    <div className="current-work">
      <h3>Travaux de ce dossier</h3>
      <p>{v.symptoms || "Motif à préciser"}</p>
      {o ? (
        <>
          <progress max={100} value={p.percent || 0} />
          <strong>
            {p.percent} % · {p.done}/{p.total} travaux réalisés
          </strong>
          {showTasks &&
            o.tasks.map((t) => (
              <p key={t.id}>
                {t.doneAt ? "✓" : "○"} {t.label}
                {t.doneAt && (
                  <small>
                    {" "}
                    · {t.technician} ·{" "}
                    {new Date(t.doneAt).toLocaleString("fr-FR")}
                  </small>
                )}
              </p>
            ))}
        </>
      ) : (
        <p>Liste des travaux à définir à la prise en charge.</p>
      )}
      {(s.blocked || s.pausedSince) && (
        <p className="core-warning">
          {s.blocked ? "Intervention bloquée" : "Intervention en pause"}
          {s.pauseReason ? ` · ${s.pauseReason}` : ""}
          {s.issues.filter((i) => i.state !== "Résolu").length > 0 &&
            " · décision du responsable attendue (Rapports)"}
        </p>
      )}
      {s.requests
        .filter((r) => r.state !== "Annulée")
        .map((r) => {
          const part = db.parts.find((p) => p.id === r.part);
          return (
            <p key={r.id} className="core-part-line">
              {r.state.startsWith("Réservée") ? "✓" : "⏳"} {r.quantity || 1} ×{" "}
              {part?.name || r.part} · {r.state}
              {part && !r.state.startsWith("Réservée") && (
                <small>
                  {" "}
                  · {Math.max(0, part.stock - part.reserved)} disponible(s) en
                  magasin
                </small>
              )}
            </p>
          );
        })}
      <div className="assigned-technician">
        <UserCircle size={32} />
        <span>
          <small>Technicien du dossier</small>
          <strong>{v.technician}</strong>
          <small>
            {s.runningSince
              ? "Travaille actuellement sur ce véhicule"
              : v.status}
          </small>
        </span>
      </div>
    </div>
  );
}
export function CoreDesk({
  db,
  selected,
  scope = "core",
  onAction,
  onWorkshop,
  onQuotes,
  on3D,
  onNew,
}: {
  db: DB;
  selected?: string;
  scope?: string;
  onAction: (type: string, id: string, p: any) => Promise<boolean>;
  onWorkshop: (id: string) => void;
  onQuotes: (id: string) => void;
  on3D: (id: string) => void;
  onNew: () => void;
}) {
  const [chosen, setChosen] = useState(selected || ""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState(scope === "operations" ? "jobs" : "present"),
    [busy, setBusy] = useState(false),
    [partQuery, setPartQuery] = useState(""),
    [voiceMode, setVoiceMode] = useState("");
  const assignment = useRef<HTMLDetailsElement>(null),
    billing = useRef<HTMLDetailsElement>(null),
    delivery = useRef<HTMLDetailsElement>(null);
  const v = db.vehicles.find((v) => v.id === chosen),
    o = v ? db.workOrders?.[v.id] : undefined;
  const present = db.vehicles.filter(
    (v) => v.present !== false && v.status !== "Livré",
  );
  const waiting = waitingVehicles(db),
    orders = Object.values(db.workOrders || {});
  const rows = (scope === "waiting" ? waiting : db.vehicles).filter(
    (v) =>
      (scope === "waiting" ||
        filter === "all" ||
        (filter === "jobs" &&
          v.present !== false &&
          !["Livré", "Prêt à livrer"].includes(v.status)) ||
        (filter === "present" && v.present !== false && v.status !== "Livré") ||
        (filter === "active" && v.status === "En intervention") ||
        (filter === "ready" && v.status === "Prêt à livrer") ||
        (filter === "waiting" && waiting.some((w) => w.id === v.id))) &&
      `${v.client} ${v.plate} ${v.make} ${v.model} ${v.phone} ${v.vin || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function run(action: string, p: any = {}, id = v?.id) {
    if (!id || busy) return false;
    setBusy(true);
    try {
      return await onAction(
        action.startsWith("core.") ? action : `core.${action}`,
        id,
        p,
      );
    } finally {
      setBusy(false);
    }
  }
  const activeJobOf = (technician: string) =>
    db.vehicles.find(
      (c) =>
        c.id !== v?.id &&
        c.technician === technician &&
        c.present !== false &&
        c.status !== "Livré" &&
        !!workshopFor(db, c.id).runningSince,
    );
  const card = (label: string, count: number, kind: string) => (
    <button aria-pressed={filter === kind} onClick={() => setFilter(kind)}>
      <span className="metric-icon" aria-hidden="true">
        {kind === "present" ? (
          <Car size={27} />
        ) : kind === "active" ? (
          <Wrench size={27} />
        ) : kind === "waiting" ? (
          <Armchair size={27} />
        ) : (
          <Key size={27} />
        )}
      </span>
      <strong>{count}</strong>
      <span>{label}</span>
    </button>
  );
  return (
    <section className="core-workspace">
      {scope === "core" && (
        <>
          {" "}
          <div className="core-kpis">
            {card("Véhicules présents", present.length, "present")}
            {card(
              "Interventions en cours",
              present.filter((v) => v.status === "En intervention").length,
              "active",
            )}
            {card("Clients sur place", waiting.length, "waiting")}
            {card(
              "À restituer",
              present.filter((v) => v.status === "Prêt à livrer").length,
              "ready",
            )}
          </div>
        </>
      )}
      {scope === "operations" && (
        <nav className="workspace-tabs" aria-label="Filtrer les travaux">
          {[
            ["jobs", "À faire et en cours"],
            ["active", "En cours"],
            ["ready", "À restituer"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      <div className="core-columns">
        <aside className="core-list">
          <h2>
            {scope === "waiting"
              ? "Clients sur place"
              : scope === "operations"
                ? "Travaux de l’atelier"
                : "Véhicules à suivre"}
          </h2>
          <input
            aria-label="Rechercher un dossier opérationnel"
            placeholder="Plaque, client, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="core-filters">
            <button
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              Tous les dossiers
            </button>
          </div>
          {scope === "waiting" && (
            <p>
              Seules les arrivées enregistrées sont affichées. Pour accueillir
              un client existant, ouvrez son dossier depuis l’accueil.
            </p>
          )}
          {rows.map((car) => {
            const p = orderProgress(db, car.id);
            return (
              <button
                key={car.id}
                className={`core-car ${chosen === car.id ? "selected" : ""}`}
                onClick={() => setChosen(car.id)}
              >
                <strong>
                  {car.plate} · {car.make} {car.model}
                </strong>
                <span>{car.client}</span>
                <span>
                  {car.status} · {car.technician}
                </span>
                {p.percent !== null && (
                  <span>
                    <progress max={100} value={p.percent} />
                    {p.percent} % des travaux
                  </span>
                )}
                {car.technician === "Non affecté" && <b>À affecter</b>}
                {workshopFor(db, car.id).blocked && (
                  <b>
                    Bloqué
                    {workshopFor(db, car.id).pauseReason
                      ? ` · ${workshopFor(db, car.id).pauseReason}`
                      : ""}
                  </b>
                )}
              </button>
            );
          })}
          {!rows.length && <p>Aucun dossier dans ce filtre.</p>}
          {scope === "waiting" && !waiting.length && !!db.demoVersion && (
            <button
              disabled={busy}
              onClick={() => run("test-arrivals", {}, db.vehicles[0]?.id)}
            >
              Ajouter trois clients d’essai
            </button>
          )}
        </aside>
        <article className="core-detail" aria-label="Dossier opérationnel">
          {!v ? (
            <>
              <h2>Choisissez un dossier</h2>
              <p>Réception, travaux, pièces et restitution réunis ici.</p>
              <p>
                {orders.filter((o) => !o.deliveredAt).length} dossiers pris en
                charge.
              </p>
            </>
          ) : (
            <>
              <header className="core-vehicle-title">
                <span className="plate">{v.plate}</span>
                <h2>
                  {v.make} {v.model}
                </h2>
                <p>
                  {v.client} · {v.status}
                </p>
                <strong>
                  {o
                    ? "Prise en charge enregistrée"
                    : v.status === "Réception"
                      ? "Véhicule à prendre en charge"
                      : "Suivi des travaux à ouvrir"}
                </strong>
              </header>
              <div className="core-toolbar">
                <button
                  className="primary"
                  disabled={busy || v.status === "Livré"}
                  onClick={() => {
                    const step = nextWorkStep(db, v);
                    const target =
                      step.action === "assign"
                        ? assignment
                        : step.action === "billing"
                          ? billing
                          : step.action === "delivery"
                            ? delivery
                            : null;
                    if (target?.current) {
                      target.current.open = true;
                      target.current.scrollIntoView({ block: "nearest" });
                      return;
                    }
                    if (step.action === "quote") onQuotes(v.id);
                    else if (step.action === "work") onWorkshop(v.id);
                    else if (
                      [
                        "receive",
                        "open",
                        "quality",
                        "resume-delivery",
                      ].includes(step.action)
                    )
                      run(step.action);
                  }}
                >
                  {nextWorkStep(db, v).label}
                </button>
                <button onClick={() => onQuotes(v.id)}>Devis</button>
                <button onClick={() => on3D(v.id)}>Voir en 3D</button>
                {v.phone && (
                  <a href={`tel:${v.phone.replace(/[^+\d]/g, "")}`}>Appeler</a>
                )}
              </div>
              <p className="workflow-hint">{nextWorkStep(db, v).hint}</p>
              <div className="voice-shortcuts">
                <button onClick={() => setVoiceMode("report")}>
                  <Microphone size={20} /> Dicter le compte rendu
                </button>
                <button onClick={() => setVoiceMode("command")}>
                  Assistant atelier
                </button>
              </div>
              {voiceMode && (
                <VoiceAssistant
                  key={`${v.id}-${voiceMode}`}
                  db={db}
                  vehicle={v.id}
                  mode={voiceMode}
                  onAction={(type, p) => onAction(type, v.id, p)}
                  onClose={() => setVoiceMode("")}
                />
              )}
              <DeliveryDeadline db={db} vehicle={v} />
              <CurrentWork
                db={db}
                vehicle={v}
                showTasks={!o || !!o.deliveredAt}
              />
              <details
                ref={assignment}
                className="core-section core-disclosure"
              >
                <summary>Client sur place et technicien</summary>
                <div className="core-toolbar">
                  <button
                    disabled={
                      busy ||
                      v.status === "Livré" ||
                      (!!v.reception && v.reception.state !== "left")
                    }
                    onClick={() => run("arrival")}
                  >
                    Client arrivé · salle d’attente
                  </button>
                  <button
                    disabled={
                      busy || !v.reception || v.reception.state === "left"
                    }
                    onClick={() => run("departure")}
                  >
                    Client quitte la salle
                  </button>
                </div>
                {o && !o.deliveredAt && (
                  <form
                    key={`assign-${v.id}-${v.technician}-${v.bay}`}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      run("assign", {
                        technician: f.get("tech"),
                        bay: f.get("bay") === "" ? null : Number(f.get("bay")),
                      });
                    }}
                  >
                    <label>
                      Technicien
                      <select name="tech" defaultValue={v.technician}>
                        {technicians.map((t) => {
                          const job = activeJobOf(t);
                          return (
                            <option key={t} value={t}>
                              {t}
                              {job ? ` · en intervention sur ${job.plate}` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label>
                      Poste
                      <select name="bay" defaultValue={v.bay || ""}>
                        <option value="">Sans pont</option>
                        {Array.from({ length: 8 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            Poste {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button disabled={busy}>Confirmer l’affectation</button>
                    <p>
                      Un technicien déjà en intervention active ne peut pas être
                      affecté : mettez son chrono en pause ou choisissez
                      quelqu’un de disponible.
                    </p>
                  </form>
                )}
              </details>
              {o && !o.deliveredAt && (
                <section className="core-section">
                  <h3>Travaux demandés → réalisés</h3>
                  {o.tasks.map((t) => (
                    <label className="core-task" key={t.id}>
                      <input
                        type="checkbox"
                        checked={!!t.doneAt}
                        disabled={busy || v.status !== "En intervention"}
                        onChange={(e) =>
                          run("task", { task: t.id, done: e.target.checked })
                        }
                      />
                      {t.label}
                    </label>
                  ))}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      if (
                        await run("add-task", {
                          label: new FormData(form).get("label"),
                        })
                      )
                        form.reset();
                    }}
                  >
                    <input
                      name="label"
                      required
                      maxLength={500}
                      placeholder="Ajouter un travail demandé"
                    />
                    <button disabled={busy}>Ajouter</button>
                  </form>
                  <p>
                    Le pourcentage compte les travaux cochés, pas le temps
                    écoulé.
                  </p>
                </section>
              )}
              <details className="core-section core-disclosure">
                <summary>Chercher ou demander une pièce</summary>
                <input
                  aria-label="Rechercher une pièce"
                  placeholder="Disque, filtre, référence…"
                  value={partQuery}
                  onChange={(e) => setPartQuery(e.target.value)}
                />
                <p>
                  Disponibilité physique. Compatibilité avec ce véhicule à
                  vérifier par référence/VIN.
                </p>
                {partQuery.trim() &&
                  db.parts
                    .filter((p) =>
                      `${p.name} ${p.ref}`
                        .toLowerCase()
                        .includes(partQuery.toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((p) => (
                      <div className="core-part" key={p.id}>
                        <span>
                          <strong>{p.name}</strong> · {p.ref}
                          <br />
                          {p.stock - p.reserved} disponible(s) · {p.reserved}{" "}
                          réservé(s) · {p.location}
                        </span>
                        <button
                          disabled={busy || !o || !!o.deliveredAt}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await onAction("request", v.id, {
                                part: p.id,
                                quantity: 1,
                              });
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Demander 1 pièce
                        </button>
                      </div>
                    ))}
                {partQuery.trim() &&
                  !db.parts.some((p) =>
                    `${p.name} ${p.ref}`
                      .toLowerCase()
                      .includes(partQuery.toLowerCase()),
                  ) && (
                    <p>
                      Aucune référence correspondante. Aucune disponibilité
                      garantie.
                    </p>
                  )}
              </details>
              {o && (
                <>
                  <details
                    ref={billing}
                    className="core-section core-disclosure"
                  >
                    <summary>Devis et paiement</summary>
                    {(db.quotes || [])
                      .filter((q) => q.vehicle === v.id)
                      .map((q) => (
                        <div className="core-part" key={q.id}>
                          <span>
                            {q.id} · {q.state} ·{" "}
                            {money(Math.round(quoteTotals(q).total * 100))}
                          </span>
                          {q.state === "Validé" && !o.invoice && (
                            <button
                              disabled={busy}
                              onClick={() => run("invoice", { quote: q.id })}
                            >
                              Établir le décompte
                            </button>
                          )}
                        </div>
                      ))}
                    {!o.invoice ? (
                      <p>
                        Décompte non établi. Acceptez un devis après accord du
                        client.
                      </p>
                    ) : (
                      <>
                        <strong>
                          Reste à régler : {money(orderBalance(o) || 0)}
                        </strong>
                        <p>
                          Suivi interne ; facture réglementaire non générée.
                          Aucun débit bancaire n’est effectué.
                        </p>
                        {o.payments.map((p) => (
                          <p key={p.id}>
                            {money(p.cents)} · {p.method} · {p.reference} ·{" "}
                            {new Date(p.at).toLocaleString("fr-FR")}
                          </p>
                        ))}
                        {!o.deliveredAt && (orderBalance(o) || 0) > 0 && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const f = new FormData(e.currentTarget);
                              await run("payment", {
                                cents: Math.round(
                                  Number(f.get("amount")) * 100,
                                ),
                                reference: f.get("reference"),
                                method: f.get("method"),
                              });
                            }}
                          >
                            <label>
                              Montant reçu (€)
                              <input
                                name="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                max={(orderBalance(o) || 0) / 100}
                              />
                            </label>
                            <label>
                              Référence justificative
                              <input
                                name="reference"
                                required
                                maxLength={160}
                              />
                            </label>
                            <label>
                              Moyen
                              <select name="method">
                                <option>Carte</option>
                                <option>Espèces</option>
                                <option>Virement</option>
                              </select>
                            </label>
                            <button disabled={busy}>
                              Confirmer le règlement reçu
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </details>
                  <details
                    ref={delivery}
                    className="core-section core-disclosure"
                  >
                    <summary>Préparer la restitution</summary>
                    {o.contact ? (
                      <p>
                        Contact consigné : {o.contact.channel} ·{" "}
                        {o.contact.note} ·{" "}
                        {new Date(o.contact.at).toLocaleString("fr-FR")}
                      </p>
                    ) : (
                      <p>Client averti : aucune confirmation enregistrée.</p>
                    )}

                    {!o.deliveredAt && (
                      <>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            run("contact", {
                              channel: f.get("channel"),
                              note: f.get("note"),
                            });
                          }}
                        >
                          <select
                            aria-label="Canal de contact effectué"
                            name="channel"
                          >
                            <option>Téléphone</option>
                            <option>Sur place</option>
                          </select>
                          <input
                            name="note"
                            placeholder="Compte rendu du contact effectué"
                            required
                            maxLength={1000}
                          />
                          <button disabled={busy}>Consigner le contact</button>
                        </form>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            run("pickup", {
                              at: new Date(String(f.get("at"))).toISOString(),
                            });
                          }}
                        >
                          <label>
                            Récupération confirmée · heure de cet appareil
                            <input type="datetime-local" required name="at" />
                          </label>
                          <button disabled={busy}>
                            Enregistrer le créneau
                          </button>
                        </form>
                        <details>
                          <summary>
                            Horaires du garage ·{" "}
                            {db.openingHours
                              ? `${db.openingHours.opens}–${db.openingHours.closes}`
                              : "à configurer"}
                          </summary>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const f = new FormData(e.currentTarget);
                              run("hours", {
                                opens: f.get("opens"),
                                closes: f.get("closes"),
                                weekdays: f.getAll("days").map(Number),
                              });
                            }}
                          >
                            <label>
                              Ouverture (Europe/Lisbon)
                              <input
                                type="time"
                                name="opens"
                                required
                                defaultValue={db.openingHours?.opens || "08:00"}
                              />
                            </label>
                            <label>
                              Fermeture
                              <input
                                type="time"
                                name="closes"
                                required
                                defaultValue={
                                  db.openingHours?.closes || "18:00"
                                }
                              />
                            </label>
                            {[
                              "Dim",
                              "Lun",
                              "Mar",
                              "Mer",
                              "Jeu",
                              "Ven",
                              "Sam",
                            ].map((day, i) => (
                              <label key={day}>
                                <input
                                  type="checkbox"
                                  name="days"
                                  value={i}
                                  defaultChecked={(
                                    db.openingHours?.weekdays || [1, 2, 3, 4, 5]
                                  ).includes(i)}
                                />
                                {day}
                              </label>
                            ))}
                            <button disabled={busy}>
                              Confirmer les horaires du garage
                            </button>
                          </form>
                          <p>
                            Les créneaux hors ouverture sont refusés. Jours
                            fériés non configurés.
                          </p>
                        </details>
                        {!db.openingHours && (
                          <p className="core-warning">
                            Horaires du garage non renseignés : les créneaux
                            hors ouverture ne sont pas détectés. Confirmez-les
                            ci-dessus pour activer ce contrôle.
                          </p>
                        )}
                        <button
                          disabled={busy || v.status !== "Contrôle qualité"}
                          onClick={() => run("quality")}
                        >
                          Valider le contrôle final
                        </button>
                        <ul>
                          {deliveryBlocks(db, v.id).map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            run("deliver", {
                              keysConfirmed:
                                new FormData(e.currentTarget).get("keys") ===
                                "on",
                            });
                          }}
                        >
                          <label>
                            <input type="checkbox" name="keys" required /> Clés
                            remises au destinataire vérifié
                          </label>
                          <button
                            className="primary"
                            disabled={
                              busy || deliveryBlocks(db, v.id).length > 0
                            }
                          >
                            Confirmer la livraison
                          </button>
                        </form>
                      </>
                    )}
                    {o.pickupAt && (
                      <p>
                        Créneau : {new Date(o.pickupAt).toLocaleString("fr-FR")}
                      </p>
                    )}
                    {o.deliveredAt && (
                      <strong>
                        Livré le{" "}
                        {new Date(o.deliveredAt).toLocaleString("fr-FR")}
                      </strong>
                    )}
                  </details>
                </>
              )}
              <MessageComposer
                key={v.id}
                db={db}
                id={v.id}
                onAction={(type, p) => onAction(type, v.id, p)}
              />
              <details className="core-section">
                <summary>
                  Comptes rendus de l’atelier (
                  {workshopFor(db, v.id).reports.length})
                </summary>
                {workshopFor(db, v.id).reports.map((r) => (
                  <article className="guided-item" key={r.id}>
                    <small>{new Date(r.at).toLocaleString("fr-FR")}</small>
                    <p>{r.text}</p>
                  </article>
                ))}
              </details>
              <details className="core-section">
                <summary>Historique du dossier</summary>
                {exampleHistory(db, v).length > 0 && (
                  <>
                    <h4>Visites précédentes · exemples du jeu d’essai</h4>
                    {exampleHistory(db, v).map((h) => (
                      <article className="history-visit" key={h.id}>
                        <strong>{h.label}</strong>
                        <span>
                          {h.date} · {h.km.toLocaleString("fr-FR")} km
                        </span>
                      </article>
                    ))}
                  </>
                )}

                {db.audit
                  .filter((a) => a.vehicle === v.id)
                  .slice(0, 30)
                  .map((a) => (
                    <p key={a.id}>
                      {new Date(a.at).toLocaleString("fr-FR")} · {a.action}
                    </p>
                  ))}
              </details>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
