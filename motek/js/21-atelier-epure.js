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
  };
  const tag = $("#ztag");
  if (tag) new MutationObserver(apply).observe(tag, { childList: true, characterData: true, subtree: true });
  CX.on("change", apply);
  CX.on("remote", apply);
  apply();
  window.LIVE_EPURE = { apply, PANELS };
})();
