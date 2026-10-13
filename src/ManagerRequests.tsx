import { useState } from "react";
import { Package, WarningCircle, CheckCircle } from "@phosphor-icons/react";
import { workshopFor } from "./workshop-domain";
import type { DB } from "./domain";
export function ManagerRequests({
  db,
  onAction,
}: {
  db: DB;
  onAction: (vehicle: string, type: string, payload: any) => Promise<boolean>;
}) {
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({}),
    [decision, setDecision] = useState<Record<string, string>>({});
  const requests = db.vehicles.flatMap((v) =>
    workshopFor(db, v.id)
      .requests.filter(
        (r) =>
          r.state === "À valider responsable" ||
          r.state === "En attente magasin",
      )
      .map((r) => ({ v, r })),
  );
  const issues = db.vehicles.flatMap((v) =>
    workshopFor(db, v.id)
      .issues.filter((i) => i.state !== "Résolu")
      .map((i) => ({ v, i })),
  );
  return (
    <section className="content-card manager-requests">
      <div className="section-head">
        <h3>Décisions du responsable</h3>
        <span className="small-chip">
          {requests.length} demandes · {issues.length} problèmes ouverts
        </span>
      </div>
      {requests.map(({ v, r }) => {
        const p = db.parts.find((p) => p.id === r.part)!;
        const quantity = r.quantity || 1;
        return (
          <article className="manager-request" key={r.id}>
            <Package size={24} />
            <div>
              <h4>
                {quantity} × {p.name}
              </h4>
              <p>
                {v.make} {v.model} · {v.plate} · {p.ref}
              </p>
              <small>
                {p.stock - p.reserved} disponibles · référence fictive · aucun
                achat automatique
              </small>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={!!confirmed[r.id]}
                  onChange={(e) =>
                    setConfirmed({ ...confirmed, [r.id]: e.target.checked })
                  }
                />
                Référence et compatibilité vérifiées pour la démonstration
              </label>
            </div>
            <button
              className="primary"
              disabled={!confirmed[r.id] || p.stock - p.reserved < quantity}
              onClick={() =>
                onAction(v.id, "approve", {
                  requestId: r.id,
                  compatibilityConfirmed: true,
                })
              }
            >
              <CheckCircle size={18} />
              Valider et réserver
            </button>
            {p.stock - p.reserved < quantity && (
              <span className="text-amber">
                Stock insuffisant : réception nécessaire.
              </span>
            )}
          </article>
        );
      })}
      {issues.map(({ v, i }) => (
        <article className="manager-request issue" key={i.id}>
          <WarningCircle size={24} />
          <div>
            <h4>{v.plate} · problème signalé</h4>
            <p>{i.text}</p>
            <input
              aria-label={"Décision pour " + v.plate}
              value={decision[i.id] || ""}
              placeholder="Décision à consigner avant reprise"
              onChange={(e) =>
                setDecision({ ...decision, [i.id]: e.target.value })
              }
            />
          </div>
          <button
            className="secondary"
            disabled={!decision[i.id]?.trim()}
            onClick={() =>
              onAction(v.id, "resolve", {
                issueId: i.id,
                decision: decision[i.id],
              })
            }
          >
            Consigner et lever l’incident
          </button>
        </article>
      ))}
      {!requests.length && !issues.length && (
        <p className="empty">Aucune décision en attente.</p>
      )}
    </section>
  );
}
