/* ==========================================================================
   Parc live 3D (MOTEK Dépann) — scène écrite pour le dépannage :
   un grand parc de gardiennage (véhicules rangés par ordre chronologique
   d'entrée, couleur réelle, plaque et jours de garde), et à droite le dépôt
   des camions (plateaux, paniers, porte-voitures) selon leur statut.
   Clic sur un véhicule ou un camion → fiche à droite. Three.js, code MOTEK.
   ========================================================================== */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

(function () {
  const $ = (s) => document.querySelector(s);
  const view = $("#view-map"), host = $("#scene");
  if (!view || !host) return;
  const U = CX.util, esc = U.esc;

  /* ---------- rendu ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef1f4);
  scene.fog = new THREE.Fog(0xeef1f4, 140, 260);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 600);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI / 2.2; controls.minDistance = 10; controls.maxDistance = 180;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc4ccd6, 1.05));
  const sun = new THREE.DirectionalLight(0xfff6e6, 2.2);
  sun.position.set(-40, 70, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 80, bottom: -80, near: 10, far: 220 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  /* ---------- matériaux & géométries ---------- */
  const matCache = new Map();
  const mat = (color, o = {}) => { const k = color + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, o))); return matCache.get(k); };
  const box = (parent, w, h, d, m, x = 0, y = 0, z = 0, shadow = true) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); g.castShadow = shadow; g.receiveShadow = true; parent.add(g); return g; };
  const BLUE = 0x1768ee, ASPHALT = 0x9a9ea6, LINE = 0xf4f5f7, KERB = 0xd6d9de;

  /* ---------- sol, parc, dépôt ---------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(0xdfe3e8, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const LOT = { x: -34, z: 0, w: 72, d: 46 }, DEPOT = { x: 44, z: 0, w: 34, d: 46 };
  const slab = (r, color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), mat(color, { roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.set(r.x, 0.02, r.z); m.receiveShadow = true; scene.add(m); return m; };
  slab(LOT, ASPHALT); slab(DEPOT, 0x8e939b);
  const kerb = (r) => { for (const [x, z, w, d] of [[r.x, r.z - r.d / 2, r.w, 0.5], [r.x, r.z + r.d / 2, r.w, 0.5], [r.x - r.w / 2, r.z, 0.5, r.d], [r.x + r.w / 2, r.z, 0.5, r.d]]) box(scene, w, 0.25, d, mat(KERB), x, 0.12, z, false); };
  kerb(LOT); kerb(DEPOT);
  // mur de séparation parc / dépôt avec le portail
  box(scene, 0.6, 2.4, 20, mat(0xffffff), 6, 1.2, -13); box(scene, 0.6, 2.4, 20, mat(0xffffff), 6, 1.2, 13);
  box(scene, 0.62, 0.3, 46.4, mat(BLUE), 6, 2.55, 0, false);
  // lampadaires
  const lampM = mat(0x3a3f47, { metalness: 0.4, roughness: 0.5 });
  for (const [x, z] of [[-66, -21], [-66, 21], [-2, -21], [-2, 21], [28, -21], [28, 21], [60, -21], [60, 21]]) { box(scene, 0.25, 7, 0.25, lampM, x, 3.5, z); box(scene, 1.6, 0.18, 0.5, mat(0xffffff, { emissive: 0xfff4d6, emissiveIntensity: 1.2 }), x, 7, z, false); }
  // arbres simples autour
  const treeM = mat(0x8fd0a0), trunkM = mat(0x8b6b4a);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = 86 + (i % 3) * 8, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.55; if (Math.abs(x) < 80 && Math.abs(z) < 28) continue; box(scene, 0.4, 1.6, 0.4, trunkM, x, 0.8, z); const c = new THREE.Mesh(new THREE.SphereGeometry(1.8 + (i % 3) * 0.3, 12, 9), treeM); c.position.set(x, 2.8, z); c.castShadow = true; scene.add(c); }

  /* ---------- étiquettes (sprites texte) ---------- */
  const labelCache = new Map();
  const label = (text, opts = {}) => {
    const key = text + JSON.stringify(opts);
    if (!labelCache.has(key)) {
      const c = document.createElement("canvas"), w = 256, h = 72; c.width = w; c.height = h; const g = c.getContext("2d");
      g.fillStyle = opts.bg || "rgba(255,255,255,.92)"; g.beginPath(); g.roundRect(8, 10, w - 16, h - 20, 14); g.fill();
      g.fillStyle = opts.fg || "#121418"; g.font = "800 " + (opts.size || 28) + "px Inter, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 1);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      labelCache.set(key, new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    }
    const s = new THREE.Sprite(labelCache.get(key)); s.scale.set(opts.w || 3.6, (opts.w || 3.6) * 72 / 256, 1); s.renderOrder = 5; return s;
  };

  /* ---------- voitures & camions procéduraux ---------- */
  const glassM = mat(0x2b3440, { roughness: 0.2, metalness: 0.3 }), tireM = mat(0x22252a, { roughness: 0.9 }), rimM = mat(0xc9ced6, { metalness: 0.6, roughness: 0.35 });
  function car(hex) {
    const g = new THREE.Group(), body = mat(new THREE.Color(hex || "#c9cdd3").getHex(), { roughness: 0.45, metalness: 0.15 });
    box(g, 1.8, 0.55, 4.2, body, 0, 0.55, 0); box(g, 1.6, 0.5, 2.2, body, 0, 1.05, -0.2); box(g, 1.5, 0.42, 1.9, glassM, 0, 1.08, -0.2, false);
    for (const [x, z] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 16), tireM); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); w.castShadow = true; g.add(w); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12), rimM); r.rotation.z = Math.PI / 2; r.position.set(x, 0.34, z); g.add(r); }
    box(g, 0.3, 0.12, 0.06, mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 }), -0.6, 0.6, 2.12, false); box(g, 0.3, 0.12, 0.06, mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 }), 0.6, 0.6, 2.12, false);
    box(g, 0.3, 0.1, 0.06, mat(0xd7261e, { emissive: 0xd7261e, emissiveIntensity: 0.6 }), -0.6, 0.6, -2.12, false); box(g, 0.3, 0.1, 0.06, mat(0xd7261e, { emissive: 0xd7261e, emissiveIntensity: 0.6 }), 0.6, 0.6, -2.12, false);
    return g;
  }
  function truck(kind, tone) {
    const g = new THREE.Group(), cabM = mat(BLUE, { roughness: 0.4, metalness: 0.2 }), bedM = mat(0x2a2d33, { roughness: 0.6, metalness: 0.3 }), frameM = mat(0x5b6670);
    const long = kind === "Porte-voitures" ? 9.5 : 7.2;
    box(g, 2.3, 0.5, long, frameM, 0, 0.6, 0);
    box(g, 2.3, 1.9, 2.2, cabM, 0, 1.75, long / 2 - 1.1); box(g, 2.1, 0.9, 0.9, glassM, 0, 2.1, long / 2 - 0.3, false);
    if (kind === "Panier") { box(g, 2.2, 0.3, long - 2.6, bedM, 0, 0.95, -1.2); const arm = box(g, 0.4, 0.4, 3.2, mat(0xb96400), 0, 1.6, -long / 2 + 1.2); arm.rotation.x = 0.35; box(g, 1.6, 0.2, 0.8, mat(0xb96400), 0, 0.9, -long / 2 + 0.2); }
    else if (kind === "Porte-voitures") { box(g, 2.3, 0.2, long - 2.6, bedM, 0, 1.0, -1.3); box(g, 2.3, 0.2, long - 3, bedM, 0, 3.0, -1.5); for (const z of [-long / 2 + 0.6, 0.3]) { box(g, 0.2, 2.1, 0.2, frameM, -1.05, 2, z); box(g, 0.2, 2.1, 0.2, frameM, 1.05, 2, z); } }
    else { box(g, 2.3, 0.22, long - 2.6, bedM, 0, 0.96, -1.2); box(g, 2.3, 0.12, 1.1, bedM, 0, 0.88, -long / 2 + 0.3).rotation.x = -0.18; box(g, 0.1, 0.5, long - 2.6, mat(0xb96400), -1.1, 1.3, -1.2, false); box(g, 0.1, 0.5, long - 2.6, mat(0xb96400), 1.1, 1.3, -1.2, false); }
    box(g, 1.2, 0.25, 0.4, mat(0xff8c00, { emissive: 0xff8c00, emissiveIntensity: 0.8 }), 0, 2.85, long / 2 - 1.1, false); // gyrophare
    for (const z of [long / 2 - 1.2, -long / 2 + 1.5, -long / 2 + 2.8]) for (const x of [-1.15, 1.15]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16), tireM); w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, z); w.castShadow = true; g.add(w); }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(tone, { emissive: tone, emissiveIntensity: 0.7 })); dot.position.set(0, 3.3, long / 2 - 1.1); g.add(dot);
    return g;
  }

  /* ---------- placement ---------- */
  const dyn = new THREE.Group(); scene.add(dyn);
  const pick = []; // { obj, kind, id }
  const SLOT_W = 2.9, SLOT_D = 5.4, ROWS = 4, PER_ROW = 24;
  const slotPos = (i) => { const row = Math.floor(i / PER_ROW), col = i % PER_ROW; const x = LOT.x - LOT.w / 2 + 2.2 + col * SLOT_W + SLOT_W / 2; const z = LOT.z - LOT.d / 2 + 3 + row * (SLOT_D + 2.4) + SLOT_D / 2 + (row >= 2 ? 3 : 0); return { x, z, row }; };
  const markings = new THREE.Group(); scene.add(markings);
  for (let i = 0; i < ROWS * PER_ROW; i++) { const p = slotPos(i); box(markings, 0.12, 0.02, SLOT_D, mat(LINE), p.x - SLOT_W / 2, 0.04, p.z, false); if (i % PER_ROW === PER_ROW - 1) box(markings, 0.12, 0.02, SLOT_D, mat(LINE), p.x + SLOT_W / 2, 0.04, p.z, false); }
  // bandes de niveau (N-1, N-2, N-3) : trois bandes de 32 places
  const LEVEL_SLOTS = 32;
  for (let l = 0; l < 3; l++) { const p0 = slotPos(l * LEVEL_SLOTS); const s = label(["Niveau -1", "Niveau -2", "Niveau -3"][l], { bg: "rgba(23,104,238,.95)", fg: "#fff", size: 30, w: 7 }); s.position.set(p0.x + 5, 3.2, p0.z - SLOT_D / 2 - 0.8); scene.add(s); }
  const BAY_W = 4.2, BAY_D = 11;
  const bayPos = (i) => ({ x: DEPOT.x - DEPOT.w / 2 + 3 + (i % 6) * (BAY_W + 1.2) + BAY_W / 2, z: i < 6 ? DEPOT.z - 11 : DEPOT.z + 11 });
  for (let i = 0; i < 12; i++) { const p = bayPos(i); box(markings, 0.14, 0.02, BAY_D, mat(LINE), p.x - BAY_W / 2, 0.04, p.z, false); box(markings, 0.14, 0.02, BAY_D, mat(LINE), p.x + BAY_W / 2, 0.04, p.z, false); box(markings, BAY_W, 0.02, 0.14, mat(LINE), p.x, 0.04, p.z + (i < 6 ? -BAY_D / 2 : BAY_D / 2), false); }
  const depotLabel = label("Dépôt camions", { bg: "rgba(42,45,51,.95)", fg: "#fff", size: 30, w: 8 }); depotLabel.position.set(DEPOT.x, 3.4, DEPOT.z - 1); scene.add(depotLabel);
  const TONE = { Disponible: 0x1b9a55, "En mission": 0xff8c00, Entretien: 0xd7261e };

  let built = 0;
  function build() {
    dyn.clear(); pick.length = 0;
    const S = CX.S; if (!S || !S.gardes) return;
    if (window.DEP && DEP.refreshGardeStatus) DEP.refreshGardeStatus();
    // véhicules gardés : par niveau, puis par ordre chronologique d'entrée
    const parked = S.gardes.filter((g) => !g.outAt);
    ["N1", "N2", "N3"].forEach((lvl, li) => {
      parked.filter((g) => g.level === lvl).sort((a, b) => (a.since < b.since ? -1 : 1)).slice(0, LEVEL_SLOTS).forEach((g, k) => {
        const p = slotPos(li * LEVEL_SLOTS + k), c = car(g.vehicle.hex); c.position.set(p.x, 0, p.z); c.rotation.y = p.row % 2 ? Math.PI : 0;
        const days = DEP.gardeDays(g), tone = g.status === "Abandon présumé" ? "rgba(215,38,30,.95)" : g.status === "Relance à faire" ? "rgba(185,100,0,.95)" : "rgba(255,255,255,.92)";
        const s = label(g.vehicle.plate + "  " + days + " j", { bg: tone, fg: tone.startsWith("rgba(255") ? "#121418" : "#fff", size: 26, w: 3.4 }); s.position.set(0, 2.3, 0); c.add(s);
        c.userData = { kind: "garde", id: g.id }; dyn.add(c); pick.push(c);
      });
    });
    // camions : au dépôt s'ils sont disponibles ou en entretien ; en mission → emplacement vide marqué
    S.trucks.slice(0, 12).forEach((t, i) => {
      const p = bayPos(i);
      if (t.status === "En mission") { const s = label(t.name + " · en mission", { bg: "rgba(255,140,0,.18)", fg: "#b96400", size: 24, w: 4.6 }); s.position.set(p.x, 0.6, p.z); s.userData = { kind: "truck", id: t.id }; dyn.add(s); pick.push(s); return; }
      const tr = truck(t.kind, TONE[t.status] || 0x1b9a55); tr.position.set(p.x, 0, p.z); tr.rotation.y = i < 6 ? 0 : Math.PI;
      const s = label(t.name, { size: 28, w: 4 }); s.position.set(0, 4.2, 0); tr.add(s);
      if (t.status === "Entretien") { const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 10), mat(0xff6a00)); cone.position.set(p.x + 2.6, 0.45, p.z + (i < 6 ? 5 : -5)); dyn.add(cone); }
      tr.userData = { kind: "truck", id: t.id }; dyn.add(tr); pick.push(tr);
    });
    built++;
    kpis();
  }
  function kpis() {
    const S = CX.S, parked = S.gardes.filter((g) => !g.outAt), free = S.trucks.filter((t) => t.status === "Disponible");
    const k1 = $("#k1"), k1s = $("#k1s"), k1d = $("#k1d"); if (k1) k1.textContent = parked.length; if (k1s) k1s.textContent = S.parc.levels.map((l) => l.name.replace("Niveau ", "N") + " " + parked.filter((g) => g.level === l.id).length).join(" · "); if (k1d) k1d.textContent = parked.filter((g) => g.status !== "En garde").length + " à relancer";
    const cards = view.querySelectorAll(".kpis .kpi");
    if (cards[1]) { cards[1].querySelector(".l").textContent = "Camions disponibles"; cards[1].querySelector(".v b").textContent = free.length + "/" + S.trucks.length; cards[1].querySelector(".v .d").textContent = S.trucks.filter((t) => t.status === "En mission").length + " en mission"; cards[1].querySelector(".s").textContent = S.trucks.filter((t) => t.status === "Entretien").length + " en entretien"; cards[1].style.display = ""; }
    if (cards[2]) cards[2].style.display = "none";
  }

  /* ---------- fiche latérale ---------- */
  const detail = $("#detail");
  let selected = null;
  function showGarde(g) {
    const days = DEP.gardeDays(g), fees = DEP.gardeFees(g);
    detail.innerHTML = `<div class="pd"><div class="pd-h"><div class="pd-ic" style="background:${esc(g.vehicle.hex)}"></div><div><div class="pd-k">Parc · ${esc(g.level)} · place ${esc(g.slot.split("-")[1])}</div><h3>${esc(g.vehicle.make)} ${esc(g.vehicle.model)}</h3><div class="pd-s">${UI.plate(g.vehicle.plate)} ${BO.chip(g.status, g.status === "Abandon présumé" ? "red" : g.status === "Relance à faire" ? "amber" : "green", true)}</div></div><button class="pd-x" data-x>${UI.icon("x", 16)}</button></div>
      <div class="tiles"><div class="tile"><div class="tl">Entrée</div><div class="tv">${esc(U.fmtD(g.since))}</div></div><div class="tile"><div class="tl">Jours</div><div class="tv">${days}</div></div><div class="tile"><div class="tl">Frais</div><div class="tv">${esc(U.chf(fees))}</div></div><div class="tile"><div class="tl">Mandant</div><div class="tv" style="font-size:13px">${esc(g.mandant)}</div></div></div>
      <dl class="kv mt"><dt>Motif</dt><dd>${esc(g.reason)}</dd><dt>Référence</dt><dd>${esc(g.ref || "—")}</dd><dt>Propriétaire</dt><dd>${esc(g.owner.name || "—")}<br>${esc(g.owner.phone || "")}</dd></dl>
      <div class="pd-acts"><button class="btn pri" data-open-g="${g.id}">${UI.icon("layers", 14)}Ouvrir la garde</button><button class="btn" data-open-m="mandats:${g.id}">${UI.icon("shield", 14)}Mandat</button>${g.owner.phone ? `<a class="btn" href="tel:${esc(g.owner.phone.replace(/\\s/g, ""))}">${UI.icon("phone", 14)}Appeler</a>` : ""}</div></div>`;
    bindDetail();
  }
  function showTruck(t) {
    const m = CX.S.missions.find((x) => x.truckId === t.id && !["Terminée", "Facturée"].includes(x.status)), d = t.driverId ? DEP.driver(t.driverId) : null;
    detail.innerHTML = `<div class="pd"><div class="pd-h"><div class="pd-ic" style="background:#1768ee;display:grid;place-items:center;color:#fff">${UI.icon("truck", 20)}</div><div><div class="pd-k">Dépôt camions</div><h3>${esc(t.name)}</h3><div class="pd-s">${esc(t.kind)} · ${esc(t.plate)} ${BO.chip(t.status, t.status === "Disponible" ? "green" : t.status === "Entretien" ? "red" : "amber", true)}</div></div><button class="pd-x" data-x>${UI.icon("x", 16)}</button></div>
      <dl class="kv"><dt>Chauffeur</dt><dd>${d ? esc(d.name) + "<br>" + esc(d.phone || "") : "—"}</dd><dt>Marque</dt><dd>${esc(t.brand || "—")} · ${U.chf ? "" : ""}${esc(String(t.km))} km</dd>${t.ct ? `<dt>Contrôle technique</dt><dd>${esc(U.fmtD(t.ct))}</dd>` : ""}${t.notes ? `<dt>Notes</dt><dd>${esc(t.notes)}</dd>` : ""}</dl>
      ${m ? `<div class="form-note mt">${UI.icon("pin", 15)}<div><b>${esc(m.no)}</b> · ${esc(m.status)}<br>${esc(m.kind)} · ${esc(m.address)}</div></div>` : ""}
      <div class="pd-acts">${m ? `<button class="btn pri" data-open="missions:${m.id}">${UI.icon("truck", 14)}Ouvrir la mission</button>` : `<button class="btn pri" data-open="missions::new">${UI.icon("plus", 14)}Nouvelle mission</button>`}<button class="btn" data-open="fleet">${UI.icon("lift", 14)}Flotte</button></div></div>`;
    bindDetail();
  }
  function bindDetail() {
    detail.classList.remove("off");
    detail.querySelector("[data-x]").addEventListener("click", () => { detail.classList.add("off"); selected = null; });
    detail.querySelectorAll("[data-open-g]").forEach((b) => b.addEventListener("click", () => APP.open("parc", { id: b.dataset.openG })));
    detail.querySelectorAll("[data-open-m]").forEach((b) => b.addEventListener("click", () => { const [mod, id] = b.dataset.openM.split(":"); APP.open(mod, { id }); }));
    detail.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { const [mod, id] = b.dataset.open.split(":"); APP.open(mod, id === "" ? { tab: "new" } : id ? { id } : {}); }));
  }

  /* ---------- caméra : vues ---------- */
  let anim = null;
  function flyTo(target, dist, az = 0.55, pol = 0.9, dur = 1.1) {
    const from = { p: camera.position.clone(), t: controls.target.clone() };
    const to = { t: new THREE.Vector3(target.x, 0, target.z) };
    to.p = new THREE.Vector3(to.t.x + dist * Math.sin(pol) * Math.sin(az), dist * Math.cos(pol), to.t.z + dist * Math.sin(pol) * Math.cos(az));
    const t0 = performance.now(); anim = { from, to, t0, dur: dur * 1000 };
  }
  const VIEWS = { ALL: () => flyTo({ x: 6, z: 2 }, 118, 0.5, 0.78), PARC: () => flyTo({ x: LOT.x, z: LOT.z }, 74, 0.4, 0.82), DEPOT: () => flyTo({ x: DEPOT.x, z: DEPOT.z }, 48, 0.7, 0.85) };
  const PLACES = [["ALL", "cube", "Site"], ["PARC", "layers", "Parc"], ["DEPOT", "truck", "Camions"]];
  const ctl = view.querySelector(".ctl");
  if (ctl) {
    const tour = ctl.querySelector("#tourBtn"); if (tour) tour.style.display = "none";
    PLACES.forEach(([id, ic, l]) => { const b = document.createElement("button"); b.className = "nav"; b.dataset.place = id; b.innerHTML = UI.icon(ic, 17) + "<span>" + l + "</span>"; b.addEventListener("click", () => { VIEWS[id](); ctl.querySelectorAll("[data-place]").forEach((x) => x.classList.toggle("on", x === b)); }); ctl.appendChild(b); });
    ctl.querySelector('[data-place="ALL"]').classList.add("on");
  }
  const zt = $("#zt"), zs = $("#zs"), ztag = $("#ztag"); if (zt) zt.textContent = "Parc & dépôt"; if (zs) zs.textContent = "Dan Dépanne · Paris 10e"; if (ztag) ztag.textContent = "DD";

  /* ---------- interaction ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let down = null;
  const hit = (e) => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); const hits = ray.intersectObjects(pick, true); if (!hits.length) return null; let o = hits[0].object; while (o && !(o.userData && o.userData.kind)) o = o.parent; return o; };
  renderer.domElement.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener("pointerup", (e) => { if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; const o = hit(e); if (!o) return; select(o.userData); });
  renderer.domElement.addEventListener("pointermove", (e) => { const o = hit(e); renderer.domElement.style.cursor = o ? "pointer" : ""; });
  function select(u, fly = true) {
    selected = u;
    if (u.kind === "garde") { const g = DEP.garde(u.id); if (!g) return false; showGarde(g); const o = pick.find((p) => p.userData.id === u.id); if (fly && o) flyTo(o.position, 22, 0.45, 0.95); return true; }
    if (u.kind === "truck") { const t = DEP.truck(u.id); if (!t) return false; showTruck(t); const o = pick.find((p) => p.userData.id === u.id); if (fly && o) flyTo(o.position, 26, 0.6, 0.95); return true; }
    return false;
  }
  APP.focusHandlers.push((target) => {
    if (!target) return false;
    if (target.type === "garde") return select({ kind: "garde", id: target.id });
    if (target.type === "truck") return select({ kind: "truck", id: target.id });
    if (target.type === "mission") { const m = DEP.mission(target.id); if (m && m.gardeId) return select({ kind: "garde", id: m.gardeId }); if (m && m.truckId) return select({ kind: "truck", id: m.truckId }); }
    if (target.type === "vehicle" && typeof target.id === "string") { const g = DEP.inPark().find((x) => x.vehicle.plate === target.id); if (g) return select({ kind: "garde", id: g.id }); }
    return false;
  });
  window.MAP_SEARCH = (q) => { const out = [], n = (s) => String(s).toLowerCase(); DEP.inPark().forEach((g) => { if (n(g.vehicle.plate + " " + g.vehicle.make + " " + g.vehicle.model).includes(q)) out.push({ grp: "Parc", ic: "car", t: g.vehicle.plate + " · " + g.vehicle.make + " " + g.vehicle.model, s: g.level + " · " + DEP.gardeDays(g) + " j · " + g.mandant, mapOnly: true, go: () => APP.showInMap("garde", g.id) }); }); CX.S.trucks.forEach((t) => { if (n(t.name + " " + t.plate + " " + t.kind).includes(q)) out.push({ grp: "Camions", ic: "truck", t: t.name, s: t.kind + " · " + t.status, mapOnly: true, go: () => APP.showInMap("truck", t.id) }); }); return out; };

  /* ---------- boucle ---------- */
  const clock = $("#clock");
  const resize = () => { const w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  addEventListener("resize", resize); resize();
  camera.position.set(60, 90, 120); controls.target.set(6, 0, 2); VIEWS.ALL();
  let lastClock = "";
  function frame(now) {
    requestAnimationFrame(frame);
    if (anim) { const k = Math.min(1, (now - anim.t0) / anim.dur), e = 1 - Math.pow(1 - k, 3); camera.position.lerpVectors(anim.from.p, anim.to.p, e); controls.target.lerpVectors(anim.from.t, anim.to.t, e); if (k >= 1) anim = null; }
    controls.update();
    if (clock) { const c = U.hm(U.nowMin()); if (c !== lastClock) { clock.textContent = c; lastClock = c; } }
    if (view.classList.contains("on")) renderer.render(scene, camera);
  }
  /* ---------- panneaux bas : missions en cours et listes ---------- */
  const track = $("#track"), tabs = $("#tabs"), blist = $("#blist");
  const MSTEPS = ["Demandée", "Affectée", "En route", "Sur place", "Remorquage", "Déposée au parc", "Terminée"];
  const MICON = { "Demandée": "bell", "Affectée": "user", "En route": "truck", "Sur place": "map", "Remorquage": "layers", "Déposée au parc": "pin", "Terminée": "check" };
  let tab = "relance", trackId = null;
  function activeMissions() { return (CX.S.missions || []).filter((m) => ["Affectée", "En route", "Sur place", "Remorquage"].includes(m.status)).sort((a, b) => (a.at < b.at ? 1 : -1)); }
  function renderTrack() {
    if (!track) return;
    const act = activeMissions(); const m = act.find((x) => x.id === trackId) || act[0]; trackId = m ? m.id : null;
    if (!m) { track.innerHTML = `<div class="main"><div class="hd"><span class="ic">${UI.icon("truck", 16)}</span>Missions en cours<small>aucune mission sur la route</small></div><div class="muted" style="margin:auto 0;font-size:12px">Les missions affectées apparaissent ici avec leur avancement et le camion engagé.</div></div>`; return; }
    const cur = MSTEPS.indexOf(m.status), t = m.truckId ? DEP.truck(m.truckId) : null, d = m.driverId ? DEP.driver(m.driverId) : null;
    const tm = (st) => { const h = (m.history || []).find((x) => x.text === "Statut : " + st); const t = h && String(h.at).split(" ")[1]; return t ? t.slice(0, 5) : ""; };
    track.innerHTML = `<div class="main"><div class="hd"><span class="ic">${UI.icon("truck", 16)}</span>${esc(m.no)} · ${esc(m.kind)}<small>${act.length} mission${act.length > 1 ? "s" : ""} en cours · ${esc(m.address)}</small></div>
      <div class="steps">${MSTEPS.map((st, i) => `<div class="step ${i < cur ? "done" : i === cur ? "cur" : "fut"}"><div class="c">${UI.icon(MICON[st], 13)}</div><div class="n">${esc(st)}</div><div class="tm">${esc(tm(st))}</div></div>`).join("")}</div></div>
      <div class="mini" data-truck="${t ? esc(t.id) : ""}">${UI.carPic(m.vehicle.hex || "#dfe3e8")}<div><div class="t">${esc(m.vehicle.plate)}</div><div class="s">${esc(m.vehicle.make)} ${esc(m.vehicle.model)}</div><div class="e">${t ? esc(t.name) + " · " + esc(t.kind) : "Camion à affecter"}${d ? " · " + esc(d.name.split(" ")[0]) : ""}</div></div><span class="chev">${"›"}</span></div>`;
    const mini = track.querySelector(".mini"); if (mini && t) mini.addEventListener("click", () => select({ kind: "truck", id: t.id }));
  }
  function renderBoard() {
    if (!tabs || !blist) return;
    const S = CX.S, rel = DEP.inPark().filter((g) => g.status !== "En garde").sort((a, b) => (a.since < b.since ? -1 : 1)), act = activeMissions(), mails = (S.insMail || []).filter((x) => !x.handledAt);
    const T = [["relance", "À relancer", rel.length], ["missions", "Missions", act.length], ["mails", "Assureurs", mails.length]];
    tabs.innerHTML = `<span class="bi">${UI.icon("layers", 15)}</span>${T.map(([k, l, n]) => `<button class="tab ${tab === k ? "on" : ""}" data-tab="${k}">${l} <small>${n}</small></button>`).join("")}<span class="site">${esc(S.company.name)}</span>`;
    tabs.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; renderBoard(); }));
    const chip = (t, tone) => `<span class="badge ${tone}" style="font-size:10.5px">${esc(t)}</span>`;
    let rows = "";
    if (tab === "relance") rows = rel.map((g) => `<div class="br" data-g="${esc(g.id)}"><div class="id">${esc(g.vehicle.plate)}<small>${esc(g.slot)}</small></div><div class="ds">${esc(g.vehicle.make)} ${esc(g.vehicle.model)} · ${esc(g.mandant)}</div><div class="bd">${chip(g.status, g.status === "Abandon présumé" ? "red" : "amber")}</div><div class="pg">${DEP.gardeDays(g)} j</div><span class="ch">${"›"}</span></div>`).join("") || `<div class="muted" style="padding:12px;font-size:12px">Aucun véhicule à relancer.</div>`;
    if (tab === "missions") rows = act.map((m) => { const t = m.truckId ? DEP.truck(m.truckId) : null; return `<div class="br" data-m="${esc(m.id)}"><div class="id">${esc(m.no)}<small>${esc(m.vehicle.plate)}</small></div><div class="ds">${esc(m.kind)} · ${esc(m.address)}</div><div class="bd">${chip(m.status, "blue")}</div><div class="pg">${t ? esc(t.name) : "—"}</div><span class="ch">${"›"}</span></div>`; }).join("") || `<div class="muted" style="padding:12px;font-size:12px">Aucune mission en cours.</div>`;
    if (tab === "mails") rows = mails.map((x) => `<div class="br" data-mail="${esc(x.id)}"><div class="id">${esc(x.ref || "—")}<small>${esc(x.plate || "")}</small></div><div class="ds">${esc(x.subject)}</div><div class="bd">${chip({ accord: "Accord", refus: "Refus", paiement: "Paiement", pieces: "Pièces" }[x.intent] || x.intent, { accord: "green", refus: "red", paiement: "green", pieces: "amber" }[x.intent] || "slate")}</div><div class="pg">${esc(x.from.split("@")[1] || "")}</div><span class="ch">${"›"}</span></div>`).join("") || `<div class="muted" style="padding:12px;font-size:12px">Boîte mail assureurs à jour.</div>`;
    blist.innerHTML = rows;
    blist.querySelectorAll("[data-g]").forEach((r) => r.addEventListener("click", () => select({ kind: "garde", id: r.dataset.g })));
    blist.querySelectorAll("[data-m]").forEach((r) => r.addEventListener("click", () => { trackId = r.dataset.m; renderTrack(); const m = DEP.mission(r.dataset.m); if (m && m.truckId) select({ kind: "truck", id: m.truckId }); }));
    blist.querySelectorAll("[data-mail]").forEach((r) => r.addEventListener("click", () => APP.open("mandats", { tab: "mail" })));
  }
  function renderPanels() { try { renderTrack(); renderBoard(); } catch (e) { console.warn("panneaux parc", e); } }
  view.classList.add("panels-on");

  build(); renderPanels();
  requestAnimationFrame(frame);
  let rebuildT = null; const rebuild = () => { clearTimeout(rebuildT); rebuildT = setTimeout(() => { build(); renderPanels(); if (selected) select(selected, false); }, 150); };
  CX.on("change", rebuild); CX.on("remote", rebuild); CX.on("reset", rebuild);
  const intro = $("#intro"); if (intro) setTimeout(() => intro.classList.add("off"), 600);
  const hint = $("#hint"); if (hint) setTimeout(() => hint.classList.add("off"), 9000);
  window.PARC3D = { build, select, flyTo, scene, camera, counts: () => ({ cars: pick.filter((o) => o.userData.kind === "garde").length, trucks: pick.filter((o) => o.userData.kind === "truck").length }) };
})();
