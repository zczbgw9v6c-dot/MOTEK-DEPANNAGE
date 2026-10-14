import { validOrders, type WorkOrder } from "./core-schema.ts";
import type { DealershipLayout } from "./dealership-layout.ts";
import { prepareClientMessage } from "./communication-domain.ts";
import { createDemo } from "./demo.ts";
import { team, type Department } from "./team-data.ts";
import type { Appointment } from "./planning-domain.ts";
import type { DiagnosticCase } from "./diagnostic-domain.ts";
import type { ManagerAlert } from "./dashboard-domain.ts";
import type { WorkshopState } from "./workshop-domain.ts";
import type { FieldEvidence } from "./identification.ts";
export const statuses = [
  "Réception",
  "Diagnostic",
  "Devis à valider",
  "En intervention",
  "Contrôle qualité",
  "Prêt à livrer",
  "Livré",
] as const;
export type Status = (typeof statuses)[number];
export type Vehicle = {
  id: string;
  make: string;
  model: string;
  plate: string;
  client: string;
  phone: string;
  email: string;
  km: number;
  year: number;
  color: string;
  shape: "sedan" | "suv" | "hatch";
  symptoms: string;
  codes: string;
  status: Status;
  technician: string;
  bay: number | null;
  due: string;
  quality: boolean;
  notes: string;
  parts: string[];
  vin?: string;
  country?: string;
  assetId?: string;
  registrationEvidence?: FieldEvidence[];
  present?: boolean;
  demo?: boolean;
  arrivedAt?: string;
  reception?: {
    arrivedAt: string;
    state: "waiting" | "received" | "left";
    receivedAt?: string;
  };
  estimatedMinutes?: number;
  engine?: string;
  department?: Department;
  partReservations?: Record<string, number>;
};
export type Part = {
  id: string;
  name: string;
  ref: string;
  stock: number;
  reserved: number;
  price: number;
  location: string;
  threshold: number;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  brand?: string;
  supplier?: string;
  lastMovement?: string;
  demo?: boolean;
};
export type Audit = { id: string; at: string; vehicle: string; action: string };
export type DB = {
  openingHours?: {
    opens: string;
    closes: string;
    weekdays: number[];
    timeZone: "Europe/Lisbon";
  };
  workOrders?: Record<string, WorkOrder>;
  version: 1;
  vehicles: Vehicle[];
  parts: Part[];
  audit: Audit[];
  orders: {
    id: string;
    part: string;
    quantity: number;
    status: string;
    at?: string;
  }[];
  messages: {
    id: string;
    vehicle: string;
    text: string;
    kind?: "quote" | "pickup" | "closing";
    channel?: "SMS" | "WhatsApp";
    plannedAt?: string;
    createdAt?: string;
  }[];
  workshop?: Record<string, WorkshopState>;
  quotes?: Quote[];
  assetDisabled?: string[];
  demoVersion?: number;
  dealership?: DealershipLayout;
  appointments?: Appointment[];
  diagnosticCases?: DiagnosticCase[];
  alerts?: ManagerAlert[];
  stockMovements?: {
    id: string;
    part: string;
    vehicle: string;
    kind: string;
    quantity: number;
    at: string;
  }[];
  invoices?: {
    id: string;
    vehicle: string;
    total: number;
    state: string;
    at: string;
    demo: boolean;
  }[];
  maintenance?: {
    id: string;
    vehicle: string;
    label: string;
    due: string;
    consent: boolean;
  }[];
};
export type Quote = {
  id: string;
  vehicle: string;
  lines: { id: string; label: string; quantity: number; unitPrice: number }[];
  vat: number;
  state: "Brouillon" | "À valider" | "Validé";
  at: string;
};
export const technicians = ["Non affecté", ...team.map((t) => t.name)];
export const bayPosition = (
  bay: number,
  layout?: DealershipLayout,
): [number, number] => [7, -12 - (bay - 1) * (layout?.workshopSpacing || 5)];
export function vehiclePosition(
  v: Vehicle,
  all: Vehicle[],
  layout?: DealershipLayout,
): [number, number] {
  if (v.bay) return bayPosition(v.bay, layout);
  const ready = all.filter(
    (c) => c.status === "Prêt à livrer" && c.bay === null,
  );
  const ri = ready.findIndex((c) => c.id === v.id);
  if (ri >= 0 && ri < 4)
    return [15 + (ri % 2) * 4, 10 + Math.floor(ri / 2) * 5];
  const parked = all.filter(
    (c) =>
      c.bay === null &&
      c.status !== "Livré" &&
      c.present !== false &&
      (c.status !== "Prêt à livrer" ||
        ready.findIndex((r) => r.id === c.id) >= 4),
  );
  const i = Math.max(
    0,
    parked.findIndex((c) => c.id === v.id),
  );
  return [-7, -12 - i * (layout?.workshopSpacing || 5)];
}
export const zones = [
  { id: "accueil", name: "Accueil", short: "Accueil", x: -17, z: 10 },
  { id: "atelier", name: "Atelier mécanique", short: "Atelier", x: 0, z: -28 },
  {
    id: "attente",
    name: "Salle d’attente",
    short: "Salle d’attente",
    x: -17,
    z: -3,
  },
  { id: "stock", name: "Magasin & stocks", short: "Stocks", x: 17, z: -12 },
  { id: "carrosserie", name: "Carrosserie", short: "Carrosserie", x: 17, z: 0 },
  {
    id: "bureau",
    name: "Bureau du responsable",
    short: "Bureau",
    x: -17,
    z: -13,
  },
  { id: "livraison", name: "Livraison", short: "Livraison", x: 17, z: 15 },
  { id: "showroom", name: "Showroom", short: "Showroom", x: 0, z: 14 },
  { id: "parking", name: "Parc atelier", short: "Parc", x: -7, z: -28 },
];
export function seed(): DB {
  return createDemo();
}
export function record(db: DB, vehicle: string, action: string): DB {
  return {
    ...db,
    audit: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        vehicle,
        action,
      },
      ...db.audit,
    ],
  };
}
export function updateVehicle(db: DB, id: string, patch: Partial<Vehicle>): DB {
  const old = db.vehicles.find((v) => v.id === id);
  if (!old) throw Error("Dossier introuvable.");
  const next = { ...old, ...patch };
  if (next.status === "Prêt à livrer" && !next.quality)
    throw Error("Validez le contrôle qualité avant la livraison.");
  if (
    next.status === "Livré" &&
    old.status !== "Prêt à livrer" &&
    old.status !== "Livré"
  )
    throw Error("Le véhicule doit être prêt à livrer.");
  if (
    next.bay !== null &&
    db.vehicles.some(
      (v) => v.id !== id && v.bay === next.bay && v.status !== "Livré",
    )
  )
    throw Error("Ce poste est déjà occupé.");
  if (next.status === "Prêt à livrer" || next.status === "Livré")
    next.bay = null;
  if (next.status === "Livré") next.present = false;
  const result = record(
    { ...db, vehicles: db.vehicles.map((v) => (v.id === id ? next : v)) },
    id,
    patch.status ? `Statut : ${next.status}` : "Dossier mis à jour",
  );
  return old.status !== next.status && next.status === "Prêt à livrer"
    ? prepareClientMessage(result, id, "pickup")
    : result;
}
export function reservePart(db: DB, vehicle: string, id: string): DB {
  const part = db.parts.find((p) => p.id === id);
  const car = db.vehicles.find((v) => v.id === vehicle);
  if (!part || !car) throw Error("Pièce ou véhicule introuvable.");
  if (car.parts.includes(id))
    throw Error("Cette pièce est déjà réservée pour ce dossier.");
  if (part.stock - part.reserved < 1)
    throw Error("Stock disponible insuffisant. Préparez une commande.");
  return record(
    {
      ...db,
      parts: db.parts.map((p) =>
        p.id === id ? { ...p, reserved: p.reserved + 1 } : p,
      ),
      vehicles: db.vehicles.map((v) =>
        v.id === vehicle ? { ...v, parts: [...v.parts, id] } : v,
      ),
    },
    vehicle,
    `Pièce réservée : ${part.name}`,
  );
}
export const cases = [
  {
    id: "CAS-001",
    title: "Défauts électriques multiples",
    vehicle: "Range Rover · Diesel · 2018",
    symptoms:
      "démarrage difficile défauts électriques direction intermittente batterie tension masse",
    codes: ["P0562", "U0100"],
    cause: "Connexion de masse oxydée, confirmée après mesure.",
    checks: [
      "Mesurer la tension batterie au repos et au démarrage.",
      "Contrôler les chutes de tension des liaisons de masse.",
      "Vérifier les connecteurs avant de remplacer un calculateur.",
    ],
    result: "Résolution confirmée après essais et contrôle à 30 jours.",
  },
  {
    id: "CAS-002",
    title: "Vibrations au freinage",
    vehicle: "BMW Série 3 · Diesel · 2019",
    symptoms: "vibrations freinage bruit train avant roue disque frein",
    codes: [],
    cause: "Voile des disques avant mesuré au comparateur.",
    checks: [
      "Mesurer le voile et l’épaisseur des disques.",
      "Contrôler les moyeux et le jeu du train avant.",
      "Comparer les valeurs à la documentation applicable.",
    ],
    result: "Absence de vibration après intervention et essai routier.",
  },
  {
    id: "CAS-003",
    title: "Pression de suralimentation insuffisante",
    vehicle: "Peugeot 3008 · Diesel · 2020",
    symptoms: "perte puissance voyant moteur turbo pression durite",
    codes: ["P0299"],
    cause: "Durite de suralimentation fissurée, fuite confirmée.",
    checks: [
      "Inspecter le circuit de suralimentation.",
      "Comparer pression demandée et mesurée.",
      "Effectuer un test d’étanchéité selon la procédure constructeur.",
    ],
    result: "Pression rétablie et code absent après essai.",
  },
];
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{4,}/g) || [];
export function similarCases(query: string) {
  const terms = new Set(words(query));
  return cases
    .map((c) => ({
      ...c,
      score: words(c.symptoms + " " + c.codes.join(" ")).filter((w) =>
        terms.has(w),
      ).length,
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
export function loadDB(raw: string | null): DB {
  if (!raw) return seed();
  const d = JSON.parse(raw);
  const invalid = () => {
    throw Error("Sauvegarde invalide ou incompatible.");
  };
  if (
    !d ||
    d.version !== 1 ||
    !Array.isArray(d.vehicles) ||
    !Array.isArray(d.parts) ||
    !Array.isArray(d.audit) ||
    !Array.isArray(d.orders) ||
    !Array.isArray(d.messages)
  )
    return invalid();
  const str = (x: unknown) => typeof x === "string";
  const number = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x) && x >= 0;
  if (
    d.dealership !== undefined &&
    (!d.dealership ||
      !["leftBrand", "rightBrand"].every(
        (k) =>
          str(d.dealership[k]) &&
          d.dealership[k].trim().length > 0 &&
          d.dealership[k].length <= 40,
      ) ||
      typeof d.dealership.waitingRoom !== "boolean")
  )
    return invalid();
  if (
    d.dealership?.workshopSpacing !== undefined &&
    ![5, 6, 7].includes(d.dealership.workshopSpacing)
  )
    return invalid();
  for (const v of d.vehicles) {
    if (
      v?.reception !== undefined &&
      (!v.reception ||
        !["waiting", "received", "left"].includes(v.reception.state) ||
        !str(v.reception.arrivedAt) ||
        !Number.isFinite(Date.parse(v.reception.arrivedAt)) ||
        (v.reception.receivedAt !== undefined &&
          (!str(v.reception.receivedAt) ||
            !Number.isFinite(Date.parse(v.reception.receivedAt)))))
    )
      return invalid();
    if (
      !v ||
      ![
        "id",
        "make",
        "model",
        "plate",
        "client",
        "phone",
        "email",
        "color",
        "symptoms",
        "codes",
        "technician",
        "due",
        "notes",
      ].every((k) => str(v[k])) ||
      !/^#[0-9a-f]{6}$/i.test(v.color) ||
      !number(v.km) ||
      !number(v.year) ||
      !["sedan", "suv", "hatch"].includes(v.shape) ||
      !statuses.includes(v.status) ||
      typeof v.quality !== "boolean" ||
      !Array.isArray(v.parts) ||
      !v.parts.every(str) ||
      !(v.bay === null || (Number.isInteger(v.bay) && v.bay >= 1 && v.bay <= 8))
    )
      return invalid();
  }
  if (
    d.workOrders !== undefined &&
    !validOrders(
      d.workOrders,
      d.vehicles.map((v: Vehicle) => v.id),
    )
  )
    return invalid();
  if (
    d.openingHours !== undefined &&
    (!d.openingHours ||
      d.openingHours.timeZone !== "Europe/Lisbon" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.openingHours.opens) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.openingHours.closes) ||
      d.openingHours.opens >= d.openingHours.closes ||
      !Array.isArray(d.openingHours.weekdays) ||
      !d.openingHours.weekdays.length ||
      !d.openingHours.weekdays.every(
        (n: number) => Number.isInteger(n) && n >= 0 && n <= 6,
      ))
  )
    return invalid();
  for (const p of d.parts) {
    if (
      !p ||
      !["id", "name", "ref", "location"].every((k) => str(p[k])) ||
      !["stock", "reserved", "price", "threshold"].every((k) => number(p[k])) ||
      p.reserved > p.stock
    )
      return invalid();
  }
  for (const a of d.audit) {
    if (!a || !["id", "at", "vehicle", "action"].every((k) => str(a[k])))
      return invalid();
  }
  for (const o of d.orders) {
    if (
      !o ||
      !str(o.id) ||
      !str(o.part) ||
      !str(o.status) ||
      (o.at !== undefined &&
        (!str(o.at) || !Number.isFinite(Date.parse(o.at)))) ||
      !Number.isInteger(o.quantity) ||
      o.quantity < 1 ||
      !d.parts.some((p: Part) => p.id === o.part)
    )
      return invalid();
  }
  for (const m of d.messages) {
    if (
      m &&
      ((m.kind !== undefined &&
        !["quote", "pickup", "closing"].includes(m.kind)) ||
        (m.channel !== undefined && !["SMS", "WhatsApp"].includes(m.channel)) ||
        ["plannedAt", "createdAt"].some(
          (k) =>
            m[k] !== undefined &&
            (!str(m[k]) || !Number.isFinite(Date.parse(m[k]))),
        ))
    )
      return invalid();
    if (!m || !["id", "vehicle", "text"].every((k) => str(m[k])))
      return invalid();
  }
  if (
    new Set(d.vehicles.map((v: Vehicle) => v.id)).size !== d.vehicles.length ||
    new Set(d.parts.map((p: Part) => p.id)).size !== d.parts.length
  )
    return invalid();
  if (
    d.assetDisabled !== undefined &&
    (!Array.isArray(d.assetDisabled) || !d.assetDisabled.every(str))
  )
    return invalid();
  for (const v of d.vehicles) {
    if (
      (v.vin !== undefined && !str(v.vin)) ||
      (v.country !== undefined && !["FR", "PT", "ES"].includes(v.country)) ||
      (v.assetId !== undefined && !str(v.assetId))
    )
      return invalid();
    if (
      v.registrationEvidence !== undefined &&
      (!Array.isArray(v.registrationEvidence) ||
        v.registrationEvidence.some(
          (f: any) =>
            !f ||
            !str(f.code) ||
            !str(f.label) ||
            !str(f.raw) ||
            !str(f.value) ||
            typeof f.confirmed !== "boolean" ||
            !["pdf_text", "ocr_local", "manual"].includes(f.source),
        ))
    )
      return invalid();
  }
  if (d.quotes !== undefined) {
    if (!Array.isArray(d.quotes)) return invalid();
    for (const q of d.quotes) {
      if (
        !q ||
        !str(q.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === q.vehicle) ||
        !["Brouillon", "À valider", "Validé"].includes(q.state) ||
        !number(q.vat) ||
        q.vat > 100 ||
        !str(q.at) ||
        !Array.isArray(q.lines) ||
        q.lines.some(
          (l: any) =>
            !l ||
            !str(l.id) ||
            !str(l.label) ||
            !number(l.quantity) ||
            l.quantity <= 0 ||
            !number(l.unitPrice),
        )
      )
        return invalid();
    }
  }
  if (d.workshop !== undefined) {
    if (
      !d.workshop ||
      Array.isArray(d.workshop) ||
      typeof d.workshop !== "object"
    )
      return invalid();
    for (const [id, state] of Object.entries(d.workshop) as [string, any][]) {
      if (
        !d.vehicles.some((v: Vehicle) => v.id === id) ||
        !state ||
        !number(state.elapsed) ||
        !(
          state.runningSince === null ||
          (str(state.runningSince) &&
            Number.isFinite(Date.parse(state.runningSince)))
        ) ||
        !state.checks ||
        !["repair", "safety", "test"].every(
          (k) => typeof state.checks[k] === "boolean",
        ) ||
        !str(state.keyLocation) ||
        !["issues", "photos", "reports", "requests"].every((k) =>
          Array.isArray(state[k]),
        )
      )
        return invalid();
      if (
        state.photos.length > 3 ||
        state.photos.some(
          (p: any) =>
            !p ||
            !str(p.id) ||
            !str(p.at) ||
            !str(p.data) ||
            !p.data.startsWith("data:image/jpeg;base64,") ||
            p.data.length > 1500000,
        )
      )
        return invalid();
      for (const kind of ["issues", "reports"])
        if (
          state[kind].some(
            (x: any) => !x || !str(x.id) || !str(x.text) || !str(x.at),
          )
        )
          return invalid();
      if (
        state.requests.some(
          (r: any) =>
            !r || !str(r.id) || !str(r.part) || !str(r.at) || !str(r.state),
        )
      )
        return invalid();
    }
  }
  for (const field of [
    "appointments",
    "diagnosticCases",
    "alerts",
    "stockMovements",
    "invoices",
    "maintenance",
  ])
    if (d[field] !== undefined && !Array.isArray(d[field])) return invalid();
  if (
    d.appointments?.some(
      (a: any) =>
        !a ||
        !str(a.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === a.vehicle) ||
        !str(a.technician) ||
        !str(a.resource) ||
        !str(a.department) ||
        !Number.isFinite(Date.parse(a.start)) ||
        !number(a.duration) ||
        a.duration < 15 ||
        !Number.isFinite(Date.parse(a.promised)) ||
        !Array.isArray(a.requiredParts) ||
        !a.requiredParts.every(str) ||
        !["Planifié", "En cours", "En pause", "Terminé"].includes(a.state) ||
        typeof a.arrived !== "boolean",
    )
  )
    return invalid();
  if (
    d.diagnosticCases?.some(
      (c: any) =>
        !c ||
        !str(c.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === c.vehicleId) ||
        !str(c.symptoms) ||
        !str(c.engine) ||
        !Array.isArray(c.codes) ||
        !c.codes.every(str) ||
        !Array.isArray(c.tests) ||
        c.tests.some(
          (t: any) =>
            !t || !str(t.name) || !str(t.result) || typeof t.done !== "boolean",
        ) ||
        !Array.isArray(c.hypotheses) ||
        !str(c.repair) ||
        !str(c.result) ||
        typeof c.resolved !== "boolean" ||
        !(c.cause === null || str(c.cause)),
    )
  )
    return invalid();
  if (
    d.alerts?.some(
      (a: any) =>
        !a ||
        !str(a.id) ||
        !str(a.vehicle) ||
        !str(a.message) ||
        !str(a.kind) ||
        typeof a.resolved !== "boolean",
    )
  )
    return invalid();
  if (
    d.invoices?.some(
      (i: any) =>
        !i ||
        !str(i.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === i.vehicle) ||
        !number(i.total) ||
        !str(i.state),
    )
  )
    return invalid();
  return d as DB;
}
