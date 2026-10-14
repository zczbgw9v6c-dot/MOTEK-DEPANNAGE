export type WorkOrder = {
  id: string;
  vehicle: string;
  openedAt: string;
  tasks: { id: string; label: string; doneAt?: string; technician?: string }[];
  invoice?: { quote: string; totalCents: number; issuedAt: string };
  payments: {
    id: string;
    cents: number;
    reference: string;
    at: string;
    method: "Carte" | "Espèces" | "Virement";
  }[];
  contact?: { at: string; note: string; channel: "Téléphone" | "Sur place" };
  pickupAt?: string;
  deliveredAt?: string;
};
export function validOrders(
  value: unknown,
  ids: string[],
): value is Record<string, WorkOrder> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const date = (s: unknown) =>
    typeof s === "string" && Number.isFinite(Date.parse(s));
  const text = (s: unknown) => typeof s === "string" && s.trim().length > 0;
  const cents = (s: unknown) => Number.isSafeInteger(s) && Number(s) >= 0;
  return Object.entries(value).every(
    ([key, o]: [string, any]) =>
      o &&
      key === o.vehicle &&
      ids.includes(key) &&
      text(o.id) &&
      date(o.openedAt) &&
      Array.isArray(o.tasks) &&
      o.tasks.length > 0 &&
      o.tasks.length <= 50 &&
      new Set(o.tasks.map((t: any) => t.id)).size === o.tasks.length &&
      o.tasks.every(
        (t: any) =>
          t &&
          text(t.id) &&
          text(t.label) &&
          (!t.doneAt || (date(t.doneAt) && text(t.technician))),
      ) &&
      Array.isArray(o.payments) &&
      new Set(o.payments.map((p: any) => p.id)).size === o.payments.length &&
      o.payments.every(
        (p: any) =>
          p &&
          text(p.id) &&
          cents(p.cents) &&
          p.cents > 0 &&
          text(p.reference) &&
          date(p.at) &&
          ["Carte", "Espèces", "Virement"].includes(p.method),
      ) &&
      (!o.invoice ||
        (text(o.invoice.quote) &&
          cents(o.invoice.totalCents) &&
          date(o.invoice.issuedAt))) &&
      (!o.contact ||
        (date(o.contact.at) &&
          text(o.contact.note) &&
          ["Téléphone", "Sur place"].includes(o.contact.channel))) &&
      (!o.pickupAt || date(o.pickupAt)) &&
      (!o.deliveredAt || date(o.deliveredAt)),
  );
}
