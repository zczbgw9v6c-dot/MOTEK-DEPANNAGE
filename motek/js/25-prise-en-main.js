/* ==========================================================================
   Prise en main : visite guidée page par page. À chaque étape MOTEK ouvre
   l'écran concerné (parc 3D, dépôt, bureau, tableau de bord, missions, parc,
   assureurs, agent, commandes, facturation) et affiche une carte
   d'explication flottante. Ouverte une seule fois, à la première visite sur
   cet appareil ; rejouable depuis le bouton « œil » de l'en-tête.
   ========================================================================== */
(function () {
  const KEY = "motek-tour-done";
  const map = (place) => () => { if (APP.mode !== "map") APP.setMode("map"); if (window.PARC3D && PARC3D.setPlace) setTimeout(() => PARC3D.setPlace(place), 60); const d = document.querySelector("#detail"); if (d) d.classList.add("off"); };
  const bo = (id, p) => () => APP.open(id, p || {});
  const STEPS = [
    { go: map("ALL"), ic: "cube", t: "Bienvenue, Joseph", d: "Voici votre site vu du ciel : à gauche le <b>parc de gardiennage</b> sur trois niveaux, à droite le <b>dépôt des camions</b>, devant le <b>bureau</b>. Tout ce que vous voyez est relié aux dossiers : un clic sur un véhicule ou un camion ouvre sa fiche." },
    { go: map("PARC"), ic: "layers", t: "Le parc, niveau par niveau", d: "Niveau -1 devant, -2, -3 derrière. Chaque véhicule garde sa couleur, sa plaque et son nombre de jours. Étiquette <b>violette</b> : arrivé et pas encore traité. <b>Orange</b> : plus de 30 jours, à relancer. <b>Rouge</b> : plus de 60 jours, abandon présumé." },
    { go: map("DEPOT"), ic: "truck", t: "Vos camions", d: "Les cinq <b>paniers Toyota Hilux 2025</b>, les plateaux et les porte-voitures sont garés par emplacement. Un camion en mission laisse sa place vide avec son nom ; un camion en entretien a un cône. Le point de couleur sur la cabine donne le statut." },
    { go: map("OFFICE"), ic: "users", t: "Le bureau", d: "Nadia (sinistres & assureurs), Karim (standard & planning) et Sabrina (facturation) ont des profils de démonstration avec leurs modules prévus. Les droits d’accès individuels ne sont pas encore activés. Vous gérez ces accès dans <b>Flotte & chauffeurs → Bureau</b>." },
    { go: bo("dashboard"), ic: "dashboard", t: "Votre journée", d: "Six chiffres qui comptent : missions en attente, camions sur la route, camions disponibles, véhicules au parc, terminées aujourd’hui, gardes à relancer. Juste dessous, <b>Demander à MOTEK</b> : « où est la AB-123-CD ? », « camions disponibles »… Chaque indicateur ouvre sa liste." },
    { go: bo("missions"), ic: "truck", t: "Une demande arrive", d: "AXA, la MAIF, un particulier ou la police appellent : <b>Nouvelle mission</b>. Vous affectez un camion, le chauffeur retrouve sa mission dans <b>Poste chauffeur</b> et touche « Sur place », « Remorquage », « Déposée au parc ». Les heures sont horodatées pour le mandant." },
    { go: bo("planning-dep"), ic: "calendar", t: "Le planning par camion", d: "Choisissez la journée : les missions sont classées par heure prévue dans la ligne de chaque camion. Glissez une mission à affecter sur un camion libre ou utilisez <b>Affecter / déplacer</b> sur tablette. Un camion ou chauffeur déjà engagé est refusé." },
    { go: bo("chauffeur"), ic: "truck", t: "La cabine du chauffeur", d: "Sur téléphone ou tablette, choisissez un chauffeur de démonstration : ses missions, l’appel client, les étapes d’intervention et les photos sont réunis ici. <b>Déposée au parc</b> attribue la première place libre en un geste. Ce sélecteur ne constitue pas une authentification." },
    { go: bo("parc"), ic: "layers", t: "Le dossier du véhicule", d: "Chaque véhicule gardé suit des étapes : <b>non traité → expertise en attente → expertisé → décision assureur → prêt à sortir</b>. Les frais (18 € / jour + 45 € de dossier) courent automatiquement ; la sortie fige les frais et prépare un reçu imprimable. Les gardes anciennes d’un même assureur se relancent en groupe." },
    { go: bo("mandats"), ic: "shield", t: "Assureurs", d: "Chaque mission ou garde d’un assureur devient un <b>mandat</b> : à déclarer, prise en charge demandée, accordée, facturée, payée. L’onglet <b>Compagnies</b> réunit les attentes d’accord, dossiers à facturer, impayés TTC et délais de règlement datés." },
    { go: bo("agent", { tab: "mail" }), ic: "cube", t: "L’agent lit les courriels", d: "L’agent reconnaît la référence sinistre ou la plaque dans les courriels des assureurs, les classe (<b>virement annoncé, accord, pièces demandées, refus</b>) et propose l’action. Ces courriels sont simulés. Rien n’est appliqué sans votre clic ; un virement annoncé ne vaut pas encaissement. Il prépare aussi les <b>relances</b> et les messages <b>WhatsApp</b> aux propriétaires." },
    { go: bo("supply"), ic: "box", t: "Batteries et commandes", d: "Une mission « panne batterie » crée un besoin ; vous le transformez en commande et le <b>bon de commande est préparé</b> pour votre envoi manuel au fournisseur. Suivi : commandée, reçue, posée. Les commandes de réassort des paniers se préparent ici ; aucun stock physique n’est déduit automatiquement." },
    { go: bo("invoices"), ic: "invoice", t: "Facturer", d: "Missions terminées et gardes restituées se facturent au mandant en un clic, avec les libellés du dépannage (remorquage, dépannage sur place, gardiennage, frais de dossier). Acomptes déclarés, avoirs sur le solde non réglé, retards et export de préparation comptable sont disponibles. Les documents restent fictifs." },
    { go: map("ALL"), ic: "check", t: "C’est parti", d: "Vous pouvez rejouer cette visite avec le bouton <b>œil</b> en haut à droite. Bonne journée, Joseph." },
  ];
  let i = 0, card = null;
  function close(done) { if (card) { card.remove(); card = null; } if (done) { try { localStorage.setItem(KEY, "1"); } catch (e) {} } }
  function draw() {
    const s = STEPS[i];
    if (!card) { card = document.createElement("div"); card.className = "coach"; document.body.appendChild(card); }
    card.innerHTML = `<div class="coach-h"><span class="coach-ic">${UI.icon(s.ic, 18)}</span><span class="coach-step">Étape ${i + 1} / ${STEPS.length}</span><button class="coach-x" data-x title="Quitter">${UI.icon("x", 15)}</button></div><h3>${s.t}</h3><p>${s.d}</p><div class="coach-dots">${STEPS.map((_, k) => `<i class="${k === i ? "on" : k < i ? "done" : ""}"></i>`).join("")}</div><div class="coach-f"><button class="btn sm" data-prev ${i === 0 ? "disabled" : ""}>Précédent</button><span class="sp"></span><button class="btn sm pri" data-next>${i === STEPS.length - 1 ? "Terminer" : "Suivant"}</button></div>`;
    card.querySelector("[data-x]").addEventListener("click", () => close(true));
    card.querySelector("[data-prev]").addEventListener("click", () => { if (i > 0) { i--; draw(); } });
    card.querySelector("[data-next]").addEventListener("click", () => { if (i < STEPS.length - 1) { i++; draw(); } else close(true); });
    try { s.go(); } catch (e) { console.warn("tour", e); }
  }
  const open = (from = 0) => { UI.closeModals(); BO.closeDrawer(); i = Math.max(0, Math.min(STEPS.length-1, from)); draw(); };
  const btn = document.createElement("button");
  btn.id = "helpbtn"; btn.className = "gbtn"; btn.title = "Prise en main"; btn.innerHTML = UI.icon("eye", 17);
  btn.addEventListener("click", () => (card ? close(false) : open(0)));
  const anchor = document.querySelector("#gbtn") || document.querySelector("#bell");
  if (anchor) anchor.insertAdjacentElement("beforebegin", btn);
  let done = false; try { done = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (!done && !navigator.webdriver) setTimeout(() => { if (!document.querySelector(".mdl-bg")) open(0); }, 2500);
  window.TOUR = { open, close, STEPS };
})();
