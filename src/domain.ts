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
};
export type Audit = { id: string; at: string; vehicle: string; action: string };
export type DB = {
  version: 1;
  vehicles: Vehicle[];
  parts: Part[];
  audit: Audit[];
  orders: { id: string; part: string; quantity: number; status: string }[];
  messages: { id: string; vehicle: string; text: string }[];
  workshop?: Record<string, WorkshopState>;
  quotes?: Quote[];
  assetDisabled?: string[];
};
export type Quote = {
  id: string;
  vehicle: string;
  lines: { id: string; label: string; quantity: number; unitPrice: number }[];
  vat: number;
  state: "Brouillon" | "À valider" | "Validé";
  at: string;
};
export const technicians = [
  "Non affecté",
  "Thomas Martin",
  "Sarah Moreau",
  "Lucas Bernard",
  "Emma Petit",
];
export const bayPosition = (bay: number): [number, number] => [
  bay % 2 ? -7 : 7,
  -10 + Math.floor((bay - 1) / 2) * 5,
];
export function vehiclePosition(v: Vehicle, all: Vehicle[]): [number, number] {
  if (v.bay) return bayPosition(v.bay);
  const ready = all.filter(
    (c) => c.status === "Prêt à livrer" && c.bay === null,
  );
  const ri = ready.findIndex((c) => c.id === v.id);
  if (ri >= 0 && ri < 2) return [15 + ri * 4, 10];
  const parked = all.filter(
    (c) =>
      c.bay === null &&
      c.status !== "Livré" &&
      (c.status !== "Prêt à livrer" ||
        ready.findIndex((r) => r.id === c.id) >= 2),
  );
  const i = Math.max(
    0,
    parked.findIndex((c) => c.id === v.id),
  );
  return [-17 + (i % 4) * 11, 22 + Math.floor(i / 4) * 5];
}
export const zones = [
  { id: "accueil", name: "Accueil", short: "Accueil", x: -17, z: 10 },
  { id: "atelier", name: "Atelier mécanique", short: "Atelier", x: 0, z: 0 },
  { id: "attente", name: "Salle d’attente", short: "Attente", x: -17, z: -3 },
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
  { id: "parking", name: "Parking extérieur", short: "Parking", x: 0, z: 24 },
];
export function seed(): DB {
  const base = {
    phone: "06 00 00 00 00",
    email: "",
    km: 84500,
    year: 2020,
    symptoms: "Vibrations au freinage et bruit sur le train avant.",
    codes: "",
    quality: false,
    notes: "",
    parts: [],
  };
  return {
    version: 1,
    vehicles: [
      {
        ...base,
        id: "v1",
        make: "BMW",
        model: "Série 3",
        plate: "GH-482-LP",
        client: "Alexandre Dubois",
        color: "#426780",
        shape: "sedan",
        status: "En intervention",
        technician: "Thomas Martin",
        bay: 1,
        due: "14:30",
      },
      {
        ...base,
        id: "v2",
        make: "Peugeot",
        model: "3008",
        plate: "FV-913-AB",
        client: "Camille Laurent",
        color: "#b7b9b4",
        shape: "suv",
        status: "Diagnostic",
        technician: "Sarah Moreau",
        bay: 2,
        due: "15:00",
        symptoms: "Perte de puissance et voyant moteur.",
        codes: "P0299",
      },
      {
        ...base,
        id: "v3",
        make: "Volkswagen",
        model: "Golf",
        plate: "GT-205-NC",
        client: "Julien Robert",
        color: "#b39c79",
        shape: "hatch",
        status: "Devis à valider",
        technician: "Lucas Bernard",
        bay: 3,
        due: "16:00",
      },
      {
        ...base,
        id: "v4",
        make: "Land Rover",
        model: "Range Rover",
        plate: "HP-731-DR",
        client: "Sophie Mercier",
        color: "#52665b",
        shape: "suv",
        status: "Diagnostic",
        technician: "Emma Petit",
        bay: 4,
        due: "17:00",
        symptoms:
          "Démarrage difficile, défauts électriques et direction intermittente.",
        codes: "P0562 U0100",
      },
      {
        ...base,
        id: "v5",
        make: "Renault",
        model: "Clio",
        plate: "FM-648-JK",
        client: "Marc Lefèvre",
        color: "#b36e5b",
        shape: "hatch",
        status: "Contrôle qualité",
        technician: "Thomas Martin",
        bay: 5,
        due: "14:00",
      },
      {
        ...base,
        id: "v6",
        make: "Audi",
        model: "A4",
        plate: "GC-092-TM",
        client: "Nathalie Roux",
        color: "#d8d8d2",
        shape: "sedan",
        status: "En intervention",
        technician: "Sarah Moreau",
        bay: 6,
        due: "16:30",
      },
      {
        ...base,
        id: "v7",
        make: "Volvo",
        model: "XC60",
        plate: "HN-418-BV",
        client: "Pierre Girard",
        color: "#33444d",
        shape: "suv",
        status: "Prêt à livrer",
        technician: "Lucas Bernard",
        bay: null,
        due: "15:30",
        quality: true,
      },
    ],
    parts: [
      {
        id: "disc",
        name: "Disque de frein avant",
        ref: "DEMO-FR-001",
        stock: 8,
        reserved: 0,
        price: 78,
        location: "A · 01",
        threshold: 4,
      },
      {
        id: "pads",
        name: "Jeu de plaquettes",
        ref: "DEMO-FR-002",
        stock: 3,
        reserved: 0,
        price: 46,
        location: "A · 02",
        threshold: 4,
      },
      {
        id: "caliper",
        name: "Étrier de frein",
        ref: "DEMO-FR-003",
        stock: 0,
        reserved: 0,
        price: 145,
        location: "A · 03",
        threshold: 2,
      },
      {
        id: "filter",
        name: "Filtre à huile",
        ref: "DEMO-FL-001",
        stock: 24,
        reserved: 0,
        price: 12,
        location: "B · 01",
        threshold: 10,
      },
    ],
    audit: [],
    orders: [],
    messages: [],
  };
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
  return record(
    { ...db, vehicles: db.vehicles.map((v) => (v.id === id ? next : v)) },
    id,
    patch.status ? `Statut : ${next.status}` : "Dossier mis à jour",
  );
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
  for (const v of d.vehicles) {
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
      !Number.isInteger(o.quantity) ||
      o.quantity < 1 ||
      !d.parts.some((p: Part) => p.id === o.part)
    )
      return invalid();
  }
  for (const m of d.messages) {
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
  return d as DB;
}
