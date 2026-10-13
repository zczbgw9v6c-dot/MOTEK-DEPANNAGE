export const departments = [
  "Mécanique",
  "Diagnostic",
  "Pneumatiques",
  "Vitrage",
  "Carrosserie",
  "Peinture",
  "Contrôle qualité",
  "Livraison",
] as const;
export type Department = (typeof departments)[number];
export type Technician = {
  id: string;
  name: string;
  specialty: string;
  skills: Department[];
  department: Department;
  color: string;
  shiftStart: string;
  shiftEnd: string;
  quality: { checked: number; reworks: number };
};
export const team: Technician[] = [
  {
    id: "kader",
    name: "Kader",
    specialty: "Vitrage et pare-brise",
    skills: ["Vitrage", "Contrôle qualité"],
    department: "Vitrage",
    color: "#4f7f8b",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 38, reworks: 1 },
  },
  {
    id: "yanis",
    name: "Yanis",
    specialty: "Mécanique générale et freinage",
    skills: ["Mécanique", "Contrôle qualité"],
    department: "Mécanique",
    color: "#657c8c",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 42, reworks: 1 },
  },
  {
    id: "sofiane",
    name: "Sofiane",
    specialty: "Carrosserie et peinture",
    skills: ["Carrosserie", "Peinture", "Contrôle qualité"],
    department: "Carrosserie",
    color: "#987863",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 31, reworks: 0 },
  },
  {
    id: "mehdi",
    name: "Mehdi",
    specialty: "Pneumatiques et géométrie",
    skills: ["Pneumatiques", "Contrôle qualité"],
    department: "Pneumatiques",
    color: "#63816e",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 47, reworks: 1 },
  },
  {
    id: "thomas",
    name: "Thomas",
    specialty: "Diagnostic électronique",
    skills: ["Diagnostic", "Contrôle qualité"],
    department: "Diagnostic",
    color: "#50758d",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 34, reworks: 0 },
  },
  {
    id: "karim",
    name: "Karim",
    specialty: "Entretien et révisions",
    skills: ["Mécanique", "Contrôle qualité"],
    department: "Mécanique",
    color: "#9a8560",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 51, reworks: 1 },
  },
  {
    id: "lucas",
    name: "Lucas",
    specialty: "Mécanique lourde et suspension",
    skills: ["Mécanique", "Contrôle qualité"],
    department: "Mécanique",
    color: "#627786",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 29, reworks: 0 },
  },
  {
    id: "rayan",
    name: "Rayan",
    specialty: "Mécanique polyvalente",
    skills: ["Mécanique", "Diagnostic", "Pneumatiques", "Contrôle qualité"],
    department: "Mécanique",
    color: "#738b80",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 44, reworks: 1 },
  },
];
export const resources = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: "lift-" + (i + 1),
    name: "Pont " + (i + 1),
    department: "Mécanique" as Department,
    bay: i + 1,
  })),
  {
    id: "tyres",
    name: "Poste pneumatiques",
    department: "Pneumatiques" as Department,
    bay: null,
  },
  {
    id: "glass",
    name: "Poste vitrage",
    department: "Vitrage" as Department,
    bay: null,
  },
  {
    id: "diagnostic",
    name: "Poste diagnostic",
    department: "Diagnostic" as Department,
    bay: null,
  },
  {
    id: "body",
    name: "Zone carrosserie",
    department: "Carrosserie" as Department,
    bay: null,
  },
  {
    id: "paint",
    name: "Cabine peinture",
    department: "Peinture" as Department,
    bay: null,
  },
  {
    id: "quality",
    name: "Contrôle final",
    department: "Contrôle qualité" as Department,
    bay: null,
  },
];
