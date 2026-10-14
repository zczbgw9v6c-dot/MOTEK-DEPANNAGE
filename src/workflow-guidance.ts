import type { DB, Vehicle } from "./domain.ts";
import { orderBalance } from "./core-domain.ts";
export function nextWorkStep(
  db: DB,
  v: Vehicle,
): { action: string; label: string; hint: string } {
  const o = db.workOrders?.[v.id];
  if (v.status === "Livré")
    return {
      action: "closed",
      label: "Dossier clôturé",
      hint: "Le véhicule a été remis au client.",
    };
  if (!o && v.status === "Prêt à livrer" && v.quality)
    return {
      action: "resume-delivery",
      label: "Reprendre la restitution",
      hint: "Le contrôle est déjà validé. Complétez maintenant le règlement et la remise des clés.",
    };
  if (!o)
    return v.status === "Réception"
      ? {
          action: "receive",
          label: "Prendre en charge",
          hint: "Enregistrez le travail demandé pour démarrer le suivi.",
        }
      : {
          action: "open",
          label: "Ouvrir le suivi des travaux",
          hint: "Ce dossier n’a pas encore de liste de travaux : ouvrez-la pour suivre la progression, le règlement et la restitution.",
        };
  if (v.technician === "Non affecté")
    return {
      action: "assign",
      label: "Choisir le technicien",
      hint: "Affectez le dossier à la personne qui va intervenir.",
    };
  if (!db.quotes?.some((q) => q.vehicle === v.id && q.state === "Validé"))
    return {
      action: "quote",
      label: "Vérifier le devis",
      hint: "Recueillez l’accord du client avant les travaux. Le règlement est suivi séparément.",
    };
  if (!["Prêt à livrer", "Contrôle qualité"].includes(v.status))
    return {
      action: "work",
      label: "Ouvrir l’intervention",
      hint: "Démarrez le chrono, cochez les travaux réalisés, puis terminez les contrôles.",
    };
  if (v.status === "Contrôle qualité")
    return {
      action: "quality",
      label: "Valider le contrôle final",
      hint: "Vérifiez le résultat avant d’annoncer le véhicule prêt.",
    };
  if (!o.invoice)
    return {
      action: "billing",
      label: "Préparer le règlement",
      hint: "Établissez le décompte depuis le devis accepté.",
    };
  if (orderBalance(o) !== 0)
    return {
      action: "billing",
      label: "Enregistrer le règlement",
      hint: "Consignez le montant réellement reçu, même partiel.",
    };
  if (!o.contact || !o.pickupAt)
    return {
      action: "delivery",
      label: "Organiser la récupération",
      hint: "Confirmez le contact client et son créneau de passage.",
    };
  return {
    action: "delivery",
    label: "Remettre les clés",
    hint: "Vérifiez le destinataire puis confirmez la livraison.",
  };
}
