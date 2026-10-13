import { useState } from "react";
import {
  Plus,
  CheckCircle,
  Printer,
  FileText,
  X,
  ArrowRight,
  Clock,
} from "@phosphor-icons/react";
import { type DB, type Quote, record, updateVehicle } from "./domain";
import { quoteTotals, saveQuote, approveQuote } from "./quote-domain";
const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
export function Quotes({
  db,
  commit,
  initialVehicle,
}: {
  db: DB;
  initialVehicle?: string;
  commit: (fn: (db: DB) => DB, message?: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
      (db.quotes || [])
        .filter((q) => q.vehicle === initialVehicle)
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0]?.id || null,
    ),
    [draft, setDraft] = useState<Quote | null>(null),
    [vehicle, setVehicle] = useState(
      initialVehicle ||
        db.vehicles.find((v) => v.status === "Devis à valider")?.id ||
        db.vehicles[0]?.id ||
        "",
    );
  const quotes = db.quotes || [];
  const quote = draft || quotes.find((q) => q.id === selected) || null;
  const totals = quote ? quoteTotals(quote) : null;
  const car = db.vehicles.find((v) => v.id === quote?.vehicle);
  function create() {
    const q: Quote = {
      id: crypto.randomUUID(),
      vehicle,
      lines: [],
      vat: 20,
      state: "Brouillon",
      at: new Date().toISOString(),
    };
    setSelected(q.id);
    setDraft(q);
  }
  return (
    <section className="quotes-layout">
      <aside className="content-card quote-list">
        <div className="section-head">
          <h2>Devis de l’atelier</h2>
          <span className="small-chip">
            {quotes.filter((q) => q.state === "À valider").length} en attente
          </span>
        </div>
        <label>
          Véhicule
          <select
            aria-label="Véhicule du devis"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            {db.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} · {v.plate}
              </option>
            ))}
          </select>
        </label>
        <button className="primary full" disabled={!vehicle} onClick={create}>
          <Plus size={18} />
          Nouveau devis
        </button>
        <h4>Dossiers signalés en attente</h4>
        {db.vehicles
          .filter((v) => v.status === "Devis à valider")
          .map((v) => (
            <button
              key={v.id}
              className="quote-pending"
              onClick={() => {
                setVehicle(v.id);
                const q = quotes.find((q) => q.vehicle === v.id);
                if (q) {
                  setSelected(q.id);
                  setDraft(null);
                }
              }}
            >
              <Clock />
              <span>
                {v.make} {v.model}
                <small>
                  {v.plate} ·{" "}
                  {quotes.some((q) => q.vehicle === v.id)
                    ? "Ouvrir le devis"
                    : "Devis à composer"}
                </small>
              </span>
            </button>
          ))}
        <h4>Devis enregistrés</h4>
        {quotes.map((q) => (
          <button
            key={q.id}
            className={"quote-pending " + (selected === q.id ? "on" : "")}
            onClick={() => {
              setSelected(q.id);
              setDraft(null);
            }}
          >
            <FileText />
            <span>
              {db.vehicles.find((v) => v.id === q.vehicle)?.plate}
              <small>
                {q.state} · {money(quoteTotals(q).total)}
              </small>
            </span>
            <ArrowRight />
          </button>
        ))}
        {!quotes.length && (
          <p className="empty">
            Créez un devis : aucune ligne ni aucun tarif ne sera ajouté
            automatiquement.
          </p>
        )}
      </aside>
      <section className="content-card quote-editor">
        {quote && totals && car ? (
          <>
            <div className="section-head">
              <div>
                <span className="eyebrow">
                  DEVIS LOCAL · {quote.state.toUpperCase()}
                </span>
                <h2>
                  {car.make} {car.model}
                </h2>
                <p>
                  {car.plate} · {car.client}
                </p>
              </div>
              <button className="secondary" onClick={() => window.print()}>
                <Printer size={18} />
                Imprimer
              </button>
            </div>
            <div className="notice">
              Document de démonstration, sans signature électronique ni valeur
              fiscale. Prix et taux saisis manuellement ; aucune donnée
              fournisseur ou constructeur.
            </div>
            <div className="table-scroll">
              <table className="quote-lines">
                <thead>
                  <tr>
                    <th>Opération / pièce</th>
                    <th>Quantité</th>
                    <th>Prix unitaire HT</th>
                    <th>Total HT</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((line, i) => (
                    <tr key={line.id}>
                      <td>
                        <input
                          aria-label={"Libellé ligne " + (i + 1)}
                          disabled={quote.state === "Validé"}
                          value={line.label}
                          onChange={(e) =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, label: e.target.value }
                                  : l,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={"Quantité ligne " + (i + 1)}
                          type="number"
                          min=".01"
                          step=".01"
                          disabled={quote.state === "Validé"}
                          value={line.quantity}
                          onChange={(e) =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, quantity: Number(e.target.value) }
                                  : l,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={"Prix ligne " + (i + 1)}
                          type="number"
                          min="0"
                          step=".01"
                          disabled={quote.state === "Validé"}
                          value={line.unitPrice}
                          onChange={(e) =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, unitPrice: Number(e.target.value) }
                                  : l,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>{money(line.quantity * line.unitPrice)}</td>
                      <td>
                        <button
                          aria-label={"Supprimer ligne " + (i + 1)}
                          disabled={quote.state === "Validé"}
                          onClick={() =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.filter(
                                (l) => l.id !== line.id,
                              ),
                            })
                          }
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quote.state !== "Validé" && (
              <button
                className="secondary"
                onClick={() =>
                  setDraft({
                    ...quote,
                    lines: [
                      ...quote.lines,
                      {
                        id: crypto.randomUUID(),
                        label: "",
                        quantity: 1,
                        unitPrice: 0,
                      },
                    ],
                  })
                }
              >
                <Plus size={18} />
                Ajouter une ligne
              </button>
            )}
            <div className="quote-totals">
              <label>
                TVA saisie (%)
                <input
                  aria-label="TVA du devis"
                  type="number"
                  min="0"
                  max="100"
                  step=".1"
                  disabled={quote.state === "Validé"}
                  value={quote.vat}
                  onChange={(e) =>
                    setDraft({ ...quote, vat: Number(e.target.value) })
                  }
                />
              </label>
              <div>
                <span>
                  Total HT<strong>{money(totals.ht)}</strong>
                </span>
                <span>
                  TVA<strong>{money(totals.tax)}</strong>
                </span>
                <span>
                  Total TTC<strong>{money(totals.total)}</strong>
                </span>
              </div>
            </div>
            <div className="quote-actions">
              {quote.state !== "Validé" && (
                <>
                  <button
                    className="secondary"
                    onClick={() =>
                      commit(
                        (d) => saveQuote(d, { ...quote, state: "Brouillon" }),
                        "Brouillon sauvegardé.",
                      )
                    }
                  >
                    Enregistrer le brouillon
                  </button>
                  <button
                    className="primary"
                    disabled={
                      !quote.lines.length ||
                      quote.lines.some(
                        (l) =>
                          !l.label.trim() || l.quantity <= 0 || l.unitPrice < 0,
                      )
                    }
                    onClick={() => {
                      commit((d) => {
                        const next = saveQuote(d, {
                          ...quote,
                          state: "À valider",
                        });
                        return updateVehicle(next, quote.vehicle, {
                          status: "Devis à valider",
                        });
                      }, "Devis soumis à validation.");
                      setDraft(null);
                    }}
                  >
                    Soumettre à validation
                  </button>
                </>
              )}
              {quote.state === "À valider" && !draft && (
                <button
                  className="primary"
                  onClick={() =>
                    commit(
                      (d) => approveQuote(d, quote.id),
                      "Accord client enregistré manuellement.",
                    )
                  }
                >
                  <CheckCircle size={18} />
                  Enregistrer l’accord client
                </button>
              )}
              {quote.state === "Validé" && (
                <span className="text-green">
                  <CheckCircle />
                  Accord saisi manuellement · journalisé
                </span>
              )}
            </div>
            <p className="warning-small">
              Les modifications du formulaire ne sont sauvegardées qu’avec
              Enregistrer ou Soumettre. Aucun message n’est envoyé au client.
            </p>
          </>
        ) : (
          <div className="empty">
            <FileText size={45} />
            <h2>Un devis clair, lié au véhicule.</h2>
            <p>
              Choisissez un véhicule et créez un devis. Ajoutez uniquement les
              opérations et montants que vous connaissez.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
