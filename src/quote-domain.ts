import { prepareClientMessage } from "./communication-domain.ts";
import { record, updateVehicle, type DB, type Quote } from "./domain.ts";
export function quoteTotals(quote: Quote) {
  const ht = quote.lines.reduce(
    (sum, line) => sum + Math.round(line.quantity * line.unitPrice * 100) / 100,
    0,
  );
  const tax = Math.round(ht * quote.vat) / 100;
  return {
    ht: Math.round(ht * 100) / 100,
    tax,
    total: Math.round((ht + tax) * 100) / 100,
  };
}
export function saveQuote(db: DB, quote: Quote): DB {
  if (!db.vehicles.some((v) => v.id === quote.vehicle))
    throw Error("Dossier introuvable.");
  if (
    !Number.isFinite(quote.vat) ||
    quote.vat < 0 ||
    quote.vat > 100 ||
    quote.lines.some(
      (l) =>
        !l.label.trim() ||
        !Number.isFinite(l.quantity) ||
        l.quantity <= 0 ||
        !Number.isFinite(l.unitPrice) ||
        l.unitPrice < 0,
    )
  )
    throw Error("Vérifiez les libellés, quantités, prix et taux de TVA.");
  const current = db.quotes?.find((q) => q.id === quote.id);
  if (current?.state === "Validé" || current?.state === "Refusé")
    throw Error(
      `Un devis ${current.state.toLowerCase()} ne peut plus être modifié : créez une nouvelle version.`,
    );
  const result = record(
    {
      ...db,
      quotes: [...(db.quotes || []).filter((q) => q.id !== quote.id), quote],
    },
    quote.vehicle,
    "Devis " + quote.state.toLowerCase() + " enregistré",
  );
  return quote.state === "À valider" && quote.lines.length
    ? prepareClientMessage(result, quote.vehicle, "quote")
    : result;
}
export function approveQuote(db: DB, id: string) {
  const quote = db.quotes?.find((q) => q.id === id);
  if (!quote || quote.state !== "À valider" || !quote.lines.length)
    throw Error("Un devis avec des lignes doit être soumis avant validation.");
  const next = record(
    {
      ...db,
      quotes: db.quotes!.map((q) =>
        q.id === id ? { ...q, state: "Validé" as const } : q,
      ),
    },
    quote.vehicle,
    "Accord client saisi manuellement pour le devis",
  );
  const vehicle = next.vehicles.find((v) => v.id === quote.vehicle)!;
  return vehicle.status === "Devis à valider"
    ? updateVehicle(next, vehicle.id, { status: "Diagnostic" })
    : next;
}

/** Customer refusal recorded by staff: the quote is frozen, nothing is billed. */
export function rejectQuote(db: DB, id: string, reason = "") {
  const quote = db.quotes?.find((q) => q.id === id);
  if (!quote || quote.state !== "À valider")
    throw Error("Seul un devis soumis au client peut être refusé.");
  if (db.workOrders?.[quote.vehicle]?.invoice?.quote === id)
    throw Error("Ce devis a déjà servi au décompte.");
  const next = record(
    {
      ...db,
      quotes: db.quotes!.map((q) =>
        q.id === id ? { ...q, state: "Refusé" as const } : q,
      ),
    },
    quote.vehicle,
    "Refus du devis saisi manuellement" + (reason ? " : " + reason : ""),
  );
  const vehicle = next.vehicles.find((v) => v.id === quote.vehicle)!;
  const stillPending = next.quotes!.some(
    (q) => q.vehicle === quote.vehicle && q.state === "À valider",
  );
  return vehicle.status === "Devis à valider" && !stillPending
    ? updateVehicle(next, vehicle.id, { status: "Diagnostic" })
    : next;
}
