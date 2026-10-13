import * as THREE from "three";
/** Hide architecture crossing the centre or silhouette of the vehicle, not objects behind it. */
export function occludesTarget(
  bounds: THREE.Box3,
  camera: THREE.Vector3,
  aim: THREE.Vector3,
) {
  return [
    [0, 0],
    [-1, -1.9],
    [1, -1.9],
    [-1, 1.9],
    [1, 1.9],
  ].some(([dx, dz]) => {
    const target = aim.clone().add(new THREE.Vector3(dx, 0, dz));
    const direction = target.clone().sub(camera);
    const distance = direction.length();
    const ray = new THREE.Ray(camera, direction.normalize());
    const hit = ray.intersectBox(bounds, new THREE.Vector3());
    return hit !== null && hit.distanceTo(camera) < distance - 1;
  });
}
