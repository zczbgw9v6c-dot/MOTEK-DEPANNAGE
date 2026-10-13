import { layoutZoneMarkers } from "./marker-layout";
import { useEffect, useRef, type RefObject } from "react";
import {
  Buildings,
  Wrench,
  Users,
  Package,
  Car,
  FileText,
  Flag,
  Armchair,
} from "@phosphor-icons/react";
import type { GarageScene } from "./scene";
import { zones, type DB } from "./domain";
import { zoneSummary } from "./zone-summary";
const icons = {
  accueil: Buildings,
  atelier: Wrench,
  attente: Armchair,
  stock: Package,
  carrosserie: Car,
  bureau: FileText,
  livraison: Flag,
  showroom: Car,
  parking: Car,
};
export function ZoneMarkers({
  scene,
  db,
  onSelect,
  large = false,
}: {
  scene: RefObject<GarageScene | null>;
  db: DB;
  large?: boolean;
  onSelect: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const points = layoutZoneMarkers(
        scene.current?.projectZones() || [],
        root.current?.clientWidth || 0,
        root.current?.clientHeight || 0,
        large,
      );
      const buttons = root.current?.children;
      if (buttons)
        for (const child of Array.from(buttons)) {
          const el = child as HTMLElement,
            p = points.find((p) => p.id === el.dataset.zone);
          el.style.visibility = p?.visible ? "visible" : "hidden";
          if (p) {
            el.style.left = `${p.x}px`;
            el.style.top = `${p.y}px`;
          }
        }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [scene, large]);
  return (
    <div
      ref={root}
      className="zone-markers"
      aria-label="Zones interactives de la maquette"
    >
      {zones
        .filter(
          (z) => db.dealership?.waitingRoom !== false || z.id !== "attente",
        )
        .map((z) => {
          const summary = zoneSummary(db, z.id);
          const Icon = icons[z.id as keyof typeof icons] || Users;
          return (
            <button
              data-zone={z.id}
              style={{ visibility: "hidden" }}
              key={z.id}
              className={`zone-marker zone-${z.id}`}
              onClick={() => onSelect(z.id)}
              aria-label={`${z.short}, ${summary.label}`}
            >
              <span className="marker-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{z.short}</strong>
                <small>{summary.label}</small>
              </span>
              {summary.alerts > 0 && (
                <b
                  className="marker-alert"
                  aria-label={`${summary.alerts} alertes`}
                >
                  {summary.alerts}
                </b>
              )}
            </button>
          );
        })}
    </div>
  );
}
