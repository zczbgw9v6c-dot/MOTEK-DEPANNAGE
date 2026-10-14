import { layoutZoneMarkers } from "./marker-layout";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { DB } from "./domain";
import type { GarageScene } from "./scene";
import { waitingVehicles } from "./guided-domain";
import { receptionLabel } from "./reception-domain";
export function CustomerMarkers({
  scene,
  db,
  active,
  onSelect,
}: {
  scene: RefObject<GarageScene | null>;
  db: DB;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => {
      const points = layoutZoneMarkers(
        scene.current?.projectCustomers() || [],
        root.current?.clientWidth || 0,
        root.current?.clientHeight || 0,
        true,
      );
      for (const el of Array.from(
        root.current?.children || [],
      ) as HTMLElement[]) {
        const p = points.find((p) => p.id === el.dataset.customer);
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
  }, [scene, active]);
  if (!active) return null;
  return (
    <div ref={root} className="customer-markers" aria-label="Clients présents">
      {waitingVehicles(db).map((v) => (
        <button
          key={v.id}
          data-customer={v.id}
          style={{ visibility: "hidden" }}
          onClick={() => onSelect(v.id)}
        >
          <strong>{v.client}</strong>
          <span>{receptionLabel(v, now)}</span>
          <small>
            {v.make} {v.model} · {v.status}
          </small>
        </button>
      ))}
    </div>
  );
}
