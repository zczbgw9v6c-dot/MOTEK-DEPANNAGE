export type ZonePoint = { id: string; x: number; y: number; visible: boolean };
/** Keep labels readable when nearby rooms project to the same screen space. */
export function layoutZoneMarkers(
  points: ZonePoint[],
  width: number,
  height: number,
  large = false,
): ZonePoint[] {
  const placed: ZonePoint[] = [];
  const half = large ? 90 : 76,
    h = large ? 84 : 58;
  return points.map((point) => {
    if (!point.visible || width < half * 2 || height < 100)
      return { ...point, visible: false };
    for (const dx of [0, -(half * 2 + 6), half * 2 + 6])
      for (const dy of [
        0,
        -(h + 4),
        h + 4,
        -(h + 4) * 2,
        (h + 4) * 2,
        -(h + 4) * 3,
        (h + 4) * 3,
      ]) {
        const x = Math.min(width - half - 8, Math.max(half + 8, point.x + dx));
        const y = Math.min(height - 12, Math.max(h + 65, point.y + dy));
        if (
          !placed.some(
            (p) =>
              Math.abs(p.x - x) < half * 2 + 6 && Math.abs(p.y - y) < h + 4,
          )
        ) {
          const result = { ...point, x, y };
          placed.push(result);
          return result;
        }
      }
    return { ...point, visible: false };
  });
}
