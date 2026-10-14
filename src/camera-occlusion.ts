import * as THREE from "three";
/** Hide architecture crossing the centre or silhouette of the vehicle, not objects behind it. */
export const vehicleOffsets: [number, number][] = [
  [0, 0],
  [-1, -1.9],
  [1, -1.9],
  [-1, 1.9],
  [1, 1.9],
];
/** Sample points covering a whole room, so a zone view hides any wall crossing its floor. */
export function zoneOffsets(halfWidth: number, halfDepth: number) {
  const offsets: [number, number][] = [];
  for (const fx of [-1, -0.5, 0, 0.5, 1])
    for (const fz of [-1, -0.5, 0, 0.5, 1])
      offsets.push([fx * halfWidth, fz * halfDepth]);
  return offsets;
}
/** A person standing between the camera and the framed car hides it: true when within `radius` of the line of sight. */
export function blocksLineOfSight(
  point: THREE.Vector3,
  camera: THREE.Vector3,
  aim: THREE.Vector3,
  radius = 1.1,
) {
  const flatCamera = new THREE.Vector3(camera.x, 0, camera.z),
    flatAim = new THREE.Vector3(aim.x, 0, aim.z),
    flatPoint = new THREE.Vector3(point.x, 0, point.z);
  const segment = flatAim.clone().sub(flatCamera);
  const length = segment.length();
  if (length < 1e-6) return false;
  const t = flatPoint.clone().sub(flatCamera).dot(segment) / (length * length);
  // Only the stretch in front of the car counts; people behind or beside it stay visible.
  if (t <= 0.05 || t >= 0.9) return false;
  const closest = flatCamera.clone().add(segment.multiplyScalar(t));
  return closest.distanceTo(flatPoint) < radius;
}
export function occludesTarget(
  bounds: THREE.Box3,
  camera: THREE.Vector3,
  aim: THREE.Vector3,
  offsets: [number, number][] = vehicleOffsets,
) {
  // A room is sampled at eye level: a high camera would otherwise look over a 2.9 m wall
  // that still hides the cars parked behind it.
  const eye =
    offsets === vehicleOffsets
      ? camera
      : new THREE.Vector3(camera.x, Math.min(camera.y, 1.6), camera.z);
  return offsets.some(([dx, dz]) => {
    const target = aim.clone().add(new THREE.Vector3(dx, 0, dz));
    const direction = target.clone().sub(eye);
    const distance = direction.length();
    const ray = new THREE.Ray(eye, direction.normalize());
    const hit = ray.intersectBox(bounds, new THREE.Vector3());
    return hit !== null && hit.distanceTo(eye) < distance - 1;
  });
}
