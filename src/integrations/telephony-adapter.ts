import type { DB } from "../domain.ts";
/**
 * Réceptionniste téléphonique : contrat d’intégration.
 * Aucun fournisseur n’est raccordé. Un adaptateur réel (SIP, Twilio, Vonage, Aircall…)
 * devra produire des `CallEvent` et consommer les `CallIntent` ; le CRM, lui, ne
 * connaît que ces structures et n’invente ni diagnostic, ni disponibilité de pièce,
 * ni promesse de délai.
 */
export type CallEvent =
  | { type: "incoming"; callId: string; from: string; at: string }
  | { type: "transcript"; callId: string; text: string; at: string }
  | { type: "ended"; callId: string; at: string; reason: string };
export type CallIntent = {
  callId: string;
  /** Identité déclarée par l’appelant, jamais déduite du numéro seul. */
  caller: { name?: string; phone: string };
  vehicle?: { plate?: string; make?: string; model?: string };
  request: string;
  /** Créneau souhaité, à confronter aux disponibilités réelles du planning. */
  wishedAt?: string;
  /** Tout ce qui exige un humain : urgence, question technique, mécontentement… */
  needsHuman: boolean;
  confidence: "haute" | "moyenne" | "basse";
};
export interface TelephonyAdapter {
  readonly name: string;
  readonly live: boolean;
  /** Démarre l’écoute des appels ; ne fait rien pour l’adaptateur local. */
  start(onEvent: (event: CallEvent) => void): Promise<void>;
  /** Parole synthétique ou texte lu à l’appelant ; non envoyé sans fournisseur. */
  say(callId: string, text: string): Promise<void>;
  transferToHuman(callId: string, extension: string): Promise<void>;
  stop(): Promise<void>;
}
/** Adaptateur par défaut : rien n’est raccordé, tout est explicite. */
export const noTelephony: TelephonyAdapter = {
  name: "Aucun fournisseur raccordé",
  live: false,
  async start() {},
  async say() {},
  async transferToHuman() {},
  async stop() {},
};
/** Questions courantes auxquelles le réceptionniste peut répondre sans inventer. */
export function answerFrequentQuestion(
  db: DB,
  question: string,
): string | null {
  const q = question.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/horaire|ouvert|ferme|quelle heure/.test(q)) {
    if (!db.openingHours)
      return "Les horaires ne sont pas encore renseignés dans MOTEK ; je vous passe l’accueil.";
    const days = [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
    ];
    return `Le garage est ouvert ${db.openingHours.weekdays.map((d) => days[d]).join(", ")} de ${db.openingHours.opens} à ${db.openingHours.closes}.`;
  }
  if (/pret|prete|recuperer|termine/.test(q))
    return "Je ne peux pas confirmer l’état d’un véhicule par téléphone sans vérification : je prends votre immatriculation et l’accueil vous rappelle.";
  if (/prix|tarif|combien|devis/.test(q))
    return "Les prix dépendent d’un devis établi par l’atelier ; je note votre demande pour qu’il vous soit proposé.";
  return null;
}
/** Transforme une intention d’appel en demande CRM : dossier existant retrouvé ou nouveau brouillon, jamais de doublon silencieux. */
export function intentToRequest(db: DB, intent: CallIntent) {
  const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const byPlate = intent.vehicle?.plate
    ? db.vehicles.find(
        (v) => normalize(v.plate) === normalize(intent.vehicle!.plate!),
      )
    : undefined;
  const byPhone = db.vehicles.filter(
    (v) =>
      v.phone.replace(/\D/g, "") === intent.caller.phone.replace(/\D/g, ""),
  );
  return {
    existingVehicle:
      byPlate?.id ?? (byPhone.length === 1 ? byPhone[0].id : undefined),
    candidates: byPhone.map((v) => v.id),
    draft: {
      client: intent.caller.name || byPlate?.client || byPhone[0]?.client || "",
      phone: intent.caller.phone,
      plate: intent.vehicle?.plate || byPlate?.plate || "",
      make: intent.vehicle?.make || byPlate?.make || "",
      model: intent.vehicle?.model || byPlate?.model || "",
      symptoms: intent.request,
      wishedAt: intent.wishedAt,
    },
    /** Un humain confirme toujours : identité ambiguë, confiance basse ou demande sensible. */
    requiresHumanConfirmation:
      intent.needsHuman ||
      intent.confidence === "basse" ||
      (!byPlate && byPhone.length > 1),
  };
}
