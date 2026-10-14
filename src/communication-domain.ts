import type { DB } from "./domain.ts";

/** Local outbox: preparing a draft never sends a message or records client approval. */
export function prepareClientMessage(
  db: DB,
  vehicleId: string,
  kind: "pickup" | "quote" | "closing",
): DB {
  const v = db.vehicles.find((v) => v.id === vehicleId);
  if (!v) throw Error("Dossier introuvable.");
  let text: string;
  if (kind === "closing") {
    if (!db.openingHours)
      throw Error(
        "Renseignez les horaires du garage avant de préparer ce rappel.",
      );
    text = `Bonjour ${v.client}, pour votre ${v.make} ${v.model} (${v.plate}), nous vous rappelons nos horaires : ${db.openingHours.opens}–${db.openingHours.closes} (Europe/Lisbon), les jours d’ouverture convenus avec l’accueil. Merci de confirmer votre passage. L’équipe MOTEK.`;
  } else if (kind === "pickup") {
    if (!v.quality || !["Prêt à livrer", "Livré"].includes(v.status))
      throw Error(
        "Validez le contrôle qualité avant de préparer la restitution.",
      );
    text = `Bonjour ${v.client}, votre ${v.make} ${v.model} (${v.plate}) est prêt à être récupéré. Contactez l’accueil pour convenir de votre passage. L’équipe MOTEK.`;
  } else {
    const q = db.quotes
      ?.filter((q) => q.vehicle === v.id && q.state === "À valider")
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
    if (!q?.lines.length)
      throw Error(
        "Enregistrez un devis avec des lignes et soumettez-le à validation.",
      );
    const ht = q.lines.reduce(
      (n, l) => n + Math.round(l.quantity * l.unitPrice * 100) / 100,
      0,
    );
    const total = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Math.round((ht + Math.round(ht * q.vat) / 100) * 100) / 100);
    text = `Bonjour ${v.client}, le devis pour votre ${v.make} ${v.model} (${v.plate}) s’élève à ${total} TTC. Travaux proposés : ${q.lines.map((l) => l.label).join(", ")}. Merci de nous confirmer votre accord avant la poursuite des travaux. L’équipe MOTEK.`;
  }
  if (db.messages.some((m) => m.vehicle === v.id && m.text === text)) return db;
  return {
    ...db,
    messages: [
      {
        id: crypto.randomUUID(),
        vehicle: v.id,
        text,
        kind,
        createdAt: new Date().toISOString(),
      },
      ...db.messages,
    ],
    audit: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        vehicle: v.id,
        action: `Agent WhatsApp : brouillon ${kind === "pickup" ? "restitution" : kind === "closing" ? "horaires" : "devis"} préparé, non envoyé`,
      },
      ...db.audit,
    ],
  };
}
