import type { DB, Vehicle, Part, Quote } from "./domain.ts";
import { team, type Appointment, type Department } from "./planning-domain.ts";
import type { DiagnosticCase } from "./diagnostic-domain.ts";
import type { WorkshopState } from "./workshop-domain.ts";
const stockRows = [
  ["disc", "Disque de frein avant", "Freinage", "unité", 78],
  ["pads", "Jeu de plaquettes avant", "Freinage", "jeu", 46],
  ["caliper", "Étrier avant gauche", "Freinage", "unité", 145],
  ["filter", "Filtre à huile", "Filtres", "unité", 12],
  ["air-filter", "Filtre à air", "Filtres", "unité", 22],
  ["cabin-filter", "Filtre d’habitacle", "Filtres", "unité", 19],
  ["fuel-filter", "Filtre à carburant", "Filtres", "unité", 34],
  ["gear-filter", "Filtre à transmission", "Filtres", "unité", 42],
  ["pads-rear", "Plaquettes arrière", "Freinage", "jeu", 41],
  ["disc-rear", "Disques arrière", "Freinage", "unité", 69],
  ["caliper-right", "Étrier avant droit", "Freinage", "unité", 148],
  ["brake-fluid", "Liquide de frein", "Freinage", "litre", 13],
  ["brake-hose", "Flexible de frein", "Freinage", "unité", 29],
  ["abs-sensor", "Capteur ABS", "Freinage", "unité", 54],
  ["wear-sensor", "Témoin d’usure de plaquettes", "Freinage", "unité", 15],
  ["oil-5w30", "Huile moteur 5W-30", "Fluides", "litre", 11],
  ["oil-0w20", "Huile moteur 0W-20", "Fluides", "litre", 13],
  ["oil-5w40", "Huile moteur 5W-40", "Fluides", "litre", 10],
  ["coolant", "Liquide de refroidissement", "Fluides", "litre", 8],
  ["screen-fluid", "Liquide lave-glace", "Fluides", "litre", 4],
  ["gear-oil", "Huile de boîte", "Fluides", "litre", 16],
  ["steering-fluid", "Liquide de direction assistée", "Fluides", "litre", 12],
  ["brake-cleaner", "Nettoyant frein", "Fluides", "aérosol", 7],
  ["tyre-16", "Pneu 205/55 R16", "Pneumatiques", "unité", 83],
  ["tyre-17", "Pneu 225/45 R17", "Pneumatiques", "unité", 109],
  ["tyre-18", "Pneu 225/40 R18", "Pneumatiques", "unité", 132],
  ["valve", "Valve de pneu", "Pneumatiques", "unité", 4],
  ["tpms", "Capteur TPMS", "Pneumatiques", "unité", 56],
  ["weights", "Masse d’équilibrage", "Pneumatiques", "boîte", 18],
  ["battery", "Batterie 12 V", "Électricité", "unité", 139],
  ["alternator", "Alternateur", "Électricité", "unité", 279],
  ["starter", "Démarreur", "Électricité", "unité", 229],
  ["spark", "Bougie d’allumage", "Électricité", "unité", 14],
  ["glow", "Bougie de préchauffage", "Électricité", "unité", 24],
  ["fuse", "Fusible", "Électricité", "unité", 2],
  ["relay", "Relais électrique", "Électricité", "unité", 17],
  ["shock-front", "Amortisseur avant", "Suspension", "unité", 98],
  ["shock-rear", "Amortisseur arrière", "Suspension", "unité", 78],
  ["spring", "Ressort de suspension", "Suspension", "unité", 59],
  ["arm", "Triangle de suspension", "Suspension", "unité", 86],
  ["tie-rod", "Rotule de direction", "Suspension", "unité", 38],
  ["bonnet", "Capot", "Carrosserie", "unité", 310],
  ["bumper", "Pare-chocs avant", "Carrosserie", "unité", 245],
  ["mirror", "Rétroviseur", "Carrosserie", "unité", 165],
  ["headlight", "Phare avant", "Carrosserie", "unité", 289],
  ["rear-light", "Feu arrière", "Carrosserie", "unité", 119],
  ["windscreen", "Pare-brise", "Vitrage", "unité", 295],
  ["wiper", "Balai d’essuie-glace", "Vitrage", "paire", 29],
  ["glass-glue", "Colle à pare-brise", "Vitrage", "cartouche", 23],
  ["belt", "Courroie d’accessoire", "Entretien", "unité", 35],
] as const;
export function demoStock(now: number): Part[] {
  return stockRows.map(([id, name, category, unit, price], i) => ({
    id,
    name,
    category,
    unit,
    price,
    purchasePrice: Math.round(price * 0.62 * 100) / 100,
    brand: "AtelierParts Démo",
    supplier: "Fournisseur fictif " + ((i % 3) + 1),
    ref:
      "DEMO-" +
      category.slice(0, 3).toUpperCase() +
      "-" +
      String(i + 1).padStart(3, "0"),
    stock:
      id === "disc"
        ? 8
        : id === "pads"
          ? 3
          : id === "caliper" || id === "caliper-right" || id === "windscreen"
            ? 0
            : id === "filter"
              ? 24
              : i % 11 === 0
                ? 0
                : i % 7 === 0
                  ? 2
                  : 10 + (i % 18),
    reserved: 0,
    location:
      String.fromCharCode(65 + Math.floor(i / 10)) +
      " · " +
      String((i % 10) + 1).padStart(2, "0"),
    threshold: id === "disc" || id === "pads" ? 4 : 3,
    lastMovement: new Date(now - (i + 1) * 3600000).toISOString(),
    demo: true,
  }));
}
const models: [string, string, Vehicle["shape"]][] = [
  ["BMW", "Série 3", "sedan"],
  ["Peugeot", "3008", "suv"],
  ["Volkswagen", "Golf", "hatch"],
  ["Land Rover", "Range Rover", "suv"],
  ["Renault", "Clio", "hatch"],
  ["Audi", "A4", "sedan"],
  ["Volvo", "XC60", "suv"],
  ["Citroën", "C3", "hatch"],
  ["Toyota", "Yaris", "hatch"],
  ["Audi", "Q5", "suv"],
  ["Peugeot", "208", "hatch"],
  ["Volkswagen", "Tiguan", "suv"],
  ["Mercedes", "Classe C", "sedan"],
  ["Dacia", "Duster", "suv"],
  ["Ford", "Focus", "hatch"],
  ["Opel", "Corsa", "hatch"],
  ["Fiat", "500", "hatch"],
  ["Nissan", "Qashqai", "suv"],
  ["Hyundai", "i30", "hatch"],
  ["Kia", "Ceed", "hatch"],
];
const clients = [
  "Alexandre Dubois",
  "Camille Laurent",
  "Julien Robert",
  "Sophie Mercier",
  "Marc Lefèvre",
  "Nathalie Roux",
  "Pierre Girard",
  "Clara Morel",
  "Hugo Fontaine",
  "Inès Garnier",
  "Sarah Lopes",
  "Louis Mendes",
  "Manon Durand",
  "Adam Pereira",
];
const diagnosticRows = [
  [
    "Démarrage difficile",
    "P0562",
    "Batterie faible",
    "Tension de démarrage mesurée à 8,7 V sur ce cas fictif.",
    "Batterie remplacée après confirmation du défaut.",
  ],
  [
    "Décharge de batterie à l’arrêt",
    "B1318",
    "Consommation parasite",
    "Consommation de repos fictive : 260 mA ; relais isolé lors du test.",
    "Relais concerné remplacé puis consommation contrôlée.",
  ],
  [
    "Voyant batterie, charge insuffisante",
    "P0620",
    "Régulateur d’alternateur",
    "Tension de charge fictive mesurée : 11,9 V.",
    "Alternateur remplacé après contrôle du circuit.",
  ],
  [
    "Voyant ABS intermittent",
    "C0035",
    "Capteur de roue",
    "Signal absent sur la roue avant gauche dans le relevé fictif.",
    "Capteur et connectique contrôlés puis réparation.",
  ],
  [
    "Calage moteur à chaud",
    "P0335",
    "Capteur de vilebrequin",
    "Signal du capteur absent à chaud dans le test fictif.",
    "Capteur remplacé et essai de redémarrage.",
  ],
  [
    "Température moteur élevée",
    "P0217",
    "Thermostat bloqué",
    "Test d’ouverture non effectué ; cause à vérifier.",
    "Aucune réparation confirmée.",
  ],
  [
    "Fuite de liquide de refroidissement",
    "",
    "Durite fissurée",
    "Fuite localisée sous pression dans ce cas fictif.",
    "Durite remplacée et test d’étanchéité final.",
  ],
  [
    "Perte de puissance, turbo",
    "P0299",
    "Fuite de suralimentation",
    "Fuite fictive confirmée sur une durite, pression insuffisante relevée.",
    "Durite remplacée puis contrôle des pressions.",
  ],
  [
    "Ralenti irrégulier, injecteurs",
    "P0202",
    "Circuit injecteur",
    "Mesures électriques à compléter ; injecteur non condamné.",
    "Diagnostic encore ouvert.",
  ],
  [
    "À-coups de boîte automatique",
    "P0741",
    "Verrouillage convertisseur",
    "Mesures et documentation de la variante à vérifier.",
    "Aucun remplacement engagé.",
  ],
  [
    "FAP chargé, mode dégradé",
    "P2463",
    "Accumulation de suie",
    "Pression différentielle fictive trop élevée, valeurs consignées.",
    "Cause d’encrassement corrigée et contrôle final.",
  ],
  [
    "Ralenti instable, EGR",
    "P0401",
    "Passage EGR obstrué",
    "Contrôle fictif du débit et inspection du passage.",
    "Passage remis en état puis contrôle.",
  ],
  [
    "Climatisation sans froid",
    "B10A9",
    "Fuite circuit climatisation",
    "Fuite fictive repérée lors d’un test adapté par un professionnel.",
    "Réparation de la fuite et contrôle réglementaire simulé.",
  ],
  [
    "Bruit de suspension sur bosses",
    "",
    "Silentbloc usé",
    "Jeu fictif observé au contrôle du train avant.",
    "Élément remplacé et essai final.",
  ],
  [
    "Défauts électriques, direction intermittente, démarrage difficile",
    "P0562 U0100",
    "Masse oxydée",
    "Chute de tension fictive sur masse : 1,4 V sous charge.",
    "Liaison réparée et tests électriques répétés.",
  ],
] as const;
export function createDemo(now = Date.now()): DB {
  const baseDay = new Date(now);
  baseDay.setHours(8, 0, 0, 0);
  const start = (offset: number) =>
    new Date(baseDay.getTime() + offset * 60000).toISOString();
  const currentStatuses: Vehicle["status"][] = [
    "En intervention",
    "Diagnostic",
    "Devis à valider",
    "Diagnostic",
    "En intervention",
    "En intervention",
    "Prêt à livrer",
    "Prêt à livrer",
    "Prêt à livrer",
    "Prêt à livrer",
    "Réception",
    "Réception",
    "Devis à valider",
    "Diagnostic",
  ];
  const names = [
    "Yanis",
    "Thomas",
    "Kader",
    "Rayan",
    "Karim",
    "Lucas",
    "Mehdi",
    "Sofiane",
    "Karim",
    "Rayan",
    "Non affecté",
    "Mehdi",
    "Sofiane",
    "Thomas",
  ];
  const vehicles: Vehicle[] = Array.from({ length: 60 }, (_, i) => {
    const [make, model, shape] = models[i % models.length];
    const present = i < 14;
    const status = present
      ? currentStatuses[i]
      : i < 20
        ? "Réception"
        : "Livré";
    return {
      id: "v" + (i + 1),
      make,
      model,
      shape,
      plate:
        i === 0
          ? "GH-482-LP"
          : i === 1
            ? "FV-913-AB"
            : i === 2
              ? "GT-205-NC"
              : `DE-${String(i + 100).padStart(3, "0")}-MO`,
      client:
        clients[i % clients.length] + (i >= 14 ? " · dossier " + (i + 1) : ""),
      phone:
        "06 00 00 " +
        String(Math.floor(i / 100)).padStart(2, "0") +
        " " +
        String(i).padStart(2, "0"),
      email: "",
      country: "FR",
      km: 84500 + i * 1700,
      year: 2018 + (i % 7),
      color: ["#426780", "#b7b9b4", "#b39c79", "#52665b", "#b36e5b", "#d8d8d2"][
        i % 6
      ],
      symptoms:
        i === 0
          ? "Vibrations au freinage et bruit sur le train avant."
          : i === 2
            ? "Remplacement de pare-brise, impact hors champ réparable."
            : i === 13
              ? "Voyant moteur et attente de diagnostic électrique."
              : diagnosticRows[i % 15][0],
      codes:
        i === 0 || i === 2 || (i >= 6 && i < 14)
          ? ""
          : diagnosticRows[i % 15][1],
      status,
      technician: present ? names[i] : team[i % 8].name,
      bay: i < 6 ? i + 1 : null,
      due: present ? "16:30" : "17:00",
      quality: status === "Livré" || status === "Prêt à livrer",
      notes: present
        ? "Dossier de démonstration fictif."
        : "Archive de démonstration fictive.",
      parts: [],
      present,
      ...(present
        ? { arrivedAt: new Date(now - (70 + i * 8) * 60000).toISOString() }
        : {}),
      estimatedMinutes: i === 2 ? 90 : 60 + (i % 3) * 30,
      engine: "Motorisation démo " + ((i % 4) + 1),
      demo: true,
      department:
        i === 2
          ? "Vitrage"
          : i === 1 || i === 3 || i === 13
            ? "Diagnostic"
            : i === 11
              ? "Pneumatiques"
              : i === 12
                ? "Carrosserie"
                : "Mécanique",
    };
  });
  const quotes: Quote[] = Array.from({ length: 7 }, (_, i) => ({
    id: "demo-quote-" + (i + 1),
    vehicle: i < 5 ? ["v1", "v2", "v4", "v5", "v6"][i] : i === 5 ? "v3" : "v13",
    lines: [
      {
        id: "quote-line-" + i,
        label: "Opération et pièces fictives · devis de démonstration",
        quantity: 1,
        unitPrice: 180 + i * 75,
      },
    ],
    vat: 20,
    state: i < 5 ? "Validé" : "À valider",
    at: new Date(now - 86400000).toISOString(),
  }));
  const appointments: Appointment[] = vehicles.slice(0, 20).map((v, i) => ({
    id: "appointment-" + v.id,
    vehicle: v.id,
    technician: v.technician === "Non affecté" ? "Rayan" : v.technician,
    resource:
      i < 6
        ? "lift-" + (i + 1)
        : i < 10
          ? "quality"
          : i === 11
            ? "tyres"
            : i === 12
              ? "body"
              : i === 13
                ? "diagnostic"
                : i >= 14
                  ? "lift-" + ((i % 8) + 1)
                  : "lift-7",
    department: v.department || "Mécanique",
    start:
      i < 6
        ? start(120)
        : i < 10
          ? start(-120 + i * 60)
          : i >= 14
            ? new Date(
                baseDay.getTime() + 86400000 + (i - 14) * 90 * 60000,
              ).toISOString()
            : start(360 + (i - 10) * 90),
    duration: v.estimatedMinutes || 60,
    promised: new Date(
      baseDay.getTime() + (i >= 14 ? 86400000 : 0) + 10 * 3600000,
    ).toISOString(),
    priority: i === 2 || i === 13 ? "Haute" : "Normale",
    requiredParts:
      i === 0
        ? ["disc", "pads"]
        : i === 2
          ? ["windscreen", "glass-glue"]
          : i === 4
            ? ["filter"]
            : i === 11
              ? ["tyre-17"]
              : [],
    requiresQuote: i < 6 || i === 12,
    state:
      i >= 6 && i < 10 ? "Terminé" : i < 6 && i !== 2 ? "En cours" : "Planifié",
    arrived: v.present === true,
  }));
  // Sequential diagnostic bookings; no simultaneous technician reservation in the demo.
  appointments.find((a) => a.vehicle === "v4")!.start = start(240);
  appointments.find((a) => a.vehicle === "v4")!.technician = "Rayan";
  appointments.find((a) => a.vehicle === "v3")!.resource = "glass";
  for (const a of appointments.filter((a) => a.vehicle === "v3"))
    a.start = start(420);
  for (const a of appointments.filter((a) => !a.arrived)) {
    const tech = team.find((t) => t.name === a.technician)!;
    if (!tech.skills.includes(a.department)) {
      a.department = tech.department;
      const dedicated = {
        Vitrage: "glass",
        Pneumatiques: "tyres",
        Diagnostic: "diagnostic",
        Carrosserie: "body",
        Peinture: "paint",
      } as Record<string, string>;
      a.resource = dedicated[a.department] || a.resource;
    }
  }
  for (const v of vehicles) {
    const a = appointments.find((a) => a.vehicle === v.id);
    if (a)
      v.due = new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Lisbon",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(a.promised));
  }
  const parts = demoStock(now);
  const workshop: Record<string, WorkshopState> = {};
  for (const [i, v] of vehicles.slice(0, 14).entries()) {
    workshop[v.id] = {
      elapsed: i < 6 ? 900 + i * 60 : 0,
      runningSince: null,
      checks: { repair: v.quality, safety: v.quality, test: v.quality },
      keyLocation: "Accueil · casier " + String(i + 1).padStart(2, "0"),
      issues: [],
      photos: [],
      reports: [],
      requests: [],
      idleElapsed: 0,
      pausedSince: null,
      pauseReason: "",
      blocked: false,
      events: [],
    };
  }
  // Running sessions are started by the seed initializer on the server, not by fixtures used in unit tests.
  const diagnosticCases: DiagnosticCase[] = diagnosticRows.map(
    ([symptoms, code, cause, proof, repair], i) => {
      const v = vehicles[20 + i];
      v.symptoms = symptoms;
      v.codes = code;
      const open = [5, 8, 9].includes(i);
      return {
        id: "DIAG-" + String(i + 1).padStart(3, "0"),
        vehicleId: v.id,
        at: new Date(now - (i + 4) * 86400000).toISOString(),
        symptoms,
        codes: code.split(" ").filter(Boolean),
        engine: v.engine!,
        tests: [
          { name: "Contrôle initial consigné", result: proof, done: !open },
          {
            name: "Contrôle après réparation",
            result: open
              ? "Non effectué."
              : "Essai final fictif enregistré, défaut non reproduit.",
            done: !open,
          },
        ],
        hypotheses: [
          { label: cause, state: open ? "À vérifier" : "Confirmée" },
          {
            label: "Autre composant du système",
            state: open ? "À vérifier" : "Rejetée",
          },
        ],
        cause: open ? null : cause,
        repair,
        result: open
          ? "Dossier non résolu ; aucune certitude."
          : "Résolution fictive confirmée dans le dossier.",
        resolved: !open,
        recurred: i === 10,
        demo: true,
      };
    },
  );
  const alerts = [
    {
      id: "demo-alert-v14",
      vehicle: "v14",
      kind: "diagnostic",
      message: "Diagnostic électrique complémentaire demandé.",
      at: new Date(now - 1800000).toISOString(),
      resolved: false,
    },
  ];
  workshop.v14.blocked = true;
  workshop.v14.issues = [
    {
      id: "demo-issue-v14",
      text: "Diagnostic électrique complémentaire à valider.",
      at: new Date(now - 1800000).toISOString(),
      state: "Ouvert",
      category: "Diagnostic",
    },
  ];
  return {
    version: 1,
    demoVersion: 2,
    vehicles,
    parts,
    audit: [],
    orders: [
      {
        id: "demo-order-1",
        part: "windscreen",
        quantity: 1,
        status: "À valider",
      },
      {
        id: "demo-order-2",
        part: "caliper-right",
        quantity: 2,
        status: "À valider",
      },
    ],
    messages: [],
    quotes,
    workshop,
    appointments,
    diagnosticCases,
    alerts,
    stockMovements: [],
    invoices: vehicles.slice(35, 40).map((v, i) => ({
      id: "demo-invoice-" + i,
      vehicle: v.id,
      total: 240 + i * 125,
      state: "Payée",
      at: new Date(now - (i + 2) * 86400000).toISOString(),
      demo: true,
    })),
    maintenance: vehicles.slice(40, 44).map((v) => ({
      id: "maintenance-" + v.id,
      vehicle: v.id,
      label: "Entretien à vérifier selon historique",
      due: new Date(now + 14 * 86400000).toISOString(),
      consent: false,
    })),
  };
}
