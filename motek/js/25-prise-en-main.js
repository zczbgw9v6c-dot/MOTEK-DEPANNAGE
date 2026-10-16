/* ==========================================================================
   Prise en main : visite guidée courte (8 écrans), ouverte à la première visite
   sur cet appareil et depuis le bouton « ? » de l'en-tête.
   ========================================================================== */
(function () {
  const KEY = "motek-tour-done";
  const STEPS = [
    { ic: "truck", t: "Bienvenue dans MOTEK Dépann", d: "Une seule base pour tout le monde : le <b>tableau de bord</b> au bureau, les <b>missions</b> sur la tablette du camion, le <b>parc</b> chez le gardien. Ce qu’un chauffeur touche sur la route est visible au bureau dans la seconde." },
    { ic: "alert", t: "Une demande arrive", d: "AXA, la MAIF, un particulier ou la police appellent : « Nouvelle mission ». Motif, adresse, véhicule, conducteur, tarif prévu. La mission apparaît en rouge tant qu’aucun camion n’est affecté." },
    { ic: "lift", t: "Affecter un camion", d: "« Affecter un camion » propose les camions disponibles et leur chauffeur habituel. Le camion passe « en mission », la mission passe « en route ». Les camions en entretien ne sont pas proposés." },
    { ic: "pin", t: "Sur la route", d: "Le chauffeur touche « Sur place », puis « Réparé sur place » ou « Remorquage ». Les heures sont horodatées pour le mandant. « Appeler » compose directement le numéro du conducteur." },
    { ic: "layers", t: "Déposer au parc", d: "Pour un remorquage vers le parc : choisir une place libre sur un des trois niveaux. Le véhicule apparaît sur le plan avec sa couleur, sa plaque et son nombre de jours de garde ; les frais courent automatiquement." },
    { ic: "send", t: "Relances et abandons", d: "Au-delà de 30 jours, le parc signale « relance à faire » ; au-delà de 60, « abandon présumé ». Le bouton « Relancer » prépare le courrier au mandant avec le montant des frais ; vous le validez." },
    { ic: "msg", t: "Demandez à MOTEK", d: "Sur le tableau de bord : « où est la AB-123-CD ? », « camions disponibles », « missions en attente », « à facturer ». La réponse arrive avec le bouton pour agir." },
    { ic: "invoice", t: "Facturer et sortir", d: "Une mission terminée ou déposée se facture au mandant en un clic. La sortie du parc calcule les jours et les frais, note à qui le véhicule est remis, et laisse le règlement à la Facturation." },
  ];
  let i = 0, modal = null;
  const open = (from = 0) => {
    i = from;
    const draw = (el) => {
      const s = STEPS[i];
      el.querySelector("[data-tour]").innerHTML = `<div class="tour-ic">${BO.icon(s.ic, 34)}</div><div><div class="tour-step">Étape ${i + 1} / ${STEPS.length}</div><h2>${s.t}</h2><p>${s.d}</p></div>`;
      el.querySelector("[data-dots]").innerHTML = STEPS.map((_, k) => `<i class="${k === i ? "on" : k < i ? "done" : ""}"></i>`).join("");
      el.querySelector("[data-prev]").disabled = i === 0;
      el.querySelector("[data-next]").innerHTML = i === STEPS.length - 1 ? BO.icon("check", 15) + "C’est parti" : "Suivant " + BO.icon("arrowR", 15);
    };
    modal = UI.modal({ title: "Prise en main de MOTEK Dépann", wide: true,
      body: `<div class="tour" data-tour></div><div class="tour-dots" data-dots></div>`,
      foot: `<label class="chk" style="margin-right:auto"><input type="checkbox" data-skip> Ne plus afficher au démarrage</label><button class="btn" data-prev>${BO.icon("arrowL", 15)}Précédent</button><button class="btn pri" data-next></button>`,
      onMount: (el, close) => {
        draw(el);
        el.querySelector("[data-prev]").addEventListener("click", () => { if (i > 0) { i--; draw(el); } });
        el.querySelector("[data-next]").addEventListener("click", () => { if (i < STEPS.length - 1) { i++; draw(el); } else { try { localStorage.setItem(KEY, "1"); } catch (e) {} close(); } });
        el.querySelector("[data-skip]").addEventListener("change", (e) => { try { localStorage.setItem(KEY, e.target.checked ? "1" : "0"); } catch (e2) {} });
      },
      onClose: () => { modal = null; } });
  };
  const btn = document.createElement("button");
  btn.id = "helpbtn"; btn.className = "gbtn"; btn.title = "Prise en main"; btn.innerHTML = UI.icon("eye", 17);
  btn.addEventListener("click", () => open(0));
  const anchor = document.querySelector("#gbtn") || document.querySelector("#bell");
  if (anchor) anchor.insertAdjacentElement("beforebegin", btn);
  let done = false; try { done = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (!done && !navigator.webdriver) setTimeout(() => { if (!document.querySelector(".mdl-bg")) open(0); }, 2500);
  window.TOUR = { open, STEPS };
})();
