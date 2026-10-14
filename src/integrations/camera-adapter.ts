import type { DB } from "../domain.ts";
/**
 * Caméra intelligente à l’entrée : contrat d’intégration.
 * Aucune caméra ni service de lecture de plaque n’est raccordé. Un adaptateur réel
 * (flux RTSP + lecture locale, ou service ANPR) produira des `PlateSighting` ; le CRM
 * ne fait que les rapprocher des dossiers et demande une validation humaine en cas de doute.
 */
export type PlateSighting = {
  id: string;
  at: string;
  /** Lecture brute de la plaque, telle que renvoyée par le lecteur. */
  plate: string;
  /** Score 0–1 annoncé par le lecteur ; sans score, la lecture est traitée comme incertaine. */
  confidence?: number;
  camera: string;
  /** Image optionnelle conservée localement pour la validation humaine. */
  snapshot?: string;
};
export interface CameraAdapter {
  readonly name: string;
  readonly live: boolean;
  start(onSighting: (sighting: PlateSighting) => void): Promise<void>;
  stop(): Promise<void>;
}
export const noCamera: CameraAdapter = {
  name: "Aucune caméra raccordée",
  live: false,
  async start() {},
  async stop() {},
};
export type ArrivalMatch = {
  sighting: PlateSighting;
  /** Dossier retenu uniquement si la lecture est sûre et unique. */
  vehicle?: string;
  /** Dossiers proches (plaques à un caractère près) à départager par un humain. */
  candidates: string[];
  appointment?: string;
  status: "confirmé" | "à valider" | "inconnu" | "doublon";
  reason: string;
};
const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
function distance(a: string, b: string) {
  if (a.length !== b.length) return Math.abs(a.length - b.length) + 1;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}
/**
 * Rapproche une lecture d’un dossier. Une plaque ne garantit pas le modèle exact ;
 * elle ne sert qu’à retrouver le dossier ou le rendez-vous.
 */
export function matchSighting(
  db: DB,
  sighting: PlateSighting,
  recent: ArrivalMatch[] = [],
  now = Date.now(),
): ArrivalMatch {
  const plate = normalize(sighting.plate);
  const open = db.vehicles.filter((v) => v.status !== "Livré");
  const exact = open.filter((v) => normalize(v.plate) === plate);
  const near = open.filter(
    (v) =>
      normalize(v.plate) !== plate && distance(normalize(v.plate), plate) <= 1,
  );
  const duplicate = recent.find(
    (m) =>
      normalize(m.sighting.plate) === plate &&
      now - Date.parse(m.sighting.at) < 10 * 60000,
  );
  if (duplicate)
    return {
      sighting,
      vehicle: duplicate.vehicle,
      candidates: duplicate.candidates,
      status: "doublon",
      reason:
        "Même plaque vue il y a moins de dix minutes : aucune nouvelle arrivée créée.",
    };
  const sure = (sighting.confidence ?? 0) >= 0.85;
  if (exact.length === 1 && sure) {
    const v = exact[0];
    const appointment = db.appointments?.find(
      (a) => a.vehicle === v.id && a.state === "Planifié",
    );
    return {
      sighting,
      vehicle: v.id,
      candidates: [],
      appointment: appointment?.id,
      status: "confirmé",
      reason: appointment
        ? "Plaque sûre et rendez-vous planifié retrouvé."
        : "Plaque sûre et dossier ouvert retrouvé.",
    };
  }
  if (exact.length >= 1 || near.length >= 1)
    return {
      sighting,
      candidates: [...exact, ...near].map((v) => v.id),
      status: "à valider",
      reason: !sure
        ? "Lecture incertaine : confirmez le véhicule à l’accueil."
        : exact.length > 1
          ? "Plusieurs dossiers ouverts portent cette plaque."
          : "Plaque proche d’un dossier existant : validation humaine nécessaire.",
    };
  return {
    sighting,
    candidates: [],
    status: "inconnu",
    reason: "Aucun dossier ne correspond : à accueillir comme nouveau client.",
  };
}
