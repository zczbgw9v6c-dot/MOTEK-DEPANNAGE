import * as THREE from "three";
import { loadVehicleAsset, disposeObject, supportedAsset } from "./assets";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bayPosition, vehiclePosition, zones, type Vehicle } from "./domain";
import { walls, doors, blocked, findPath, type Box } from "./navigation";
export type Selection = {
  kind:
    | "vehicle"
    | "wheel"
    | "bay"
    | "technician"
    | "stock"
    | "reception"
    | "delivery"
    | "office"
    | "door"
    | "part";
  id: string;
};
export type Mode = "overview" | "walk" | "free";
const palette = {
  floor: "#c6ccc9",
  wall: "#f0f1ea",
  navy: "#233c4c",
  blue: "#567e96",
  wood: "#ac9878",
};
export class GarageScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  controls: OrbitControls;
  mode: Mode = "overview";
  speed = 3.8;
  reduced = false;
  quality = "standard";
  private frame = 0;
  private last = 0;
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private path: [number, number][] = [];
  private furniture: Box[] = [];
  private cars = new THREE.Group();
  private generation = 0;
  private assetDisabled: string[] = [];
  private inspectedId: string | null = null;
  private wheelObjects = new Map<string, THREE.Group[]>();
  private liftGroups = new Map<number, THREE.Group>();
  private doorMeshes = new Map<string, THREE.Mesh>();
  private closed = new Set<string>();
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private highlight = new THREE.Group();
  private selected: string | null = null;
  private currentCars: Vehicle[] = [];
  private down = [0, 0];
  private disposed = false;
  private ro: ResizeObserver;
  private cleanups: (() => void)[] = [];
  private lastPosition = 0;
  private hovered = "";
  constructor(
    private host: HTMLDivElement,
    private select: (s: Selection) => void,
    private position: (x: number, z: number) => void,
    private hint: (s: string) => void,
    private failure: (s: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color("#dde5e4");
    this.scene.fog = new THREE.Fog("#dde5e4", 65, 135);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 85;
    this.scene.add(new THREE.HemisphereLight("#fffdf3", "#5b6b73", 2.7));
    const sun = new THREE.DirectionalLight("#fff8e9", 3.7);
    sun.position.set(-25, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.camera.far = 100;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.build();
    this.scene.add(this.cars, this.highlight);
    this.setMode("overview");
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.listen(window, "keydown", (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches("input,textarea,select")) return;
      this.keys.add(e.code);
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "KeyZ",
          "KeyQ",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
        ].includes(e.code)
      )
        e.preventDefault();
      if (e.code === "KeyE" && this.mode === "walk") {
        this.interact();
      }
      if (e.code === "Escape") this.path = [];
    });
    this.listen(window, "keyup", (e: KeyboardEvent) =>
      this.keys.delete(e.code),
    );
    this.listen(window, "blur", () => this.keys.clear());
    this.listen(document, "pointerlockchange", () => {
      if (document.pointerLockElement !== this.renderer.domElement)
        this.keys.clear();
    });
    this.listen(this.renderer.domElement, "pointerdown", (e: PointerEvent) => {
      this.down = [e.clientX, e.clientY];
    });
    this.listen(this.renderer.domElement, "pointerup", (e: PointerEvent) => {
      if (Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 5)
        return;
      if (this.mode === "walk") {
        if (document.pointerLockElement === this.renderer.domElement)
          this.interact();
        else
          this.renderer.domElement
            .requestPointerLock()
            ?.catch(() =>
              this.hint(
                "Maintenez le bouton de la souris pour regarder autour de vous.",
              ),
            );
      } else {
        this.pick(e.clientX, e.clientY, true);
      }
    });
    this.listen(this.renderer.domElement, "pointermove", (e: PointerEvent) => {
      if (
        this.mode === "walk" &&
        (document.pointerLockElement === this.renderer.domElement ||
          e.buttons === 1)
      ) {
        this.yaw -= e.movementX * 0.0024;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch - e.movementY * 0.0024,
          -1.3,
          1.3,
        );
      } else if (this.mode !== "walk") this.pick(e.clientX, e.clientY, false);
    });
    this.listen(this.renderer.domElement, "webglcontextlost", (e: Event) => {
      e.preventDefault();
      this.failure(
        "La 3D est indisponible. Les dossiers restent accessibles en vue liste.",
      );
    });
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  private listen(target: EventTarget, event: string, handler: any) {
    target.addEventListener(event, handler);
    this.cleanups.push(() => target.removeEventListener(event, handler));
  }
  private material(color: string, metalness = 0, roughness = 0.7) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness });
  }
  private box(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    tag?: Selection,
  ) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      this.material(color),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (tag) m.userData.select = tag;
    parent.add(m);
    return m;
  }
  private cylinder(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    color: string,
  ) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 24),
      this.material(color, 0.35, 0.5),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  private label(
    text: string,
    x: number,
    y: number,
    z: number,
    width = 3,
    color = "#233c4c",
    bg = "#ffffff",
  ) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    ctx.font = "600 43px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 384, 64);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, depthTest: true }),
    );
    s.position.set(x, y, z);
    s.scale.set(width, width / 6, 1);
    this.scene.add(s);
    return s;
  }
  private solid(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    color: string,
    tag?: Selection,
  ) {
    this.furniture.push({ x, z, w, d });
    return this.box(this.scene, x, h / 2, z, w, h, d, color, tag);
  }
  private build() {
    this.box(this.scene, 0, -0.25, 5, 110, 0.4, 110, "#aab8b2");
    this.box(this.scene, 0, -0.015, 0, 44, 0.12, 36, palette.floor);
    this.box(this.scene, 0, -0.01, 24, 44, 0.1, 12, "#717b7e");
    zones.forEach((zone) => {
      if (zone.id !== "atelier" && zone.id !== "parking")
        this.box(
          this.scene,
          zone.x,
          0.052,
          zone.z,
          zone.x === 0 ? 23 : 9.6,
          0.02,
          zone.id === "attente"
            ? 9.5
            : zone.id === "bureau"
              ? 9.5
              : zone.id === "accueil"
                ? 15.6
                : zone.id === "showroom"
                  ? 8.5
                  : 11.5,
          zone.id === "stock"
            ? "#aab9b6"
            : zone.id === "carrosserie"
              ? "#bcc6c5"
              : "#d9dcd6",
        );
      this.label(
        zone.short.toUpperCase(),
        zone.x,
        3.3,
        zone.z,
        zone.id === "atelier" ? 5 : 3.2,
      );
    });
    walls.forEach((b) => {
      this.box(this.scene, b.x, 1.45, b.z, b.w, 2.9, b.d, palette.wall);
      this.box(
        this.scene,
        b.x,
        0.12,
        b.z,
        b.w + 0.04,
        0.24,
        b.d + 0.04,
        palette.navy,
      );
    });
    // Doorways stay visible; doors start open and may be closed by interaction.
    doors.forEach((d) => {
      const m = this.box(
        this.scene,
        d.x,
        1.2,
        d.z - 1.5,
        0.15,
        2.4,
        2.9,
        "#7e999e",
        { kind: "door", id: d.id },
      );
      m.rotation.y = Math.PI / 2;
      this.doorMeshes.set(d.id, m);
      this.label("PORTE", d.x, 2.85, d.z, 1.2);
    });
    for (let i = 1; i <= 8; i++) {
      const [x, z] = bayPosition(i);
      this.box(this.scene, x, 0.061, z, 5, 0.025, 4.6, "#abb6b3");
      for (const edge of [-2.45, 2.45])
        this.box(this.scene, x + edge, 0.08, z, 0.06, 0.02, 4.6, "#e6e8dc");
      const tag: Selection = { kind: "bay", id: String(i) };
      for (const dx of [-1.65, 1.65]) {
        this.solid(x + dx, z, 0.32, 0.6, 3.1, palette.navy, tag);
        this.box(
          this.scene,
          x + dx,
          3.12,
          z,
          0.48,
          0.16,
          0.78,
          palette.blue,
          tag,
        );
      }
      const lift = new THREE.Group();
      lift.position.set(x, 0, z);
      for (const dx of [-0.65, 0.65])
        this.box(lift, dx, 0.14, 0, 0.2, 0.16, 3.6, palette.navy, tag);
      this.scene.add(lift);
      this.liftGroups.set(i, lift);
      this.label(`POSTE ${String(i).padStart(2, "0")}`, x, 3.8, z, 2.3);
      this.solid(x + (x < 0 ? -3 : 3), z + 1.5, 0.75, 0.5, 0.9, "#687d83", {
        kind: "stock",
        id: "tools",
      });
    }
    // Reception counter, screens and waiting lounge.
    this.solid(-18, 7.5, 5, 1.2, 1.05, palette.wood, {
      kind: "reception",
      id: "reception",
    });
    this.box(this.scene, -18, 1.08, 7.5, 5.2, 0.08, 1.4, "#eceee7");
    for (const x of [-19.2, -16.8]) {
      this.box(this.scene, x, 1.5, 7.5, 0.85, 0.6, 0.07, palette.navy, {
        kind: "reception",
        id: "reception",
      });
      this.box(this.scene, x, 1.2, 7.6, 0.2, 0.3, 0.2, "#657880");
    }
    for (const z of [-5.5, -0.5]) {
      this.solid(-20, z, 1.2, 3, 0.65, "#74877e");
      this.box(this.scene, -20.5, 1, z, 0.22, 0.75, 3, "#74877e");
    }
    this.solid(-16, -5, 2, 1.3, 0.42, palette.wood);
    this.solid(-20, -14, 2.2, 1.1, 0.78, palette.wood, {
      kind: "office",
      id: "office",
    });
    this.box(this.scene, -20, 1.12, -14, 0.9, 0.62, 0.1, palette.navy, {
      kind: "office",
      id: "office",
    });
    // Stock shelves with separately selectable reference boxes.
    for (const x of [14, 20])
      for (const z of [-15, -10]) {
        this.solid(x, z, 1.1, 3, 2.25, "#526b71", {
          kind: "stock",
          id: "shelf",
        });
        for (let row = 0; row < 3; row++) {
          this.box(
            this.scene,
            x,
            0.45 + row * 0.6,
            z,
            1.2,
            0.08,
            3.1,
            "#c4c9c1",
          );
          for (let j = 0; j < 3; j++)
            this.box(
              this.scene,
              x,
              0.7 + row * 0.6,
              z - 1 + j,
              0.85,
              0.42,
              0.7,
              j % 2 ? "#b29e7e" : "#d4c6a9",
              {
                kind: "stock",
                id: row === 0 ? "disc" : row === 1 ? "pads" : "filter",
              },
            );
        }
      }
    this.solid(20, 0, 2.5, 6, 2.6, "#d4ded9", { kind: "delivery", id: "body" });
    this.box(this.scene, 18.7, 1.25, 0, 0.04, 2.2, 5, "#9daba7");
    this.label("CABINE PEINTURE", 20, 2.8, 0, 3);
    this.solid(20, 15, 1.3, 2, 0.9, palette.wood, {
      kind: "delivery",
      id: "delivery",
    });
    // Architectural beams, high windows and practical strip lights.
    for (const z of [-16, -8, 0, 8, 16]) {
      this.box(this.scene, 0, 5.5, z, 44, 0.15, 0.18, "#8e9e9d");
      for (const x of [-10, 10]) {
        this.box(this.scene, x, 5.4, z, 6, 0.06, 0.2, "#fffbe9");
      }
    }
    for (const x of [-21.8, 21.8])
      for (const z of [-13, -3, 9]) {
        this.box(this.scene, x, 2, z, 0.04, 1.15, 3, "#b5d2d2");
      }
    for (const x of [-18, -9, 0, 9, 18]) {
      this.box(this.scene, x, 0.06, 24, 0.08, 0.02, 9, "#d7dacc");
    }
    for (const x of [-24, 24]) {
      this.cylinder(this.scene, x, 0.65, 18, 0.8, 1.3, "#708075");
      this.cylinder(this.scene, x, 2, 18, 1.1, 1.6, "#66816b");
    }
  }
  private car(v: Vehicle, x: number, z: number, display = false) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.select = { kind: "vehicle", id: v.id };
    const suv = v.shape === "suv";
    const length = v.shape === "hatch" ? 3.65 : 4.25;
    const body = this.material(v.color, 0.55, 0.28);
    const glass = this.material("#263c47", 0.35, 0.18);
    const rounded = (
      w: number,
      h: number,
      d: number,
      y: number,
      mat: THREE.Material,
    ) => {
      const shape = new THREE.Shape();
      const r = 0.14;
      shape.moveTo(-w / 2 + r, -d / 2);
      shape.lineTo(w / 2 - r, -d / 2);
      shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
      shape.lineTo(w / 2, d / 2 - r);
      shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
      shape.lineTo(-w / 2 + r, d / 2);
      shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
      shape.lineTo(-w / 2, -d / 2 + r);
      shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
      const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: h,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.07,
          bevelThickness: 0.07,
        }),
        mat,
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };
    rounded(1.85, 0.48, length, 0.45, body);
    rounded(1.72, 0.18, length - 0.2, 0.93, body);
    // Tapered cabin via explicit side profile extruded across the car's width.
    const profile = new THREE.Shape();
    profile.moveTo(-1.17, 1.07);
    profile.lineTo(-0.72, suv ? 1.86 : 1.61);
    profile.lineTo(suv ? 0.85 : 0.48, suv ? 1.86 : 1.61);
    profile.lineTo(1.25, 1.07);
    profile.closePath();
    const cabin = new THREE.Mesh(
      new THREE.ExtrudeGeometry(profile, { depth: 1.6, bevelEnabled: false }),
      glass,
    );
    cabin.rotation.y = Math.PI / 2;
    cabin.position.x = -0.8;
    cabin.castShadow = true;
    g.add(cabin);
    rounded(1.59, 0.055, suv ? 1.65 : 1.2, suv ? 1.87 : 1.62, body);
    for (const side of [-1, 1]) {
      this.box(g, side * 0.88, 1.17, 0.05, 0.035, 0.12, 2.15, v.color);
      this.box(g, side * 0.81, 1.37, -0.05, 0.035, 0.55, 0.08, v.color);
      this.box(g, side * 1.02, 1.25, -0.78, 0.22, 0.15, 0.3, v.color);
      for (const zz of [-0.6, 0.65])
        this.box(g, side * 0.94, 1.03, zz, 0.03, 0.04, 0.19, "#d4dbdc");
    }
    this.box(g, 0, 0.55, -length / 2 - 0.025, 1.2, 0.18, 0.04, "#25333a");
    this.box(g, 0, 0.82, -length / 2 - 0.07, 0.66, 0.14, 0.03, "#eff1e8");
    for (const side of [-1, 1]) {
      this.box(
        g,
        side * 0.65,
        0.93,
        -length / 2 - 0.055,
        0.45,
        0.11,
        0.04,
        "#fcf5d5",
      );
      this.box(
        g,
        side * 0.68,
        0.88,
        length / 2 + 0.055,
        0.4,
        0.11,
        0.04,
        "#b9574e",
      );
    }
    const wheels: THREE.Group[] = [];
    for (const side of [-1, 1])
      for (const zz of [-length * 0.3, length * 0.3]) {
        const wheel = new THREE.Group();
        wheel.position.set(side * 0.94, 0.46, zz);
        wheel.userData.select = display
          ? { kind: "office", id: "showroom" }
          : { kind: "wheel", id: v.id };
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.43, 0.43, 0.27, 32),
          this.material("#252c2e", 0, 0.95),
        );
        tire.rotation.z = Math.PI / 2;
        wheel.add(tire);
        const rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.285, 24),
          this.material("#bec6c7", 0.9, 0.25),
        );
        rim.rotation.z = Math.PI / 2;
        wheel.add(rim);
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16),
          this.material("#5d717b", 0.8, 0.2),
        );
        hub.rotation.z = Math.PI / 2;
        wheel.add(hub);
        for (let n = 0; n < 5; n++) {
          const spoke = this.box(
            wheel,
            side * 0.155,
            0,
            0,
            0.025,
            0.065,
            0.52,
            "#83959b",
          );
          spoke.rotation.x = (n * Math.PI) / 5;
        }
        g.add(wheel);
        wheels.push(wheel);
      }
    if (!display) this.wheelObjects.set(v.id, wheels);
    return g;
  }
  update(vehicles: Vehicle[], disabled: string[] = []) {
    const generation = ++this.generation;
    this.assetDisabled = disabled;
    this.currentCars = vehicles;
    this.clear(this.cars);
    this.wheelObjects.clear();
    vehicles
      .filter((v) => v.status !== "Livré")
      .forEach((v) => {
        const [x, z] = vehiclePosition(v, vehicles);
        const g = this.car(v, x, z);
        if (v.bay) g.position.y = this.liftGroups.get(v.bay)?.position.y || 0;
        this.cars.add(g);
        const assetId =
          v.assetId ||
          "kenney-" +
            (v.shape === "suv"
              ? "suv"
              : v.shape === "hatch"
                ? "hatchback-sports"
                : "sedan");
        if (supportedAsset(assetId) && !this.assetDisabled.includes(assetId)) {
          const fallback = [...g.children];
          g.userData.fallback = fallback;
          loadVehicleAsset(assetId)
            .then((asset) => {
              if (this.disposed || generation !== this.generation) {
                disposeObject(asset);
                return;
              }
              asset.traverse((o) => {
                if (
                  o instanceof THREE.Mesh &&
                  o.name.toLowerCase().includes("wheel")
                )
                  o.userData.select = { kind: "wheel", id: v.id };
              });
              g.add(asset);
              g.userData.asset = asset;
              fallback.forEach((o) => (o.visible = this.inspectedId === v.id));
              asset.visible = this.inspectedId !== v.id;
            })
            .catch(() =>
              this.hint(
                "Modèle GLB indisponible : représentation procédurale de secours.",
              ),
            );
        }
        if (v.bay) {
          const person = this.person(
            v.technician,
            x + (x < 0 ? 2.4 : -2.4),
            z + 1.3,
          );
          this.cars.add(person);
        }
      });
    const show: Vehicle = {
      ...vehicles[0],
      id: "showroom",
      color: "#d5d7d2",
      shape: "sedan",
    };
    if (vehicles.length) {
      const g = this.car(show, -6, 14, true);
      g.userData.select = { kind: "office", id: "showroom" };
      this.cars.add(g);
    }
    this.setSelected(this.selected);
  }
  private person(name: string, x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.select = { kind: "technician", id: name };
    this.box(g, 0, 1.06, 0, 0.48, 0.62, 0.28, "#38596d");
    this.cylinder(g, 0, 1.55, 0, 0.16, 0.3, "#c7a488");
    for (const side of [-1, 1]) {
      this.box(g, side * 0.13, 0.44, 0, 0.18, 0.68, 0.21, "#2b3b46");
      this.box(g, side * 0.33, 0.99, 0, 0.15, 0.58, 0.18, "#38596d");
      this.box(g, side * 0.13, 0.09, -0.06, 0.22, 0.16, 0.34, "#283036");
    }
    return g;
  }
  private boxes() {
    return [
      ...walls,
      ...this.furniture,
      { x: -6, z: 14, w: 2.05, d: 4.5 },
      ...this.currentCars
        .filter((v) => v.status !== "Livré")
        .map((v) => {
          const [x, z] = vehiclePosition(v, this.currentCars);
          return { x, z, w: 2.05, d: 4.5 };
        }),
      ...doors
        .filter((d) => this.closed.has(d.id))
        .map((d) => ({ x: d.x, z: d.z, w: 0.2, d: 3 })),
    ];
  }
  toggleDoor(id: string) {
    const m = this.doorMeshes.get(id);
    if (!m) return;
    if (this.closed.has(id)) {
      this.closed.delete(id);
      m.rotation.y = Math.PI / 2;
      m.position.z = doors.find((d) => d.id === id)!.z - 1.5;
    } else {
      const d = doors.find((d) => d.id === id)!;
      if (
        Math.hypot(this.camera.position.x - d.x, this.camera.position.z - d.z) <
        1.7
      ) {
        this.hint("Éloignez-vous de la porte avant de la fermer.");
        return;
      }
      this.closed.add(id);
      m.rotation.y = 0;
      m.position.z = d.z;
    }
    this.hint(
      this.closed.has(id) ? "Porte fermée · E pour ouvrir" : "Porte ouverte",
    );
  }
  lift(bay: number) {
    const g = this.liftGroups.get(bay);
    if (!g) return;
    const height = g.position.y > 0.1 ? 0 : 1.1;
    g.position.y = height;
    const car = this.cars.children.find(
      (c) =>
        c.userData.select?.kind === "vehicle" &&
        this.currentCars.find((v) => v.id === c.userData.select.id)?.bay ===
          bay,
    );
    if (car) car.position.y = height;
    this.hint(height ? "Pont levé" : "Pont abaissé");
  }
  setSelected(id: string | null) {
    this.selected = id;
    this.clear(this.highlight);
    if (!id) return;
    const v = this.currentCars.find((v) => v.id === id);
    if (!v) return;
    const [x, z] = vehiclePosition(v, this.currentCars);
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 2.41, 80),
      new THREE.MeshBasicMaterial({ color: "#326e95", side: THREE.DoubleSide }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.09, z);
    this.highlight.add(mesh);
  }
  inspect(id: string, exploded: boolean) {
    const car = this.cars.children.find((c) => c.userData.select?.id === id);
    if (!car) return;
    this.inspectedId = exploded ? id : null;
    const asset = car.userData.asset as THREE.Group | undefined;
    if (asset) {
      asset.visible = !exploded;
      (car.userData.fallback as THREE.Object3D[]).forEach(
        (o) => (o.visible = exploded),
      );
    }
    const wheels = this.wheelObjects.get(id);
    if (wheels) {
      wheels[0].position.x = exploded ? -1.85 : -0.94;
      let brake = car.getObjectByName("brake");
      if (!brake) {
        const group = new THREE.Group();
        group.name = "brake";
        group.position.set(-1, 0.46, wheels[0].position.z);
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.055, 48),
          this.material("#9ba5a5", 0.85, 0.3),
        );
        disc.rotation.z = Math.PI / 2;
        disc.userData.select = { kind: "part", id: "disc" };
        group.add(disc);
        this.box(group, -0.08, 0.1, 0, 0.12, 0.29, 0.2, "#a87755", {
          kind: "part",
          id: "caliper",
        });
        this.box(group, -0.15, 0.1, 0, 0.055, 0.18, 0.14, "#39484f", {
          kind: "part",
          id: "pads",
        });
        car.add(group);
        brake = group;
      }
      brake.visible = exploded;
    }
    if (exploded) {
      this.setMode("free");
      this.camera.position.set(car.position.x - 5, 2.7, car.position.z - 3.8);
      this.controls.target.set(car.position.x - 1, 0.6, car.position.z - 1.2);
      this.controls.update();
    }
  }
  setMode(mode: Mode) {
    this.path = [];
    if (document.pointerLockElement) document.exitPointerLock();
    this.mode = mode;
    this.controls.enabled = mode !== "walk";
    this.keys.clear();
    if (mode === "overview") {
      this.camera.position.set(39, 45, 53);
      this.controls.target.set(0, 0, 2);
      this.controls.update();
    } else if (mode === "walk") {
      this.camera.position.set(-17, 1.7, 13);
      this.yaw = -0.65;
      this.pitch = 0;
      this.camera.rotation.order = "YXZ";
    } else {
      this.camera.position.set(22, 15, 28);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }
  go(zoneId: string) {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    doors.forEach((d) => {
      if (this.closed.has(d.id)) this.toggleDoor(d.id);
    });
    if (this.mode !== "walk") this.setMode("walk");
    const path = findPath(
      [this.camera.position.x, this.camera.position.z],
      [zone.x, zone.z],
      this.boxes(),
    );
    if (!path.length) {
      this.hint("Aucun passage disponible vers cette zone.");
      return;
    }
    this.path = path.slice(1);
    this.hint(`En route vers ${zone.short} · Échap pour arrêter`);
  }
  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  private pick(x: number, y: number, click: boolean) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((x - r.left) / r.width) * 2 - 1,
      (-(y - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const hit = this.ray
      .intersectObjects(this.scene.children, true)
      .find((h) => !(h.object instanceof THREE.Sprite));
    const s = hit ? this.selection(hit.object) : null;
    if (click && s) this.activate(s);
    this.renderer.domElement.style.cursor = s ? "pointer" : "grab";
    const name =
      s?.kind === "vehicle" || s?.kind === "wheel"
        ? this.currentCars.find((v) => v.id === s.id)?.plate
        : s?.kind === "bay"
          ? `Pont ${s.id}`
          : s?.kind === "stock"
            ? "Ouvrir le magasin"
            : s?.kind === "technician"
              ? s.id
              : s?.kind === "door"
                ? "Ouvrir / fermer la porte"
                : "";
    if (name !== this.hovered) {
      this.hovered = name || "";
      this.hint(this.hovered);
    }
  }
  private selection(o: THREE.Object3D): Selection | null {
    let n: THREE.Object3D | null = o;
    while (n) {
      if (n.userData.select) return n.userData.select;
      n = n.parent;
    }
    return null;
  }
  private activate(s: Selection) {
    if (s.kind === "door") {
      this.toggleDoor(s.id);
      return;
    }
    if (document.pointerLockElement) document.exitPointerLock();
    this.select(s);
  }
  private interact() {
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hit = this.ray
      .intersectObjects(this.scene.children, true)
      .find((h) => !(h.object instanceof THREE.Sprite));
    const target = hit && hit.distance < 5 ? this.selection(hit.object) : null;
    if (target) this.activate(target);
    else
      this.hint(
        "Approchez-vous d’un véhicule, d’une porte ou d’un équipement.",
      );
  }
  private tick(t: number) {
    if (this.disposed) return;
    const dt = Math.min((t - this.last) / 1000, 0.045);
    this.last = t;
    if (this.mode === "walk") {
      this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      let dx = 0,
        dz = 0;
      if (this.path.length) {
        const p = this.path[0];
        const diff = new THREE.Vector2(
          p[0] - this.camera.position.x,
          p[1] - this.camera.position.z,
        );
        if (diff.length() < 0.09) this.path.shift();
        else {
          diff
            .normalize()
            .multiplyScalar(
              Math.min(
                this.speed * dt,
                new THREE.Vector2(
                  p[0] - this.camera.position.x,
                  p[1] - this.camera.position.z,
                ).length(),
              ),
            );
          dx = diff.x;
          dz = diff.y;
          if (!this.reduced) {
            this.yaw = THREE.MathUtils.lerp(
              this.yaw,
              Math.atan2(-dx, -dz),
              0.08,
            );
          }
        }
      } else {
        let f =
          Number(
            this.keys.has("KeyW") ||
              this.keys.has("KeyZ") ||
              this.keys.has("ArrowUp"),
          ) - Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
        let side =
          Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
          Number(
            this.keys.has("KeyA") ||
              this.keys.has("KeyQ") ||
              this.keys.has("ArrowLeft"),
          );
        const len = Math.hypot(f, side) || 1;
        f /= len;
        side /= len;
        dx =
          (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * side) *
          this.speed *
          dt;
        dz =
          (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * side) *
          this.speed *
          dt;
      }
      const boxes = this.boxes();
      if (!blocked(this.camera.position.x + dx, this.camera.position.z, boxes))
        this.camera.position.x += dx;
      if (!blocked(this.camera.position.x, this.camera.position.z + dz, boxes))
        this.camera.position.z += dz;
      this.camera.position.y = 1.7;
    } else this.controls.update();
    if (t - this.lastPosition > 180) {
      this.position(this.camera.position.x, this.camera.position.z);
      this.lastPosition = t;
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame((n) => this.tick(n));
  }
  setQuality(low: boolean) {
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = !low;
    this.resize();
  }
  private clear(g: THREE.Object3D) {
    g.children.forEach((c) =>
      c.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      }),
    );
    g.clear();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.cleanups.forEach((fn) => fn());
    if (document.pointerLockElement === this.renderer.domElement)
      document.exitPointerLock();
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => {
          if ("map" in m) (m.map as THREE.Texture | null)?.dispose();
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
