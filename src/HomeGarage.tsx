import { useEffect, useRef, useState } from "react";
import { GarageScene, type Selection } from "./scene";
import { layoutFor } from "./dealership-layout";
import { waitingVehicles } from "./guided-domain";
import { ZoneMarkers } from "./ZoneMarkers";
import type { DB } from "./domain";
export function HomeGarage({
  db,
  onSelect,
}: {
  db: DB;
  onSelect: (s: Selection) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<GarageScene | null>(null),
    latest = useRef(db),
    pick = useRef(onSelect);
  latest.current = db;
  pick.current = onSelect;
  const [error, setError] = useState("");
  useEffect(() => {
    if (!host.current) return;
    try {
      const d = latest.current;
      scene.current = new GarageScene(
        host.current,
        (s) => pick.current(s),
        () => {},
        () => {},
        setError,
        layoutFor(d.dealership),
      );
      scene.current.update(
        d.vehicles,
        d.assetDisabled,
        d.workshop,
        !!d.demoVersion,
        waitingVehicles(d),
      );
      scene.current.setMode("overview");
    } catch {
      setError(
        "Le plan 3D est indisponible sur ce navigateur. Les dossiers restent accessibles ci-dessus.",
      );
    }
    return () => {
      scene.current?.dispose();
      scene.current = null;
    };
  }, [db.dealership]);
  useEffect(() => {
    scene.current?.update(
      db.vehicles,
      db.assetDisabled,
      db.workshop,
      !!db.demoVersion,
      waitingVehicles(db),
    );
  }, [db.vehicles, db.workshop, db.assetDisabled, db.demoVersion]);
  return (
    <section className="home-garage">
      <header>
        <h2>Votre garage en direct</h2>
        <p>Touchez une zone ou un véhicule pour ouvrir son dossier.</p>
      </header>
      {error ? (
        <p role="status">{error}</p>
      ) : (
        <div className="home-garage-viewport">
          <div ref={host} className="canvas-host" />
          <ZoneMarkers
            scene={scene}
            db={db}
            onSelect={(id) => onSelect({ kind: "zone", id })}
          />
        </div>
      )}
    </section>
  );
}
