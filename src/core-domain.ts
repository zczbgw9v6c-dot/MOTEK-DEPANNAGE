import { prepareClientMessage } from "./communication-domain.ts";
import { record, updateVehicle, type DB } from "./domain.ts";
import { receiveClient } from "./reception-domain.ts";
import { quoteTotals } from "./quote-domain.ts";
import { workshopFor } from "./workshop-domain.ts";
import { team } from "./team-data.ts";
import type { WorkOrder } from "./core-schema.ts";
export function orderProgress(db: DB, id: string) {
  const tasks = db.workOrders?.[id]?.tasks || [];
  const done = tasks.filter((t) => t.doneAt).length;
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : null,
  };
}
export function orderBalance(o: WorkOrder) {
  return o.invoice
    ? o.invoice.totalCents - o.payments.reduce((n, p) => n + p.cents, 0)
    : null;
}
export function deliveryBlocks(db: DB, id: string): string[] {
  const v = db.vehicles.find((v) => v.id === id),
    o = db.workOrders?.[id];
  if (!v || !o) return ["Ouvrir un ordre de réparation"];
  const s = workshopFor(db, id),
    reasons: string[] = [];
  if (o.tasks.some((t) => !t.doneAt)) reasons.push("Travaux à terminer");
  if (!v.quality || v.status !== "Prêt à livrer")
    reasons.push("Contrôle final à valider");
  if (s.blocked || s.issues.some((i) => i.state !== "Résolu"))
    reasons.push("Incident à résoudre");
  if (!o.invoice) reasons.push("Décompte à établir depuis le devis accepté");
  else if (orderBalance(o) !== 0)
    reasons.push("Règlement restant à enregistrer");
  if (!o.contact) reasons.push("Contact de restitution à confirmer");
  if (!o.pickupAt) reasons.push("Créneau de récupération à confirmer");
  return reasons;
}
export function pickupConflict(db: DB, stamp: number): string | null {
  const hours = db.openingHours;
  if (!hours) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: hours.timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(stamp));
  const value = (key: string) => parts.find((p) => p.type === key)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      value("weekday"),
    ),
    time = `${value("hour")}:${value("minute")}`;
  if (
    !hours.weekdays.includes(day) ||
    time < hours.opens ||
    time >= hours.closes
  )
    return `Récupération hors ouverture (${hours.opens}–${hours.closes}, Europe/Lisbon). Proposer un autre créneau au client.`;
  return null;
}
export function coreAction(
  db: DB,
  id: string,
  action: string,
  p: any,
  now = Date.now(),
): DB {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v) throw Error("Dossier introuvable.");
  const at = new Date(now).toISOString();
  if (action === "test-arrivals") {
    if (!db.demoVersion)
      throw Error("Cette action est réservée au jeu d’essai.");
    let next = db;
    const candidates = db.vehicles
      .filter(
        (v) =>
          v.demo && v.present !== false && v.status !== "Livré" && !v.reception,
      )
      .slice(0, 3);
    if (!candidates.length)
      throw Error("Aucun dossier d’essai sans arrivée disponible.");
    for (const c of candidates) next = receiveClient(next, c.id, "waiting", at);
    return record(
      next,
      id,
      "Jeu d’essai : trois arrivées maximum enregistrées explicitement",
    );
  }
  if (action === "hours") {
    const opens = String(p.opens || ""),
      closes = String(p.closes || "");
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(opens) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(closes) ||
      opens >= closes ||
      !Array.isArray(p.weekdays) ||
      !p.weekdays.length ||
      !p.weekdays.every((n: number) => Number.isInteger(n) && n >= 0 && n <= 6)
    )
      throw Error("Horaires invalides.");
    return record(
      {
        ...db,
        openingHours: {
          opens,
          closes,
          weekdays: p.weekdays,
          timeZone: "Europe/Lisbon",
        },
      },
      id,
      "Horaires du garage confirmés",
    );
  }
  if (action === "message") {
    if (
      !["quote", "pickup", "closing"].includes(p.kind) ||
      !["SMS", "WhatsApp"].includes(p.channel)
    )
      throw Error("Choisissez le message et le canal.");
    if (
      p.plannedAt &&
      (!Number.isFinite(Date.parse(p.plannedAt)) ||
        Date.parse(p.plannedAt) < now)
    )
      throw Error("Choisissez une date future.");
    const next = prepareClientMessage(db, id, p.kind);
    const message = next.messages.find(
      (m) => m.vehicle === id && m.kind === p.kind,
    );
    if (!message) throw Error("Préparez un nouveau message depuis le dossier.");
    return record(
      {
        ...next,
        messages: next.messages.map((m) =>
          m.id === message.id
            ? { ...m, channel: p.channel, plannedAt: p.plannedAt || undefined }
            : m,
        ),
      },
      id,
      "Message préparé dans la file locale · envoi externe non raccordé",
    );
  }
  let o = db.workOrders?.[id];
  if (action === "resume-delivery") {
    if (o) return db;
    if (v.status !== "Prêt à livrer" || !v.quality)
      throw Error("Le contrôle final doit déjà être validé.");
    const order: WorkOrder = {
      id: `OR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      vehicle: id,
      openedAt: at,
      tasks: [
        {
          id: crypto.randomUUID(),
          label:
            "Reprise du dossier de restitution depuis le contrôle déjà validé",
          doneAt: at,
          technician: "Accueil",
        },
      ],
      payments: [],
    };
    return record(
      { ...db, workOrders: { ...db.workOrders, [id]: order } },
      id,
      "Suivi de restitution repris · contrôle historique conservé, règlement à vérifier",
    );
  }
  if (action === "open" || action === "receive") {
    if (v.status === "Livré") throw Error("Ce dossier est déjà clôturé.");
    let next = db;
    if (action === "receive") next = receiveClient(db, id, "received", at);
    if (o) return next;
    o = {
      id: `OR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      vehicle: id,
      openedAt: at,
      tasks: [
        {
          id: crypto.randomUUID(),
          label: v.symptoms.trim() || "Diagnostic à préciser à la réception",
        },
      ],
      payments: [],
    };
    return record(
      { ...next, workOrders: { ...next.workOrders, [id]: o } },
      id,
      "Ordre de réparation ouvert · affectation attendue",
    );
  }
  if (action === "arrival" || action === "departure")
    return receiveClient(db, id, action === "arrival" ? "waiting" : "left", at);
  if (!o) throw Error("Ouvrez un ordre de réparation.");
  if (o.deliveredAt || v.status === "Livré")
    throw Error("Ordre clôturé : les modifications sont bloquées.");
  const save = (order: WorkOrder, note: string, next = db) =>
    record(
      { ...next, workOrders: { ...next.workOrders, [id]: order } },
      id,
      note,
    );
  if (action === "assign") {
    const tech = team.find((t) => t.name === p.technician);
    if (!tech) throw Error("Choisissez un technicien.");
    if (v.department && !tech.skills.includes(v.department))
      throw Error("Compétence du technicien incompatible avec le service.");
    const busyOn = db.vehicles.find(
      (c) =>
        c.id !== id &&
        c.technician === tech.name &&
        c.present !== false &&
        c.status !== "Livré" &&
        !!workshopFor(db, c.id).runningSince,
    );
    if (busyOn)
      throw Error(
        `${tech.name} a déjà une intervention active sur ${busyOn.plate}. Mettez-la en pause ou choisissez un technicien disponible.`,
      );
    const bay = p.bay === null ? null : Number(p.bay);
    if (bay !== null && (!Number.isInteger(bay) || bay < 1 || bay > 8))
      throw Error("Poste invalide.");
    return save(
      o,
      `OR affecté à ${tech.name} · notification dans sa file atelier`,
      updateVehicle(db, id, { technician: tech.name, bay }),
    );
  }
  if (action === "add-task") {
    const label = String(p.label || "").trim();
    if (!label || label.length > 500 || o.tasks.length >= 50)
      throw Error("Libellé de travail requis (500 caractères maximum).");
    if (o.invoice || ["Contrôle qualité", "Prêt à livrer"].includes(v.status))
      throw Error("Les travaux sont clôturés.");
    return save(
      { ...o, tasks: [...o.tasks, { id: crypto.randomUUID(), label }] },
      "Travail ajouté à l’OR",
    );
  }
  if (action === "task") {
    if (v.status !== "En intervention" || v.technician === "Non affecté")
      throw Error("Démarrez l’intervention avec un technicien affecté.");
    if (!o.tasks.some((t) => t.id === p.task))
      throw Error("Travail introuvable.");
    if (typeof p.done !== "boolean") throw Error("État de travail invalide.");
    return save(
      {
        ...o,
        tasks: o.tasks.map((t) =>
          t.id === p.task
            ? {
                id: t.id,
                label: t.label,
                ...(p.done ? { doneAt: at, technician: v.technician } : {}),
              }
            : t,
        ),
      },
      p.done ? "Travail réalisé et horodaté" : "Travail remis à faire",
    );
  }
  if (action === "quality") {
    const s = workshopFor(db, id);
    if (
      v.status !== "Contrôle qualité" ||
      o.tasks.some((t) => !t.doneAt) ||
      !Object.values(s.checks).every(Boolean) ||
      s.blocked ||
      s.issues.some((i) => i.state !== "Résolu")
    )
      throw Error(
        "Terminez les travaux, les contrôles et les incidents avant validation finale.",
      );
    return updateVehicle(db, id, { quality: true, status: "Prêt à livrer" });
  }
  if (action === "invoice") {
    if (o.invoice) return db;
    const q = db.quotes?.find(
      (q) => q.id === p.quote && q.vehicle === id && q.state === "Validé",
    );
    if (!q) throw Error("Choisissez un devis accepté.");
    return save(
      {
        ...o,
        invoice: {
          quote: q.id,
          totalCents: Math.round(quoteTotals(q).total * 100),
          issuedAt: at,
        },
      },
      "Décompte interne établi depuis le devis accepté",
    );
  }
  if (action === "payment") {
    const cents = Number(p.cents),
      reference = String(p.reference || "").trim(),
      balance = orderBalance(o);
    if (
      balance === null ||
      !Number.isSafeInteger(cents) ||
      cents <= 0 ||
      cents > balance ||
      !reference ||
      reference.length > 160 ||
      !["Carte", "Espèces", "Virement"].includes(p.method)
    )
      throw Error(
        "Vérifiez le montant restant, le moyen et la référence du règlement.",
      );
    if (o.payments.some((x) => x.reference === reference))
      throw Error("Cette référence de règlement existe déjà.");
    return save(
      {
        ...o,
        payments: [
          ...o.payments,
          { id: crypto.randomUUID(), cents, reference, method: p.method, at },
        ],
      },
      "Règlement déclaré manuellement · aucun débit bancaire déclenché",
    );
  }
  if (action === "contact") {
    const note = String(p.note || "").trim();
    if (
      !note ||
      note.length > 1000 ||
      !["Téléphone", "Sur place"].includes(p.channel)
    )
      throw Error("Précisez le contact réellement effectué.");
    return save(
      { ...o, contact: { at, note, channel: p.channel } },
      "Contact de restitution consigné manuellement",
    );
  }
  if (action === "pickup") {
    const stamp = Date.parse(String(p.at));
    if (!Number.isFinite(stamp) || stamp < now)
      throw Error("Choisissez un créneau futur.");
    const conflict = pickupConflict(db, stamp);
    if (conflict) throw Error(conflict);
    return save(
      { ...o, pickupAt: new Date(stamp).toISOString() },
      "Créneau de récupération confirmé à l’accueil",
    );
  }
  if (action === "deliver") {
    const blocks = deliveryBlocks(db, id);
    if (blocks.length) throw Error(blocks.join(" · "));
    if (p.keysConfirmed !== true)
      throw Error("Confirmez la remise des clés au destinataire.");
    const next = updateVehicle(db, id, {
      status: "Livré",
      ...(v.reception
        ? { reception: { ...v.reception, state: "left" as const } }
        : {}),
    });
    return save(
      { ...o, deliveredAt: at },
      "Remise des clés confirmée · OR clôturé",
      next,
    );
  }
  throw Error("Action Core inconnue.");
}
