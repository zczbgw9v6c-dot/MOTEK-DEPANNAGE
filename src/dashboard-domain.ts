import type { DB, Vehicle } from "./domain.ts";
import { team, planningAlerts } from "./planning-domain.ts";
import { workshopFor, elapsedSeconds } from "./workshop-domain.ts";
export type ManagerAlert = {
  id: string;
  vehicle: string;
  kind: string;
  message: string;
  at: string;
  resolved: boolean;
};
export const isPresent = (v: Vehicle) =>
  v.present !== false && v.status !== "Livré";
export function dashboard(db: DB, now = Date.now()) {
  const present = db.vehicles.filter(isPresent);
  const ready = present.filter((v) => v.status === "Prêt à livrer");
  const blocked = present.filter((v) => workshopFor(db, v.id).blocked);
  const running = present.filter((v) => !!workshopFor(db, v.id).runningSince);
  const late = present.filter((v) =>
    (db.appointments || []).some(
      (a) =>
        a.vehicle === v.id &&
        a.state !== "Terminé" &&
        Date.parse(a.start) + a.duration * 60000 < now,
    ),
  );
  const critical = db.parts.filter((p) => p.stock - p.reserved < p.threshold);
  const accepted = (db.quotes || []).filter((q) => q.state === "Validé");
  const pending = (db.quotes || []).filter((q) => q.state === "À valider");
  const availableTech = team.filter(
    (t) => !running.some((v) => v.technician === t.name),
  );
  return {
    present,
    ready,
    blocked,
    running,
    late,
    critical,
    accepted,
    pending,
    availableTech,
    occupied: present.filter((v) => v.bay !== null),
    turnover: (db.invoices || [])
      .filter((i) => i.state === "Payée")
      .reduce((s, i) => s + i.total, 0),
    appointments: (db.appointments || []).filter(
      (a) => a.state === "Planifié" && Date.parse(a.start) > now,
    ),
    alerts: [
      ...(db.alerts || []).filter((a) => !a.resolved),
      ...planningAlerts(db, undefined, now).map((a) => ({
        id: a.appointment + "-" + a.code,
        vehicle: a.vehicle,
        kind: "planning",
        message: a.message,
        at: db.appointments?.find((p) => p.id === a.appointment)?.start || "",
        resolved: false,
      })),
    ],
  };
}
