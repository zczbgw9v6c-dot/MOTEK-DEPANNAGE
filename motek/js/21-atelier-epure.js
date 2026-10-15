/* ==========================================================================
   MOTEK — atelier live épuré : un seul indicateur (véhicules sur site),
   panneaux contextuels selon la zone regardée. Les chiffres d'affaires et
   délais restent dans le back-office (Paramètres › Activités pour les
   réafficher sur la carte).
   ========================================================================== */
(function () {
  const $ = (s) => document.querySelector(s);
  const view = $("#view-map");
  if (!view) return;
  // Zone (étiquette) → panneaux pertinents.
  //   AT atelier : postes + suivi de la réparation en cours
  //   PE cabine  : suivi de la réparation
  //   RV réception : postes (pour affecter un véhicule arrivé)
  //   ALL, AC accueil, BU bureau, MG magasin, EX parking : carte seule
  const PANELS = {
    AT: { board: true, track: true },
    PE: { board: false, track: true },
    RV: { board: true, track: false },
  };
  const apply = () => {
    const co = (CX.S && CX.S.company) || {};
    view.classList.toggle("epure", !co.liveFinance);
    const tag = ($("#ztag") || {}).textContent || "ALL";
    const p = co.liveFinance ? { board: true, track: true } : PANELS[tag.trim()] || { board: false, track: false };
    const board = view.querySelector(".board"),
      track = $("#track");
    if (board) board.classList.toggle("hid", !p.board);
    if (track) track.classList.toggle("hid", !p.track);
    view.classList.toggle("panels-on", !!(p.board || p.track));
  };
  // Le défilement tactile du panneau ne doit pas atteindre la caméra 3D.
  const detail = $("#detail");
  if (detail) ["touchstart", "touchmove", "wheel"].forEach((ev) => detail.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
  const tag = $("#ztag");
  if (tag) new MutationObserver(apply).observe(tag, { childList: true, characterData: true, subtree: true });
  CX.on("change", apply);
  CX.on("remote", apply);
  apply();
  // Barre latérale : raccourcis vers les lieux du garage (le mode visite reste).
  // [identifiant de zone, icône, libellé, activité requise]
  const PLACES = [
    ["ALL", "cube", "Site", null],
    ["Z-atelier", "wrench", "Atelier", null],
    ["BOOTH", "spray", "Peinture", "peinture"],
    ["Z-recv", "key", "Réception", null],
    ["Z-lounge", "coffee", "Accueil", null],
    ["Z-office", "file", "Bureau", null],
    ["Z-mag", "box", "Magasin", null],
    ["Z-park", "car", "Parking", null],
  ];
  const ZONE_ACT = { BOOTH: "peinture" };
  const zoneOn = (id) => !ZONE_ACT[id] || CX.activityOn(ZONE_ACT[id]);
  // Le menu des zones (rendu par la carte à l'ouverture) et les panneaux cachent les zones d'une activité désactivée.
  const filterZones = () => {
    document.querySelectorAll("#zmenu .zi[data-z]").forEach((z) => { z.style.display = zoneOn(z.dataset.z) ? "" : "none"; });
    view.querySelectorAll(".ctl [data-place]").forEach((b) => { b.style.display = zoneOn(b.dataset.place) ? "" : "none"; });
  };
  const ctl = view.querySelector(".ctl");
  if (ctl) {
    const tour = ctl.querySelector("#tourBtn");
    PLACES.forEach(([id, ic, l, act]) => {
      const b = document.createElement("button");
      b.className = "nav";
      b.dataset.place = id;
      b.title = l;
      b.innerHTML = UI.icon(ic, 17) + "<span>" + l + "</span>";
      b.addEventListener("click", () => APP.showInMap("map", id));
      ctl.insertBefore(b, tour);
    });
    const TAG2ID = { ALL: "ALL", AT: "Z-atelier", PE: "BOOTH", RV: "Z-recv", AC: "Z-lounge", BU: "Z-office", MG: "Z-mag", EX: "Z-park" };
    const mark = () => { const id = TAG2ID[(($("#ztag") || {}).textContent || "ALL").trim()]; ctl.querySelectorAll("[data-place]").forEach((b) => b.classList.toggle("on", b.dataset.place === id)); };
    if (tag) new MutationObserver(mark).observe(tag, { childList: true, characterData: true, subtree: true });
    mark();
    const zm = $("#zmenu");
    if (zm) new MutationObserver(filterZones).observe(zm, { childList: true });
    CX.on("change", filterZones);
    CX.on("remote", filterZones);
    filterZones();
  }
  window.LIVE_EPURE = { apply, PANELS, PLACES };

  /* ---- réglettes LED suspendues au-dessus des postes et de la réception ---- */
  const addLights = () => {
    const M = window.MAP3D;
    if (!M || !M.THREE || M.group.userData.motekLights) return false;
    const T = M.THREE, g = new T.Group();
    g.name = "motek-leds";
    const tube = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f7ff, emissiveIntensity: 1.6, roughness: 0.3 });
    const housing = new T.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.6, metalness: 0.3 });
    const wire = new T.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.8 });
    const bar = (x, z, len, rotY = 0) => {
      const b = new T.Group();
      b.position.set(x, 3.75, z);
      b.rotation.y = rotY;
      const h = new T.Mesh(new T.BoxGeometry(len, 0.08, 0.2), housing); h.position.y = 0.05; b.add(h);
      const t = new T.Mesh(new T.BoxGeometry(len - 0.1, 0.05, 0.14), tube); t.position.y = -0.01; b.add(t);
      for (const dx of [-len / 2 + 0.3, len / 2 - 0.3]) { const w = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.55, 6), wire); w.position.set(dx, 0.36, 0); b.add(w); }
      // halo doux au sol
      const halo = new T.Mesh(new T.PlaneGeometry(len + 1.2, 2.6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false }));
      halo.rotation.x = -Math.PI / 2; halo.position.y = -3.6; b.add(halo);
      g.add(b);
    };
    // deux rangées au-dessus des postes 01 → 04, une au-dessus du poste 05/06 et de la réception
    for (const x of [-24, -18, -12, -6]) { bar(x, -14.2, 4.2); bar(x, -8.8, 4.2); }
    for (const z of [-15, -10, -5]) bar(5.5, z, 4.2);
    for (const x of [-21, -11]) bar(x, 2, 4.2);
    const key = new T.PointLight(0xf6f8ff, 0.9, 42, 1.6); key.position.set(-15, 3.6, -11.5); g.add(key);
    const key2 = new T.PointLight(0xf6f8ff, 0.6, 30, 1.6); key2.position.set(5.5, 3.6, -10); g.add(key2);
    M.group.add(g);
    M.group.userData.motekLights = true;
    return true;
  };
  let tries = 0;
  const tick = setInterval(() => { if (addLights() || ++tries > 60) clearInterval(tick); }, 500);
})();
