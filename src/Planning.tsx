import { useState } from "react";
import {
  CalendarDots,
  Clock,
  ArrowUpRight,
  WarningCircle,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  toCalendarInput,
  fromCalendarInput,
  team,
  resources,
  departments,
  planningAlerts,
  nextAvailable,
  moveAppointment,
  endAt,
  type Appointment,
} from "./planning-domain";
import { type DB } from "./domain";
const time = (s: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
export function Planning({
  db,
  commit,
  onOpen,
}: {
  db: DB;
  commit: (fn: (db: DB) => DB, message?: string) => unknown;
  onOpen: (id: string) => void;
}) {
  const [view, setView] = useState("technicians"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [lateOnly, setLate] = useState(false),
    [editing, setEditing] = useState<string | null>(null),
    [start, setStart] = useState(""),
    [duration, setDuration] = useState(60);
  const alerts = planningAlerts(db),
    appointments = (db.appointments || []).filter(
      (a) =>
        a.start.slice(0, 10) === date &&
        (!lateOnly ||
          alerts.some((x) => x.appointment === a.id && x.code === "late")),
    );
  const lanes =
    view === "technicians"
      ? team.map((t) => ({ id: t.name, name: t.name, detail: t.specialty }))
      : view === "resources"
        ? resources.map((r) => ({
            id: r.id,
            name: r.name,
            detail: r.department,
          }))
        : departments.map((d) => ({
            id: d,
            name: d,
            detail: "Charge du département",
          }));
  const selected = db.appointments?.find((a) => a.id === editing);
  const getLane = (a: Appointment) =>
    view === "technicians"
      ? a.technician
      : view === "resources"
        ? a.resource
        : a.department;
  function drop(id: string, lane: string) {
    const a = db.appointments?.find((a) => a.id === id);
    if (!a) return;
    if (view === "departments") return;
    commit(
      (d) =>
        moveAppointment(
          d,
          id,
          view === "technicians" ? { technician: lane } : { resource: lane },
        ),
      "Réaffectation enregistrée.",
    );
  }
  return (
    <section className="planning-v2">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            RESSOURCES RÉELLES · HORAIRES LISBONNE
          </span>
          <h2>Le rythme de votre atelier.</h2>
        </div>
        <div className="planning-controls">
          <input
            aria-label="Date du planning"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="check-label">
            <input
              type="checkbox"
              checked={lateOnly}
              onChange={(e) => setLate(e.target.checked)}
            />
            Retards
          </label>
        </div>
      </div>
      <div className="planning-tabs">
        {[
          ["technicians", "Par technicien"],
          ["resources", "Par ressource"],
          ["departments", "Par département"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={view === id ? "on" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="planning-help">
        Glissez une carte vers une autre ligne, ou utilisez Modifier. Les
        conflits et compétences sont contrôlés avant enregistrement.
      </p>
      <div className="schedule-board">
        {lanes.map((lane) => {
          const jobs = appointments.filter((a) => getLane(a) === lane.id);
          const minutes = jobs
            .filter((a) => a.state !== "Terminé")
            .reduce((n, a) => n + a.duration, 0);
          return (
            <div
              className="schedule-lane"
              key={lane.id}
              onDragOver={(e) => {
                if (view !== "departments") e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(e.dataTransfer.getData("text/plain"), lane.id);
              }}
            >
              <div className="lane-person">
                <strong>{lane.name}</strong>
                <small>{lane.detail}</small>
                <span>{Math.round((minutes / 60) * 10) / 10} h planifiées</span>
              </div>
              <div className="lane-jobs">
                {jobs.map((a) => {
                  const v = db.vehicles.find((v) => v.id === a.vehicle)!;
                  const flags = alerts.filter((x) => x.appointment === a.id);
                  return (
                    <article
                      draggable={
                        a.state !== "Terminé" && view !== "departments"
                      }
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", a.id)
                      }
                      className={
                        "schedule-card " +
                        (a.state === "Terminé"
                          ? "complete"
                          : flags.some((f) => f.blocking)
                            ? "blocked"
                            : "")
                      }
                      key={a.id}
                    >
                      <div>
                        <span>
                          {time(a.start)} — {time(endAt(a))}
                        </span>
                        <span>
                          {a.priority === "Haute" ? "Priorité haute" : a.state}
                        </span>
                      </div>
                      <h3>
                        {v.make} {v.model}
                      </h3>
                      <small>
                        {v.plate} · {v.symptoms}
                      </small>
                      <div className="schedule-meta">
                        <Clock size={14} />
                        {a.duration} min · {v.status}
                      </div>
                      <div className="schedule-actions">
                        <button onClick={() => onOpen(v.id)}>
                          <ArrowUpRight size={15} />
                          Dossier / 3D
                        </button>
                        <button
                          disabled={a.state === "Terminé"}
                          onClick={() => {
                            setEditing(a.id);
                            setStart(toCalendarInput(a.start));
                            setDuration(a.duration);
                          }}
                        >
                          Modifier
                        </button>
                      </div>
                      {flags.length > 0 && (
                        <p className="schedule-warning">
                          <WarningCircle size={14} />
                          {flags[0].message}
                          {flags.length > 1
                            ? " + " + (flags.length - 1) + " alertes"
                            : ""}
                        </p>
                      )}
                    </article>
                  );
                })}
                {!jobs.length && (
                  <div className="lane-free">
                    <CheckCircle size={17} />
                    Aucune réservation ce jour
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="planning-editor content-card">
          <div className="section-head">
            <h3>
              Modifier la réservation ·{" "}
              {db.vehicles.find((v) => v.id === selected.vehicle)?.plate}
            </h3>
            <button className="secondary" onClick={() => setEditing(null)}>
              Fermer
            </button>
          </div>
          <div className="form-grid">
            <label>
              Début · heure de Lisbonne
              <input
                aria-label="Début de réservation"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Durée (minutes)
              <input
                aria-label="Durée de réservation"
                type="number"
                min="15"
                max="600"
                step="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
            <label>
              Technicien
              <select
                value={selected.technician}
                onChange={(e) =>
                  commit(
                    (d) =>
                      moveAppointment(d, selected.id, {
                        technician: e.target.value,
                      }),
                    "Technicien réaffecté.",
                  )
                }
              >
                {team.map((t) => (
                  <option key={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label>
              Ressource
              <select
                value={selected.resource}
                onChange={(e) =>
                  commit(
                    (d) =>
                      moveAppointment(d, selected.id, {
                        resource: e.target.value,
                      }),
                    "Ressource modifiée.",
                  )
                }
              >
                {resources.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="primary"
            onClick={() =>
              commit(
                (d) =>
                  moveAppointment(d, selected.id, {
                    start: fromCalendarInput(start),
                    duration,
                  }),
                "Horaire enregistré.",
              )
            }
          >
            Enregistrer l’horaire
          </button>
          {nextAvailable(db, { ...selected, duration }) && (
            <div className="subtle-note">
              <Clock />
              <span>
                Premier créneau libre calculé :{" "}
                {new Date(
                  nextAvailable(db, { ...selected, duration })!,
                ).toLocaleString("fr-FR", { timeZone: "Europe/Lisbon" })}
                . Les pièces et l’accord client restent à vérifier.
              </span>
              <button
                className="secondary"
                onClick={() => {
                  const proposed = nextAvailable(db, { ...selected, duration });
                  if (proposed)
                    commit(
                      (d) =>
                        moveAppointment(d, selected.id, {
                          start: proposed,
                          duration,
                        }),
                      "Créneau proposé enregistré.",
                    );
                }}
              >
                Appliquer
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
