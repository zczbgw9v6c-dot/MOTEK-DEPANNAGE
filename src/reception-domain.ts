import { record, type DB, type Vehicle } from "./domain.ts";
export function receptionLabel(v: Vehicle, now = Date.now()) {
  if (!v.reception) return "Arrivée non enregistrée";
  if (v.reception.state === "left") return "Client parti";
  if (v.reception.state === "received") return "Pris en charge";
  return `En attente · ${Math.max(0, Math.floor((now - Date.parse(v.reception.arrivedAt)) / 60000))} min`;
}
export function receiveClient(
  db: DB,
  id: string,
  state: "waiting" | "received" | "left",
  now = new Date().toISOString(),
): DB {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v || v.present === false || v.status === "Livré")
    throw Error("Ce dossier ne peut pas être accueilli.");
  if (!Number.isFinite(Date.parse(now))) throw Error("Date invalide.");
  if (v.reception?.state === state) return db;
  const reception = {
    arrivedAt:
      !v.reception || v.reception.state === "left"
        ? now
        : v.reception.arrivedAt,
    state,
    ...(state === "received" ? { receivedAt: now } : {}),
  };
  return record(
    {
      ...db,
      vehicles: db.vehicles.map((x) => (x.id === id ? { ...x, reception } : x)),
    },
    id,
    state === "waiting"
      ? "Arrivée du client enregistrée"
      : state === "received"
        ? "Client pris en charge à la réception"
        : "Départ du client de la salle d’attente",
  );
}
