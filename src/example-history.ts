import type { DB, Vehicle } from "./domain.ts";
/** Explicitly requested fictitious previous visits, never attached to a real vehicle. */
export function exampleHistory(db: DB, v: Vehicle) {
  if (!db.demoVersion || !v.demo) return [];
  const jobs = [
    "Révision : vidange et filtre à huile",
    "Contrôle du freinage et remplacement des plaquettes avant",
    "Diagnostic et remplacement de l’embrayage",
  ];
  return jobs.map((label, i) => ({
    id: `example-${v.id}-${i}`,
    date: ["2026-05-12", "2025-11-18", "2025-02-06"][i],
    label,
    km: Math.max(0, v.km - (i + 1) * 12000),
    source: "Exemple fictif",
  }));
}
