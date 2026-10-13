import type { DB, Vehicle } from "./domain.ts";
export type FieldEvidence = {
  code: string;
  label: string;
  raw: string;
  value: string;
  source: "pdf_text" | "ocr_local" | "manual";
  confidence: number | null;
  confirmed: boolean;
  extractedAt: string;
  reviewedAt: string | null;
  corrected: boolean;
  box: { x: number; y: number; w: number; h: number; page: number } | null;
};
export function validVIN(vin: string) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase().trim());
}
export function identifyLocal(
  db: DB,
  query: { plate?: string; vin?: string; country?: string },
): {
  state: "identified" | "conflict" | "not_found" | "needs_confirmation";
  matches: Vehicle[];
  source: string;
  message: string;
} {
  const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (query.vin && !validVIN(query.vin))
    return {
      state: "needs_confirmation",
      matches: [],
      source: "Contrôle de format local",
      message:
        "VIN attendu : 17 caractères sans I, O ou Q. Vérifiez le document ; aucune donnée n’a été déduite.",
    };
  const vinMatches = query.vin
    ? db.vehicles.filter(
        (v) => v.vin && normalize(v.vin) === normalize(query.vin!),
      )
    : [];
  const plateMatches = query.plate
    ? db.vehicles.filter(
        (v) =>
          (v.country || "FR") === (query.country || "FR") &&
          normalize(v.plate) === normalize(query.plate!),
      )
    : [];
  if (
    query.vin &&
    query.plate &&
    vinMatches.length &&
    plateMatches.length &&
    !vinMatches.some((v) => plateMatches.some((p) => p.id === v.id))
  )
    return {
      state: "conflict",
      matches: [...vinMatches, ...plateMatches],
      source: "Dossiers internes",
      message:
        "La plaque et le VIN correspondent à des dossiers différents. Vérifiez les sources avant tout rattachement.",
    };
  const matches = vinMatches.length ? vinMatches : plateMatches;
  return matches.length
    ? {
        state: "identified",
        matches,
        source: "Dossiers internes du serveur AutoHub",
        message:
          "Correspondance avec un dossier local. La motorisation n’est pas vérifiée par une source constructeur.",
      }
    : {
        state: "not_found",
        matches: [],
        source: "Dossiers internes uniquement",
        message:
          "Aucune correspondance locale. Complétez la fiche manuellement ou scannez le document. Aucun service de recherche par plaque n’est connecté.",
      };
}
const specs = [
  ["A", "Immatriculation"],
  ["B", "Première immatriculation"],
  ["C.1", "Titulaire"],
  ["D.1", "Marque"],
  ["D.2", "Type / variante / version"],
  ["D.3", "Modèle commercial"],
  ["E", "VIN"],
  ["F.2", "Masse maximale"],
  ["G.1", "Masse à vide"],
  ["J.1", "Genre"],
  ["P.1", "Cylindrée"],
  ["P.2", "Puissance"],
  ["P.3", "Énergie"],
  ["P.6", "Puissance administrative"],
  ["S.1", "Places"],
  ["V.7", "CO₂"],
] as const;
export function extractRegistration(
  text: string,
  source: FieldEvidence["source"],
): FieldEvidence[] {
  // Conservative: explicit labels only. Missing values stay empty for manual completion.
  const escaped = specs
    .map(([c]) => c.replaceAll(".", "\\."))
    .sort((a, b) => b.length - a.length)
    .join("|");
  const re = new RegExp(
    "(?:^|[\\n\\r])\\s*(" + escaped + ")(?:\\s*[:=]\\s*|\\s+)([^\\n\\r]+)",
    "g",
  );
  const found = new Map<string, string>();
  for (const match of text.matchAll(re)) {
    if (!found.has(match[1])) found.set(match[1], match[2].trim());
  }
  return specs.map(([code, label]) => {
    const raw = found.get(code) || "";
    let value = raw;
    if (code === "E") value = value.toUpperCase().replaceAll(" ", "");
    if (code === "A") value = value.toUpperCase();
    if (code === "E" && value && !validVIN(value)) value = "";
    return {
      code,
      label,
      raw,
      value,
      source,
      confidence: null,
      confirmed: false,
      extractedAt: new Date().toISOString(),
      reviewedAt: null,
      corrected: false,
      box: null,
    };
  });
}
