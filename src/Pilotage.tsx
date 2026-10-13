import {
  Car,
  CheckCircle,
  WarningCircle,
  Clock,
  Package,
  ArrowRight,
  FileText,
  Users,
  ChartLine,
} from "@phosphor-icons/react";
import { ManagerRequests } from "./ManagerRequests";
import { dashboard } from "./dashboard-domain";
import type { DB } from "./domain";
export function Pilotage({
  db,
  onOpen,
  onFilter,
  onView,
  commit,
  onAction,
}: {
  db: DB;
  onOpen: (id: string) => void;
  onFilter: (filter: string) => void;
  onView: (view: string) => void;
  commit: (fn: (db: DB) => DB, message?: string) => unknown;
  onAction: (id: string, type: string, payload: any) => Promise<boolean>;
}) {
  const d = dashboard(db);
  const metrics = [
    ["Présents", d.present.length, "present", Car],
    ["En cours", d.running.length, "running", Clock],
    ["Bloqués", d.blocked.length, "blocked", WarningCircle],
    ["Devis validés", d.accepted.length, "devis", FileText],
    ["Devis en attente", d.pending.length, "devis", FileText],
    ["Prêts à livrer", d.ready.length, "ready", CheckCircle],
    ["En retard", d.late.length, "late", Clock],
    ["Techniciens libres", d.availableTech.length, "equipe", Users],
    ["Ponts occupés", d.occupied.length, "planning", ChartLine],
    ["Stock critique", d.critical.length, "stocks", Package],
  ] as const;
  return (
    <section className="pilotage-v2">
      <ManagerRequests db={db} onAction={onAction} />
      <div className="dashboard-grid">
        {metrics.map(([label, count, filter, Icon]) => (
          <button
            className="dashboard-metric"
            key={label}
            onClick={() =>
              ["devis", "equipe", "planning", "stocks"].includes(filter)
                ? onView(filter)
                : onFilter(filter)
            }
          >
            <Icon size={23} />
            <strong>{count}</strong>
            <span>{label}</span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="director-grid">
        <article className="content-card">
          <h3>Alertes à traiter</h3>
          {d.alerts.slice(0, 12).map((a) => (
            <button
              className="manager-alert"
              key={a.id}
              onClick={() => onOpen(a.vehicle)}
            >
              <WarningCircle size={22} />
              <span>
                <strong>{a.message}</strong>
                <small>
                  {db.vehicles.find((v) => v.id === a.vehicle)?.plate} ·{" "}
                  {a.kind}
                </small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
          {!d.alerts.length && <p className="empty">Aucune alerte ouverte.</p>}
        </article>
        <article className="content-card">
          <h3>Prochaines livraisons</h3>
          {d.ready.map((v) => (
            <button
              className="manager-alert ready"
              key={v.id}
              onClick={() => onOpen(v.id)}
            >
              <CheckCircle size={22} />
              <span>
                <strong>
                  {v.make} {v.model}
                </strong>
                <small>{v.plate} · Contrôle final validé</small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
          <h3 className="turnover">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(d.turnover)}
          </h3>
          <p>
            Chiffre d’affaires des factures fictives marquées payées, calculé
            depuis les enregistrements.
          </p>
          <button
            className="secondary full"
            onClick={() => onFilter("invoiced")}
          >
            Voir les dossiers facturés
          </button>
        </article>
      </div>
      <div className="director-grid">
        <article className="content-card">
          <h3>Rendez-vous à venir</h3>
          {d.appointments.slice(0, 6).map((a) => (
            <button
              className="manager-alert"
              key={a.id}
              onClick={() => onOpen(a.vehicle)}
            >
              <Clock size={20} />
              <span>
                <strong>
                  {db.vehicles.find((v) => v.id === a.vehicle)?.make}{" "}
                  {db.vehicles.find((v) => v.id === a.vehicle)?.model}
                </strong>
                <small>
                  {new Date(a.start).toLocaleString("fr-FR", {
                    timeZone: "Europe/Lisbon",
                  })}{" "}
                  · {a.technician}
                </small>
              </span>
            </button>
          ))}
        </article>
        <article className="content-card">
          <h3>Entretiens à vérifier</h3>
          {(db.maintenance || []).map((m) => (
            <button
              className="manager-alert"
              key={m.id}
              onClick={() => onOpen(m.vehicle)}
            >
              <Car size={20} />
              <span>
                <strong>
                  {db.vehicles.find((v) => v.id === m.vehicle)?.plate}
                </strong>
                <small>{m.label} · consentement relance non enregistré</small>
              </span>
            </button>
          ))}
        </article>
      </div>
      <section className="content-card">
        <h3>Activité récente</h3>
        <div className="audit-list">
          {db.audit.slice(0, 20).map((a) => (
            <div key={a.id}>
              <CheckCircle size={18} />
              <span>
                {a.action}
                <small>
                  {db.vehicles.find((v) => v.id === a.vehicle)?.plate ||
                    "Atelier"}
                </small>
              </span>
              <time>{new Date(a.at).toLocaleString("fr-FR")}</time>
            </div>
          ))}
          {!db.audit.length && (
            <p className="empty">
              Les actions effectuées dans le CRM apparaîtront ici.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
