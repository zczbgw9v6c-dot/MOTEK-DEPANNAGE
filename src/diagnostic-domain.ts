import type { DB } from "./domain.ts";
export type DiagnosticCase = {
  id: string;
  vehicleId: string;
  at: string;
  symptoms: string;
  codes: string[];
  engine: string;
  tests: { name: string; result: string; done: boolean }[];
  hypotheses: {
    label: string;
    state: "Rejetée" | "À vérifier" | "Confirmée";
  }[];
  cause: string | null;
  repair: string;
  result: string;
  resolved: boolean;
  recurred: boolean;
  demo: boolean;
};
const normalized = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{3,}/g) || [];
export function searchDiagnostics(db: DB, query: string, vehicleId?: string) {
  const target = db.vehicles.find((v) => v.id === vehicleId);
  const terms = new Set(normalized(query));
  return (db.diagnosticCases || [])
    .map((c) => {
      const v = db.vehicles.find((v) => v.id === c.vehicleId);
      if (!v) return null;
      const words = new Set(normalized(c.symptoms + " " + c.codes.join(" ")));
      const matches = [...terms].filter((w) => words.has(w));
      const sameModel = target?.make === v.make && target?.model === v.model;
      const sameEngine = !!target?.engine && target.engine === c.engine;
      const score = matches.length + (sameModel ? 2 : 0) + (sameEngine ? 1 : 0);
      const similarities = [
        ...matches.map((w) => "Terme partagé : " + w),
        ...(sameModel ? ["Même marque et modèle"] : []),
        ...(sameEngine ? ["Motorisation renseignée identique"] : []),
      ];
      const differences = target
        ? [
            ...(target.make !== v.make || target.model !== v.model
              ? ["Modèle différent : " + v.make + " " + v.model]
              : []),
            ...(!sameEngine ? ["Motorisation différente ou non vérifiée"] : []),
            ...(target.km !== v.km
              ? ["Kilométrage source : " + v.km.toLocaleString("fr-FR") + " km"]
              : []),
          ]
        : [
            "Véhicule courant non sélectionné : comparaison de motorisation impossible",
          ];
      return { case: c, vehicle: v, score, similarities, differences };
    })
    .filter(
      (r): r is NonNullable<typeof r> => !!r && (!query.trim() || r.score > 0),
    )
    .sort((a, b) => b.score - a.score);
}
export function extractDTC(text: string) {
  return [
    ...new Set(text.toUpperCase().match(/\b[PCBU][0-3][0-9A-F]{3}\b/g) || []),
  ];
}
