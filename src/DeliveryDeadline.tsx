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
              timeZone: "Europe/Lisbon",
            })
          : vehicle.due}
      </strong>
      <small>
        {ready
          ? vehicle.status === "Livré"
            ? "Véhicule livré"
            : "Prêt techniquement · vérifier la restitution"
          : minutes < 0
            ? `Heure promise dépassée de ${Math.floor(-minutes / 60)} h ${Math.floor(-minutes % 60)} min · prévenir le client`
            : minutes <= 120
              ? "Livraison proche"
              : "Restitution prévue"}
      </small>
    </span>
  );
}
