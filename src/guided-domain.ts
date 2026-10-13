import type { DB, Vehicle } from "./domain.ts";
export type ShowroomCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  available: boolean;
  demo: boolean;
};
export const demoShowroom: ShowroomCar[] = [
  {
    id: "showroom-defender",
    make: "Land Rover",
    model: "Defender",
    year: 2023,
    color: "#59695f",
    available: true,
    demo: true,
  },
  {
    id: "showroom-range",
    make: "Land Rover",
    model: "Range Rover",
    year: 2023,
    color: "#8b3b42",
    available: true,
    demo: true,
  },
  {
    id: "showroom-jaguar",
    make: "Jaguar",
    model: "F-Pace",
    year: 2022,
    color: "#253f59",
    available: true,
    demo: true,
  },
];
export function showroomCars(db: DB): ShowroomCar[] {
  return db.demoVersion ? demoShowroom : [];
}
export function waitingVehicles(db: DB) {
  // Explicit simulation slots; never infer a real client's physical presence from their repair status.
  return db.demoVersion
    ? ["v11", "v12", "v13"]
        .map((id) => db.vehicles.find((v) => v.id === id))
        .filter(
          (v): v is Vehicle =>
            !!v && v.present !== false && v.status !== "Livré",
        )
    : [];
}
export function zoneVehicles(db: DB, zone: string) {
  return db.vehicles.filter(
    (v) =>
      v.present !== false &&
      v.status !== "Livré" &&
      (zone === "livraison"
        ? v.status === "Prêt à livrer"
        : zone === "parking"
          ? !v.bay && v.status !== "Prêt à livrer"
          : !!v.bay),
  );
}

export function todaysOrders(db: DB, now = new Date()) {
  const day = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  return db.orders.filter(
    (o) =>
      o.at &&
      Number.isFinite(Date.parse(o.at)) &&
      day(new Date(o.at)) === day(now),
  );
}
export function awaitingOrders(db: DB) {
  return db.orders.filter(
    (o) => !["Reçue", "Annulée", "Livrée"].includes(o.status),
  );
}
