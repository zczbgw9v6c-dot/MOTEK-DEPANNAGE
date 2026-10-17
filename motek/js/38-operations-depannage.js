/* Exploitation : planning et poste chauffeur. Toutes les données restent locales. */
(function () {
  const U = CX.util,
    { esc, today } = U;
  let day = today(),
    chauffeur = "";
  const ordered = (date) =>
    CX.S.missions
      .filter((m) => U.dOf(m.eta || m.at) === date)
      .sort((a, b) => (a.eta || a.at).localeCompare(b.eta || b.at));
  DEP.dayMissions = ordered;
  function reassign(m) {
    BO.formModal({
      title: "Réaffecter " + m.no,
      fields: [
        {
          k: "truckId",
          label: "Camion disponible",
          type: "select",
          opts: CX.S.trucks
            .filter((t) => t.status === "Disponible" || t.id === m.truckId)
            .map((t) => [t.id, t.name + " · " + t.kind]),
          req: true,
        },
      ],
      values: { truckId: m.truckId },
      submit: "Affecter",
      onSubmit: (x) => {
        if (!DEP.assign(m.id, x.truckId)) return false;
        APP.refresh();
      },
    });
  }
  function planning(el) {
    const rows = ordered(day),
      pending = rows.filter((m) => !m.truckId);
    const card = (m) =>
      `<article class="dispatch-mission" draggable="${["Demandée", "Affectée"].includes(m.status)}" data-drag="${esc(m.id)}"><div class="row"><b>${esc(U.tOf(m.eta || m.at))}</b>${BO.chip(m.status, DEP.TONE[m.status])}<span class="sp"></span><button class="btn sm" data-detail="${m.id}">Ouvrir</button></div><b>${BO.plate(m.vehicle.plate)} ${esc(m.kind)}</b><p>${esc(m.address)}</p><div class="row wrap"><span class="xs-t muted">${esc(m.no)} · ${esc(m.mandant)}</span><span class="sp"></span>${["Demandée", "Affectée"].includes(m.status) ? `<button class="btn sm" data-assign="${m.id}">Affecter / déplacer</button>` : ""}</div></article>`;
    el.innerHTML = `<div class="bo-page">${BO.head("Planning des camions", "Missions classées par heure prévue · glissez une mission à affecter sur un camion libre.", '<button class="btn pri" data-open="missions::new">Nouvelle mission</button>')}<div class="dispatch-toolbar"><label>Journée <input class="inp" type="date" data-day value="${day}"></label><button class="btn" data-today>Aujourd’hui</button><span class="muted">${rows.length} missions · ${pending.length} sans camion</span><button class="btn" data-open="chauffeur">Poste chauffeur</button></div><section class="dispatch-pending"><h2>À affecter</h2><div class="dispatch-cards">${pending.map(card).join("") || '<p class="muted">Toutes les missions de cette journée sont affectées.</p>'}</div></section><div class="dispatch-plan">${CX.S.trucks
      .map((t) => {
        const missions = rows.filter((m) => m.truckId === t.id),
          d = DEP.driver(t.driverId);
        return `<section class="dispatch-lane" data-truck="${t.id}" aria-label="${esc(t.name)}"><header><div>${UI.truckIcon(t.kind, 36)}<b>${esc(t.name)}</b><small>${esc(t.kind)} · ${esc(d?.name || "Chauffeur à affecter")}</small></div>${BO.chip(t.status, t.status === "Disponible" ? "green" : t.status === "Entretien" ? "red" : "amber")}</header><div class="dispatch-cards">${missions.map(card).join("") || `<p class="muted">${t.status === "Entretien" ? "Indisponible — entretien" : "Aucune mission prévue"}</p>`}</div></section>`;
      })
      .join("")}</div></div>`;
    el.querySelector("[data-day]").addEventListener("change", (e) => {
      day = e.target.value || today();
      APP.refresh();
    });
    el.querySelector("[data-today]").addEventListener("click", () => {
      day = today();
      APP.refresh();
    });
    el.querySelectorAll("[data-detail]").forEach((b) =>
      b.addEventListener("click", () =>
        APP.open("missions", { id: b.dataset.detail }),
      ),
    );
    el.querySelectorAll("[data-assign]").forEach((b) =>
      b.addEventListener("click", () =>
        reassign(DEP.mission(b.dataset.assign)),
      ),
    );
    el.querySelectorAll('[draggable="true"]').forEach((c) =>
      c.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", c.dataset.drag);
        e.dataTransfer.effectAllowed = "move";
      }),
    );
    el.querySelectorAll("[data-truck]").forEach((l) => {
      l.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      l.addEventListener("drop", (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (DEP.assign(id, l.dataset.truck)) APP.refresh();
      });
    });
  }
  function driverView(el) {
    if (!DEP.driver(chauffeur)) chauffeur = CX.S.drivers[0]?.id || "";
    const d = DEP.driver(chauffeur),
      missions = CX.S.missions
        .filter(
          (m) =>
            m.driverId === chauffeur &&
            (DEP.activeMission(m) || U.dOf(m.doneAt || "") === today()),
        )
        .sort((a, b) => (a.eta || a.at).localeCompare(b.eta || b.at));
    el.innerHTML = `<div class="bo-page driver-page">${BO.head("Poste chauffeur", "Sélecteur de démonstration · aucune authentification individuelle active.")}<label class="driver-select">Chauffeur <select class="inp" data-driver>${CX.S.drivers.map((d) => `<option value="${d.id}" ${d.id === chauffeur ? "selected" : ""}>${esc(d.name)}</option>`).join("")}</select></label><p class="muted">${esc(d?.name || "")} · ${missions.filter(DEP.activeMission).length} missions en cours</p>${
      missions
        .map((m) => {
          const t = DEP.truck(m.truckId);
          return `<article class="card driver-mission"><div class="card-b"><div class="row wrap">${BO.plate(m.vehicle.plate, true)}${BO.chip(m.status, DEP.TONE[m.status])}<span class="sp"></span><b>${esc(U.tOf(m.eta))}</b></div><h2>${esc(m.vehicle.make + " " + m.vehicle.model)}</h2><p><b>${esc(m.kind)}</b> · ${esc(m.mandant)}</p><p class="driver-address">${esc(m.address)}</p><p>${esc(m.destination || "Destination à confirmer")}</p>${m.notes ? `<div class="form-note warn">${esc(m.notes)}</div>` : ""}<p class="muted">${esc(t?.name || "")} · ${esc(m.no)}</p><div class="driver-actions">${m.customer.phone ? `<a class="btn" href="tel:${esc(m.customer.phone.replace(/[^+0-9]/g, ""))}">${BO.icon("phone", 18)}Appeler le client</a>` : ""}${m.status === "Affectée" ? `<button class="btn pri" data-status="${m.id}|En route">Partir</button>` : ""}${m.status === "En route" ? `<button class="btn pri" data-status="${m.id}|Sur place">Sur place</button>` : ""}${m.status === "Sur place" ? `<button class="btn pri" data-status="${m.id}|Remorquage">Remorquage</button><button class="btn" data-status="${m.id}|Terminée">Dépanné sur place</button>` : ""}${m.status === "Remorquage" ? `<button class="btn pri" data-deposit="${m.id}">Déposée au parc</button><button class="btn" data-status="${m.id}|Terminée">Livrée au garage / domicile</button>` : ""}</div><label class="btn driver-photo">${BO.icon("camera", 18)}Ajouter une photo (${(m.photos || []).length}/6)<input type="file" accept="image/*" capture="environment" data-photo="${m.id}" hidden></label><div class="driver-photos">${(m.photos || []).map((p) => `<a href="${esc(BO.photoSrc(p) || "")}" target="_blank" rel="noopener"><img src="${esc(BO.photoSrc(p) || "")}" alt="Photo de mission" loading="lazy"></a>`).join("")}</div><small class="muted">Photos compressées sur l’appareil, conservées sur le serveur MOTEK.</small></div></article>`;
        })
        .join("") ||
      BO.empty(
        "truck",
        "Aucune mission à afficher",
        "Les missions affectées à ce chauffeur apparaîtront ici.",
      )
    } </div>`;
    el.querySelector("[data-driver]").addEventListener("change", (e) => {
      chauffeur = e.target.value;
      APP.refresh();
    });
    el.querySelectorAll("[data-status]").forEach((b) =>
      b.addEventListener("click", () => {
        const [id, status] = b.dataset.status.split("|");
        if (DEP.setMissionStatus(id, status)) APP.refresh();
      }),
    );
    el.querySelectorAll("[data-deposit]").forEach((b) =>
      b.addEventListener("click", () => {
        const g = DEP.depositFirstFree(b.dataset.deposit);
        if (g) {
          UI.toast(
            "Entrée enregistrée",
            g.vehicle.plate + " · " + g.slot,
            "ok",
          );
          APP.refresh();
        }
      }),
    );
    el.querySelectorAll("[data-photo]").forEach((inp) =>
      inp.addEventListener("change", async () => {
        const m = DEP.mission(inp.dataset.photo),
          f = inp.files[0];
        if (!f) return;
        if (
          m.photos.length >= 6 ||
          f.size > 15 * 1024 * 1024 ||
          !f.type.startsWith("image/")
        ) {
          UI.toast(
            "Photo refusée",
            "6 photos maximum, images de moins de 15 Mo.",
            "warn",
          );
          return;
        }
        inp.disabled = true;
        try {
          const stored = await BO.uploadPhoto(f);
          m.photos.push({
            id: U.uid("ph"),
            ...stored,
            at: CX.now(),
            by: chauffeur,
          });
          CX.touch("mission", { id: m.id });
          APP.refresh();
        } catch (e) {
          inp.disabled = false;
          UI.toast("Photo non enregistrée", e.message, "warn");
        }
      }),
    );
  }
  DEP.kpiRoute = (module, label) => {
    const route = (module, params = {}) => ({ module, params });
    const common = {
      "À envoyer": route("supply", { seg: "send" }),
      "En livraison": route("supply", { seg: "Commandée" }),
      "À poser": route("supply", { seg: "Reçue" }),
      "Batteries ce mois": route("supply", { seg: "month" }),
      Disponibles: route("fleet", { seg: "Disponible" }),
      "En mission": route("fleet", { seg: "En mission" }),
      "En entretien": route("fleet", { seg: "Entretien" }),
      "Contrôles techniques": route("fleet", { seg: "ct" }),
      "Missions en attente": route("missions", { seg: "Demandée" }),
      "À affecter": route("missions", { seg: "Demandée" }),
      "Camions sur la route": route("missions", { seg: "road" }),
      "En intervention": route("missions", { seg: "road" }),
      "Camions disponibles": route("fleet", { seg: "Disponible" }),
      "Véhicules au parc": route("parc", { seg: "all", onlyLevel: false }),
      "Terminées aujourd’hui": route("missions", { seg: "done" }),
      "Gardes à relancer": route("parc", { seg: "remind" }),
      "Déposés au parc aujourd’hui": route("missions", { seg: "deposits" }),
      "À facturer": route("missions", { seg: "bill" }),
      "Entrées / sorties du jour": route("parc", { seg: "moves" }),
      "Frais en cours": route("parc", { seg: "all", onlyLevel: false }),
      "À encaisser": route("invoices", { seg: "open" }),
      "En retard": route("invoices", { seg: "late" }),
      "Missions à facturer": route("missions", { seg: "bill" }),
      "Gardes sorties à facturer": route("parc", { seg: "unbilled" }),
      "Encaissé ce mois": route("invoices", { seg: "paid-month" }),
      "À déclarer": route("mandats", { tab: "mandats", seg: "À déclarer" }),
      "En attente d’accord": route("mandats", {
        tab: "mandats",
        seg: "Prise en charge demandée",
      }),
      "Accordés, à facturer": route("mandats", {
        tab: "mandats",
        seg: "toBill",
      }),
      "Facturés, à encaisser": route("mandats", {
        tab: "mandats",
        seg: "Facturée",
      }),
      "E-mails à traiter": route("mandats", { tab: "mail" }),
    };
    const level = CX.S.parc.levels.find((l) => l.name === label);
    if (module === "parc" && level)
      return route("parc", { level: level.id, seg: "all", onlyLevel: true });
    return common[label] || null;
  };
  document.addEventListener("keydown", (e) => {
    const k = e.target.closest('.kpi[role="button"]');
    if (k && ["Enter", " "].includes(e.key)) {
      e.preventDefault();
      k.click();
    }
  });
  APP.register({
    id: "planning-dep",
    label: "Planning camions",
    icon: "calendar",
    group: "Dépannage",
    order: 1.5,
    activity: "depannage",
    render: planning,
  });
  APP.register({
    id: "chauffeur",
    label: "Poste chauffeur",
    icon: "truck",
    group: "Dépannage",
    order: 1.6,
    activity: "depannage",
    render: driverView,
  });
})();
