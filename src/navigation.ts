export type Box = { x: number; z: number; w: number; d: number };
export const walls: Box[] = [];
function divided(
  axis: "x" | "z",
  constant: number,
  start: number,
  end: number,
  doors: number[],
) {
  let last = start;
  for (const opening of doors) {
    const lo = opening - 1.5;
    if (lo > last)
      walls.push(
        axis === "x"
          ? { x: constant, z: (last + lo) / 2, w: 0.25, d: lo - last }
          : { x: (last + lo) / 2, z: constant, w: lo - last, d: 0.25 },
      );
    last = opening + 1.5;
  }
  if (last < end)
    walls.push(
      axis === "x"
        ? { x: constant, z: (last + end) / 2, w: 0.25, d: end - last }
        : { x: (last + end) / 2, z: constant, w: end - last, d: 0.25 },
    );
}
divided("x", -22, -52, 18, []);
divided("x", 22, -52, 18, []);
divided("z", -52, -22, 22, []);
divided("z", -18, -22, -12, [-17]);
divided("z", -18, 12, 22, [17]);
divided("z", 18, -22, 22, [0, 17]);
divided("x", -12, -18, 18, [-13, -3, 10]);
divided("x", 12, -18, 18, [-12, 0, 12]);
divided("z", -8, -22, -12, [-17]);
divided("z", 2, -22, -12, [-17]);
divided("z", -6, 12, 22, [17]);
divided("z", 6, 12, 22, [17]);
divided("z", 9, -12, 12, [0]);
export const doors = [
  { id: "d1", x: -12, z: 10, axis: "x" },
  { id: "d2", x: 12, z: -12, axis: "x" },
  { id: "d3", x: 12, z: 0, axis: "x" },
  { id: "d4", x: 12, z: 12, axis: "x" },
];
export function blocked(
  x: number,
  z: number,
  boxes: Box[],
  radius = 0.38,
  depth = 52,
) {
  return (
    x < -21.5 ||
    x > 21.5 ||
    z < -depth + 0.5 ||
    z > 29 ||
    boxes.some(
      (b) =>
        Math.abs(x - b.x) < b.w / 2 + radius &&
        Math.abs(z - b.z) < b.d / 2 + radius,
    )
  );
}
/** Grid A* with clearance; cardinal moves avoid cutting wall corners. */
export function findPath(
  from: [number, number],
  to: [number, number],
  boxes: Box[],
  depth = 52,
): [number, number][] {
  const start = from.map(Math.round) as [number, number];
  const end = to.map(Math.round) as [number, number];
  const key = (p: number[]) => p.join(",");
  const open = [start],
    parents = new Map<string, [number, number]>(),
    cost = new Map([[key(start), 0]]),
    seen = new Set<string>();
  while (open.length) {
    open.sort(
      (a, b) =>
        cost.get(key(a))! +
        Math.abs(a[0] - end[0]) +
        Math.abs(a[1] - end[1]) -
        (cost.get(key(b))! + Math.abs(b[0] - end[0]) + Math.abs(b[1] - end[1])),
    );
    const p = open.shift()!;
    const k = key(p);
    if (seen.has(k)) continue;
    seen.add(k);
    if (k === key(end)) {
      const route: [number, number][] = [end];
      let node = end;
      while (key(node) !== key(start)) {
        node = parents.get(key(node))!;
        route.unshift(node);
      }
      return route;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n: [number, number] = [p[0] + dx, p[1] + dz];
      if (blocked(...n, boxes, 0.45, depth)) continue;
      const nk = key(n),
        g = cost.get(k)! + 1;
      if (g < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, g);
        parents.set(nk, p);
        open.push(n);
      }
    }
  }
  return [];
}
