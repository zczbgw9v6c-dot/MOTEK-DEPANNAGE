/* ==========================================================================
   Parc live 3D (MOTEK Dépann) — scène écrite pour le dépanneur :
   - parc de gardiennage : trois niveaux dans l'ordre (N-1, N-2, N-3), chacun
     un bloc net de deux rangées face à une allée ; véhicules rangés par ordre
     chronologique d'entrée, couleur réelle, plaque et jours de garde
   - dépôt des camions à droite : paniers Toyota Hilux 2025, plateaux,
     porte-voitures, modélisés par type, placés selon leur statut
   - bureau à l'entrée : les trois collaborateurs qui ont un accès MOTEK
   Clic sur un véhicule, un camion ou le bureau → fiche à droite.
   Panneaux bas : missions en cours (défilement), listes (à relancer,
   non traités, missions, assureurs, flotte). Three.js, code MOTEK.
   ========================================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

(function () {
  const $ = (s) => document.querySelector(s);
  const view = $("#view-map"), host = $("#scene");
  if (!view || !host) return;
  const U = CX.util, esc = U.esc;

  /* ---------- rendu ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef1f4);
  scene.fog = new THREE.Fog(0xeef1f4, 170, 320);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 700);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.15; controls.minDistance = 8; controls.maxDistance = 220;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c2cc, 1.0));
  const sun = new THREE.DirectionalLight(0xfff6e6, 2.4);
  sun.position.set(-50, 90, 40); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 90, bottom: -90, near: 10, far: 260 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
  scene.add(sun);

  /* ---------- matériaux & primitives ---------- */
  const matCache = new Map();
  const mat = (color, o = {}) => { const k = color + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, o))); return matCache.get(k); };
  const box = (parent, w, h, d, m, x = 0, y = 0, z = 0, shadow = true) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); g.castShadow = shadow; g.receiveShadow = true; parent.add(g); return g; };
  const cyl = (parent, r, h, m, x, y, z, rotZ = Math.PI / 2, seg = 20) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); c.rotation.z = rotZ; c.position.set(x, y, z); c.castShadow = true; parent.add(c); return c; };
  const BLUE = 0x1768ee, ASPHALT = 0x9a9ea6, LINE = 0xf4f5f7, KERB = 0xd6d9de, WHITE = 0xf7f8fa;
  const glassM = mat(0x24303c, { roughness: 0.15, metalness: 0.4 }), tireM = mat(0x1f2226, { roughness: 0.95 }), rimM = mat(0xc9ced6, { metalness: 0.7, roughness: 0.3 });
  const amberM = mat(0xff8c00, { emissive: 0xff8c00, emissiveIntensity: 0.9 }), orangeM = mat(0xe8650a, { roughness: 0.5 });

  /* ---------- étiquettes (sprites texte, haute définition) ---------- */
  const labelCache = new Map();
  function label(text, opts = {}) {
    const key = text + JSON.stringify(opts);
    if (!labelCache.has(key)) {
      const c = document.createElement("canvas"), w = 640, h = 180; c.width = w; c.height = h; const g = c.getContext("2d");
      g.fillStyle = opts.bg || "rgba(255,255,255,.94)"; g.beginPath(); g.roundRect(14, 24, w - 28, h - 48, 30); g.fill();
      let fs = (opts.size || 28) * 2.1; g.font = "800 " + fs + "px Inter, Arial, sans-serif";
      while (fs > 30 && g.measureText(text).width > w - 70) { fs -= 3; g.font = "800 " + fs + "px Inter, Arial, sans-serif"; }
      g.fillStyle = opts.fg || "#121418"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 2);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter;
      labelCache.set(key, new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    }
    const s = new THREE.Sprite(labelCache.get(key)); const W = opts.w || 3.6; s.scale.set(W, W * 180 / 640, 1); s.renderOrder = 5; return s;
  }

  /* ---------- plan du site ----------
     x : gauche → droite. Parc à gauche (trois niveaux l'un derrière l'autre,
     N-1 devant), dépôt camions à droite, bureau devant l'entrée. */
  const LEVELS = [
    { id: "N1", name: "Niveau -1", z: 24 },
    { id: "N2", name: "Niveau -2", z: 0 },
    { id: "N3", name: "Niveau -3", z: -24 },
  ];
  const LEVEL_W = 66, LEVEL_D = 20, LEVEL_X = -30, PER_ROW = 20, SLOT_W = 3.1, SLOT_D = 5.6, LEVEL_SLOTS = PER_ROW * 2;
  const PARC = { x: LEVEL_X, z: 0, w: LEVEL_W + 6, d: 76 };
  const DEPOT = { x: 44, z: 2, w: 38, d: 60 };
  const OFFICE = { x: 44, z: -34, w: 14, d: 9 };

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat(0xdfe3e8, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const slab = (r, color, y = 0.02) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), mat(color, { roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.set(r.x, y, r.z); m.receiveShadow = true; scene.add(m); return m; };
  slab(PARC, ASPHALT); slab(DEPOT, 0x8e939b);
  const kerb = (r) => { for (const [x, z, w, d] of [[r.x, r.z - r.d / 2, r.w, 0.5], [r.x, r.z + r.d / 2, r.w, 0.5], [r.x - r.w / 2, r.z, 0.5, r.d], [r.x + r.w / 2, r.z, 0.5, r.d]]) box(scene, w, 0.25, d, mat(KERB), x, 0.12, z, false); };
  kerb(PARC); kerb(DEPOT);

  // niveaux : trois bandes dans l'ordre, chacune deux rangées face à une allée
  const slotPos = (li, k) => {
    const L = LEVELS[li], row = k < PER_ROW ? 0 : 1, col = k % PER_ROW;
    const x = LEVEL_X - LEVEL_W / 2 + 2 + col * SLOT_W + SLOT_W / 2;
    const z = L.z + (row === 0 ? -LEVEL_D / 2 + SLOT_D / 2 + 0.6 : LEVEL_D / 2 - SLOT_D / 2 - 0.6);
    return { x, z, row };
  };
  const markings = new THREE.Group(); scene.add(markings);
  LEVELS.forEach((L, li) => {
    slab({ x: LEVEL_X, z: L.z, w: LEVEL_W, d: LEVEL_D }, [0x969aa2, 0x8f939b, 0x888c94][li], 0.03);
    for (let k = 0; k < LEVEL_SLOTS; k++) { const p = slotPos(li, k); box(markings, 0.12, 0.02, SLOT_D, mat(LINE), p.x - SLOT_W / 2, 0.05, p.z, false); if (k % PER_ROW === PER_ROW - 1) box(markings, 0.12, 0.02, SLOT_D, mat(LINE), p.x + SLOT_W / 2, 0.05, p.z, false); }
    box(markings, 10, 0.02, 0.35, mat(LINE), LEVEL_X - 18, 0.05, L.z, false); box(markings, 10, 0.02, 0.35, mat(LINE), LEVEL_X + 18, 0.05, L.z, false);
    const s = label(L.name, { bg: ["rgba(23,104,238,.96)", "rgba(17,84,196,.96)", "rgba(12,62,150,.96)"][li], fg: "#fff", size: 46, w: 9 }); s.position.set(LEVEL_X - LEVEL_W / 2 - 4.5, 2.6, L.z); scene.add(s);
    const ramp = box(scene, 5, 0.3, 8, mat(0x7c8189), LEVEL_X - LEVEL_W / 2 - 4.5, 0.15 + li * 0.1, L.z); ramp.rotation.x = -0.08;
  });
  // dépôt : 12 emplacements en deux rangées face à l'allée centrale
  const BAY_W = 4.6, BAY_D = 12;
  const bayPos = (i) => ({ x: DEPOT.x - DEPOT.w / 2 + 3 + (i % 6) * (BAY_W + 1.2) + BAY_W / 2, z: i < 6 ? DEPOT.z - 15 : DEPOT.z + 15, row: i < 6 ? 0 : 1 });
  for (let i = 0; i < 12; i++) { const p = bayPos(i); box(markings, 0.14, 0.02, BAY_D, mat(LINE), p.x - BAY_W / 2, 0.05, p.z, false); box(markings, 0.14, 0.02, BAY_D, mat(LINE), p.x + BAY_W / 2, 0.05, p.z, false); box(markings, BAY_W, 0.02, 0.14, mat(LINE), p.x, 0.05, p.z + (p.row ? BAY_D / 2 : -BAY_D / 2), false); }
  const depotLabel = label("Dépôt camions", { bg: "rgba(42,45,51,.95)", fg: "#fff", size: 44, w: 10 }); depotLabel.position.set(DEPOT.x, 3.6, DEPOT.z); scene.add(depotLabel);
  // mur de séparation et portail
  box(scene, 0.6, 2.4, 22, mat(0xffffff), 10, 1.2, -27); box(scene, 0.6, 2.4, 26, mat(0xffffff), 10, 1.2, 25);
  box(scene, 0.62, 0.3, 76, mat(BLUE), 10, 2.55, 0, false);
  const gate = box(scene, 0.25, 1.6, 14, mat(0x3a3f47, { metalness: 0.5, roughness: 0.4 }), 10, 0.9, 0); gate.rotation.y = 0.75;
  // lampadaires
  const lampM = mat(0x3a3f47, { metalness: 0.4, roughness: 0.5 });
  for (const [x, z] of [[-66, -36], [-66, 36], [8, -36], [8, 36], [26, -30], [26, 32], [62, -30], [62, 32]]) { box(scene, 0.25, 7, 0.25, lampM, x, 3.5, z); box(scene, 1.6, 0.18, 0.5, mat(0xffffff, { emissive: 0xfff4d6, emissiveIntensity: 1.2 }), x, 7, z, false); }
  // arbres autour du site
  const treeM = mat(0x8fd0a0), trunkM = mat(0x8b6b4a);
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, r = 100 + (i % 3) * 8, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.6; if (Math.abs(x) < 80 && Math.abs(z) < 44) continue; box(scene, 0.4, 1.6, 0.4, trunkM, x, 0.8, z); const c = new THREE.Mesh(new THREE.SphereGeometry(1.8 + (i % 3) * 0.3, 12, 9), treeM); c.position.set(x, 2.8, z); c.castShadow = true; scene.add(c); }

  /* ---------- bureau : trois collaborateurs ---------- */
  const office = new THREE.Group(); scene.add(office);
  (function buildOffice() {
    const wallM = mat(0xffffff, { roughness: 0.9 }), floorM = mat(0xe9ebee), deskM = mat(0xcdbba0, { roughness: 0.7 }), screenM = mat(0x1a1d22, { emissive: 0x2d6cdf, emissiveIntensity: 0.35 });
    box(office, OFFICE.w, 0.2, OFFICE.d, floorM, OFFICE.x, 0.1, OFFICE.z);
    box(office, OFFICE.w, 3, 0.25, wallM, OFFICE.x, 1.6, OFFICE.z - OFFICE.d / 2);
    box(office, 0.25, 3, OFFICE.d, wallM, OFFICE.x - OFFICE.w / 2, 1.6, OFFICE.z); box(office, 0.25, 3, OFFICE.d, wallM, OFFICE.x + OFFICE.w / 2, 1.6, OFFICE.z);
    box(office, OFFICE.w, 2.2, 0.12, mat(0x9fc3e6, { transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.2 }), OFFICE.x, 1.3, OFFICE.z + OFFICE.d / 2, false);
    box(office, OFFICE.w + 0.8, 0.25, OFFICE.d + 0.8, mat(0xdde1e6, { transparent: true, opacity: 0.55 }), OFFICE.x, 3.2, OFFICE.z, false);
    const me = CX.S && CX.emp ? CX.emp(CX.S.meId) : null;
    const staff = [me].concat((CX.S && CX.S.office) || []).filter(Boolean).slice(0, 3);
    [[-4], [0], [4]].forEach(([dx], i) => {
      const x = OFFICE.x + dx, z = OFFICE.z - 1;
      box(office, 2.4, 0.08, 1.2, deskM, x, 0.95, z); for (const [a, b] of [[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]]) box(office, 0.08, 0.9, 0.08, mat(0x5b6670), x + a, 0.5, z + b, false);
      box(office, 0.9, 0.55, 0.05, screenM, x, 1.35, z - 0.3, false);
      const col = new THREE.Color((staff[i] && staff[i].color) || "#59606b").getHex();
      box(office, 0.7, 0.8, 0.5, mat(col), x, 0.9, z + 1.1); const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), mat(0xf1d2b6)); head.position.set(x, 1.6, z + 1.1); head.castShadow = true; office.add(head);
      if (staff[i]) { const s = label(staff[i].first, { size: 34, w: 3.6 }); s.position.set(x, 2.5, z + 1.1); office.add(s); }
    });
    const s = label("Bureau", { bg: "rgba(124,58,237,.95)", fg: "#fff", size: 44, w: 6 }); s.position.set(OFFICE.x, 4.6, OFFICE.z); office.add(s);
    office.userData = { kind: "office" };
  })();

  /* ---------- voitures ---------- */
  function wheel(parent, x, z, r = 0.34, w = 0.3) { cyl(parent, r, w, tireM, x, r, z); cyl(parent, r * 0.58, w + 0.02, rimM, x, r, z, Math.PI / 2, 14); }
  function car(hex) {
    const g = new THREE.Group(), body = mat(new THREE.Color(hex || "#c9cdd3").getHex(), { roughness: 0.4, metalness: 0.2 });
    box(g, 1.8, 0.5, 4.3, body, 0, 0.55, 0);
    const hood = box(g, 1.7, 0.18, 1.3, body, 0, 0.86, 1.4); hood.rotation.x = 0.06;
    box(g, 1.62, 0.52, 2.3, body, 0, 1.05, -0.25); box(g, 1.55, 0.44, 2.05, glassM, 0, 1.08, -0.25, false);
    box(g, 1.6, 0.25, 0.9, body, 0, 0.9, -1.7);
    for (const [x, z] of [[-0.86, 1.35], [0.86, 1.35], [-0.86, -1.35], [0.86, -1.35]]) wheel(g, x, z);
    box(g, 0.34, 0.12, 0.06, mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5 }), -0.6, 0.62, 2.16, false); box(g, 0.34, 0.12, 0.06, mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.5 }), 0.6, 0.62, 2.16, false);
    box(g, 0.34, 0.1, 0.06, mat(0xd7261e, { emissive: 0xd7261e, emissiveIntensity: 0.6 }), -0.6, 0.62, -2.16, false); box(g, 0.34, 0.1, 0.06, mat(0xd7261e, { emissive: 0xd7261e, emissiveIntensity: 0.6 }), 0.6, 0.62, -2.16, false);
    return g;
  }

  /* ---------- camions : modélisés par type ---------- */
  const cabWhite = mat(WHITE, { roughness: 0.35, metalness: 0.15 }), stripeM = mat(BLUE, { roughness: 0.4 }), bedM = mat(0x2a2d33, { roughness: 0.55, metalness: 0.35 }), frameM = mat(0x4a525c), chromeM = mat(0xd9dde3, { metalness: 0.8, roughness: 0.25 });
  const lightbar = (g, x, y, z, w = 1.3) => { box(g, w, 0.16, 0.36, amberM, x, y, z, false); box(g, w + 0.2, 0.06, 0.4, chromeM, x, y - 0.1, z, false); };
  const beacon = (g, tone, x, y, z) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), mat(tone, { emissive: tone, emissiveIntensity: 0.8 })); d.position.set(x, y, z); g.add(d); };

  // Toyota Hilux 2025 double cabine équipé panier (dépanneuse à fourche)
  function hiluxPanier(tone) {
    const g = new THREE.Group();
    box(g, 1.95, 0.6, 5.3, cabWhite, 0, 0.75, 0);
    const hood = box(g, 1.85, 0.35, 1.45, cabWhite, 0, 1.2, 1.9); hood.rotation.x = 0.05;
    box(g, 1.9, 0.5, 0.35, mat(0x2b2e33), 0, 0.85, 2.65, false);
    box(g, 1.9, 0.9, 2.3, cabWhite, 0, 1.55, 0.25);
    box(g, 1.82, 0.62, 2.05, glassM, 0, 1.68, 0.25, false);
    box(g, 1.95, 0.08, 2.4, cabWhite, 0, 2.02, 0.25, false);
    box(g, 1.98, 0.22, 5.4, stripeM, 0, 0.5, 0, false);
    box(g, 1.9, 0.5, 1.9, bedM, 0, 1.05, -1.75);
    box(g, 0.22, 0.22, 2.9, orangeM, 0, 1.45, -2.4);
    box(g, 0.5, 0.5, 0.6, orangeM, 0, 1.45, -1.2);
    box(g, 2.1, 0.12, 0.5, orangeM, 0, 0.45, -3.9, false);
    box(g, 0.12, 0.12, 1.0, orangeM, -0.9, 0.45, -3.6, false); box(g, 0.12, 0.12, 1.0, orangeM, 0.9, 0.45, -3.6, false);
    box(g, 0.08, 0.6, 0.08, frameM, -0.9, 1.3, -2.6, false); box(g, 0.08, 0.6, 0.08, frameM, 0.9, 1.3, -2.6, false);
    lightbar(g, 0, 2.2, 0.25, 1.5); beacon(g, tone, 0, 2.55, 0.25);
    for (const [x, z] of [[-0.95, 1.65], [0.95, 1.65], [-0.95, -1.5], [0.95, -1.5]]) wheel(g, x, z, 0.42, 0.34);
    box(g, 1.9, 0.15, 0.1, chromeM, 0, 0.5, 2.7, false);
    return g;
  }
  // Plateau (Iveco Daily / Master / Sprinter) : cabine utilitaire + plateau basculant
  function plateau(tone, brand) {
    const g = new THREE.Group(), L = 7.4;
    box(g, 2.2, 0.45, L, frameM, 0, 0.62, 0);
    box(g, 2.2, 1.95, 2.3, cabWhite, 0, 1.75, L / 2 - 1.15);
    box(g, 2.1, 0.95, 0.8, glassM, 0, 2.05, L / 2 - 0.25, false); box(g, 2.22, 0.34, 2.35, stripeM, 0, 0.95, L / 2 - 1.15, false);
    box(g, 2.0, 0.42, 0.45, mat(0x2b2e33), 0, 1.0, L / 2 + 0.05, false);
    box(g, 2.3, 0.2, L - 2.5, bedM, 0, 1.02, -1.25);
    const tail = box(g, 2.3, 0.14, 1.2, bedM, 0, 0.9, -L / 2 + 0.35); tail.rotation.x = -0.22;
    box(g, 0.1, 0.5, L - 2.5, orangeM, -1.12, 1.35, -1.25, false); box(g, 0.1, 0.5, L - 2.5, orangeM, 1.12, 1.35, -1.25, false);
    box(g, 2.1, 0.9, 0.2, frameM, 0, 1.55, L / 2 - 2.4, false);
    cyl(g, 0.22, 1.2, chromeM, 0, 1.55, L / 2 - 2.55, Math.PI / 2, 12);
    lightbar(g, 0, 2.85, L / 2 - 1.15, 1.6); beacon(g, tone, 0, 3.2, L / 2 - 1.15);
    for (const z of [L / 2 - 1.3, -L / 2 + 1.6]) for (const x of [-1.15, 1.15]) wheel(g, x, z, 0.5, 0.4);
    if (brand && /Sprinter|Master/.test(brand)) box(g, 2.0, 0.1, 0.3, chromeM, 0, 0.55, L / 2 + 0.1, false);
    return g;
  }
  // Porte-voitures (Iveco Eurocargo) : cabine poids lourd + deux ponts
  function porteVoitures(tone) {
    const g = new THREE.Group(), L = 10;
    box(g, 2.4, 0.5, L, frameM, 0, 0.7, 0);
    box(g, 2.4, 2.3, 2.3, cabWhite, 0, 2.0, L / 2 - 1.15); box(g, 2.3, 1.1, 0.8, glassM, 0, 2.35, L / 2 - 0.25, false); box(g, 2.42, 0.4, 2.35, stripeM, 0, 1.1, L / 2 - 1.15, false);
    box(g, 2.2, 0.5, 0.45, mat(0x2b2e33), 0, 1.15, L / 2 + 0.05, false);
    box(g, 2.4, 0.2, L - 2.6, bedM, 0, 1.1, -1.3); box(g, 2.4, 0.18, L - 3.2, bedM, 0, 3.3, -1.6);
    for (const z of [-L / 2 + 0.5, -1.4, 1.6]) { box(g, 0.16, 2.2, 0.16, frameM, -1.12, 2.2, z); box(g, 0.16, 2.2, 0.16, frameM, 1.12, 2.2, z); }
    const ramp = box(g, 2.3, 0.12, 2.2, bedM, 0, 2.6, -L / 2 - 0.4); ramp.rotation.x = -0.55;
    lightbar(g, 0, 3.25, L / 2 - 1.15, 1.8); beacon(g, tone, 0, 3.6, L / 2 - 1.15);
    for (const z of [L / 2 - 1.4, -L / 2 + 1.5, -L / 2 + 2.9]) for (const x of [-1.2, 1.2]) wheel(g, x, z, 0.55, 0.45);
    return g;
  }
  // Dépanneuse légère (Boxer) : fourgon + petite flèche
  function legere(tone) {
    const g = new THREE.Group(), L = 6;
    box(g, 2.1, 0.45, L, frameM, 0, 0.6, 0); box(g, 2.1, 1.9, 2.1, cabWhite, 0, 1.7, L / 2 - 1.05); box(g, 2.0, 0.9, 0.7, glassM, 0, 2.0, L / 2 - 0.2, false); box(g, 2.12, 0.34, 2.15, stripeM, 0, 0.95, L / 2 - 1.05, false);
    box(g, 2.0, 0.4, L - 2.4, bedM, 0, 0.95, -1.2); box(g, 0.2, 0.2, 2.2, orangeM, 0, 1.35, -2.0); box(g, 1.8, 0.1, 0.4, orangeM, 0, 0.42, -3.2, false);
    lightbar(g, 0, 2.75, L / 2 - 1.05, 1.3); beacon(g, tone, 0, 3.1, L / 2 - 1.05);
    for (const z of [L / 2 - 1.2, -L / 2 + 1.4]) for (const x of [-1.08, 1.08]) wheel(g, x, z, 0.45, 0.36);
    return g;
  }
  function truck(t, tone) { return t.kind === "Panier" ? hiluxPanier(tone) : t.kind === "Porte-voitures" ? porteVoitures(tone) : t.kind === "Dépanneuse légère" ? legere(tone) : plateau(tone, t.brand); }
  const TONE = { Disponible: 0x1b9a55, "En mission": 0xff8c00, Entretien: 0xd7261e };

  /* ---------- placement dynamique ---------- */
  const dyn = new THREE.Group(); scene.add(dyn);
  const pick = [];
  function build() {
    dyn.clear(); pick.length = 0;
    const S = CX.S; if (!S || !S.gardes) return;
    if (window.DEP && DEP.refreshGardeStatus) DEP.refreshGardeStatus();
    const parked = S.gardes.filter((g) => !g.outAt);
    LEVELS.forEach((L, li) => {
      parked.filter((g) => g.level === L.id).sort((a, b) => (a.since < b.since ? -1 : 1)).slice(0, LEVEL_SLOTS).forEach((g, k) => {
        const p = slotPos(li, k), c = car(g.vehicle.hex); c.position.set(p.x, 0, p.z); c.rotation.y = p.row ? Math.PI : 0;
        const days = DEP.gardeDays(g);
        const tone = g.status === "Abandon présumé" ? "rgba(215,38,30,.96)" : g.status === "Relance à faire" ? "rgba(185,100,0,.96)" : g.step === "Non traité" ? "rgba(124,58,237,.96)" : "rgba(255,255,255,.94)";
        const s = label(g.vehicle.plate + "  ·  " + days + " j", { bg: tone, fg: tone.startsWith("rgba(255,255") ? "#121418" : "#fff", size: 30, w: 4.2 }); s.position.set(0, 2.5, 0); c.add(s);
        c.userData = { kind: "garde", id: g.id }; dyn.add(c); pick.push(c);
      });
    });
    S.trucks.slice(0, 12).forEach((t, i) => {
      const p = bayPos(i);
      const drv = t.driverId ? DEP.driver(t.driverId) : null;
      if (t.status === "En mission") { const s = label((drv ? drv.first + " · " : "") + t.name + " · en mission", { bg: "rgba(255,140,0,.22)", fg: "#b96400", size: 28, w: 5.8 }); s.position.set(p.x, 0.7, p.z); s.userData = { kind: "truck", id: t.id }; dyn.add(s); pick.push(s); return; }
      const tr = truck(t, TONE[t.status] || 0x1b9a55); tr.position.set(p.x, 0, p.z); tr.rotation.y = p.row ? 0 : Math.PI;
      const s = label(t.name + (drv ? " · " + drv.first : t.kind === "Panier" ? " · Hilux" : ""), { size: 32, w: 5 }); s.position.set(0, 4.4, 0); tr.add(s);
      if (t.status === "Entretien") { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 10), mat(0xff6a00)); cone.position.set(p.x + 2.6, 0.45, p.z + (p.row ? -6 : 6)); dyn.add(cone); }
      tr.userData = { kind: "truck", id: t.id }; dyn.add(tr); pick.push(tr);
    });
    pick.push(office);
    kpis();
  }
  function kpis() {
    const S = CX.S, parked = S.gardes.filter((g) => !g.outAt), free = S.trucks.filter((t) => t.status === "Disponible"), onRoad = S.trucks.filter((t) => t.status === "En mission"), maint = S.trucks.filter((t) => t.status === "Entretien");
    const set = (card, l, v, d, s) => { if (!card) return; card.style.display = ""; card.querySelector(".l").textContent = l; card.querySelector(".v b").textContent = v; card.querySelector(".v .d").textContent = d; card.querySelector(".s").textContent = s; };
    const cards = view.querySelectorAll(".kpis .kpi");
    set(cards[0], "Véhicules sur site", parked.length, parked.filter((g) => g.step === "Non traité").length + " non traités", LEVELS.map((L) => L.name.replace("Niveau ", "N") + " " + parked.filter((g) => g.level === L.id).length).join(" · "));
    set(cards[1], "Camions disponibles", free.length + "/" + S.trucks.length, onRoad.length + " sur la route", free.filter((t) => t.kind === "Panier").length + " paniers · " + free.filter((t) => t.kind !== "Panier").length + " plateaux / porte-voitures");
    set(cards[2], "En entretien", maint.length, maint.length ? maint.map((t) => t.name).join(", ") : "aucun", parked.filter((g) => g.status !== "En garde").length + " véhicules à relancer");
  }

  /* ---------- fiche latérale ---------- */
  const detail = $("#detail");
  let selected = null;
  const STEPS_G = ["Non traité", "Expertise en attente", "Expertisé", "Décision assureur", "Épave — enlèvement", "Prêt à sortir"];
  function showGarde(g) {
    const days = DEP.gardeDays(g), fees = DEP.gardeFees(g), si = STEPS_G.indexOf(g.step || "Non traité");
    detail.innerHTML = `<div class="pd"><div class="pd-h"><div class="pd-ic" style="background:${esc(g.vehicle.hex)}"></div><div><div class="pd-k">${esc(g.level)} · place ${esc(g.slot.split("-")[1])} · entré le ${esc(U.fmtD(g.since))}</div><h3>${esc(g.vehicle.make)} ${esc(g.vehicle.model)}</h3><div class="pd-s">${UI.plate(g.vehicle.plate)} ${BO.chip(g.status, g.status === "Abandon présumé" ? "red" : g.status === "Relance à faire" ? "amber" : "green", true)}</div></div><button class="pd-x" data-x>${UI.icon("x", 16)}</button></div>
      <div class="pd-steps">${STEPS_G.filter((s) => s !== "Épave — enlèvement" || g.step === s).map((s) => `<button class="pst ${s === g.step ? "cur" : STEPS_G.indexOf(s) < si ? "done" : ""}" data-step="${esc(s)}" title="Passer à « ${esc(s)} »">${esc(s)}</button>`).join("")}</div>
      <div class="tiles"><div class="tile"><div class="tl">Jours</div><div class="tv">${days}</div></div><div class="tile"><div class="tl">Frais</div><div class="tv">${esc(U.chf(fees))}</div></div><div class="tile"><div class="tl">Mandant</div><div class="tv" style="font-size:13px">${esc(g.mandant)}</div></div><div class="tile"><div class="tl">Dossier</div><div class="tv" style="font-size:13px">${esc(g.ref || "—")}</div></div></div>
      <dl class="kv mt"><dt>Motif</dt><dd>${esc(g.reason)}</dd><dt>Propriétaire</dt><dd>${esc(g.owner.name || "—")}<br>${esc(g.owner.phone || "")}</dd>${g.insurance ? `<dt>Assurance</dt><dd>${esc(g.insurance.status)}</dd>` : ""}</dl>
      <div class="pd-acts"><button class="btn pri" data-open-g="${g.id}">${UI.icon("layers", 14)}Dossier</button><button class="btn" data-open-m="mandats:${g.id}">${UI.icon("shield", 14)}Mandat</button>${g.owner.phone ? `<button class="btn" data-wa="${g.id}">${UI.icon("msg", 14)}WhatsApp</button>` : ""}</div></div>`;
    bindDetail();
    detail.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => { if (DEP.setGardeStep) DEP.setGardeStep(g.id, b.dataset.step); }));
    const wa = detail.querySelector("[data-wa]"); if (wa) wa.addEventListener("click", () => { if (DEP.whatsapp) DEP.whatsapp({ phone: g.owner.phone, name: g.owner.name, plate: g.vehicle.plate, kind: "recuperer", gardeId: g.id }); else APP.open("agent", { tab: "wa" }); });
  }
  function showTruck(t) {
    const m = CX.S.missions.find((x) => x.truckId === t.id && !["Terminée", "Facturée"].includes(x.status)), d = t.driverId ? DEP.driver(t.driverId) : null;
    detail.innerHTML = `<div class="pd"><div class="pd-h"><div class="pd-ic" style="background:#1768ee;display:grid;place-items:center;color:#fff">${UI.truckIcon ? UI.truckIcon(t.kind, 26, "#fff") : UI.icon("truck", 20)}</div><div><div class="pd-k">Dépôt camions · ${esc(t.kind)}</div><h3>${esc(t.name)}</h3><div class="pd-s">${esc(t.brand || "")}${t.year ? " " + t.year : ""} · ${esc(t.plate)} ${BO.chip(t.status, t.status === "Disponible" ? "green" : t.status === "Entretien" ? "red" : "amber", true)}</div></div><button class="pd-x" data-x>${UI.icon("x", 16)}</button></div>
      <dl class="kv"><dt>Dépanneur</dt><dd>${d ? esc(d.first) + (d.phone ? ' · <a class="lnk" href="tel:' + esc(String(d.phone).replace(/\s/g, '')) + '">' + esc(d.phone) + '</a>' : '') : "camion de réserve, sans dépanneur attitré"}</dd><dt>Kilométrage</dt><dd>${esc(BO.num(t.km))} km</dd>${t.ct ? `<dt>Contrôle technique</dt><dd>${esc(U.fmtD(t.ct))}</dd>` : ""}${t.notes ? `<dt>Notes</dt><dd>${esc(t.notes)}</dd>` : ""}</dl>
      ${m ? `<div class="form-note mt">${UI.icon("pin", 15)}<div><b>${esc(m.no)}</b> · ${esc(m.status)}<br>${esc(m.kind)} · ${esc(m.address)}</div></div>` : ""}
      <div class="pd-acts">${m ? `<button class="btn pri" data-open="missions:${m.id}">${UI.icon("truck", 14)}Ouvrir la mission</button>` : `<button class="btn pri" data-open="missions::new">${UI.icon("plus", 14)}Nouvelle mission</button>`}<button class="btn" data-open="fleet">${UI.icon("lift", 14)}Flotte</button></div></div>`;
    bindDetail();
  }
  function showOffice() {
    const staff = CX.S.office || [], me = CX.emp(CX.S.meId);
    const mods = APP.modules ? APP.modules() : [];
    detail.innerHTML = `<div class="pd"><div class="pd-h"><div class="pd-ic" style="background:#7c3aed;display:grid;place-items:center;color:#fff">${UI.icon("users", 20)}</div><div><div class="pd-k">Bureau · 25 av. Claude Vellefaux</div><h3>Le bureau</h3><div class="pd-s">Joseph, ${esc(staff.map((p) => p.first).join(" et "))}</div></div><button class="pd-x" data-x>${UI.icon("x", 16)}</button></div>
      <div class="pd-staff">${me ? `<div class="ps"><span class="bav" style="background:#121418">${esc(me.ini)}</span><div><b>${esc(me.first)}</b><small>${esc(me.title || "Gérant")} · tous les accès</small></div></div>` : ""}${staff.map((p) => `<div class="ps"><span class="bav" style="background:${esc(p.color)}">${esc(p.ini)}</span><div><b>${esc(p.name)}</b><small>${esc(p.title)}</small><small class="acc">${(p.access || []).map((a) => { const m = mods.find((x) => x.id === a); return esc(m ? m.label : a); }).join(" · ")}</small></div></div>`).join("")}</div>
      <div class="pd-acts"><button class="btn pri" data-open="fleet:bureau">${UI.icon("users", 14)}Gérer les accès</button><button class="btn" data-open="dashboard">${UI.icon("dashboard", 14)}Tableau de bord</button></div></div>`;
    bindDetail();
  }
  function bindDetail() {
    detail.classList.remove("off");
    detail.querySelector("[data-x]").addEventListener("click", () => { detail.classList.add("off"); selected = null; });
    detail.querySelectorAll("[data-open-g]").forEach((b) => b.addEventListener("click", () => APP.open("parc", { id: b.dataset.openG })));
    detail.querySelectorAll("[data-open-m]").forEach((b) => b.addEventListener("click", () => { const [mod, id] = b.dataset.openM.split(":"); APP.open(mod, { id }); }));
    detail.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { const [mod, id] = b.dataset.open.split(":"); APP.open(mod, id === "" ? { tab: "new" } : id === "bureau" ? { tab: "bureau" } : id ? { id } : {}); }));
  }

  /* ---------- caméra : vues & cadrage ---------- */
  let anim = null;
  function flyTo(target, dist, az = 0.55, pol = 0.9, dur = 1.1) {
    const from = { p: camera.position.clone(), t: controls.target.clone() };
    const to = { t: new THREE.Vector3(target.x, 0, target.z) };
    to.p = new THREE.Vector3(to.t.x + dist * Math.sin(pol) * Math.sin(az), dist * Math.cos(pol), to.t.z + dist * Math.sin(pol) * Math.cos(az));
    anim = { from, to, t0: performance.now(), dur: dur * 1000 };
  }
  // cadre un rectangle au sol quelle que soit la taille de la fenêtre
  function fitRect(r, az = 0.5, pol = 0.78, margin = 1.0) {
    const vFov = THREE.MathUtils.degToRad(camera.fov), hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    const diag = Math.hypot(r.w, r.d) * margin;
    const dist = Math.max(diag / 2 / Math.tan(hFov / 2), diag / 2 / Math.tan(vFov / 2) * 0.9);
    flyTo({ x: r.x, z: r.z }, Math.min(dist, 215), az, pol);
  }
  const SITE = { x: 4, z: -2, w: 146, d: 86 };
  const VIEWS = {
    ALL: () => fitRect(SITE, 0.16, 0.8),
    PARC: () => fitRect(PARC, 0.12, 0.8),
    N1: () => fitRect({ x: LEVEL_X, z: LEVELS[0].z, w: LEVEL_W, d: LEVEL_D + 6 }, 0.3, 0.86),
    N2: () => fitRect({ x: LEVEL_X, z: LEVELS[1].z, w: LEVEL_W, d: LEVEL_D + 6 }, 0.3, 0.86),
    N3: () => fitRect({ x: LEVEL_X, z: LEVELS[2].z, w: LEVEL_W, d: LEVEL_D + 6 }, 0.3, 0.86),
    DEPOT: () => fitRect(DEPOT, 0.25, 0.85, 1.05),
    OFFICE: () => flyTo({ x: OFFICE.x, z: OFFICE.z }, 30, 0.2, 1.0),
  };
  const PLACES = [["ALL", "cube", "Site", "Parc, dépôt et bureau"], ["PARC", "layers", "Parc", "Trois niveaux de gardiennage"], ["DEPOT", "truck", "Camions", "Dépôt : paniers, plateaux, porte-voitures"], ["OFFICE", "users", "Bureau", "Joseph, Moïse et Florence"]];
  const ctl = view.querySelector(".ctl");
  const zt = $("#zt"), zs = $("#zs"), ztag = $("#ztag"), zbtn = $("#zbtn"), zmenu = $("#zmenu");
  const TAGS = { ALL: "SITE", PARC: "PARC", DEPOT: "DEP", OFFICE: "BUR" };
  const setPlace = (id) => {
    if (!VIEWS[id]) return; VIEWS[id]();
    if (ctl) ctl.querySelectorAll("[data-place]").forEach((x) => x.classList.toggle("on", x.dataset.place === id || (id.startsWith("N") && x.dataset.place === "PARC")));
    const P = PLACES.find((p) => p[0] === id) || ["", "", LEVELS.find((L) => L.id === id).name, "Parc de gardiennage"];
    if (zt) zt.textContent = P[2]; if (zs) zs.textContent = P[3]; if (ztag) ztag.textContent = id.startsWith("N") ? id.replace("N", "N-") : TAGS[id];
  };
  if (ctl) {
    const tour = ctl.querySelector("#tourBtn"); if (tour) tour.style.display = "none";
    PLACES.forEach(([id, ic, l]) => { const b = document.createElement("button"); b.className = "nav"; b.dataset.place = id; b.innerHTML = UI.icon(ic, 17) + "<span>" + l + "</span>"; b.addEventListener("click", () => setPlace(id)); ctl.appendChild(b); });
  }
  // bouton de zone de l'en-tête : menu fonctionnel (site, niveaux, dépôt, bureau)
  if (zbtn && zmenu) {
    const items = [["ALL", "Site complet", "Parc, dépôt et bureau"], ["N1", "Niveau -1", ""], ["N2", "Niveau -2", ""], ["N3", "Niveau -3", ""], ["DEPOT", "Dépôt camions", ""], ["OFFICE", "Bureau", ""]];
    const draw = () => {
      const S = CX.S, parked = S.gardes.filter((g) => !g.outAt);
      zmenu.innerHTML = items.map(([id, l, s]) => `<div class="zi" data-zone="${id}"><span class="ztag" style="min-width:36px">${id.startsWith("N") ? id.replace("N", "N-") : TAGS[id]}</span><div><div style="font-weight:700;font-size:13px">${l}</div><div style="font-size:11px;color:var(--ink3)">${id.startsWith("N") ? parked.filter((g) => g.level === id).length + " véhicules · " + parked.filter((g) => g.level === id && g.status !== "En garde").length + " à relancer" : id === "DEPOT" ? S.trucks.filter((t) => t.status === "Disponible").length + " camions disponibles" : id === "OFFICE" ? (S.office || []).length + " collaborateurs" : s}</div></div></div>`).join("");
      zmenu.querySelectorAll("[data-zone]").forEach((z) => z.addEventListener("click", () => { zmenu.classList.remove("on"); if (APP.mode !== "map") APP.setMode("map"); setPlace(z.dataset.zone); }));
    };
    zbtn.addEventListener("click", (e) => { e.stopPropagation(); draw(); zmenu.classList.toggle("on"); const n = $("#nmenu"); if (n) n.classList.remove("on"); });
    document.addEventListener("click", (e) => { if (!e.target.closest("#zmenu") && !e.target.closest("#zbtn")) zmenu.classList.remove("on"); });
  }

  /* ---------- interaction ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let down = null;
  const hit = (e) => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); const hits = ray.intersectObjects(pick, true); if (!hits.length) return null; let o = hits[0].object; while (o && !(o.userData && o.userData.kind)) o = o.parent; return o; };
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => { if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; const o = hit(e); if (!o) return; select(o.userData); });
  renderer.domElement.addEventListener("pointermove", (e) => { const o = hit(e); renderer.domElement.style.cursor = o ? "pointer" : ""; });
  function select(u, fly = true) {
    selected = u;
    if (u.kind === "garde") { const g = DEP.garde(u.id); if (!g) return false; showGarde(g); const o = pick.find((p) => p.userData.id === u.id); if (fly && o) flyTo(o.position, 24, 0.35, 0.9); return true; }
    if (u.kind === "truck") { const t = DEP.truck(u.id); if (!t) return false; showTruck(t); const o = pick.find((p) => p.userData.id === u.id); if (fly && o) flyTo(o.position, 24, 0.6, 0.95); return true; }
    if (u.kind === "office") { showOffice(); if (fly) VIEWS.OFFICE(); return true; }
    return false;
  }
  APP.focusHandlers.push((target) => {
    if (!target) return false;
    if (target.type === "garde") return select({ kind: "garde", id: target.id });
    if (target.type === "truck") return select({ kind: "truck", id: target.id });
    if (target.type === "office") return select({ kind: "office" });
    if (target.type === "mission") { const m = DEP.mission(target.id); if (m && m.gardeId) return select({ kind: "garde", id: m.gardeId }); if (m && m.truckId) return select({ kind: "truck", id: m.truckId }); }
    if (target.type === "vehicle" && typeof target.id === "string") { const g = DEP.inPark().find((x) => x.vehicle.plate === target.id); if (g) return select({ kind: "garde", id: g.id }); }
    return false;
  });
  window.MAP_SEARCH = (q) => {
    const out = [], n = (s) => String(s).toLowerCase();
    DEP.inPark().forEach((g) => { if (n(g.vehicle.plate + " " + g.vehicle.make + " " + g.vehicle.model).includes(q)) out.push({ grp: "Parc", ic: "car", t: g.vehicle.plate + " · " + g.vehicle.make + " " + g.vehicle.model, s: g.level + " · " + DEP.gardeDays(g) + " j · " + g.mandant, mapOnly: true, go: () => APP.showInMap("garde", g.id) }); });
    CX.S.trucks.forEach((t) => { if (n(t.name + " " + t.plate + " " + t.kind + " " + (t.brand || "")).includes(q)) out.push({ grp: "Camions", ic: "truck", t: t.name + " · " + (t.brand || t.kind), s: t.kind + " · " + t.status, mapOnly: true, go: () => APP.showInMap("truck", t.id) }); });
    if ("bureau".includes(q) || (CX.S.office || []).some((p) => n(p.name).includes(q))) out.push({ grp: "Site", ic: "users", t: "Bureau", s: (CX.S.office || []).map((p) => p.first).join(", "), mapOnly: true, go: () => APP.showInMap("office", "") });
    return out;
  };

  /* ---------- panneaux bas : missions en cours (défilement) et listes ---------- */
  const track = $("#track"), tabs = $("#tabs"), blist = $("#blist");
  const MSTEPS = ["Demandée", "Affectée", "En route", "Sur place", "Remorquage", "Déposée au parc", "Terminée"];
  const MICON = { "Demandée": "bell", "Affectée": "user", "En route": "truck", "Sur place": "map", "Remorquage": "layers", "Déposée au parc": "pin", "Terminée": "check" };
  const ROTATE_MS = 30000;
  let tab = "relance", trackIdx = 0, trackPaused = false, trackTimer = null, trackPinned = null;
  function activeMissions() { return (CX.S.missions || []).filter((m) => ["Demandée", "Affectée", "En route", "Sur place", "Remorquage"].includes(m.status)).sort((a, b) => (a.at < b.at ? 1 : -1)); }
  function renderTrack() {
    if (!track) return;
    const act = activeMissions();
    if (!act.length) { track.innerHTML = `<div class="main"><div class="hd"><span class="ic">${UI.icon("truck", 16)}</span>Missions en cours<small>aucune mission sur la route</small></div><div class="muted" style="margin:auto 0;font-size:12px">Les missions demandées ou affectées défilent ici avec leur avancement et le camion engagé.</div></div>`; return; }
    if (trackPinned) { const k = act.findIndex((m) => m.id === trackPinned); if (k >= 0) trackIdx = k; }
    trackIdx = ((trackIdx % act.length) + act.length) % act.length;
    const m = act[trackIdx], cur = MSTEPS.indexOf(m.status), t = m.truckId ? DEP.truck(m.truckId) : null, d = m.driverId ? DEP.driver(m.driverId) : null;
    const tm = (st) => { const h = (m.history || []).find((x) => x.text === "Statut : " + st); const tt = h && String(h.at).split(" ")[1]; return tt ? tt.slice(0, 5) : st === "Demandée" ? U.tOf(m.at) : ""; };
    track.innerHTML = `<div class="main"><div class="hd"><span class="ic">${UI.icon("truck", 16)}</span>${esc(m.no)} · ${esc(m.kind)}${m.status === "Demandée" ? ' <span class="badge b-red" style="font-size:10px">sans camion</span>' : ""}<small>${esc(m.address)} · ${esc(m.mandant)}</small><span class="trk-nav"><button data-tprev title="Précédente">‹</button><b>${trackIdx + 1}/${act.length}</b><button data-tnext title="Suivante">›</button></span></div>
      <div class="steps">${MSTEPS.map((st, i) => `<div class="step ${i < cur ? "done" : i === cur ? "cur" : "fut"}"><div class="c">${UI.icon(MICON[st], 13)}</div><div class="n">${esc(st)}</div><div class="tm">${esc(tm(st))}</div></div>`).join("")}</div>
      <div class="trk-bar"><i style="animation-duration:${ROTATE_MS}ms"></i></div></div>
      <div class="mini" data-truck="${t ? esc(t.id) : ""}">${UI.carPic(m.vehicle.hex || "#dfe3e8")}<div><div class="t">${esc(m.vehicle.plate)}</div><div class="s">${esc(m.vehicle.make)} ${esc(m.vehicle.model)}</div><div class="e">${t ? esc(t.name) + " · " + esc(t.kind) : "Camion à affecter"}${d ? " · " + esc(d.first || d.name.split(" ")[0]) : ""}</div></div><span class="chev">›</span></div>`;
    const mini = track.querySelector(".mini"); if (mini) mini.addEventListener("click", () => { if (t) select({ kind: "truck", id: t.id }); else APP.open("missions", { id: m.id }); });
    track.querySelector("[data-tprev]").addEventListener("click", () => { trackPinned = null; trackIdx--; renderTrack(); armTrack(); });
    track.querySelector("[data-tnext]").addEventListener("click", () => { trackPinned = null; trackIdx++; renderTrack(); armTrack(); });
    track.querySelector(".hd").addEventListener("click", (e) => { if (!e.target.closest("button")) APP.open("missions", { id: m.id }); });
  }
  function armTrack() { clearInterval(trackTimer); trackTimer = setInterval(() => { if (trackPaused || document.hidden || !view.classList.contains("on")) return; trackPinned = null; trackIdx++; renderTrack(); }, ROTATE_MS); }
  if (track) { track.addEventListener("pointerenter", () => { trackPaused = true; }); track.addEventListener("pointerleave", () => { trackPaused = false; }); }
  function renderBoard() {
    if (!tabs || !blist) return;
    const S = CX.S, rel = DEP.inPark().filter((g) => g.status !== "En garde").sort((a, b) => (a.since < b.since ? -1 : 1)), fresh = DEP.inPark().filter((g) => g.step === "Non traité"), act = activeMissions(), mails = (S.insMail || []).filter((x) => !x.handledAt);
    const T = [["relance", "À relancer", rel.length], ["new", "Non traités", fresh.length], ["missions", "Missions", act.length], ["mails", "Assureurs", mails.length], ["fleet", "Flotte", S.trucks.length]];
    tabs.innerHTML = `<span class="bi">${UI.icon("layers", 15)}</span>${T.map(([k, l, n]) => `<button class="tab ${tab === k ? "on" : ""}" data-tab="${k}">${l} <small>${n}</small></button>`).join("")}`;
    tabs.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; renderBoard(); }));
    const chip = (t, tone) => `<span class="badge b-${tone}" style="font-size:10.5px">${esc(t)}</span>`;
    let rows = "";
    const gRow = (g, badge) => `<div class="br" data-g="${esc(g.id)}"><div class="id">${esc(g.vehicle.plate)}<small>${esc(g.slot)}</small></div><div class="ds">${esc(g.vehicle.make)} ${esc(g.vehicle.model)} · ${esc(g.mandant)}</div><div class="bd">${badge}</div><div class="pg">${DEP.gardeDays(g)} j</div><span class="ch">›</span></div>`;
    if (tab === "relance") rows = rel.map((g) => gRow(g, chip(g.status, g.status === "Abandon présumé" ? "red" : "amber"))).join("") || `<div class="muted" style="padding:12px;font-size:12px">Aucun véhicule à relancer.</div>`;
    if (tab === "new") rows = fresh.map((g) => gRow(g, chip("Non traité", "purple"))).join("") || `<div class="muted" style="padding:12px;font-size:12px">Tous les véhicules arrivés sont traités.</div>`;
    if (tab === "missions") rows = act.map((m) => { const t = m.truckId ? DEP.truck(m.truckId) : null; return `<div class="br" data-m="${esc(m.id)}"><div class="id">${esc(m.no)}<small>${esc(m.vehicle.plate)}</small></div><div class="ds">${esc(m.kind)} · ${esc(m.address)}</div><div class="bd">${chip(m.status, m.status === "Demandée" ? "red" : "blue")}</div><div class="pg">${t ? esc(t.name) : "—"}</div><span class="ch">›</span></div>`; }).join("") || `<div class="muted" style="padding:12px;font-size:12px">Aucune mission en cours.</div>`;
    if (tab === "mails") rows = mails.map((x) => `<div class="br" data-mail="${esc(x.id)}"><div class="id">${esc(x.ref || "—")}<small>${esc(x.plate || "")}</small></div><div class="ds">${esc(x.subject)}</div><div class="bd">${chip({ accord: "Accord", refus: "Refus", paiement: "Paiement", pieces: "Pièces", relance: "Relance" }[x.intent] || x.intent, { accord: "green", refus: "red", paiement: "green", pieces: "amber", relance: "amber" }[x.intent] || "slate")}</div><div class="pg">${esc(x.from.split("@")[1] || "")}</div><span class="ch">›</span></div>`).join("") || `<div class="muted" style="padding:12px;font-size:12px">Boîte mail assureurs à jour.</div>`;
    if (tab === "fleet") rows = `<div class="fgrid">${S.trucks.map((t) => { const d = t.driverId ? DEP.driver(t.driverId) : null, m = S.missions.find((x) => x.truckId === t.id && !["Terminée", "Facturée"].includes(x.status)); return `<div class="ft ${t.status === "Disponible" ? "ok" : t.status === "Entretien" ? "ko" : "busy"}" data-t="${esc(t.id)}"><div class="fi">${UI.truckIcon ? UI.truckIcon(t.kind, 44) : UI.icon("truck", 30)}</div><div class="fx"><b>${esc(t.name)}</b><small>${esc(t.brand || t.kind)}${t.year ? " " + t.year : ""}</small><small class="st">${m ? esc(m.no) + " · " + esc(m.status) : esc(t.status)}</small></div>${d ? `<span class="bav" style="background:${esc(d.color || "#1768ee")}" title="${esc(d.name)}">${esc(d.ini)}</span>` : ""}</div>`; }).join("")}</div>`;
    blist.innerHTML = rows;
    blist.querySelectorAll("[data-g]").forEach((r) => r.addEventListener("click", () => select({ kind: "garde", id: r.dataset.g })));
    blist.querySelectorAll("[data-t]").forEach((r) => r.addEventListener("click", () => select({ kind: "truck", id: r.dataset.t })));
    blist.querySelectorAll("[data-m]").forEach((r) => r.addEventListener("click", () => { trackPinned = r.dataset.m; renderTrack(); armTrack(); const m = DEP.mission(r.dataset.m); if (m && m.truckId) select({ kind: "truck", id: m.truckId }); else if (m) APP.open("missions", { id: m.id }); }));
    blist.querySelectorAll("[data-mail]").forEach((r) => r.addEventListener("click", () => APP.open("agent", { tab: "mail" })));
  }
  function renderPanels() { try { renderTrack(); renderBoard(); } catch (e) { console.warn("panneaux parc", e); } }
  view.classList.add("panels-on");

  /* ---------- boucle ---------- */
  const clock = $("#clock");
  const currentPlace = () => { const b = ctl && ctl.querySelector("[data-place].on"); return b ? b.dataset.place : "ALL"; };
  const resize = () => { const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight; renderer.setSize(w, h, true); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  addEventListener("resize", () => { resize(); if (!selected) setPlace(currentPlace()); }); resize();
  camera.position.set(70, 110, 140); controls.target.set(6, 0, 0); setPlace("ALL");
  let lastClock = "";
  function frame(now) {
    requestAnimationFrame(frame);
    if (anim) { const k = Math.min(1, (now - anim.t0) / anim.dur), e = 1 - Math.pow(1 - k, 3); camera.position.lerpVectors(anim.from.p, anim.to.p, e); controls.target.lerpVectors(anim.from.t, anim.to.t, e); if (k >= 1) anim = null; }
    controls.update();
    if (clock) { const c = U.hm(U.nowMin()); if (c !== lastClock) { clock.textContent = c; lastClock = c; } }
    if (view.classList.contains("on")) renderer.render(scene, camera);
  }
  build(); renderPanels(); armTrack();
  requestAnimationFrame(frame);
  let rebuildT = null; const rebuild = () => { clearTimeout(rebuildT); rebuildT = setTimeout(() => { build(); renderPanels(); if (selected) select(selected, false); }, 150); };
  CX.on("change", rebuild); CX.on("remote", rebuild); CX.on("reset", rebuild);
  const intro = $("#intro"); if (intro) setTimeout(() => intro.classList.add("off"), 600);
  const hint = $("#hint"); if (hint) setTimeout(() => hint.classList.add("off"), 9000);
  window.PARC3D = { build, select, flyTo, setPlace, scene, camera, counts: () => ({ cars: pick.filter((o) => o.userData.kind === "garde").length, trucks: pick.filter((o) => o.userData.kind === "truck").length }) };
})();
