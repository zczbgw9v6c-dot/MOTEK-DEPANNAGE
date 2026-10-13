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
  issues: {
    id: string;
    text: string;
    at: string;
    state?: string;
    category?: string;
  }[];
  photos: WorkshopPhoto[];
  reports: { id: string; text: string; at: string }[];
  requests: {
    id: string;
    part: string;
    at: string;
    state: string;
    quantity?: number;
  }[];
  idleElapsed?: number;
  pausedSince?: string | null;
  pauseReason?: string;
  blocked?: boolean;
  events?: { type: string; at: string; reason: string }[];
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
  idleElapsed: 0,
  pausedSince: null,
  pauseReason: "",
  blocked: false,
  events: [],
});
export function workshopFor(db: DB, id: string): WorkshopState {
  return db.workshop && Object.hasOwn(db.workshop, id)
    ? { ...emptyWorkshop(), ...db.workshop[id] }
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
      {
        elapsed: elapsedSeconds(s, now),
        runningSince: null,
        pausedSince: new Date(now).toISOString(),
        pauseReason: "Pause manuelle",
        events: [
          ...(s.events || []),
          {
            type: "pause",
            at: new Date(now).toISOString(),
            reason: "Pause manuelle",
          },
        ],
      },
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
  if (
    s.issues.some((i) => i.state !== "Résolu") ||
    s.requests.some((r) => !r.state.startsWith("Réservée"))
  )
    throw Error(
      "Le responsable doit traiter le blocage ou valider les pièces avant reprise.",
    );
  if (
    db.vehicles.some(
      (other) =>
        other.id !== id &&
        other.technician === v.technician &&
        workshopFor(db, other.id).runningSince,
    )
  )
    throw Error(
      "Ce technicien a déjà une intervention active. Mettez-la en pause ou réaffectez le dossier.",
    );
  const appointment = db.appointments?.find(
    (a) => a.vehicle === id && a.state !== "Terminé",
  );
  let next = updateVehicle(db, id, {
    status: "En intervention",
    present: true,
  });
  if (appointment)
    next = {
      ...next,
      appointments: next.appointments!.map((a) =>
        a.id === appointment.id
          ? { ...a, state: "En cours" as const, arrived: true }
          : a,
      ),
    };
  return patchWorkshop(
    next,
    id,
    {
      runningSince: new Date(now).toISOString(),
      idleElapsed:
        (s.idleElapsed || 0) +
        (s.pausedSince
          ? Math.max(0, Math.floor((now - Date.parse(s.pausedSince)) / 1000))
          : 0),
      pausedSince: null,
      pauseReason: "",
      blocked: false,
      events: [
        ...(s.events || []),
        {
          type: s.events?.length ? "resume" : "start",
          at: new Date(now).toISOString(),
          reason: "",
        },
      ],
    },
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
  const finished = updateVehicle(next, id, {
    status: "Contrôle qualité",
    quality: false,
    bay: null,
  });
  return {
    ...finished,
    appointments: finished.appointments?.map((a) =>
      a.vehicle === id ? { ...a, state: "Terminé" as const } : a,
    ),
  };
}
export function requestPart(
  db: DB,
  id: string,
  part: string,
  quantity = 1,
  now = Date.now(),
): DB {
  const p = db.parts.find((p) => p.id === part);
  if (!p) throw Error("Pièce introuvable.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    throw Error("Quantité invalide.");
  const s = workshopFor(db, id);
  if (s.requests.some((r) => r.part === part && r.state !== "Annulée"))
    throw Error("Une demande existe déjà pour cette pièce.");
  const at = new Date(now).toISOString();
  const next = patchWorkshop(
    db,
    id,
    {
      requests: [
        ...s.requests,
        {
          id: crypto.randomUUID(),
          part,
          quantity,
          at,
          state: "À valider responsable",
        },
      ],
    },
    "Demande de pièce : " + p.name + " × " + quantity,
  );
  const blocked =
    p.stock - p.reserved < quantity
      ? pauseWork(next, id, "Attente de pièce", true, now)
      : next;
  return addAlert(
    blocked,
    id,
    "piece",
    `${quantity} × ${p.name} demandé · ${p.stock - p.reserved} disponible(s) · compatibilité à vérifier.`,
    now,
  );
}
export function addAlert(
  db: DB,
  vehicle: string,
  kind: string,
  message: string,
  now = Date.now(),
): DB {
  return {
    ...db,
    alerts: [
      {
        id: crypto.randomUUID(),
        vehicle,
        kind,
        message,
        at: new Date(now).toISOString(),
        resolved: false,
      },
      ...(db.alerts || []),
    ],
  };
}
export function pauseWork(
  db: DB,
  id: string,
  reason: string,
  blocked = false,
  now = Date.now(),
): DB {
  const s = workshopFor(db, id);
  const at = new Date(now).toISOString();
  const next = patchWorkshop(
    db,
    id,
    {
      elapsed: elapsedSeconds(s, now),
      runningSince: null,
      pausedSince: s.pausedSince || at,
      pauseReason: reason,
      blocked: blocked || s.blocked,
      events: [...(s.events || []), { type: "pause", at, reason }],
    },
    "Pause : " + reason,
  );
  return {
    ...next,
    appointments: next.appointments?.map((a) =>
      a.vehicle === id && a.state !== "Terminé"
        ? { ...a, state: "En pause" as const }
        : a,
    ),
  };
}
export function reportIssue(
  db: DB,
  id: string,
  text: string,
  category = "Incident mécanique",
  now = Date.now(),
): DB {
  if (!text.trim()) throw Error("Décrivez le problème.");
  const s = workshopFor(db, id),
    at = new Date(now).toISOString();
  let next = patchWorkshop(
    db,
    id,
    {
      issues: [
        ...s.issues,
        { id: crypto.randomUUID(), text, at, state: "Ouvert", category },
      ],
      blocked: true,
    },
    "Problème signalé : " + text,
  );
  next = pauseWork(next, id, category, true, now);
  return addAlert(next, id, "incident", text, now);
}
export function approveRequest(
  db: DB,
  id: string,
  requestId: string,
  compatibilityConfirmed: boolean,
  now = Date.now(),
): DB {
  if (!compatibilityConfirmed)
    throw Error("Confirmez la référence et la compatibilité avant validation.");
  const s = workshopFor(db, id),
    r = s.requests.find((r) => r.id === requestId);
  if (!r || r.state.startsWith("Réservée"))
    throw Error("Demande inexistante ou déjà validée.");
  const p = db.parts.find((p) => p.id === r.part)!,
    v = db.vehicles.find((v) => v.id === id)!,
    quantity = r.quantity || 1;
  if (p.stock - p.reserved < quantity)
    throw Error(
      "Stock insuffisant. Préparez une commande à valider ou simulez une réception.",
    );
  const held = v.partReservations?.[p.id] || (v.parts.includes(p.id) ? 1 : 0);
  const next = {
    ...db,
    parts: db.parts.map((x) =>
      x.id === p.id
        ? {
            ...x,
            reserved: x.reserved + quantity,
            lastMovement: new Date(now).toISOString(),
          }
        : x,
    ),
    vehicles: db.vehicles.map((x) =>
      x.id === id
        ? {
            ...x,
            parts: [...new Set([...x.parts, p.id])],
            partReservations: {
              ...x.partReservations,
              [p.id]: held + quantity,
            },
          }
        : x,
    ),
    stockMovements: [
      {
        id: crypto.randomUUID(),
        part: p.id,
        vehicle: id,
        kind: "Réservation",
        quantity,
        at: new Date(now).toISOString(),
      },
      ...(db.stockMovements || []),
    ],
  };
  const updated = patchWorkshop(
    next,
    id,
    {
      requests: s.requests.map((x) =>
        x.id === r.id
          ? { ...x, state: "Réservée · référence validée manuellement" }
          : x,
      ),
    },
    "Demande de pièce validée et réservée par le responsable",
  );
  return {
    ...updated,
    alerts: updated.alerts?.map((a) =>
      a.vehicle === id && a.kind === "piece" ? { ...a, resolved: true } : a,
    ),
  };
}
export function resolveIssue(
  db: DB,
  id: string,
  issueId: string,
  decision: string,
  now = Date.now(),
): DB {
  if (!decision.trim()) throw Error("Consignez la décision.");
  const s = workshopFor(db, id);
  if (!s.issues.some((i) => i.id === issueId))
    throw Error("Incident introuvable.");
  const issues = s.issues.map((i) =>
    i.id === issueId ? { ...i, state: "Résolu" } : i,
  );
  const next = patchWorkshop(
    db,
    id,
    {
      issues,
      blocked:
        issues.some((i) => i.state !== "Résolu") ||
        s.requests.some((r) => !r.state.startsWith("Réservée")),
    },
    "Décision responsable : " + decision,
  );
  return {
    ...next,
    alerts: next.alerts?.map((a) =>
      a.vehicle === id && a.kind === "incident" ? { ...a, resolved: true } : a,
    ),
  };
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
