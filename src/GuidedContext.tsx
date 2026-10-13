import { team } from "./team-data";
import { DeliveryDeadline } from "./DeliveryDeadline";
import { quoteTotals } from "./quote-domain";
import { zones, statuses, type DB } from "./domain";
import {
  showroomCars,
  waitingVehicles,
  zoneVehicles,
  todaysOrders,
  awaitingOrders,
} from "./guided-domain";
import type { Selection } from "./scene";
export function GuidedContext({
  db,
  selection,
  onSelect,
  onView,
  onReception,
  onClose,
}: {
  db: DB;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onView: (v: string) => void;
  onReception: () => void;
  onClose: () => void;
}) {
  const zone = selection.id;
  const showroom = showroomCars(db);
  const cars =
    zone === "attente" || zone === "accueil"
      ? waitingVehicles(db)
      : zoneVehicles(db, zone);
  const inventory =
    selection.kind === "inventory" ? showroom.find((v) => v.id === zone) : null;
  return (
    <>
      <div className="panel-top">
        <strong>
          {inventory
            ? "VÉHICULE DU SHOWROOM"
            : zones.find((z) => z.id === zone)?.name || "Votre espace"}
        </strong>
        <button
          className="icon-button"
          aria-label="Revenir au plan"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="guided-context">
        {zone === "atelier" && (
          <div className="spatial-stats">
            <strong>{cars.length} véhicules</strong>
            <span>
              {cars.filter((v) => v.status === "En intervention").length}{" "}
              interventions
            </span>
            <span>
              {cars.filter((v) => v.status === "Devis à valider").length}{" "}
              accords attendus
            </span>
          </div>
        )}
        {zone === "livraison" && (
          <div className="spatial-stats">
            <strong>{cars.length} véhicules prêts</strong>
            <span>
              Choisissez une voiture pour suivre sa restitution et ses messages.
            </span>
          </div>
        )}
        {inventory ? (
          <>
            <h2>
              {inventory.make} {inventory.model}
            </h2>
            <p>
              {inventory.year} ·{" "}
              {inventory.available ? "Disponible" : "Indisponible"}
            </p>
            <p className="notice">
              Stock commercial de démonstration. Représentation générique,
              modèle exact non importé.
            </p>
          </>
        ) : zone === "showroom" ? (
          <>
            <h2>Véhicules disponibles</h2>
            <p className="warning-small">
              Inventaire de démonstration · illustrations génériques.
            </p>
            {showroom
              .filter((v) => v.available)
              .map((v) => (
                <button
                  className="vehicle-row"
                  key={v.id}
                  onClick={() => onSelect({ kind: "inventory", id: v.id })}
                >
                  <span>
                    <strong>
                      {v.make} {v.model}
                    </strong>
                    <small>{v.year} · Disponible</small>
                  </span>
                </button>
              ))}
            {!showroom.length && <p>Aucun véhicule commercial enregistré.</p>}
          </>
        ) : zone === "stock" ? (
          <>
            <h2>Commandes & arrivages</h2>
            <p>
              Préparations internes et commandes en attente. Aucun envoi
              fournisseur automatique.
            </p>
            <h3>Aujourd’hui · {todaysOrders(db).length}</h3>
            {todaysOrders(db).map((o) => (
              <div className="guided-item" key={o.id}>
                <strong>{db.parts.find((p) => p.id === o.part)?.name}</strong>
                <span>
                  {o.quantity} unité(s) · {o.status}
                </span>
              </div>
            ))}
            {!todaysOrders(db).length && (
              <p>Aucune commande horodatée aujourd’hui.</p>
            )}
            <h3>En attente · {awaitingOrders(db).length}</h3>
            {awaitingOrders(db).map((o) => (
              <div className="guided-item" key={o.id}>
                <strong>
                  {db.parts.find((p) => p.id === o.part)?.name || o.part}
                </strong>
                <span>
                  {o.quantity} unité(s) · {o.status}
                </span>
                <small>
                  {o.at
                    ? new Date(o.at).toLocaleString("fr-FR")
                    : "Date non renseignée"}
                </small>
              </div>
            ))}
            {!db.orders.length && <p>Aucune commande enregistrée.</p>}
            <button className="primary full" onClick={() => onView("stocks")}>
              Ouvrir les stocks
            </button>
          </>
        ) : zone === "bureau" ? (
          <>
            <h2>Responsable d’atelier</h2>
            <p>
              {db.quotes?.filter((q) => q.state === "À valider").length || 0}{" "}
              devis à valider ·{" "}
              {db.alerts?.filter((a) => !a.resolved).length || 0} alertes
              ouvertes
            </p>
            <button className="primary full" onClick={() => onView("pilotage")}>
              Voir les alertes
            </button>
            <button className="secondary full" onClick={() => onView("devis")}>
              Voir les devis
            </button>
          </>
        ) : (
          <>
            <h2>
              {zone === "accueil"
                ? "Accueil des clients"
                : zone === "attente"
                  ? "Clients en attente"
                  : zone === "livraison"
                    ? "Véhicules prêts"
                    : "Dossiers de cette zone"}
            </h2>
            {(zone === "attente" || zone === "accueil") && (
              <p className="warning-small">
                Présences simulées dans le garage de démonstration.
              </p>
            )}
            {cars.map((v) => (
              <button
                className="vehicle-row"
                key={v.id}
                onClick={() =>
                  onSelect({
                    kind:
                      zone === "attente" || zone === "accueil"
                        ? "customer"
                        : "vehicle",
                    id: v.id,
                  })
                }
              >
                <span>
                  <strong>
                    {zone === "attente" || zone === "accueil"
                      ? v.client
                      : `${v.make} ${v.model}`}
                  </strong>
                  <small>
                    {v.plate} · {v.status}
                  </small>
                </span>
              </button>
            ))}
            {!cars.length && <p>Aucun dossier dans cette zone.</p>}
            {zone === "atelier" && (
              <>
                <h3>Équipe de l’atelier</h3>
                {team.map((t) => (
                  <button
                    className="vehicle-row"
                    key={t.id}
                    onClick={() => onSelect({ kind: "technician", id: t.name })}
                  >
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.specialty}</small>
                    </span>
                  </button>
                ))}
              </>
            )}
            {zone === "accueil" && (
              <button className="primary full" onClick={onReception}>
                Accueillir un véhicule
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function ClientContext({
  db,
  vehicle,
  onVehicle,
  onQuotes,
  onClose,
}: {
  db: DB;
  vehicle: import("./domain").Vehicle;
  onVehicle: () => void;
  onQuotes: () => void;
  onClose: () => void;
}) {
  const quote = (db.quotes || [])
    .filter((q) => q.vehicle === vehicle.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  const total = quote ? quoteTotals(quote).total : 0;
  return (
    <>
      <div className="panel-top">
        <strong>DOSSIER CLIENT</strong>
        <button
          className="icon-button"
          aria-label="Revenir au plan"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="guided-context">
        <h2>{vehicle.client}</h2>
        <p>
          {vehicle.make} {vehicle.model} · {vehicle.plate}
        </p>
        <div className="guided-item">
          <strong>Étape actuelle</strong>
          <span>{vehicle.status}</span>
          <small>
            {vehicle.status === "Prêt à livrer"
              ? "Contrôle qualité validé · véhicule à récupérer"
              : "Réparation en cours de suivi"}
          </small>
        </div>
        {quote ? (
          <div className="guided-item">
            <strong>Dernier devis · {quote.state}</strong>
            <span>
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(total)}{" "}
              TTC
            </span>
            <small>
              {quote.state === "Validé"
                ? "Accord client enregistré"
                : "Accord non enregistré"}
            </small>
            {quote.lines.map((l) => (
              <span key={l.id}>{l.label}</span>
            ))}
          </div>
        ) : (
          <p>Aucun devis enregistré.</p>
        )}
        <ol className="client-progress" aria-label="Étapes du dossier">
          {statuses.map((s) => (
            <li
              key={s}
              aria-current={s === vehicle.status ? "step" : undefined}
            >
              {s}
            </li>
          ))}
        </ol>
        <DeliveryDeadline db={db} vehicle={vehicle} />
        <button className="primary full" onClick={onVehicle}>
          Voir son véhicule dans l’atelier
        </button>
        <button className="secondary full" onClick={onQuotes}>
          Consulter les devis
        </button>
      </div>
    </>
  );
}

export function VehicleSummary({
  db,
  vehicle: v,
  onDetails,
  onClose,
}: {
  db: DB;
  vehicle: DB["vehicles"][number];
  onDetails: () => void;
  onClose: () => void;
}) {
  const events = db.audit
    .filter((a) => a.vehicle === v.id)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  const drafts = db.messages.filter((m) => m.vehicle === v.id);
  const quote = db.quotes
    ?.filter((q) => q.vehicle === v.id)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  return (
    <>
      <div className="panel-top">
        <strong>VÉHICULE · SYNTHÈSE</strong>
        <button aria-label="Fermer la synthèse" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="guided-context">
        <h2>
          {v.make} {v.model}
        </h2>
        <p>
          {v.plate} · {v.client}
        </p>
        <div className="guided-item">
          <strong>{v.status}</strong>
          <span>Contrôle qualité : {v.quality ? "validé" : "à valider"}</span>
        </div>
        {quote && (
          <div className="guided-item">
            <strong>Devis · {quote.state}</strong>
            <span>
              {quoteTotals(quote).total.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
        )}
        <DeliveryDeadline db={db} vehicle={v} />
        <div className="guided-item">
          <strong>SMS de récupération · aucun envoi confirmé</strong>
          <span>
            {drafts.length
              ? "Message WhatsApp préparé, non envoyé."
              : "Aucun message préparé."}
          </span>
          <small>Le service SMS n’est pas connecté.</small>
        </div>
        <h3>Derniers événements</h3>
        {events.length ? (
          events.map((e) => (
            <div className="guided-item" key={e.id}>
              <strong>{e.action}</strong>
              <small>{new Date(e.at).toLocaleString("fr-FR")}</small>
            </div>
          ))
        ) : (
          <p>Aucun événement enregistré.</p>
        )}
        <button className="primary" onClick={onDetails}>
          Ouvrir le dossier complet
        </button>
      </div>
    </>
  );
}
