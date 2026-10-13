import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export const modelNames = [
  "sedan",
  "sedan-sports",
  "suv",
  "suv-luxury",
  "hatchback-sports",
  "van",
  "delivery",
  "delivery-flat",
  "truck",
  "truck-flat",
] as const;
export const modelIds = [
  ...modelNames.map((n) => "kenney-" + n),
  "spectral-gt",
];
export type Asset = {
  id: string;
  kind: "vehicle" | "mechanical";
  name: string;
  make: string;
  source: string;
  creator: string | null;
  license: string;
  licenseStatus: string;
  verifiedAt: string | null;
  licenseProof?: string;
  triangles: number;
  bytes: number;
  sha256: string | null;
  status: string;
  url: string | null;
  preview: string | null;
  generic: boolean;
  enabled: boolean;
  noAI: boolean;
  attribution?: string;
};
const cache = new Map<string, Promise<THREE.Group>>();
export function supportedAsset(id: string) {
  return modelIds.includes(id);
}
export async function loadVehicleAsset(id: string): Promise<THREE.Group> {
  if (!supportedAsset(id)) throw Error("Modèle non vérifié ou inconnu.");
  let request = cache.get(id);
  if (!request) {
    request = new GLTFLoader()
      .loadAsync(
        "/models/" +
          (id === "spectral-gt" ? "spectral-gt" : id.slice(7)) +
          ".glb",
      )
      .then((g) => g.scene);
    cache.set(id, request);
    request.catch(() => cache.delete(id));
  }
  const original = await request;
  const clone = original.clone(true);
  clone.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry = o.geometry.clone();
      o.material = Array.isArray(o.material)
        ? o.material.map((m) => m.clone())
        : o.material.clone();
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const bounds = new THREE.Box3().setFromObject(clone),
    size = bounds.getSize(new THREE.Vector3()),
    center = bounds.getCenter(new THREE.Vector3());
  const scale = 4.1 / Math.max(size.x, size.z);
  clone.scale.setScalar(scale);
  clone.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    -center.z * scale,
  );
  const group = new THREE.Group();
  group.name = "licensed-glb";
  group.rotation.y = id === "spectral-gt" ? Math.PI / 2 : Math.PI;
  group.add(clone);
  return group;
}
export function disposeObject(group: THREE.Object3D) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
        m.dispose(),
      );
    }
  });
}
