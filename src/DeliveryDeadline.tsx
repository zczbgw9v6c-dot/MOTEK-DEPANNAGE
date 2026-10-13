import { useEffect, useState } from "react";
import { serverNow } from "./api";
import type { DB, Vehicle } from "./domain";
export function DeliveryDeadline({
  db,
  vehicle,
}: {
  db: DB;
  vehicle: Vehicle;
}) {
  const [now, setNow] = useState(serverNow());
  useEffect(() => {
    const interval = setInterval(() => setNow(serverNow()), 30000);
    return () => clearInterval(interval);
  }, []);
  const appointment = db.appointments?.find(
    (a) => a.vehicle === vehicle.id && a.state !== "Terminé",
  );
  const deadline = appointment ? Date.parse(appointment.promised) : NaN;
  const minutes = (deadline - now) / 60000;
  const ready = ["Prêt à livrer", "Livré"].includes(vehicle.status);
  const tone = ready
    ? "ready"
    : minutes < 0
      ? "late"
      : minutes <= 120
        ? "soon"
        : "normal";
  return (
    <span className={`delivery-deadline ${tone}`}>
      <strong>
        {Number.isFinite(deadline)
          ? new Date(deadline).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : vehicle.due}
      </strong>
      <small>
        {ready
          ? "Véhicule prêt"
          : minutes < 0
            ? "Échéance dépassée"
            : minutes <= 120
              ? "Livraison proche"
              : "Restitution prévue"}
      </small>
    </span>
  );
}
