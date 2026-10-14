import { useState } from "react";
import {
  MagnifyingGlass,
  Package,
  Plus,
  WarningCircle,
} from "@phosphor-icons/react";
import { record, type DB } from "./domain";
const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
export function Stocks({
  db,
  commit,
}: {
  db: DB;
  commit: (fn: (d: DB) => DB, message?: string) => unknown;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [critical, setCritical] = useState(false);
  const parts = db.parts.filter(
    (p) =>
      (p.name + " " + p.ref + " " + p.location)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === "all" || p.category === category) &&
      (!critical || p.stock - p.reserved < p.threshold),
  );
  const categories = [...new Set(db.parts.map((p) => p.category || "Autres"))];
  return (
    <section className="content-card stocks-v2">
      <div className="section-head">
        <div>
          <h2>Magasin & stocks · {db.parts.length} références</h2>
          <p>
            Références internes, fournisseurs et tarifs fictifs. Aucune
            compatibilité OEM présumée.
          </p>
        </div>
        <span className="small-chip">
          Mouvements liés aux dossiers et commandes
        </span>
      </div>
      <div className="stock-filters">
        <div className="search">
          <MagnifyingGlass size={18} />
          <input
            aria-label="Rechercher une pièce"
            placeholder="Désignation, référence, emplacement…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Catégorie de stock"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={critical}
            onChange={(e) => setCritical(e.target.checked)}
          />
          Stock critique
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Pièce / référence</th>
              <th>Catégorie / fournisseur</th>
              <th>Emplacement</th>
              <th>Quantité</th>
              <th>Réservées</th>
              <th>Disponibles</th>
              <th>Achat / vente HT démo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>
                    {p.ref} · {p.brand}
                  </small>
                </td>
                <td>
                  {p.category}
                  <small>{p.supplier}</small>
                </td>
                <td>
                  {p.location}
                  <small>
                    Dernier mouvement :{" "}
                    {p.lastMovement
                      ? new Date(p.lastMovement).toLocaleDateString("fr-FR")
                      : "—"}
                  </small>
                </td>
                <td>
                  {p.stock}
                  <small>{p.unit || "unité"}</small>
                </td>
                <td>{p.reserved}</td>
                <td>
                  <span
                    className={
                      p.stock - p.reserved < p.threshold
                        ? "text-amber"
                        : "text-green"
                    }
                  >
                    {p.stock - p.reserved}
                  </span>
                  <small>Seuil : {p.threshold}</small>
                </td>
                <td>
                  {money(p.purchasePrice || 0)}
                  <small>{money(p.price)} vente</small>
                </td>
                <td>
                  <button
                    className="secondary"
                    onClick={() =>
                      commit(
                        (d) =>
                          record(
                            {
                              ...d,
                              orders: [
                                {
                                  id: crypto.randomUUID(),
                                  part: p.id,
                                  quantity: 1,
                                  status: "À valider",
                                  at: new Date().toISOString(),
                                },
                                ...d.orders,
                              ],
                            },
                            "stock",
                            "Commande fournisseur préparée, aucun envoi : " +
                              p.name,
                          ),
                        "Commande préparée, sans achat ni envoi.",
                      )
                    }
                  >
                    Préparer
                    <Plus size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!parts.length && (
        <p className="empty">Aucune référence correspondante.</p>
      )}
      <h3>Commandes préparées · aucun fournisseur connecté</h3>
      {db.orders.map((o) => (
        <div className="order-row" key={o.id}>
          <Package />
          <strong>{db.parts.find((p) => p.id === o.part)?.name}</strong>
          <span>
            {o.quantity} unité(s) · {o.status}
          </span>
          <button
            className="secondary"
            disabled={o.status === "Reçue"}
            onClick={() =>
              commit((d) => {
                const order = d.orders.find((x) => x.id === o.id)!;
                if (order.status === "Reçue")
                  throw Error("Commande déjà reçue.");
                return record(
                  {
                    ...d,
                    orders: d.orders.map((x) =>
                      x.id === o.id ? { ...x, status: "Reçue" } : x,
                    ),
                    parts: d.parts.map((p) =>
                      p.id === o.part
                        ? {
                            ...p,
                            stock: p.stock + order.quantity,
                            lastMovement: new Date().toISOString(),
                          }
                        : p,
                    ),
                    stockMovements: [
                      {
                        id: crypto.randomUUID(),
                        part: order.part,
                        vehicle: "stock",
                        kind: "Réception déclarée manuellement",
                        quantity: order.quantity,
                        at: new Date().toISOString(),
                      },
                      ...(d.stockMovements || []),
                    ],
                  },
                  "stock",
                  "Réception de commande déclarée manuellement et mouvement de stock",
                );
              }, "Réception manuelle enregistrée.")
            }
          >
            Confirmer la réception manuelle
          </button>
        </div>
      ))}
      <h3>Derniers mouvements</h3>
      {(db.stockMovements || []).slice(0, 12).map((m) => (
        <div className="order-row" key={m.id}>
          <Package />
          <strong>{db.parts.find((p) => p.id === m.part)?.name}</strong>
          <span>
            {m.kind} · {m.quantity} ·{" "}
            {db.vehicles.find((v) => v.id === m.vehicle)?.plate || "Magasin"}
          </span>
          <small>{new Date(m.at).toLocaleString("fr-FR")}</small>
        </div>
      ))}
    </section>
  );
}
