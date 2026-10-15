/* ==========================================================================
   Prise en main : visite guidée courte (8 écrans), ouverte à la première visite
   sur cet appareil et depuis le bouton « ? » de l'en-tête.
   ========================================================================== */
(function () {
  const KEY = "motek-tour-done";
  const STEPS = [
    { ic: "cube", t: "Bienvenue dans MOTEK", d: "Deux faces, une seule base : l’<b>atelier live</b> en 3D pour voir le garage en un coup d’œil, le <b>back-office</b> pour gérer dossiers, devis, pièces et factures. Tout ce que vous faites sur une tablette est visible sur les autres postes." },
    { ic: "car", t: "Touchez une voiture", d: "Dans l’atelier live, touchez un véhicule : sa fiche s’ouvre à droite avec le client, l’étape en cours, le technicien et les boutons « Ouvrir l’OR » et « Fiche client ». La barre de gauche vous emmène directement à l’atelier, la cabine, l’accueil ou le parking." },
    { ic: "wrench", t: "Le dossier, pas à pas", d: "Un ordre de réparation avance de gauche à droite : réception, devis, accord, pièces, travaux, contrôle qualité, prêt, facturé. Le bouton bleu en haut du dossier propose toujours l’étape suivante ; rien ne saute d’étape sans contrôle." },
    { ic: "phone", t: "Dictez les travaux", d: "Dans l’onglet Travaux, le micro transforme une phrase en liste de tâches : « équilibrage, remontage des pneus, remplacement de la lunette arrière ». Vous relisez, puis validez. Le micro s’active dans Agent IA › Réglages." },
    { ic: "box", t: "Pièce manquante → le magasin sait", d: "Sur le poste technicien, « Pièce manquante » envoie la demande au comptoir : elle apparaît dans Pièces & commandes, le magasinier la sert ou la commande, et le dossier se met à jour tout seul. Tout est centralisé." },
    { ic: "camera", t: "Photos depuis la tablette", d: "Onglet Photos d’un dossier : « Prendre une photo » ouvre l’appareil, « Importer » prend plusieurs fichiers. Les photos sont rangées avant / après et visibles partout." },
    { ic: "msg", t: "Demandez à MOTEK", d: "Sur le tableau de bord : « Où est la Golf MB-118-CC ? », « Livraisons du jour », « La Clio est prête ». L’assistant répond et propose une action que vous confirmez d’un geste. Rien ne part sans vous." },
    { ic: "key", t: "Clés, paiement, et c’est fini", d: "La facture s’émet depuis le dossier, le règlement se saisit dans Facturation, puis « Remettre les clés » clôture. Si le client n’a pas réglé, MOTEK le dit avant de rendre la voiture." },
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
    modal = UI.modal({ title: "Prise en main de MOTEK", wide: true,
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
