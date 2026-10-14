import { useState } from "react";
import type { DB } from "./domain";
export function ReceptionArrival({
  db,
  onArrival,
}: {
  db: DB;
  onArrival: (id: string) => Promise<boolean>;
}) {
  const [id, setId] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="reception-arrival"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!id || busy) return;
        setBusy(true);
        try {
          if (await onArrival(id)) setId("");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="reception-existing">
        Accueillir un client déjà connu
      </label>
      <select
        id="reception-existing"
        value={id}
        onChange={(e) => setId(e.target.value)}
        required
      >
        <option value="">Choisir son dossier</option>
        {db.vehicles
          .filter(
            (v) =>
              v.present !== false &&
              v.status !== "Livré" &&
              (!v.reception || v.reception.state === "left"),
          )
          .map((v) => (
            <option key={v.id} value={v.id}>
              {v.client} · {v.plate}
            </option>
          ))}
      </select>
      <button className="primary full" disabled={!id || busy}>
        Enregistrer l’arrivée
      </button>
    </form>
  );
}
