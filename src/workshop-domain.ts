import {
  record,
  updateVehicle,
  reservePart,
  type DB,
  type Vehicle,
} from "./domain.ts";
export type WorkshopPhoto = { id: string; data: string; at: string };
export type WorkshopState = {
  elapsed: number;
  runningSince: string | null;
  checks: { repair: boolean; safety: boolean; test: boolean };
  keyLocation: string;
  issues: { id: string; text: string; at: string }[];
  photos: WorkshopPhoto[];
  reports: { id: string; text: string; at: string }[];
  requests: { id: string; part: string; at: string; state: string }[];
};
export const emptyWorkshop = (): WorkshopState => ({
  elapsed: 0,
  runningSince: null,
  checks: { repair: false, safety: false, test: false },
  keyLocation: "Accueil · casier à préciser",
  issues: [],
  photos: [],
  reports: [],
  requests: [],
});
export function workshopFor(db: DB, id: string): WorkshopState {
  return db.workshop && Object.hasOwn(db.workshop, id)
    ? db.workshop[id]
    : emptyWorkshop();
}
export function patchWorkshop(
  db: DB,
  id: string,
  patch: Partial<WorkshopState>,
  action: string,
): DB {
  if (!db.vehicles.some((v) => v.id === id))
    throw Error("Dossier introuvable.");
  return record(
    {
      ...db,
      workshop: { ...db.workshop, [id]: { ...workshopFor(db, id), ...patch } },
    },
    id,
    action,
  );
}
export function elapsedSeconds(state: WorkshopState, now = Date.now()) {
  return (
    state.elapsed +
    (state.runningSince
      ? Math.max(
          0,
          Math.floor((now - new Date(state.runningSince).getTime()) / 1000),
        )
      : 0)
  );
}
export function toggleWork(db: DB, id: string, now = Date.now()): DB {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v) throw Error("Dossier introuvable.");
  const s = workshopFor(db, id);
  if (s.runningSince)
    return patchWorkshop(
      db,
      id,
      { elapsed: elapsedSeconds(s, now), runningSince: null },
      "Intervention mise en pause",
    );
  if (
    ["Devis à valider", "Prêt à livrer", "Livré", "Contrôle qualité"].includes(
      v.status,
    )
  )
    throw Error(
      "Ce statut ne permet pas de démarrer : vérifiez le devis ou le contrôle final.",
    );
  if (v.technician === "Non affecté")
    throw Error("Affectez un technicien avant de démarrer.");
  const next = updateVehicle(db, id, { status: "En intervention" });
  return patchWorkshop(
    next,
    id,
    { runningSince: new Date(now).toISOString() },
    "Intervention démarrée",
  );
}
export function finishWork(db: DB, id: string, now = Date.now()) {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v || v.status !== "En intervention")
    throw Error("Démarrez d’abord l’intervention.");
  const s = workshopFor(db, id);
  if (!Object.values(s.checks).every(Boolean))
    throw Error("Complétez les trois points de contrôle avant de terminer.");
  const next = patchWorkshop(
    db,
    id,
    { elapsed: elapsedSeconds(s, now), runningSince: null },
    "Travaux terminés, contrôle final demandé",
  );
  return updateVehicle(next, id, {
    status: "Contrôle qualité",
    quality: false,
  });
}
export function requestPart(db: DB, id: string, part: string) {
  const p = db.parts.find((p) => p.id === part);
  if (!p) throw Error("Pièce introuvable.");
  const s = workshopFor(db, id);
  if (s.requests.some((r) => r.part === part && r.state !== "Annulée"))
    throw Error("Une demande existe déjà pour cette pièce.");
  let next = db;
  let state = "En attente magasin";
  if (p.stock - p.reserved > 0) {
    next = reservePart(db, id, part);
    state = "Réservée · compatibilité à confirmer";
  }
  return patchWorkshop(
    next,
    id,
    {
      requests: [
        ...s.requests,
        { id: crypto.randomUUID(), part, at: new Date().toISOString(), state },
      ],
    },
    "Demande de pièce : " + p.name,
  );
}
export function duplicateVehicle(db: DB, v: Vehicle) {
  const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return db.vehicles.find(
    (c) =>
      c.id !== v.id &&
      ((v.vin && c.vin && normalize(v.vin) === normalize(c.vin)) ||
        ((c.country || "FR") === (v.country || "FR") &&
          normalize(c.plate) === normalize(v.plate))),
  );
}
