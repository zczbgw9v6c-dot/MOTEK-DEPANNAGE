import type { DB } from "./domain.ts";
import {
  showroomCars,
  waitingVehicles,
  zoneVehicles,
  awaitingOrders,
} from "./guided-domain.ts";
export function zoneSummary(
  db: DB,
  id: string,
): { count: number; label: string; alerts: number } {
  const present = db.vehicles.filter(
    (v) => v.present !== false && v.status !== "Livré",
  );
  const cars = zoneVehicles(db, id);
  switch (id) {
    case "atelier":
      return {
        count: cars.length,
        label: `${cars.length} véhicules`,
        alerts: cars.filter((v) => db.workshop?.[v.id]?.blocked).length,
      };
    case "attente":
    case "accueil": {
      const count = waitingVehicles(db).length;
      return {
        count,
        label: `${count} clients${db.demoVersion ? " · démo" : ""}`,
        alerts: 0,
      };
    }
    case "stock":
      return {
        count: db.parts.length,
        label: `${db.parts.length} références`,
        alerts: awaitingOrders(db).length,
      };
    case "bureau": {
      const count =
        db.quotes?.filter((q) => q.state === "À valider").length || 0;
      return { count, label: `${count} devis à valider`, alerts: count };
    }
    case "livraison":
      return { count: cars.length, label: `${cars.length} prêts`, alerts: 0 };
    case "showroom": {
      const count = showroomCars(db).filter((v) => v.available).length;
      return {
        count,
        label: `${count} disponibles${db.demoVersion ? " · démo" : ""}`,
        alerts: 0,
      };
    }
    case "carrosserie":
      return {
        count: cars.length,
        label: `${cars.length} véhicules`,
        alerts: cars.filter((v) => db.workshop?.[v.id]?.blocked).length,
      };
    case "parking":
      return { count: cars.length, label: `${cars.length} au parc`, alerts: 0 };
    default:
      return {
        count: present.length,
        label: `${present.length} présents`,
        alerts: 0,
      };
  }
}
