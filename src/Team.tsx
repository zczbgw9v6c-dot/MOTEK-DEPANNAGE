import { Car, ArrowRight, Clock, ShieldCheck } from "@phosphor-icons/react";
import { team } from "./planning-domain";
import { dashboard } from "./dashboard-domain";
import { workshopFor, elapsedSeconds } from "./workshop-domain";
import type { DB } from "./domain";
export function Team({ db, onOpen }: { db: DB; onOpen: (id: string) => void }) {
  const live = dashboard(db);
  return (
    <section className="content-card">
      <div className="section-head">
        <h2>Huit métiers, une équipe.</h2>
        <span className="small-chip">
          {team.length} profils fictifs · {live.availableTech.length} sans
          session active
        </span>
      </div>
      <div className="team-v2">
        {team.map((t) => {
          const jobs = live.present.filter((v) => v.technician === t.name);
          const active = jobs.filter(
            (v) => !!workshopFor(db, v.id).runningSince,
          );
          const minutes = (db.appointments || [])
            .filter((a) => a.technician === t.name && a.state !== "Terminé")
            .reduce((s, a) => s + a.duration, 0);
          const seconds = db.vehicles
            .filter((v) => v.technician === t.name)
            .reduce((s, v) => s + elapsedSeconds(workshopFor(db, v.id)), 0);
          return (
            <article className="team-profile" key={t.id}>
              <div className="team-profile-top">
                <span style={{ background: t.color }}>
                  {t.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h3>{t.name}</h3>
                  <p>{t.specialty}</p>
                </div>
                <i className={active.length ? "working" : ""} />
              </div>
              <div className="team-skills">
                {t.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="team-numbers">
                <div>
                  <strong>{jobs.length}</strong>
                  <small>Dossiers présents</small>
                </div>
                <div>
                  <strong>{Math.round((minutes / 60) * 10) / 10} h</strong>
                  <small>Charge réservée</small>
                </div>
                <div>
                  <strong>{Math.floor(seconds / 60)} min</strong>
                  <small>Travail chronométré</small>
                </div>
              </div>
              <div className="team-quality">
                <ShieldCheck size={17} />
                {
                  db.vehicles.filter(
                    (v) => v.technician === t.name && v.quality,
                  ).length
                }{" "}
                contrôles documentés ·{" "}
                {
                  (db.diagnosticCases || []).filter(
                    (c) =>
                      c.recurred &&
                      db.vehicles.find((v) => v.id === c.vehicleId)
                        ?.technician === t.name,
                  ).length
                }{" "}
                retour(s) fictif(s)
              </div>
              {jobs.map((v) => (
                <button
                  className="team-task"
                  key={v.id}
                  onClick={() => onOpen(v.id)}
                >
                  <Car size={20} />
                  <span>
                    {v.make} {v.model}
                    <small>
                      {v.plate} · {v.status}
                      {workshopFor(db, v.id).blocked ? " · Bloqué" : ""}
                    </small>
                  </span>
                  <ArrowRight />
                </button>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}
