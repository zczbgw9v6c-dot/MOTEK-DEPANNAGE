import { demoShowroom } from "./guided-domain";
import { occludesTarget } from "./camera-occlusion";
import {
  vehicleView,
  zoneView,
  isRendered,
  shortestTurn,
} from "./camera-navigation";
import { portoLayout, type DealershipLayout } from "./dealership-layout";
import * as THREE from "three";
import { team } from "./team-data";
import { isPresent } from "./dashboard-domain";
import { loadVehicleAsset, disposeObject, supportedAsset } from "./assets";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bayPosition, vehiclePosition, zones, type Vehicle } from "./domain";
import {
  walls,
  doors,
  blocked,
  findPath,
  nearestWalkable,
  type Box,
} from "./navigation";
export type Selection = {
  kind:
    | "zone"
    | "customer"
    | "inventory"
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
  detail?: boolean;
};
export type Mode = "overview" | "walk" | "free";
const palette = {
  floor: "#505a61",
  wall: "#e2e4df",
  navy: "#202a32",
  blue: "#48647c",
  wood: "#917457",
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
  private environment: THREE.WebGLRenderTarget;
  private floorTexture: THREE.CanvasTexture | null = null;
  private occlusionBounds = new Map<THREE.Object3D, THREE.Box3>();
  private cameraFlight: {
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null = null;
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
  private customerHighlight = new THREE.Group();
  private selectedCustomer: string | null = null;
  private cohortHighlight = new THREE.Group();
  private cohortIDs: string[] = [];
  private selected: string | null = null;
  private focusedVehicle: string | null = null;
  private focusRear = false;
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
    private layout: DealershipLayout = portoLayout,
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
    this.renderer.toneMappingExposure = 1.18;
    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(environment, 0.045);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.65;
    environment.dispose();
    pmrem.dispose();
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color("#242c35");
    this.scene.fog = new THREE.Fog("#242c35", 180, 360);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enabled = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    this.controls.touches.ONE = THREE.TOUCH.PAN;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    this.controls.minDistance = 7;
    this.controls.addEventListener("change", () => {
      const target = this.controls.target;
      const dx = THREE.MathUtils.clamp(target.x, -24, 24) - target.x;
      const dz = THREE.MathUtils.clamp(target.z, -70, 20) - target.z;
      target.x += dx;
      target.z += dz;
      this.camera.position.x += dx;
      this.camera.position.z += dz;
    });
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.65;
    this.controls.addEventListener("start", () => {
      this.cameraFlight = null;
    });
    this.controls.minPolarAngle = 0.18;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.12;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 85;
    this.scene.add(new THREE.HemisphereLight("#dbe7ff", "#36302b", 1.8));
    const sun = new THREE.DirectionalLight("#fff3de", 3.2);
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
    const fill = new THREE.DirectionalLight("#b8d6ff", 1.3);
    fill.position.set(24, 18, -35);
    this.scene.add(fill);
    this.build();
    for (const object of this.scene.children) {
      if (object.userData.occluder)
        this.occlusionBounds.set(
          object,
          new THREE.Box3().setFromObject(object),
        );
    }
    this.scene.add(
      this.cars,
      this.highlight,
      this.cohortHighlight,
      this.customerHighlight,
    );
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
      if (e.button !== 0) return;
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
    color = "#eef3f5",
    bg = "#202932",
    parent: THREE.Object3D = this.scene,
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
    s.userData.sceneLabel = true;
    parent.add(s);
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
    const object = this.box(this.scene, x, h / 2, z, w, h, d, color, tag);
    object.userData.occluder = true;
    return object;
  }
  private get depth() {
    return 17 + 7 * (this.layout.workshopSpacing || 5);
  }
  private activeWalls() {
    return walls
      .filter(
        (w) =>
          this.layout.waitingRoom || !(w.x < -12 && (w.z === -8 || w.z === 2)),
      )
      .map((w) =>
        w.z === -52
          ? { ...w, z: -this.depth }
          : Math.abs(w.x) === 22 && w.d === 70
            ? { ...w, z: (18 - this.depth) / 2, d: 18 + this.depth }
            : w,
      );
  }
  /** Canvas-local coordinates for the accessible HTML zone markers. */
  projectZones(): { id: string; x: number; y: number; visible: boolean }[] {
    const { width, height } = this.renderer.domElement.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    return zones
      .filter((zone) => this.layout.waitingRoom || zone.id !== "attente")
      .map((zone) => {
        const point = new THREE.Vector3(zone.x, 2, zone.z).project(this.camera);
        return {
          id: zone.id,
          x: (point.x * 0.5 + 0.5) * width,
          y: (-point.y * 0.5 + 0.5) * height,
          visible:
            this.mode === "overview" &&
            point.z > -1 &&
            point.z < 1 &&
            Math.abs(point.x) < 1 &&
            Math.abs(point.y) < 1,
        };
      });
  }
  private industrialFloor() {
    // A locally generated texture: concrete aggregate, tile seams and subtle wear.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d5d5d3";
    ctx.fillRect(0, 0, 256, 256);
    let seed = 173;
    const random = () =>
      (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 5500; i++) {
      const shade = Math.floor(150 + random() * 100);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.2)`;
      ctx.fillRect(random() * 256, random() * 256, 1 + random() * 2, 1);
    }
    ctx.strokeStyle = "rgba(39,45,49,.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, 254.5, 254.5);
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.strokeRect(2, 2, 252, 252);
    this.floorTexture = new THREE.CanvasTexture(canvas);
    this.floorTexture.colorSpace = THREE.SRGBColorSpace;
    this.floorTexture.wrapS = this.floorTexture.wrapT = THREE.RepeatWrapping;
    this.floorTexture.anisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy(),
    );
  }
  private glassFrame(b: Box) {
    const alongX = b.w > b.d;
    const length = alongX ? b.w : b.d;
    for (const y of [0.28, 2.92])
      this.box(
        this.scene,
        b.x,
        y,
        b.z,
        alongX ? b.w : 0.09,
        0.065,
        alongX ? 0.09 : b.d,
        "#25313a",
      );
    const segments = Math.max(1, Math.ceil(length / 2.6));
    for (let i = 0; i <= segments; i++) {
      const offset = -length / 2 + (i * length) / segments;
      this.box(
        this.scene,
        b.x + (alongX ? offset : 0),
        1.6,
        b.z + (alongX ? 0 : offset),
        0.075,
        2.65,
        0.075,
        "#25313a",
      );
    }
  }
  private toolCabinet(x: number, z: number) {
    const tag: Selection = { kind: "stock", id: "tools" };
    const cabinet = this.solid(x, z, 0.9, 0.65, 0.92, "#293740", tag);
    cabinet.material.metalness = 0.7;
    cabinet.material.roughness = 0.32;
    const top = this.box(
      this.scene,
      x,
      0.96,
      z,
      1.02,
      0.065,
      0.75,
      "#a8b2b5",
      tag,
    );
    top.material.metalness = 0.85;
    for (let row = 0; row < 5; row++) {
      this.box(
        this.scene,
        x,
        0.24 + row * 0.13,
        z + 0.335,
        0.78,
        0.012,
        0.01,
        "#121b23",
        tag,
      );
      this.box(
        this.scene,
        x,
        0.28 + row * 0.13,
        z + 0.355,
        0.62,
        0.025,
        0.025,
        "#a1adb1",
        tag,
      );
    }
    for (const dx of [-0.35, 0.35])
      for (const dz of [-0.22, 0.22]) {
        const wheel = this.cylinder(
          this.scene,
          x + dx,
          0.08,
          z + dz,
          0.09,
          0.07,
          "#11181d",
        );
        wheel.rotation.z = Math.PI / 2;
      }
    for (let i = 0; i < 3; i++) {
      const tool = this.box(
        this.scene,
        x - 0.28 + i * 0.2,
        1.01,
        z,
        0.035,
        0.025,
        0.3,
        "#b8c1c6",
        tag,
      );
      tool.material.metalness = 0.9;
      tool.rotation.y = i * 0.35;
    }
  }
  private plant(x: number, z: number) {
    this.cylinder(this.scene, x, 0.29, z, 0.28, 0.58, "#414c50");
    this.cylinder(this.scene, x, 0.58, z, 0.23, 0.025, "#302b25");
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4;
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        this.material(i % 2 ? "#465c3c" : "#62744d", 0, 0.85),
      );
      leaf.scale.set(0.1, 0.56, 0.055);
      leaf.position.set(
        x + Math.cos(angle) * 0.18,
        0.98 + (i % 3) * 0.12,
        z + Math.sin(angle) * 0.18,
      );
      leaf.rotation.set(Math.sin(angle) * 0.55, angle, Math.cos(angle) * 0.55);
      leaf.castShadow = true;
      this.scene.add(leaf);
    }
  }
  private roundedBox(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    radius = 0.06,
  ) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)),
      this.material(color, 0.05, 0.48),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private loungeScreen(
    w: number,
    h: number,
    type: "television" | "magazine" | "coffee",
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = type === "magazine" ? 640 : 288;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    gradient.addColorStop(0, "#132e42");
    gradient.addColorStop(1, "#395765");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8cbfc8";
    ctx.fillRect(30, 30, 40, 5);
    ctx.fillStyle = "#eef6f4";
    ctx.font = "600 34px Arial";
    ctx.fillText(type === "magazine" ? "MOTEK / DRIVE" : "MOTEK", 30, 80);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#b8ced5";
    ctx.fillText(
      type === "coffee" ? "CAFÉ · ESPRESSO" : "Bienvenue dans votre garage",
      30,
      119,
    );
    if (type !== "coffee") {
      // Local illustration, not a stream, advertisement or third-party image.
      ctx.fillStyle = "#101d28";
      ctx.beginPath();
      ctx.moveTo(70, 224);
      ctx.lineTo(91, 186);
      ctx.lineTo(179, 180);
      ctx.lineTo(215, 147);
      ctx.lineTo(335, 148);
      ctx.lineTo(379, 181);
      ctx.lineTo(443, 194);
      ctx.lineTo(446, 224);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#6b91a3";
      ctx.beginPath();
      ctx.moveTo(207, 180);
      ctx.lineTo(232, 158);
      ctx.lineTo(323, 158);
      ctx.lineTo(353, 181);
      ctx.closePath();
      ctx.fill();
      for (const x of [139, 383]) {
        ctx.fillStyle = "#0c151c";
        ctx.beginPath();
        ctx.arc(x, 222, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9cabb3";
        ctx.beginPath();
        ctx.arc(x, 222, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      if (type === "magazine") {
        ctx.fillStyle = "#f0ede4";
        ctx.font = "600 32px Arial";
        ctx.fillText("DESIGN & AUTOMOBILE", 30, 325);
        ctx.font = "21px Arial";
        ctx.fillText("Le plaisir de prendre la route", 30, 374);
        ctx.fillStyle = "#91a5ae";
        for (let i = 0; i < 5; i++)
          ctx.fillRect(30, 430 + i * 23, 310 - i * 20, 5);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
    );
  }
  private waitingLounge() {
    const tag: Selection = { kind: "zone", id: "attente" };
    const lounge = new THREE.Group();
    lounge.userData.select = tag;
    this.scene.add(lounge);
    // Two full-size leather sofas share a clear central circulation aisle.
    for (const z of [-4.7, -0.7]) {
      this.furniture.push({ x: -20, z, w: 1.35, d: 3.3 });
      this.roundedBox(lounge, -20, 0.34, z, 1.35, 0.32, 3.3, "#373c3d");
      this.roundedBox(lounge, -20.54, 0.86, z, 0.24, 0.94, 3.3, "#3e4545", 0.1);
      for (const end of [-1, 1]) {
        this.roundedBox(
          lounge,
          -20,
          0.67,
          z + end * 1.52,
          1.35,
          0.58,
          0.25,
          "#454d4c",
          0.09,
        );
        for (const x of [-20.45, -19.55])
          this.cylinder(lounge, x, 0.15, z + end * 1.3, 0.055, 0.23, "#7e888b");
      }
      for (const offset of [-0.93, 0, 0.93]) {
        this.roundedBox(
          lounge,
          -19.96,
          0.57,
          z + offset,
          1.02,
          0.2,
          0.89,
          "#4d5654",
          0.075,
        );
        const cushion = this.roundedBox(
          lounge,
          -20.36,
          0.91,
          z + offset,
          0.23,
          0.63,
          0.89,
          "#48514f",
          0.075,
        );
        cushion.rotation.z = -0.11;
        this.box(
          lounge,
          -19.448,
          0.59,
          z + offset,
          0.008,
          0.015,
          0.73,
          "#69706a",
        );
      }
    }
    // Low table with real thickness, inset metal legs, locally drawn magazines and cups.
    this.furniture.push({ x: -17.8, z: -4.65, w: 1.65, d: 1.25 });
    const table = this.roundedBox(
      lounge,
      -17.8,
      0.49,
      -4.65,
      1.65,
      0.09,
      1.25,
      "#a59073",
      0.07,
    );
    table.material.roughness = 0.35;
    for (const dx of [-0.65, 0.65])
      for (const dz of [-0.45, 0.45])
        this.cylinder(
          lounge,
          -17.8 + dx,
          0.27,
          -4.65 + dz,
          0.025,
          0.43,
          "#303b44",
        );
    for (let i = 0; i < 3; i++) {
      const book = this.roundedBox(
        lounge,
        -18.09 + i * 0.13,
        0.555 + i * 0.018,
        -4.72 + i * 0.03,
        0.3,
        0.017,
        0.4,
        "#e4e1d5",
        0.005,
      );
      book.rotation.y = i * 0.14 - 0.13;
      if (i === 2) {
        const cover = this.loungeScreen(0.295, 0.395, "magazine");
        cover.rotation.set(-Math.PI / 2, 0, -book.rotation.y);
        cover.position.set(
          book.position.x,
          book.position.y + 0.01,
          book.position.z,
        );
        lounge.add(cover);
      }
    }
    for (const x of [-17.38, -17.63]) {
      this.cylinder(lounge, x, 0.55, -4.35, 0.09, 0.015, "#c5c0b4");
      this.cylinder(lounge, x, 0.62, -4.35, 0.058, 0.12, "#e7e2d4");
      this.cylinder(lounge, x, 0.683, -4.35, 0.05, 0.008, "#493429");
    }
    // Coffee station is outside the doorway at the north end of the room.
    this.furniture.push({ x: -20.1, z: -7.28, w: 2.5, d: 0.85 });
    this.roundedBox(
      lounge,
      -20.1,
      0.51,
      -7.28,
      2.5,
      0.94,
      0.85,
      "#67615a",
      0.045,
    );
    this.box(lounge, -20.1, 1, -7.28, 2.6, 0.06, 0.94, "#c1b9a9");
    for (const x of [-20.86, -20.1, -19.34]) {
      this.box(lounge, x, 0.51, -6.849, 0.71, 0.78, 0.013, "#756d62");
      this.box(lounge, x, 0.79, -6.831, 0.24, 0.023, 0.03, "#b9c1c1");
    }
    const coffee = this.roundedBox(
      lounge,
      -20.6,
      1.32,
      -7.24,
      0.72,
      0.58,
      0.54,
      "#273239",
      0.035,
    );
    coffee.material.metalness = 0.75;
    coffee.material.roughness = 0.24;
    this.box(lounge, -20.6, 1.51, -6.958, 0.58, 0.13, 0.024, "#a2b1b7");
    this.box(lounge, -20.6, 1.27, -6.946, 0.5, 0.28, 0.028, "#131a1c");
    this.box(lounge, -20.6, 1.12, -6.891, 0.55, 0.035, 0.15, "#9aabae");
    for (const dx of [-0.12, 0.12]) {
      this.cylinder(lounge, -20.6 + dx, 1.36, -6.896, 0.018, 0.09, "#b9c2c4");
      this.cylinder(lounge, -20.6 + dx, 1.19, -6.886, 0.054, 0.12, "#ede5d4");
    }
    for (let i = 0; i < 4; i++)
      this.cylinder(
        lounge,
        -19.56,
        1.06 + i * 0.065,
        -7.2,
        0.065,
        0.095,
        "#e5dfd4",
      );
    this.roundedBox(
      lounge,
      -19.18,
      1.12,
      -7.2,
      0.2,
      0.18,
      0.25,
      "#b6ab94",
      0.025,
    );
    // Two glazed dispensers: bottles and packaged snacks are decorative, not stock records.
    for (const [index, x] of [-14.3, -12.95].entries()) {
      this.furniture.push({ x, z: -7.2, w: 1.1, d: 0.95 });
      const machine = this.roundedBox(
        lounge,
        x,
        1.08,
        -7.2,
        1.1,
        2.08,
        0.95,
        "#26323b",
        0.075,
      );
      machine.material.metalness = 0.6;
      this.box(lounge, x - 0.09, 1.2, -6.714, 0.72, 1.33, 0.035, "#111c24");
      this.box(lounge, x + 0.43, 1.38, -6.686, 0.12, 0.35, 0.035, "#a7b5b7");
      const screen = this.box(
        lounge,
        x + 0.43,
        1.62,
        -6.676,
        0.12,
        0.13,
        0.025,
        "#52828b",
      );
      screen.material.emissive.set("#366f7d");
      screen.material.emissiveIntensity = 0.6;
      this.box(lounge, x - 0.06, 0.31, -6.687, 0.76, 0.2, 0.04, "#11191f");
      for (let row = 0; row < 3; row++) {
        this.box(
          lounge,
          x - 0.09,
          0.74 + row * 0.4,
          -6.58,
          0.69,
          0.025,
          0.18,
          "#859397",
        );
        for (let col = 0; col < 3; col++) {
          const px = x - 0.31 + col * 0.23,
            y = 0.89 + row * 0.4;
          if (index === 0) {
            this.cylinder(
              lounge,
              px,
              y,
              -6.56,
              0.06,
              0.25,
              col === 1 ? "#aa7054" : "#558284",
            );
            this.cylinder(lounge, px, y + 0.15, -6.56, 0.028, 0.045, "#bec5c0");
          } else
            this.roundedBox(
              lounge,
              px,
              y,
              -6.56,
              0.15,
              0.24,
              0.08,
              ["#b59857", "#796e83", "#7d9a7a"][col],
              0.02,
            );
        }
      }
      const glass = this.box(
        lounge,
        x - 0.09,
        1.23,
        -6.51,
        0.73,
        1.33,
        0.008,
        "#c2e0e0",
      );
      glass.material.transparent = true;
      glass.material.opacity = 0.13;
      glass.material.depthWrite = false;
      glass.material.roughness = 0.12;
    }
    // A wall TV faces the sofas; all screen content is a local static welcome graphic.
    const television = new THREE.Group();
    television.position.set(-12.2, 2.08, -0.6);
    television.rotation.y = -Math.PI / 2;
    lounge.add(television);
    this.roundedBox(television, 0, 0, 0, 1.8, 1.05, 0.08, "#141b20", 0.035);
    const screen = this.loungeScreen(1.7, 0.95, "television");
    screen.position.z = 0.043;
    television.add(screen);
    // Small pendant luminaires. Their mounts stay high and do not seal the cutaway roof.
    for (const z of [-4.7, -0.6]) {
      this.cylinder(lounge, -17.4, 3.48, z, 0.012, 0.8, "#3b444a");
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.22, 28, 1, true),
        this.material("#393d3e", 0.65, 0.25),
      );
      shade.position.set(-17.4, 3.03, z);
      lounge.add(shade);
      const light = this.cylinder(
        lounge,
        -17.4,
        2.94,
        z,
        0.26,
        0.025,
        "#fff0d2",
      );
      light.material.emissive.set("#ffd7a0");
      light.material.emissiveIntensity = 1.1;
    }
    const ambient = new THREE.PointLight("#ffdfb0", 12, 12, 2);
    ambient.position.set(-17.5, 2.85, -3);
    lounge.add(ambient);
    for (const [x, z] of [
      [-21.25, 1.05],
      [-13.15, 1],
      [-21.2, -6.35],
    ])
      this.plant(x, z);
    // Glazed west wall gives a view of the existing site; no second room is created.
    const west = this.scene.children.find(
      (object) =>
        object instanceof THREE.Mesh &&
        object.position.x === -22 &&
        object.userData.occluder,
    ) as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> | undefined;
    if (west) {
      // Preserve the full exterior wall: insert an interior glazing panel instead of deleting it.
      const glazing = this.box(
        lounge,
        -21.85,
        1.8,
        -3.2,
        0.018,
        1.75,
        5.7,
        "#b7d4d8",
      );
      glazing.material.transparent = true;
      glazing.material.opacity = 0.22;
      glazing.material.depthWrite = false;
      for (const z of [-6.05, -3.2, -0.35])
        this.box(lounge, -21.79, 1.8, z, 0.055, 1.85, 0.055, "#45545c");
    }
  }
  private customerAvatar(v: Vehicle, index: number) {
    const avatar = new THREE.Group();
    const seated = index < 6;
    const seats = [-4.7, -0.7, -5.63, 0.23, -3.77, -1.63];
    avatar.position.set(
      seated ? -19.94 : -15.1 + ((index - 6) % 3) * 0.88,
      0,
      seated ? seats[index] : -4.5 + Math.floor((index - 6) / 3) * 1.2,
    );
    avatar.rotation.y = seated ? -Math.PI / 2 : -0.25;
    avatar.userData.select = { kind: "customer", id: v.id };
    avatar.userData.customerAnchor = seated ? 1.83 : 2.12;
    avatar.userData.seated = seated;
    // Neutral illustrative avatar variation is deterministic and carries no personal photo data.
    const variant = [...v.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4;
    const clothes = ["#565850", "#445968", "#8b7561", "#596c66"][variant];
    const skin = ["#ba9278", "#c3a087", "#a47e68", "#d0ac90"][variant];
    const hairColor = ["#38312d", "#514137", "#736554", "#292a2c"][variant];
    const hip = seated ? 0.68 : 0.86;
    const chest = hip + 0.36,
      headY = chest + 0.47;
    const body = this.roundedBox(
      avatar,
      0,
      chest,
      0,
      0.44,
      0.61,
      0.28,
      clothes,
      0.12,
    );
    body.material.roughness = 0.88;
    this.roundedBox(avatar, 0, hip, 0, 0.38, 0.22, 0.28, "#353f49", 0.065);
    this.cylinder(avatar, 0, headY - 0.22, 0, 0.065, 0.15, skin);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 16),
      this.material(skin, 0, 0.87),
    );
    head.scale.set(0.133, 0.18, 0.137);
    head.position.set(0, headY, -0.006);
    head.userData.select = { kind: "customer", id: v.id, detail: true };
    avatar.add(head);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      this.material(hairColor, 0, 0.97),
    );
    hair.scale.set(0.139, 0.184, 0.144);
    hair.position.set(0, headY + 0.009, 0.003);
    hair.userData.select = { kind: "customer", id: v.id, detail: true };
    avatar.add(hair);
    const limb = (
      a: [number, number, number],
      b: [number, number, number],
      radius: number,
      color: string,
    ) => {
      const start = new THREE.Vector3(...a),
        end = new THREE.Vector3(...b);
      const direction = end.clone().sub(start);
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(
          radius,
          Math.max(0.01, direction.length() - 2 * radius),
          4,
          10,
        ),
        this.material(color, 0, 0.9),
      );
      mesh.position.copy(start.add(end).multiplyScalar(0.5));
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
      );
      avatar.add(mesh);
    };
    for (const side of [-1, 1]) {
      const knee: [number, number, number] = seated
        ? [side * 0.115, 0.6, -0.39]
        : [side * 0.105, 0.47, 0.02];
      limb([side * 0.11, hip, 0], knee, 0.082, "#353f49");
      limb(knee, [side * 0.115, 0.16, seated ? -0.43 : 0], 0.068, "#353f49");
      this.roundedBox(
        avatar,
        side * 0.115,
        0.1,
        seated ? -0.48 : -0.055,
        0.16,
        0.13,
        0.3,
        "#262c30",
        0.05,
      );
      const elbow: [number, number, number] = [
        side * 0.255,
        chest - 0.16,
        seated ? -0.12 : 0.035,
      ];
      const hand: [number, number, number] = [
        side * 0.16,
        seated ? hip + 0.11 : hip - 0.12,
        seated ? -0.29 : 0.01,
      ];
      limb([side * 0.23, chest + 0.22, 0], elbow, 0.064, clothes);
      limb(elbow, hand, 0.052, clothes);
      const palm = new THREE.Mesh(
        new THREE.SphereGeometry(1, 10, 8),
        this.material(skin, 0, 0.9),
      );
      palm.position.set(...hand);
      palm.scale.set(0.045, 0.07, 0.032);
      avatar.add(palm);
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 8, 6),
        this.material("#303337"),
      );
      eye.position.set(side * 0.05, headY + 0.025, -0.131);
      avatar.add(eye);
      const ear = new THREE.Mesh(
        new THREE.SphereGeometry(1, 10, 8),
        this.material(skin),
      );
      ear.scale.set(0.025, 0.045, 0.03);
      ear.position.set(side * 0.13, headY, 0);
      avatar.add(ear);
      const collar = this.roundedBox(
        avatar,
        side * 0.055,
        chest + 0.27,
        -0.145,
        0.09,
        0.13,
        0.02,
        "#d8d9d1",
        0.006,
      );
      collar.rotation.z = side * -0.36;
    }
    this.roundedBox(
      avatar,
      0,
      chest - 0.015,
      -0.149,
      0.012,
      0.44,
      0.009,
      "#919993",
      0.003,
    );
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(1, 10, 8),
      this.material(skin),
    );
    nose.scale.set(0.028, 0.038, 0.035);
    nose.position.set(0, headY - 0.008, -0.135);
    avatar.add(nose);
    if (seated && index % 2 === 0) {
      const phone = this.roundedBox(
        avatar,
        0.05,
        hip + 0.15,
        -0.32,
        0.085,
        0.015,
        0.155,
        "#192a37",
        0.008,
      );
      phone.rotation.x = -0.16;
    }
    avatar.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return avatar;
  }
  /** Screen anchors share the same CRM vehicle IDs as the customer panels. */
  projectCustomers(): { id: string; x: number; y: number; visible: boolean }[] {
    const { width, height } = this.renderer.domElement.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    const inLounge =
      this.controls.target.x < -12 &&
      this.controls.target.z > -9 &&
      this.controls.target.z < 3;
    return this.cars.children
      .filter((object) => object.userData.select?.kind === "customer")
      .map((object) => {
        const point = object
          .localToWorld(
            new THREE.Vector3(0, object.userData.customerAnchor || 2.1, 0),
          )
          .project(this.camera);
        return {
          id: object.userData.select.id,
          x: (point.x * 0.5 + 0.5) * width,
          y: (-point.y * 0.5 + 0.5) * height,
          visible:
            (this.mode === "overview" || (this.mode === "free" && inLounge)) &&
            point.z > -1 &&
            point.z < 1 &&
            Math.abs(point.x) < 1 &&
            Math.abs(point.y) < 1,
        };
      });
  }
  setSelectedCustomer(id: string | null) {
    this.selectedCustomer = id;
    this.clear(this.customerHighlight);
    const customer = this.cars.children.find(
      (object) =>
        object.userData.select?.kind === "customer" &&
        object.userData.select.id === id,
    );
    if (!customer) return;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.39, 0.46, 48),
      new THREE.MeshBasicMaterial({
        color: "#64b5ff",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(customer.position);
    ring.position.y = 0.09;
    if (customer.userData.seated) ring.position.x += 0.4;
    ring.renderOrder = 4;
    this.customerHighlight.add(ring);
  }
  private roomDetails() {
    // Metal workbench and pegboard in the parts room.
    this.solid(17, -17, 4, 0.85, 0.85, "#374650", {
      kind: "stock",
      id: "tools",
    });
    const bench = this.box(
      this.scene,
      17,
      0.9,
      -17,
      4.1,
      0.09,
      0.95,
      "#a1a9aa",
    );
    bench.material.metalness = 0.8;
    this.box(this.scene, 17, 1.63, -17.39, 4.1, 1.15, 0.06, "#26343e");
    for (let i = 0; i < 9; i++) {
      const tool = this.box(
        this.scene,
        15.3 + i * 0.42,
        1.63,
        -17.33,
        0.035,
        0.4 + (i % 3) * 0.1,
        0.035,
        "#b9c2c6",
        { kind: "stock", id: "tools" },
      );
      tool.material.metalness = 0.85;
    }
    // Loose tire rack and compressor are kept out of the walking aisles.
    for (let i = 0; i < 4; i++) {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.12, 10, 24),
        this.material("#202629", 0, 0.91),
      );
      tire.position.set(20.9, 0.45 + i * 0.23, -19.2);
      tire.rotation.x = Math.PI / 2;
      tire.userData.select = { kind: "stock", id: "tires" };
      tire.castShadow = true;
      this.scene.add(tire);
    }
    // Linear drain channels; repeated floor texture is applied per slab in metres.
    for (const x of [-10.8, 10.8]) {
      this.box(this.scene, x, 0.082, -30, 0.22, 0.01, 39, "#333e46");
      for (let z = -49; z < -10; z += 0.7)
        this.box(this.scene, x, 0.091, z, 0.2, 0.008, 0.035, "#738087");
    }
    this.scene.traverse((object) => {
      if (
        !(object instanceof THREE.Mesh) ||
        !(object.geometry instanceof THREE.BoxGeometry)
      )
        return;
      const { width, height, depth } = object.geometry.parameters;
      if (
        width < 2 ||
        depth < 2 ||
        height > 0.15 ||
        object.position.y > 0.075 ||
        object.position.y < -0.02
      )
        return;
      const material = object.material as THREE.MeshStandardMaterial;
      const texture = this.floorTexture!.clone();
      texture.repeat.set(width / 2, depth / 2);
      texture.needsUpdate = true;
      material.map = texture;
      material.metalness = 0.18;
      material.roughness = 0.48;
      material.needsUpdate = true;
    });
  }
  private pendant(x: number, z: number, width: number) {
    const fixture = new THREE.Group();
    fixture.name = "suspended-worklight";
    this.scene.add(fixture);
    for (const offset of [-width * 0.37, width * 0.37])
      this.cylinder(fixture, x + offset, 4.8, z, 0.009, 1.1, "#677176");
    const housing = this.roundedBox(
      fixture,
      x,
      4.22,
      z,
      width,
      0.1,
      0.24,
      "#39454d",
      0.035,
    );
    housing.material.metalness = 0.65;
    const diffuser = this.box(
      fixture,
      x,
      4.16,
      z,
      width - 0.12,
      0.018,
      0.17,
      "#f0f4eb",
    );
    diffuser.material.emissive.set("#d9e8f3");
    diffuser.material.emissiveIntensity = 1.5;
  }
  private officeWorkstations() {
    // Three workstations remain within the existing office and its existing doorways.
    const desks = [
      { x: -20, z: -14, title: "DIRECTION" },
      { x: -14.5, z: -15.4, title: "SECRÉTARIAT" },
      { x: -20, z: -10.2, title: "COMPTABILITÉ" },
    ];
    const tag: Selection = { kind: "office", id: "office" };
    for (const { x, z, title } of desks) {
      const desk = new THREE.Group();
      desk.userData.select = tag;
      this.scene.add(desk);
      this.furniture.push({ x, z, w: 2.3, d: 1.1 });
      const top = this.roundedBox(
        desk,
        x,
        0.8,
        z,
        2.3,
        0.08,
        1.1,
        "#a4947d",
        0.025,
      );
      top.material.roughness = 0.4;
      for (const dx of [-0.94, 0.94])
        this.box(desk, x + dx, 0.4, z, 0.055, 0.76, 0.85, "#455159");
      this.roundedBox(
        desk,
        x + 0.76,
        0.42,
        z,
        0.58,
        0.66,
        0.76,
        "#d1d5d2",
        0.03,
      );
      for (let row = 0; row < 3; row++)
        this.box(
          desk,
          x + 0.76,
          0.23 + row * 0.2,
          z + 0.389,
          0.22,
          0.018,
          0.02,
          "#54616a",
        );
      this.roundedBox(
        desk,
        x - 0.18,
        1.2,
        z - 0.22,
        0.8,
        0.5,
        0.055,
        "#222e36",
        0.025,
      );
      const screen = this.box(
        desk,
        x - 0.18,
        1.2,
        z - 0.187,
        0.73,
        0.43,
        0.012,
        "#567b8d",
      );
      screen.material.emissive.set("#27495a");
      screen.material.emissiveIntensity = 0.25;
      this.box(desk, x - 0.18, 0.94, z - 0.22, 0.045, 0.24, 0.05, "#62717b");
      this.roundedBox(
        desk,
        x - 0.18,
        0.858,
        z + 0.18,
        0.5,
        0.025,
        0.2,
        "#3a454e",
        0.012,
      );
      this.roundedBox(
        desk,
        x + 0.17,
        0.86,
        z + 0.18,
        0.065,
        0.03,
        0.1,
        "#3a454e",
        0.02,
      );
      for (let sheet = 0; sheet < 3; sheet++) {
        const paper = this.box(
          desk,
          x - 0.82,
          0.85 + sheet * 0.004,
          z + 0.12,
          0.25,
          0.003,
          0.34,
          "#e4e6de",
        );
        paper.rotation.y = sheet * 0.09;
      }
      this.cylinder(desk, x + 0.9, 0.96, z - 0.3, 0.055, 0.22, "#5a6b72");
      const chairZ = z + 1;
      this.furniture.push({ x: x - 0.18, z: chairZ, w: 0.6, d: 0.64 });
      this.cylinder(desk, x - 0.18, 0.3, chairZ, 0.045, 0.43, "#a1acb0");
      this.roundedBox(
        desk,
        x - 0.18,
        0.56,
        chairZ,
        0.58,
        0.13,
        0.55,
        "#35424b",
        0.065,
      );
      this.roundedBox(
        desk,
        x - 0.18,
        0.91,
        chairZ + 0.24,
        0.56,
        0.66,
        0.1,
        "#35424b",
        0.055,
      );
      for (let spoke = 0; spoke < 5; spoke++) {
        const leg = this.box(
          desk,
          x - 0.18,
          0.12,
          chairZ,
          0.045,
          0.04,
          0.64,
          "#7a858c",
        );
        leg.rotation.y = (spoke * Math.PI) / 5;
      }
      // Low glazed privacy panels preserve sightlines through the existing shared room.
      const partition = this.box(
        desk,
        x,
        1.2,
        z - 0.65,
        2.45,
        2.25,
        0.035,
        "#bdd3d7",
      );
      partition.material.transparent = true;
      partition.material.opacity = 0.18;
      partition.material.depthWrite = false;
      partition.material.roughness = 0.18;
      for (const dx of [-1.23, 1.23])
        this.box(desk, x + dx, 1.2, z - 0.65, 0.045, 2.3, 0.065, "#53616a");
      this.furniture.push({ x, z: z - 0.65, w: 2.5, d: 0.08 });
      const sign = this.label(title, x, 2.45, z - 0.65, 2.5);
      sign.userData.select = tag;
    }
  }
  private wheelStorage() {
    const rack = new THREE.Group();
    rack.userData.select = { kind: "stock", id: "tires" };
    this.scene.add(rack);
    const x = 17,
      z = -7.65;
    this.furniture.push({ x, z, w: 4.05, d: 0.9 });
    for (const dx of [-1.97, 1.97])
      for (const dz of [-0.4, 0.4])
        this.box(rack, x + dx, 1.15, z + dz, 0.065, 2.3, 0.065, "#34434d");
    for (const y of [0.2, 1.15, 2.2]) {
      for (const dz of [-0.36, 0.36])
        this.box(rack, x, y, z + dz, 4, 0.055, 0.055, "#657985");
    }
    for (let row = 0; row < 2; row++) {
      for (let slot = 0; slot < 5; slot++) {
        const wheel = new THREE.Group();
        wheel.position.set(x - 1.55 + slot * 0.78, 0.65 + row * 0.95, z);
        rack.add(wheel);
        const tire = new THREE.Mesh(
          new THREE.TorusGeometry(0.295, 0.105, 10, 24),
          this.material("#20282e", 0, 0.9),
        );
        tire.castShadow = true;
        wheel.add(tire);
        if (row === 1) {
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(0.245, 0.025, 8, 24),
            this.material("#b8c3c8", 0.9, 0.24),
          );
          rim.position.z = 0.075;
          wheel.add(rim);
          for (let spoke = 0; spoke < 5; spoke++) {
            const metal = this.box(
              wheel,
              0,
              0,
              0.075,
              0.04,
              0.46,
              0.035,
              "#b8c3c8",
            );
            metal.material.metalness = 0.9;
            metal.material.roughness = 0.23;
            metal.rotation.z = (spoke * Math.PI) / 5;
          }
          const hub = this.cylinder(wheel, 0, 0, 0.08, 0.055, 0.04, "#71818b");
          hub.rotation.x = Math.PI / 2;
        }
      }
    }
    const label = this.label("PNEUS · JANTES", x, 2.5, z, 3);
    label.userData.select = { kind: "stock", id: "tires" };
  }
  private paintBooth() {
    const tag: Selection = { kind: "zone", id: "carrosserie" };
    const shell = new THREE.Group();
    shell.userData.select = tag;
    this.scene.add(shell);
    const x = 19.1,
      z = 0;
    const back = this.solid(x, z - 3.45, 4.8, 0.16, 3.05, "#e5e7e1", tag);
    back.material.roughness = 0.44;
    for (const side of [-1, 1]) {
      const panel = this.solid(
        x + side * 2.3,
        z,
        0.14,
        6.9,
        3.05,
        "#e5e7e1",
        tag,
      );
      panel.material.roughness = 0.44;
      for (const zz of [-2.3, -0.7, 0.9, 2.5]) {
        this.box(
          shell,
          x + side * 2.21,
          1.55,
          zz,
          0.018,
          2.65,
          0.027,
          "#a8b4b8",
        );
        const strip = this.box(
          shell,
          x + side * 2.2,
          2.55,
          zz - 0.33,
          0.028,
          0.26,
          1.05,
          "#eef5ee",
        );
        strip.material.emissive.set("#e7f1f4");
        strip.material.emissiveIntensity = 0.8;
      }
    }
    this.box(shell, x, 0.095, z, 4.3, 0.055, 6.7, "#46545c");
    for (let n = 0; n < 24; n++)
      this.box(shell, x, 0.13, -3.18 + n * 0.275, 3.9, 0.018, 0.045, "#8a979c");
    this.box(shell, x, 2.94, z + 3.4, 4.8, 0.24, 0.22, "#c9d0ce");
    // A folded door on either side leaves the centre entrance clear and visible.
    for (const side of [-1, 1]) {
      const door = new THREE.Group();
      door.position.set(x + side * 1.8, 0, z + 3.4);
      door.rotation.y = side * 0.42;
      shell.add(door);
      this.box(door, 0, 1.45, 0, 0.78, 2.85, 0.075, "#dfe4df");
      const glass = this.box(door, 0, 1.7, 0.045, 0.55, 1.15, 0.016, "#7998a0");
      glass.material.metalness = 0.3;
      glass.material.roughness = 0.16;
      this.box(door, -side * 0.24, 1.14, 0.09, 0.025, 0.25, 0.035, "#65777e");
    }
    this.box(shell, x, 2.65, -3.35, 2.8, 0.4, 0.04, "#9daaad");
    for (let n = 0; n < 11; n++)
      this.box(
        shell,
        x - 1.25 + n * 0.25,
        2.65,
        -3.32,
        0.026,
        0.3,
        0.025,
        "#4d6069",
      );
    this.pendant(x, z, 3.1);
    const sign = this.label("CABINE PEINTURE", x, 3.4, z + 3.4, 3.5);
    sign.userData.select = tag;
  }
  private build() {
    this.box(this.scene, 0, -0.34, -12, 110, 0.4, 140, "#303a42");
    this.box(
      this.scene,
      0,
      -0.015,
      (18 - this.depth) / 2,
      44,
      0.12,
      18 + this.depth,
      palette.floor,
    );
    this.industrialFloor();
    this.box(this.scene, 0, -0.01, 24, 44, 0.1, 12, "#3d474e");
    zones
      .filter((z) => this.layout.waitingRoom || z.id !== "attente")
      .forEach((zone) => {
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
              ? "#606b72"
              : zone.id === "carrosserie"
                ? "#78848b"
                : "#8b8b85",
            { kind: "zone", id: zone.id },
          );
      });
    this.box(this.scene, 0, 0.057, -30, 23, 0.015, 40, "#596269", {
      kind: "zone",
      id: "atelier",
    });
    this.box(this.scene, -7, 0.059, -30, 5, 0.012, 40, "#4c565d", {
      kind: "zone",
      id: "parking",
    });
    this.activeWalls().forEach((b) => {
      const wall = this.box(
        this.scene,
        b.x,
        1.45,
        b.z,
        b.w,
        2.9,
        b.d,
        palette.wall,
      );
      wall.userData.occluder = true;
      if (
        b.z === 18 ||
        (b.x === -12 && b.z > -18) ||
        (b.x < -12 && (b.z === -8 || b.z === 2))
      ) {
        wall.material = new THREE.MeshPhysicalMaterial({
          color: "#c3dce1",
          transparent: true,
          opacity: 0.22,
          roughness: 0.15,
          depthWrite: false,
          metalness: 0.18,
        });
        this.glassFrame(b);
      }
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
      const [x, z] = bayPosition(i, this.layout);
      this.box(this.scene, x, 0.061, z, 5, 0.025, 4.6, "#4b555d");
      for (const edge of [-2.45, 2.45])
        this.box(this.scene, x + edge, 0.08, z, 0.06, 0.02, 4.6, "#d6ad5d");
      const tag: Selection = { kind: "bay", id: String(i) };
      for (const dx of [-1.65, 1.65]) {
        const post = this.solid(x + dx, z, 0.32, 0.6, 3.1, "#a93035", tag);
        // Lift machinery must remain complete. Only architectural walls use cutaway occlusion.
        post.userData.occluder = false;
        post.material.metalness = 0.55;
        post.material.roughness = 0.3;
        this.box(this.scene, x + dx, 0.08, z, 0.65, 0.1, 0.85, "#20262b", tag);
        this.box(
          this.scene,
          x + dx,
          1.5,
          z - 0.31,
          0.12,
          2.5,
          0.04,
          "#bac2c5",
          tag,
        );
        this.box(
          this.scene,
          x + dx,
          1.15,
          z + 0.33,
          0.24,
          0.3,
          0.12,
          "#252d32",
          tag,
        );
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
      for (const side of [-1, 1])
        for (const end of [-1, 1]) {
          const arm = this.box(
            lift,
            side * 1.08,
            0.2,
            end * 0.75,
            1.1,
            0.12,
            0.2,
            "#636f76",
            tag,
          );
          arm.rotation.y = side * end * 0.32;
          this.cylinder(
            lift,
            side * 0.65,
            0.31,
            end * 0.91,
            0.16,
            0.12,
            "#242a2e",
          );
        }
      for (const end of [-1, 1])
        this.box(
          this.scene,
          x,
          0.082,
          z + end * 2.3,
          4.95,
          0.012,
          0.045,
          "#d6ad5d",
        );
      this.scene.add(lift);
      this.liftGroups.set(i, lift);
      this.pendant(x, z, 3.25);
      this.label(`POSTE ${String(i).padStart(2, "0")}`, x, 3.8, z, 2.3);
      this.toolCabinet(x + (x < 0 ? -3 : 3), z + 1.5);
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
    if (this.layout.waitingRoom) this.waitingLounge();
    this.officeWorkstations();
    // Decorative reception staff: no customer presence or CRM record is invented.
    for (const [index, x] of [-19.2, -16.8].entries()) {
      const reception = this.person("Accueil", x, 6, "customer", false);
      reception.rotation.y = Math.PI;
      reception.userData.select = { kind: "reception", id: "reception" };
      if (index === 1) {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(1, 16, 12),
          this.material("#43342e", 0, 0.94),
        );
        hair.position.set(0, 1.53, 0.085);
        hair.scale.set(0.153, 0.235, 0.12);
        reception.add(hair);
      }
      this.scene.add(reception);
    }
    this.label("ACCUEIL · RÉCEPTION CLIENTS", -18, 2.4, 7.5, 4);
    this.box(this.scene, -18, 0.5, 8.14, 4.7, 0.7, 0.08, "#315e7b", {
      kind: "reception",
      id: "reception",
    });
    // Stock shelves with separately selectable reference boxes.
    for (const x of [14, 20])
      for (const z of [-15, -10]) {
        this.furniture.push({ x, z, w: 1.1, d: 3 });
        for (const side of [-1, 1])
          for (const end of [-1, 1]) {
            const upright = this.box(
              this.scene,
              x + side * 0.53,
              1.23,
              z + end * 1.45,
              0.075,
              2.45,
              0.075,
              "#27343e",
              { kind: "stock", id: "shelf" },
            );
            upright.material.metalness = 0.75;
          }
        for (let row = 0; row < 3; row++) {
          this.box(
            this.scene,
            x,
            0.45 + row * 0.6,
            z,
            1.2,
            0.08,
            3.1,
            "#828c93",
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
    this.paintBooth();
    this.wheelStorage();
    this.solid(21, 17, 1.3, 2, 0.9, palette.wood, {
      kind: "delivery",
      id: "delivery",
    });
    // Porto reference: a glazed frontage, two distinct showrooms and a rear workshop.
    this.label(
      this.layout.leftBrand.toUpperCase(),
      -7,
      3.8,
      15,
      5,
      "#eef2ef",
      "#303a40",
    );
    this.label(
      this.layout.rightBrand.toUpperCase(),
      7,
      3.8,
      15,
      5,
      "#eef2ef",
      "#22493e",
    );
    for (const x of [-19, -14, -9, -4, 4, 9, 14, 19]) {
      const pane = this.box(this.scene, x, 1.6, 18, 4.5, 3.2, 0.08, "#c4dddd");
      pane.material = new THREE.MeshPhysicalMaterial({
        color: "#b9d6db",
        transparent: true,
        opacity: 0.18,
        roughness: 0.12,
        metalness: 0.1,
        depthWrite: false,
      });
      this.box(this.scene, x + 2.35, 1.7, 18, 0.18, 3.4, 0.3, "#5f676b");
    }
    for (let i = 0; i < 8; i++) {
      const z = -12 - i * (this.layout.workshopSpacing || 5);
      this.box(this.scene, -7, 0.064, z, 4.5, 0.02, 4.6, "#505b63");
      this.box(this.scene, -9.3, 0.085, z, 0.06, 0.02, 4.6, "#e8ece6");
      this.label(`PARC ${i + 1}`, -7, 0.4, z + 2, 1.5);
    }
    const roof = new THREE.Group();
    roof.userData.overhead = true;
    this.scene.add(roof);
    // Architectural beams, high windows and practical strip lights.
    for (const z of [-48, -40, -32, -24, -16, -8, 0, 8, 16]) {
      this.box(roof, 0, 5.5, z, 44, 0.15, 0.18, "#3d4953");
      for (const x of [-10, 10]) {
        const strip = this.box(roof, x, 5.4, z, 6, 0.06, 0.2, "#fffbe9");
        strip.material.emissive.set("#dceaff");
        strip.material.emissiveIntensity = 2;
      }
    }
    for (const x of [-21.8, 21.8])
      for (const z of [-13, -3, 9]) {
        this.box(this.scene, x, 2, z, 0.04, 1.15, 3, "#b5d2d2");
      }
    for (const x of [-18, -9, 0, 9, 18]) {
      this.box(this.scene, x, 0.06, 24, 0.08, 0.02, 9, "#d7dacc");
    }
    for (const [x, z] of [
      [-20, 13],
      [-14, 1],
      [-14, -16],
      [20, 15],
    ])
      this.plant(x, z);
    this.roomDetails();
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
  update(
    vehicles: Vehicle[],
    disabled: string[] = [],
    live: Record<
      string,
      { blocked?: boolean; runningSince?: string | null }
    > = {},
    demo = false,
    waiting: Vehicle[] = [],
  ) {
    const generation = ++this.generation;
    this.assetDisabled = disabled;
    this.currentCars = vehicles;
    this.clear(this.cars);
    this.wheelObjects.clear();
    vehicles.filter(isPresent).forEach((v) => {
      const [x, z] = vehiclePosition(v, vehicles, this.layout);
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
    const represented = new Set(
      vehicles.filter((v) => isPresent(v) && v.bay).map((v) => v.technician),
    );
    team
      .filter((t) => !represented.has(t.name))
      .forEach((t, i) => {
        const position =
          t.department === "Carrosserie"
            ? [15, 2]
            : t.department === "Pneumatiques"
              ? [1, 6]
              : t.department === "Vitrage"
                ? [-16, 6]
                : [-17, -12 + i];
        this.cars.add(this.person(t.name, position[0], position[1]));
      });
    vehicles.filter(isPresent).forEach((v) => {
      const [x, z] = vehiclePosition(v, vehicles, this.layout);
      const vehicleLabel = this.label(
        v.plate + " · " + (live[v.id]?.blocked ? "Bloqué" : v.status),
        x,
        2.65,
        z,
        3,
        live[v.id]?.blocked || v.status === "En intervention"
          ? "#a42d3b"
          : v.status === "Prêt à livrer"
            ? "#127348"
            : v.status === "Devis à valider"
              ? "#935500"
              : "#385965",
        live[v.id]?.blocked || v.status === "En intervention"
          ? "#ffe3e7"
          : v.status === "Prêt à livrer"
            ? "#dff8e8"
            : v.status === "Devis à valider"
              ? "#fff0ca"
              : "#f6faf4",
        this.cars,
      );
      vehicleLabel.userData.vehicleLabel = v.id;
      vehicleLabel.userData.select = { kind: "vehicle", id: v.id };
    });
    if (this.layout.waitingRoom) {
      const seen = new Set<string>();
      waiting
        .filter(
          (v) =>
            vehicles.some((record) => record.id === v.id) &&
            !seen.has(v.id) &&
            !!seen.add(v.id),
        )
        .forEach((v, index) => {
          this.cars.add(this.customerAvatar(v, index));
        });
    }
    if (demo) {
      demoShowroom.forEach((v, i) => {
        const proxy = {
          ...vehicles[0],
          ...v,
          shape: "suv",
          plate: "SHOWROOM",
          status: "Réception",
        } as Vehicle;
        const group = this.car(proxy, i === 2 ? -7 : 4 + i * 5, 14, true);
        group.userData.select = { kind: "inventory", id: v.id };
        group.traverse((o) => {
          if (o.userData.select)
            o.userData.select = { kind: "inventory", id: v.id };
        });
        this.cars.add(group);
        const showroomAssetId = "kenney-suv-luxury";
        if (!this.assetDisabled.includes(showroomAssetId)) {
          const fallback = [...group.children];
          group.userData.fallback = fallback;
          loadVehicleAsset(showroomAssetId)
            .then((asset) => {
              if (this.disposed || generation !== this.generation) {
                disposeObject(asset);
                return;
              }
              asset.traverse((object) => {
                object.userData.select = { kind: "inventory", id: v.id };
              });
              group.add(asset);
              group.userData.asset = asset;
              fallback.forEach((object) => {
                object.visible = false;
              });
            })
            .catch(() => {
              // The existing selectable procedural representation remains available.
            });
        }
      });
    }
    this.setSelected(this.selected);
    this.setSelectedCustomer(this.selectedCustomer);
    this.setFocusIds(this.cohortIDs);
  }
  private person(
    name: string,
    x: number,
    z: number,
    kind: "technician" | "customer" = "technician",
    showBadge = true,
  ) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.select = { kind, id: name };
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.57, 18),
      this.material("#38596d"),
    );
    torso.position.set(0, 1.05, 0);
    torso.castShadow = true;
    g.add(torso);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 20, 16),
      this.material("#c7a488"),
    );
    head.position.set(0, 1.52, 0);
    head.scale.set(0.9, 1.15, 0.94);
    head.castShadow = true;
    g.add(head);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.085, 0.53, 6, 12),
        this.material("#2b3b46"),
      );
      leg.position.set(side * 0.12, 0.44, 0);
      g.add(leg);
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.065, 0.39, 6, 12),
        this.material("#38596d"),
      );
      arm.position.set(side * 0.29, 1.02, 0.02);
      arm.rotation.z = side * 0.13;
      g.add(arm);
      this.box(g, side * 0.12, 0.08, -0.06, 0.2, 0.14, 0.31, "#27323a");
    }
    const uniform = team.find((t) => t.name === name)?.color || "#355b78";
    g.children.forEach((o) => {
      if (
        o instanceof THREE.Mesh &&
        o.geometry instanceof THREE.CapsuleGeometry &&
        o.position.y > 0.8
      )
        (o.material as THREE.MeshStandardMaterial).color.set(uniform);
    });
    const torsoMesh = g.children[0] as THREE.Mesh;
    torsoMesh.scale.set(1.12, 1.2, 0.82);
    (torsoMesh.material as THREE.MeshStandardMaterial).color.set(uniform);
    this.cylinder(g, 0, 1.39, 0, 0.08, 0.12, "#c7a488");
    this.box(g, 0, 1.51, -0.14, 0.06, 0.07, 0.055, "#bc967e");
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 8, 6),
        this.material("#313b40"),
      );
      eye.position.set(side * 0.059, 1.56, -0.142);
      g.add(eye);
      this.box(g, side * 0.105, 1.1, -0.19, 0.12, 0.12, 0.026, uniform);
    }
    this.box(g, 0, 0.83, 0, 0.45, 0.04, 0.35, "#26333c");
    // A fitted cap, ears, hands and contrasting workwear details.
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.148, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      this.material(kind === "technician" ? uniform : "#51453c", 0, 0.95),
    );
    cap.position.set(0, 1.62, 0);
    cap.scale.set(1, 0.52, 0.95);
    g.add(cap);
    if (kind === "technician") {
      const brim = new THREE.Mesh(
        new THREE.SphereGeometry(1, 14, 8),
        this.material(uniform),
      );
      brim.position.set(0, 1.625, -0.12);
      brim.scale.set(0.14, 0.013, 0.12);
      g.add(brim);
    }
    for (const side of [-1, 1]) {
      this.box(g, side * 0.15, 1.52, 0, 0.035, 0.09, 0.06, "#c7a488");
      this.box(
        g,
        side * 0.31,
        0.76,
        0.03,
        0.09,
        0.11,
        0.09,
        kind === "technician" ? "#d1ac61" : "#c7a488",
      );
    }
    this.box(g, 0, 1.05, -0.21, 0.015, 0.48, 0.012, "#ccd4d8");
    if (kind === "technician") {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 160;
      const context = canvas.getContext("2d")!;
      context.fillStyle = uniform;
      context.fillRect(0, 0, 512, 160);
      context.fillStyle = "#ffffff";
      context.font = "bold 70px Arial";
      context.textAlign = "center";
      context.fillText(name.toUpperCase(), 256, 103);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(0.49, 0.16),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
      );
      back.position.set(0, 1.23, 0.205);
      g.add(back);
    }
    if (showBadge) {
      const badge = this.label(
        name,
        x,
        2.05,
        z,
        1.6,
        "#23465b",
        "#ffffff",
        this.cars,
      );
      badge.userData.select = { kind, id: name };
    }
    return g;
  }
  focusEntity(kind: Selection["kind"], id: string) {
    const object = this.cars.children.find(
      (o) =>
        o instanceof THREE.Group &&
        o.userData.select?.kind === kind &&
        o.userData.select?.id === id,
    );
    if (!object) return;
    const start = this.camera.position.clone(),
      target = this.controls.target.clone();
    this.setMode("free");
    this.camera.position.copy(start);
    this.controls.target.copy(target);
    if (kind === "customer") this.setSelectedCustomer(id);
    const view = vehicleView(
      object.position.x,
      object.position.z,
      this.camera.aspect,
    );
    this.cameraFlight =
      kind === "inventory"
        ? {
            position: new THREE.Vector3(...view.position),
            target: new THREE.Vector3(...view.target),
          }
        : {
            position: object.position.clone().add(new THREE.Vector3(3, 3, 5)),
            target: object.position.clone().add(new THREE.Vector3(0, 1, 0)),
          };
    if (this.reduced) {
      this.camera.position.copy(this.cameraFlight.position);
      this.controls.target.copy(this.cameraFlight.target);
      this.cameraFlight = null;
      this.controls.update();
    }
  }
  private boxes() {
    return [
      ...this.activeWalls(),
      ...this.furniture,

      ...this.currentCars.filter(isPresent).map((v) => {
        const [x, z] = vehiclePosition(v, this.currentCars, this.layout);
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
    if (!id) this.focusedVehicle = null;
    this.clear(this.highlight);
    if (!id) return;
    const v = this.currentCars.find((v) => v.id === id);
    if (!v) return;
    const [x, z] = vehiclePosition(v, this.currentCars, this.layout);
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 2.41, 80),
      new THREE.MeshBasicMaterial({ color: "#326e95", side: THREE.DoubleSide }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.09, z);
    this.highlight.add(mesh);
  }
  setFocusIds(ids: string[]) {
    this.cohortIDs = ids;
    this.clear(this.cohortHighlight);
    for (const id of ids) {
      const v = this.currentCars.find((v) => v.id === id && isPresent(v));
      if (!v) continue;
      const [x, z] = vehiclePosition(v, this.currentCars, this.layout);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.35, 2.44, 64),
        new THREE.MeshBasicMaterial({
          color: "#599678",
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.1, z);
      this.cohortHighlight.add(ring);
    }
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
      this.focusedVehicle = id;
      this.camera.position.set(car.position.x - 5, 2.7, car.position.z - 3.8);
      this.controls.target.set(car.position.x - 1, 0.6, car.position.z - 1.2);
      this.controls.update();
    }
  }
  focusVehicle(id: string, rear = false) {
    const vehicle = this.currentCars.find((v) => v.id === id);
    if (!vehicle || !isPresent(vehicle)) return;
    const [x, z] = vehiclePosition(vehicle, this.currentCars, this.layout);
    const start = this.camera.position.clone();
    const target = this.controls.target.clone();
    this.setMode("free");
    this.camera.position.copy(start);
    this.controls.target.copy(target);
    this.focusedVehicle = id;
    this.focusRear = rear;
    const view = vehicleView(x, z, this.camera.aspect, rear);
    this.controls.maxDistance = Math.max(18, 8 / this.camera.aspect);
    this.cameraFlight = {
      position: new THREE.Vector3(...view.position),
      target: new THREE.Vector3(...view.target),
    };
    if (this.reduced) {
      this.camera.position.copy(this.cameraFlight.position);
      this.controls.target.copy(this.cameraFlight.target);
      this.cameraFlight = null;
      this.controls.update();
    }
  }
  setMode(mode: Mode) {
    this.cameraFlight = null;
    this.focusedVehicle = null;
    this.controls.maxDistance = mode === "overview" ? 120 : 85;
    this.path = [];
    if (document.pointerLockElement) document.exitPointerLock();
    this.mode = mode;
    this.setSelectedCustomer(null);
    this.controls.enabled = true;
    this.keys.clear();
    if (mode === "overview") {
      const scale = Math.max(1, 1.3 / Math.max(this.camera.aspect, 0.35));
      this.camera.position.set(37 * scale, 46 * scale, -13 + 57 * scale);
      this.controls.target.set(0, 0, -13);
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
    if (this.mode !== "walk") {
      const start = this.camera.position.clone();
      const target = this.controls.target.clone();
      this.setMode("free");
      this.camera.position.copy(start);
      this.controls.target.copy(target);
      const framing = zoneView(
        zoneId,
        zone.x,
        zone.z,
        this.camera.aspect,
        this.depth,
      );
      this.controls.maxDistance = 150;
      this.cameraFlight = {
        position: new THREE.Vector3(...framing.position),
        target: new THREE.Vector3(...framing.target),
      };
      if (this.reduced) {
        this.camera.position.copy(this.cameraFlight.position);
        this.controls.target.copy(this.cameraFlight.target);
        this.cameraFlight = null;
      }
      this.hint(
        `Vue ${zone.short} · choisissez un véhicule pour ouvrir son dossier`,
      );
      return;
    }
    doors.forEach((d) => {
      if (this.closed.has(d.id)) this.toggleDoor(d.id);
    });
    const boxes = this.boxes();
    const destination = nearestWalkable([zone.x, zone.z], boxes, this.depth);
    const path = destination
      ? findPath(
          [this.camera.position.x, this.camera.position.z],
          destination,
          boxes,
          this.depth,
        )
      : [];
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
    if (this.focusedVehicle && !this.inspectedId)
      this.focusVehicle(this.focusedVehicle, this.focusRear);
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
      .find(
        (h) =>
          isRendered(h.object) &&
          (!(h.object instanceof THREE.Sprite) || !!h.object.userData.select),
      );
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
      .find(
        (h) =>
          isRendered(h.object) &&
          (!(h.object instanceof THREE.Sprite) || !!h.object.userData.select),
      );
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
            this.yaw = shortestTurn(this.yaw, Math.atan2(-dx, -dz), dt);
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
      if (
        !blocked(
          this.camera.position.x + dx,
          this.camera.position.z,
          boxes,
          0.38,
          this.depth,
        )
      )
        this.camera.position.x += dx;
      if (
        !blocked(
          this.camera.position.x,
          this.camera.position.z + dz,
          boxes,
          0.38,
          this.depth,
        )
      )
        this.camera.position.z += dz;
      this.camera.position.y = 1.7;
    } else {
      if (this.cameraFlight) {
        const alpha = 1 - Math.exp(-6 * dt);
        this.camera.position.lerp(this.cameraFlight.position, alpha);
        this.controls.target.lerp(this.cameraFlight.target, alpha);
        if (
          this.camera.position.distanceTo(this.cameraFlight.position) < 0.025
        ) {
          this.camera.position.copy(this.cameraFlight.position);
          this.controls.target.copy(this.cameraFlight.target);
          this.cameraFlight = null;
        }
      }
      this.controls.update();
    }
    if (t - this.lastPosition > 180) {
      this.position(this.camera.position.x, this.camera.position.z);
      this.lastPosition = t;
    }
    for (const vehicle of this.cars.children) {
      const asset = vehicle.userData.asset as THREE.Group | undefined;
      const fallback = vehicle.userData.fallback as
        THREE.Object3D[] | undefined;
      if (!asset || !fallback) continue;
      const inspection = this.inspectedId === vehicle.userData.select?.id;
      const detailed =
        !inspection &&
        (this.quality !== "low" ||
          this.camera.position.distanceTo(vehicle.position) < 45);
      asset.visible = detailed;
      fallback.forEach((object) => {
        object.visible = !detailed;
      });
    }
    const focused = this.mode === "free" && !!this.focusedVehicle;
    const aim = this.controls.target;
    for (const object of this.scene.children) {
      if (object.userData.overhead) object.visible = this.mode === "walk";
      if (object.userData.sceneLabel) object.visible = this.mode === "overview";
      if (object.userData.occluder) {
        object.visible = true;
        if (this.mode !== "walk") {
          const bounds =
            this.occlusionBounds.get(object) ||
            new THREE.Box3().setFromObject(object);
          object.visible = !occludesTarget(bounds, this.camera.position, aim);
        }
      }
    }
    for (const object of this.cars.children) {
      if (object instanceof THREE.Sprite) {
        object.visible =
          !focused || object.userData.vehicleLabel === this.focusedVehicle;
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame((n) => this.tick(n));
  }
  setQuality(low: boolean) {
    this.quality = low ? "low" : "standard";
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = !low;
    this.resize();
  }
  private clear(g: THREE.Object3D) {
    g.children.forEach((c) =>
      c.traverse((o) => {
        if (o instanceof THREE.Sprite) {
          o.material.map?.dispose();
          o.material.dispose();
        }
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          });
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
    this.environment.dispose();
    this.floorTexture?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
