/** Frame cars from the central aisle; the delivery room needs its own viewpoint. */
export function vehicleView(x: number, z: number, aspect = 1, rear = false) {
  const distance = Math.max(7.8, 6.4 / Math.max(aspect, 0.35));
  const side = x < 0 ? 1 : -1;
  const dx = side * distance * 0.66 * (z > 6 && rear ? -1 : 1);
  const dz = distance * 0.75 * (rear || z > 6 ? -1 : 1);
  return {
    position: [x + dx, 3.8, z + dz] as [number, number, number],
    target: [x, 0.95, z] as [number, number, number],
  };
}
/** Hidden fallback geometry and cutaway architecture must never intercept clicks. */
export function isRendered(object: { visible: boolean; parent: any }): boolean {
  let node: { visible: boolean; parent: any } | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}
export function shortestTurn(current: number, target: number, dt: number) {
  const angle = target - current;
  return (
    current +
    Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-6 * dt))
  );
}

export function zoneView(
  id: string,
  x: number,
  z: number,
  aspect = 1,
  depth = 52,
) {
  const workshop = id === "atelier" || id === "parking";
  if (workshop) z = (-depth - 9) / 2;
  const halfWidth = workshop ? 12 : id === "showroom" ? 12 : 5;
  const halfDepth = workshop ? (depth - 9) / 2 : id === "showroom" ? 5 : 7;
  const distance = Math.max(
    halfDepth * 2.8,
    ((halfWidth + halfDepth * 0.6) * 3.2) / Math.max(aspect, 0.35),
  );
  return {
    position: [x + distance * 0.45, distance * 0.72, z + distance * 0.63] as [
      number,
      number,
      number,
    ],
    target: [x, 0.8, z] as [number, number, number],
  };
}
