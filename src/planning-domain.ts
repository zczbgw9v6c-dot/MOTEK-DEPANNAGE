import type { DB, Vehicle } from "./domain.ts";
import { record, updateVehicle } from "./domain.ts";
import { team, resources, departments, type Department } from "./team-data.ts";
export { team, resources, departments } from "./team-data.ts";
export type { Department, Technician } from "./team-data.ts";
export type Appointment = {
  id: string;
  vehicle: string;
  technician: string;
  resource: string;
  department: Department;
  start: string;
  duration: number;
  promised: string;
  priority: "Normale" | "Haute";
  requiredParts: string[];
  requiresQuote: boolean;
  state: "Planifié" | "En cours" | "En pause" | "Terminé";
  arrived: boolean;
};
export type PlanningAlert = {
  code: string;
  message: string;
  vehicle: string;
  appointment: string;
  blocking: boolean;
};
export function endAt(a: Appointment) {
  return new Date(Date.parse(a.start) + a.duration * 60000).toISOString();
}
export function overlaps(a: Appointment, b: Appointment) {
  return (
    Date.parse(a.start) < Date.parse(endAt(b)) &&
    Date.parse(b.start) < Date.parse(endAt(a))
  );
}
export function planningAlerts(
  db: DB,
  appointments = db.appointments || [],
  now = Date.now(),
): PlanningAlert[] {
  const alerts: PlanningAlert[] = [];
  for (const a of appointments.filter((a) => a.state !== "Terminé")) {
    const v = db.vehicles.find((v) => v.id === a.vehicle);
    const technician = team.find((t) => t.name === a.technician);
    const push = (code: string, message: string, blocking = false) =>
      alerts.push({
        code,
        message,
        vehicle: a.vehicle,
        appointment: a.id,
        blocking,
      });
    for (const b of appointments) {
      if (b.id === a.id || b.state === "Terminé" || !overlaps(a, b)) continue;
      if (a.technician === b.technician)
        push(
          "technician_conflict",
          `${a.technician} est déjà réservé sur ${db.vehicles.find((v) => v.id === b.vehicle)?.plate}.`,
          true,
        );
      if (a.resource === b.resource)
        push(
          "resource_conflict",
          `${resources.find((r) => r.id === a.resource)?.name || a.resource} est réservé deux fois.`,
          true,
        );
    }
    if (technician && !technician.skills.includes(a.department))
      push(
        "skill",
        `${a.technician} n’a pas la compétence ${a.department} enregistrée.`,
        true,
      );
    if (!a.arrived) push("not_arrived", "Véhicule non encore arrivé.");
    if (
      a.requiresQuote &&
      !(db.quotes || []).some(
        (q) => q.vehicle === a.vehicle && q.state === "Validé",
      )
    )
      push("quote", "Accord sur devis non enregistré.", true);
    for (const id of a.requiredParts) {
      const p = db.parts.find((p) => p.id === id);
      const held = v?.partReservations?.[id] || (v?.parts.includes(id) ? 1 : 0);
      if (p && p.stock - p.reserved + held < 1)
        push("part", `Pièce indisponible : ${p.name}.`, true);
    }
    if (a.duration < (v?.estimatedMinutes || 15))
      push("duration", "Durée inférieure à l’estimation enregistrée.");
    if (Date.parse(endAt(a)) > Date.parse(a.promised))
      push("promise", "Livraison promise avant la fin prévisionnelle.");
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(a.start));
    const endTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(endAt(a)));
    if (
      technician &&
      (time < technician.shiftStart ||
        endTime > technician.shiftEnd ||
        endAt(a).slice(0, 10) !== a.start.slice(0, 10))
    )
      push("hours", "Réservation hors des horaires enregistrés.");
    if (
      Date.parse(endAt(a)) < now &&
      ["En cours", "En pause"].includes(a.state)
    )
      push("late", "Fin prévue dépassée.");
    const concurrent = appointments.filter(
      (b) =>
        b.state !== "Terminé" &&
        b.department === a.department &&
        overlaps(a, b),
    );
    const capacity = resources.filter(
      (r) => r.department === a.department,
    ).length;
    if (capacity && concurrent.length > capacity)
      push("department", "Capacité du département dépassée.");
  }
  return alerts;
}
export function moveAppointment(
  db: DB,
  id: string,
  patch: Partial<Appointment>,
): DB {
  const old = db.appointments?.find((a) => a.id === id);
  if (!old) throw Error("Réservation introuvable.");
  if (old.state === "Terminé")
    throw Error("Une réservation terminée ne peut plus être déplacée.");
  const next = { ...old, ...patch, id: old.id, vehicle: old.vehicle };
  if (
    !Number.isFinite(next.duration) ||
    next.duration < 15 ||
    next.duration > 600 ||
    !Number.isFinite(Date.parse(next.start)) ||
    !Number.isFinite(Date.parse(next.promised)) ||
    !team.some((t) => t.name === next.technician) ||
    !resources.some((r) => r.id === next.resource)
  )
    throw Error("Réservation invalide.");
  const appointments = db.appointments!.map((a) => (a.id === id ? next : a));
  const blocking = planningAlerts(db, appointments).filter(
    (a) =>
      a.appointment === id &&
      ["resource_conflict", "technician_conflict", "skill"].includes(a.code),
  );
  if (blocking.length) throw Error(blocking[0].message);
  let updated: DB = { ...db, appointments };
  const vehicle = db.vehicles.find((v) => v.id === next.vehicle)!;
  if (next.state === "En cours") {
    const resource = resources.find((r) => r.id === next.resource)!;
    updated = updateVehicle(updated, vehicle.id, {
      technician: next.technician,
      bay: resource.bay,
    });
  } else
    updated = {
      ...updated,
      vehicles: updated.vehicles.map((v) =>
        v.id === next.vehicle ? { ...v, technician: next.technician } : v,
      ),
    };
  return record(
    updated,
    next.vehicle,
    "Planning modifié : " + next.technician + " · " + next.start,
  );
}
export function nextAvailable(db: DB, a: Appointment, notBefore = Date.now()) {
  let start = Math.max(Date.parse(a.start), notBefore);
  start = Math.ceil(start / (15 * 60000)) * 15 * 60000;
  for (let i = 0; i < 7 * 24 * 4; i++, start += 15 * 60000) {
    const candidate = { ...a, start: new Date(start).toISOString() };
    const others = (db.appointments || []).filter(
      (b) => b.id !== a.id && b.state !== "Terminé",
    );
    const hours = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(start));
    const endHours = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(endAt(candidate)));
    const tech = team.find((t) => t.name === a.technician);
    if (
      !tech ||
      !tech.skills.includes(a.department) ||
      hours < tech.shiftStart ||
      endHours > tech.shiftEnd ||
      candidate.start.slice(0, 10) !== endAt(candidate).slice(0, 10)
    )
      continue;
    if (
      !others.some(
        (b) =>
          (b.technician === a.technician || b.resource === a.resource) &&
          overlaps(candidate, b),
      )
    )
      return candidate.start;
  }
  return null;
}

export function toCalendarInput(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(value))
    .replace(" ", "T");
}
export function fromCalendarInput(value: string) {
  const assumed = Date.parse(value + "Z");
  if (!Number.isFinite(assumed)) throw Error("Date invalide.");
  const offset =
    Date.parse(toCalendarInput(new Date(assumed).toISOString()) + "Z") -
    assumed;
  return new Date(assumed - offset).toISOString();
}
