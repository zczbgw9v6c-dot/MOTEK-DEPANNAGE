import { prepareClientMessage } from "./communication-domain.ts";
import { type DB } from "./domain.ts";
import {
  reportIssue,
  pauseWork,
  requestPart,
  addAlert,
  patchWorkshop,
  workshopFor,
  toggleWork,
  finishWork,
  elapsedSeconds,
} from "./workshop-domain.ts";
export type VoiceAction = {
  type:
    | "pause"
    | "resume"
    | "piece"
    | "issue"
    | "note"
    | "alert"
    | "finish"
    | "message";
  label: string;
  messageKind?: "quote" | "pickup" | "closing";
  part?: string;
  quantity?: number;
  text?: string;
};
export type VoiceProposal = {
  vehicle: string;
  text: string;
  actions: VoiceAction[];
  warnings: string[];
  reply: string;
  conflict: boolean;
};
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export function proposeVoice(
  db: DB,
  id: string,
  text: string,
  mode = "command",
  now = Date.now(),
): VoiceProposal {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v) throw Error("Ouvrez un dossier.");
  if (mode === "report") {
    if (!text.trim() || text.length > 8000)
      throw Error("Dictez un compte rendu entre 1 et 8 000 caractères.");
    return {
      vehicle: id,
      text,
      actions: [
        {
          type: "note",
          label: "Joindre le compte rendu au dossier et au devis",
          text: text.trim(),
        },
      ],
      warnings: [],
      reply:
        "Le texte sera joint après confirmation. Aucun travail ni envoi ne sera validé automatiquement.",
      conflict: false,
    };
  }
  const t = normalize(text);
  const actions: VoiceAction[] = [],
    warnings: string[] = [];
  const mentioned = db.vehicles.filter(
    (c) =>
      c.id !== id &&
      c.present !== false &&
      [c.make, c.model].some(
        (word) =>
          word.length >= 4 &&
          new RegExp(
            "\\b" +
              normalize(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
              "\\b",
          ).test(t),
      ),
  );
  const currentMention = [v.make, v.model].some((word) =>
    t.includes(normalize(word)),
  );
  if (mentioned.length && !currentMention)
    return {
      vehicle: id,
      text,
      actions: [],
      warnings: [
        "Le véhicule cité ne correspond pas au dossier ouvert. Sélectionnez le bon véhicule.",
      ],
      reply: "Véhicule à confirmer.",
      conflict: true,
    };
  if (
    mode === "command" &&
    /(?:ne|n['’]).{0,16}(?:mets?|mettez|demarr|termin|confirm|repren).{0,15}pas/.test(
      t,
    )
  )
    return {
      vehicle: id,
      text,
      actions: [],
      warnings: [
        "Négation détectée : reformulez une commande courte pour éviter une action erronée.",
      ],
      reply: "Aucune action proposée.",
      conflict: true,
    };
  if (/combien.*temps|temps.*reste/.test(t)) {
    const remaining = Math.max(
      0,
      (v.estimatedMinutes || 0) * 60 - elapsedSeconds(workshopFor(db, id), now),
    );
    return {
      vehicle: id,
      text,
      actions: [],
      warnings: [],
      reply:
        Math.ceil(remaining / 60) +
        " minutes sur l’estimation saisie ; ce n’est pas une garantie de fin.",
      conflict: false,
    };
  }
  if (/intervention.{0,15}(?:empose|en pose)/.test(t))
    warnings.push(
      "Formulation audio incertaine interprétée comme une pause : vérifiez le résumé avant confirmation.",
    );
  const partMappings: [RegExp, string][] = [
    [/etrie?r.*(droit|droite)/, "caliper-right"],
    [/etrie?r/, "caliper"],
    [/disqu.*arriere/, "disc-rear"],
    [/disqu/, "disc"],
    [/plaquett.*arriere/, "pads-rear"],
    [/plaquett/, "pads"],
    [/filtre.*huile/, "filter"],
    [/filtre.*air/, "air-filter"],
    [/pare.?brise/, "windscreen"],
    [/batterie/, "battery"],
    [/pneu/, "tyre-16"],
  ];
  const match = partMappings.find(([re]) => re.test(t));
  if (/pause|arrete|intervention.{0,15}(?:empose|en pose)/.test(t))
    actions.push({
      type: "pause",
      label: "Mettre l’intervention en pause",
      text: /manqu|piece|filtre|etrie?r/.test(t)
        ? "Attente de pièce"
        : "Pause demandée vocalement",
    });
  if (/repren|recommenc|demarr/.test(t))
    actions.push({
      type: "resume",
      label: "Démarrer / reprendre l’intervention",
    });
  if (
    (mode === "piece" ||
      /il.*(manqu|faut)|demande.*(piece|disqu|filtre|etrie?r|plaquett)|besoin/.test(
        t,
      )) &&
    match
  ) {
    const q = t.match(/\b(\d+|deux|trois|quatre|une|un)\b/);
    const numbers: Record<string, number> = {
      deux: 2,
      trois: 3,
      quatre: 4,
      un: 1,
      une: 1,
    };
    const quantity = q ? numbers[q[1]] || Number(q[1]) : 1;
    const part = db.parts.find((p) => p.id === match[1])!;
    actions.push({
      type: "piece",
      label: `Demander ${quantity} × ${part.name}`,
      part: part.id,
      quantity,
    });
    warnings.push(
      `Référence interne ${part.ref}, illustration générique : compatibilité à vérifier par le responsable. ${part.stock - part.reserved} en stock disponible.`,
    );
  } else if (mode === "piece")
    warnings.push(
      "Pièce non reconnue. Utilisez la sélection manuelle du stock ; aucune référence OEM n’est inventée.",
    );
  if (
    mode === "issue" ||
    /signale|fuite|cassee|casse |usees|usee |diagnostic.*complementaire/.test(t)
  )
    actions.push({
      type: "issue",
      label: "Signaler un problème, bloquer et alerter le responsable",
      text,
    });
  else if (mode === "report" || /ajoute.*note|compte.?rendu/.test(t))
    actions.push({
      type: "note",
      label: "Ajouter un compte rendu au dossier",
      text: text.replace(/^.*?note\s*:\s*/i, ""),
    });
  if (
    /previen[st]|avertis|alerte.*(chef|responsable)/.test(t) &&
    !actions.some((a) => a.type === "issue")
  )
    actions.push({
      type: "alert",
      label: "Alerter le chef d’atelier dans l’application",
      text,
    });
  if (/terminee|termine|controle qualite/.test(t))
    actions.push({
      type: "finish",
      label: "Terminer les travaux et demander le contrôle qualité",
    });
  if (/envoi|envoie|envoyer|message.*client/.test(t)) {
    const kind = /devis/.test(t)
      ? "quote"
      : /horaire|fermeture/.test(t)
        ? "closing"
        : "pickup";
    if (
      kind === "pickup" &&
      (!v.quality || !["Prêt à livrer", "Livré"].includes(v.status))
    )
      warnings.push(
        "Le message véhicule prêt sera disponible après validation du contrôle final.",
      );
    else
      actions.push({
        type: "message",
        messageKind: kind,
        label: "Préparer le message client, sans envoi automatique",
      });
  }
  if (!actions.length && !warnings.length)
    warnings.push("Commande non comprise. Aucune action ne sera exécutée.");
  return {
    vehicle: id,
    text,
    actions,
    warnings,
    reply: actions.map((a) => a.label).join(". "),
    conflict: false,
  };
}
export function applyVoice(
  db: DB,
  id: string,
  text: string,
  mode: string,
  confirmed: boolean,
  now = Date.now(),
): DB {
  if (!confirmed) throw Error("Confirmez explicitement les actions proposées.");
  const p = proposeVoice(db, id, text, mode, now);
  if (p.conflict || !p.actions.length)
    throw Error("Aucune action confirmable.");
  let next = db;
  for (const a of p.actions) {
    if (a.type === "pause")
      next = pauseWork(
        next,
        id,
        a.text || "Pause vocale",
        p.actions.some((x) => x.type === "piece"),
        now,
      );
    if (a.type === "resume" && !workshopFor(next, id).runningSince)
      next = toggleWork(next, id, now);
    if (a.type === "issue")
      next = reportIssue(next, id, a.text!, "Incident mécanique", now);
    if (a.type === "piece")
      next = requestPart(next, id, a.part!, a.quantity, now);
    if (a.type === "alert")
      next = addAlert(next, id, "responsable", a.text!, now);
    if (a.type === "note") {
      const s = workshopFor(next, id);
      next = patchWorkshop(
        next,
        id,
        {
          reports: [
            ...s.reports,
            {
              id: crypto.randomUUID(),
              text: a.text!,
              at: new Date(now).toISOString(),
            },
          ],
        },
        "Compte rendu vocal confirmé",
      );
    }
    if (a.type === "finish") next = finishWork(next, id, now);
    if (a.type === "message")
      next = prepareClientMessage(next, id, a.messageKind!);
  }
  return next;
}
