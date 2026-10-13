import { occludesTarget } from "../src/camera-occlusion.ts";
import * as THREE from "three";
import { nearestWalkable, blocked, findPath } from "../src/navigation.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  zoneView,
  vehicleView,
  isRendered,
  shortestTurn,
} from "../src/camera-navigation.ts";
import { seed, vehiclePosition } from "../src/domain.ts";
import { portoLayout } from "../src/dealership-layout.ts";

test("all workshop cars are framed from the central aisle, including both rows", () => {
  const db = seed();
  for (const spacing of [5, 6, 7])
    for (const v of db.vehicles.filter(
      (v) => v.present !== false && v.status !== "Livré",
    )) {
      const [x, z] = vehiclePosition(v, db.vehicles, {
        ...portoLayout,
        workshopSpacing: spacing,
      });
      const view = vehicleView(x, z, 1.2);
      assert.equal(view.target[0], x);
      assert.equal(view.target[2], z);
      if (z < 0) assert.ok(Math.abs(view.position[0]) < Math.abs(x), v.plate);
      if (z > 6) assert.ok(view.position[2] < 18, v.plate);
      assert.ok(view.position[1] > 3);
    }
});
test("narrow screens increase the distance to fit the complete car", () => {
  assert.ok(
    Math.abs(vehicleView(-7, -12, 0.5).position[0] + 7) >
      Math.abs(vehicleView(-7, -12, 1.4).position[0] + 7),
  );
});
test("hidden walls and hidden procedural wheels cannot consume the click", () => {
  const parent = { visible: false, parent: null };
  assert.equal(isRendered({ visible: true, parent }), false);
  assert.equal(isRendered({ visible: false, parent: null }), false);
  assert.equal(
    isRendered({ visible: true, parent: { visible: true, parent: null } }),
    true,
  );
});
test("automatic navigation crosses the angle boundary without a complete spin", () => {
  const turn = shortestTurn(Math.PI - 0.01, -Math.PI + 0.01, 1 / 60);
  assert.ok(turn > Math.PI - 0.01);
  assert.ok(turn < Math.PI + 0.01);
});

test("walking destinations avoid the actual vehicle occupying a viewpoint", () => {
  const boxes = [{ x: -7, z: -27, w: 2.05, d: 4.5 }];
  const target = nearestWalkable([-7, -28], boxes);
  assert.ok(target);
  assert.equal(blocked(...target, boxes, 0.45), false);
  assert.ok(findPath([0, -28], target, boxes).length);
});

test("the whole car fits in the camera after opening a dossier or resizing", () => {
  for (const aspect of [0.45, 0.7, 1, 1.8])
    for (const x of [-7, 7, 15, 19])
      for (const rear of [false, true]) {
        const view = vehicleView(x, -22, aspect, rear);
        const camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 200);
        camera.position.set(...view.position);
        camera.lookAt(new THREE.Vector3(...view.target));
        camera.updateMatrixWorld();
        for (const dx of [-1.05, 1.05])
          for (const y of [0, 2])
            for (const dz of [-2.25, 2.25]) {
              const point = new THREE.Vector3(x + dx, y, -22 + dz).project(
                camera,
              );
              assert.ok(
                Math.abs(point.x) < 1 && Math.abs(point.y) < 1,
                `aspect ${aspect}: ${point.x},${point.y}`,
              );
            }
      }
});

test("a foreground wall is hidden while walls behind the vehicle remain visible", () => {
  const camera = new THREE.Vector3(-13, 2.7, -16),
    aim = new THREE.Vector3(-7, 0.95, -22);
  const wall = new THREE.Box3(
    new THREE.Vector3(-12.2, 0, -25),
    new THREE.Vector3(-11.8, 3, -10),
  );
  assert.equal(occludesTarget(wall, camera, aim), true);
  const safe = vehicleView(-7, -22, 1.2);
  assert.equal(
    occludesTarget(wall, new THREE.Vector3(...safe.position), aim),
    false,
  );
  const behind = new THREE.Box3(
    new THREE.Vector3(-22, 0, -40),
    new THREE.Vector3(22, 3, -39),
  );
  assert.equal(
    occludesTarget(behind, new THREE.Vector3(...safe.position), aim),
    false,
  );
});
test("delivery viewpoints are distinct and still look at the same car", () => {
  const first = vehicleView(19, 15, 1.2),
    second = vehicleView(19, 15, 1.2, true);
  assert.notDeepEqual(first.position, second.position);
  assert.deepEqual(first.target, second.target);
});

test("guided workshop and showroom views fit their complete floor on tablet screens", () => {
  for (const aspect of [0.7, 1.2, 1.8])
    for (const depth of [52, 59, 66])
      for (const id of ["atelier", "showroom"]) {
        const view = zoneView(id, 0, 14, aspect, depth);
        const camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 300);
        camera.position.set(...view.position);
        camera.lookAt(new THREE.Vector3(...view.target));
        camera.updateMatrixWorld();
        for (const x of [-12, 12])
          for (const z of id === "atelier" ? [-depth, -9] : [9, 19]) {
            const point = new THREE.Vector3(x, 0, z).project(camera);
            assert.ok(
              Math.abs(point.x) < 1 && Math.abs(point.y) < 1,
              `${id} ${aspect} ${depth}: ${point.x},${point.y}`,
            );
          }
      }
});
