import type { DB } from "./domain";
export type Snapshot = { db: DB; revision: number; serverNow: number };
let offset = 0;
export const serverNow = () => Date.now() + offset;
export function syncClock(now: number) {
  offset = now - Date.now();
}
export async function readServer(): Promise<Snapshot> {
  const response = await fetch("/api/state");
  if (!response.ok) throw Error("Serveur AutoHub indisponible.");
  const value = await response.json();
  syncClock(value.serverNow);
  return value;
}
export async function changeServer(
  revision: number,
  type: string,
  vehicle: string | undefined,
  payload: any,
): Promise<Snapshot> {
  const response = await fetch("/api/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      revision,
      type,
      vehicle,
      payload,
      requestId: crypto.randomUUID(),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Modification refusée.");
  syncClock(data.serverNow);
  return data;
}
