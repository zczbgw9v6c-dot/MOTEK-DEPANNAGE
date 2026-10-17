/* ==========================================================================
   MOTEK — coque : bascule Atelier live / Back-office,
   recherche globale, cloche d'alertes, registre des modules (window.APP)
   ========================================================================== */
(function () {
  const U = CX.util,
    { esc, chf } = U;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- registre des modules back-office ----------
     APP.register({ id, label, icon, group, order, render(el, params), badge() }) */
  const modules = [];
  const GROUPS = [
    "Pilotage",
    "Dépannage",
    "Atelier",
    "Commercial & assurances",
    "Logistique",
    "Finances & équipe",
    "Système",
  ];
  /** Un module lié à une activité désactivée dans les réglages disparaît de la navigation. */
  const isActive = (m) => !m.activity || CX.activityOn(m.activity);
  const register = (m) => {
    modules.push(m);
    modules.sort(
      (a, b) =>
        GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) ||
        (a.order || 99) - (b.order || 99),
    );
  };

  let mode = "map",
    current = null,
    params = {};
  const listeners = [];
  const onMode = (fn) => listeners.push(fn);

  // Un état reçu d’un autre écran rafraîchit le back-office ; la carte 3D, elle, est reconstruite au retour sur l’atelier live.
  let mapStale = false;
  CX.on("remote", () => {
    // Le parc dépannage écoute remote et met à jour ses objets sans recharger la page.
    if (CX.S.company.profile === "depannage") { mapStale = false; return; }
    mapStale = true;
    if (mode === "map") location.reload();
  });
  function setMode(m, p) {
    if (m !== "map" && m !== "bo") m = "map";
    if (m === "map" && mapStale) {
      location.reload();
      return;
    }
    const changed = m !== mode;
    mode = m;
    document.body.classList.toggle("mode-bo", m === "bo");
    document
      .querySelectorAll(".modes button")
      .forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
    $("#view-map").classList.toggle("on", m === "map");
    $("#view-bo").classList.toggle("on", m === "bo");
    if (m === "bo")
      open((p && p.module) || current || "dashboard", p && p.params);
    if (changed || p)
      listeners.forEach((fn) => {
        try {
          fn(m);
        } catch (e) {
          console.error(e);
        }
      });
    try {
      history.replaceState(
        null,
        "",
        "#" + (m === "bo" ? "bo/" + (current || "dashboard") : "atelier"),
      );
    } catch (e) {}
  }

  /** Ouvre un module du back-office (bascule en back-office si besoin). */
  function open(id, p = {}) {
    let m = modules.find((x) => x.id === id) || modules[0];
    if (m && !isActive(m)) m = modules.find((x) => x.id === "dashboard") || modules[0];
    if (!m) return;
    current = m.id;
    params = p || {};
    if (mode !== "bo") {
      setMode("bo", { module: m.id, params: p });
      return;
    }
    const el = $("#bo-content");
    el.scrollTop = 0;
    el.innerHTML = "";
    try {
      m.render(el, params);
    } catch (e) {
      console.error(e);
      el.innerHTML = `<div class="bo-page"><div class="card pad">Erreur dans le module ${esc(m.label)} : ${esc(e.message)}</div></div>`;
    }
    try {
      history.replaceState(null, "", "#bo/" + m.id);
    } catch (e) {}
    renderNav();
  }
  const refresh = () => {
    if (mode === "bo" && current) {
      const el = $("#bo-content");
      const st = el.scrollTop;
      const m = modules.find((x) => x.id === current);
      el.innerHTML = "";
      try {
        m.render(el, params);
      } catch (e) {
        console.error(e);
      }
      el.scrollTop = st;
      renderNav();
    }
  };
  const setParams = (p) => {
    params = Object.assign({}, params, p);
  };

  function renderNav() {
    const nav = $(".bo-nav");
    if (!nav) return;
    const groups = GROUPS.filter((g) => modules.some((m) => m.group === g && isActive(m)));
    nav.innerHTML =
      groups
        .map(
          (g) =>
            `<div class="bo-grp">${esc(g)}</div>` +
            modules
              .filter((m) => m.group === g && isActive(m))
              .map((m) => {
                let b = 0;
                try {
                  b = m.badge ? m.badge() : 0;
                } catch (e) {}
                return `<a href="#bo/${m.id}" data-mod="${m.id}" class="${m.id === current ? "on" : ""}">${UI.icon(m.icon, 17)}<span>${esc(m.label)}</span>${b ? `<em>${b}</em>` : ""}</a>`;
              })
              .join(""),
        )
        .join("") +
      `<div class="nav-foot"><b>${esc((CX.S.company || {}).name || "MOTEK")}</b>${esc((CX.S.company || {}).address || "")}<br>${CX.S.pristine ? "Données de démonstration" : "Données du garage"} · enregistrées sur le serveur</div>`;
  }

  /* ---------- « montre-moi cet objet » ---------- */
  const focusHandlers = []; // la carte s'y inscrit : (target, opts) => bool
  const BO_OF = {
    ro: "ros",
    vehicle: "ros",
    customer: "crm",
    employee: "time",
    claim: "claims",
    quote: "quotes",
    invoice: "invoices",
    order: "parts",
    part: "parts",
    loan: "courtesy",
    complaint: "quality",
    poste: "planning",
    appt: "reception",
    mission: "missions",
    garde: "parc",
  };
  function focus(target, opts = {}) {
    if (!target) return;
    if (opts.map || (mode === "map" && !opts.bo)) {
      for (const h of focusHandlers) if (h(target, opts)) return;
    }
    let mod = BO_OF[target.type] || "dashboard",
      id = target.id,
      extra = {};
    if (target.type === "vehicle") {
      const r = CX.roOfVehicle(target.id);
      if (r) id = r.id;
      else {
        mod = "crm";
        extra = { tab: "vehicules", veh: target.id };
        id = null;
      }
    }
    if (target.type === "part") extra = { tab: "stock" };
    open(mod, Object.assign({ id }, extra));
  }
  /** Bascule vers l'atelier 3D et centre l'objet. */
  function showInMap(type, id) {
    setMode("map");
    setTimeout(() => {
      let ok = false;
      for (const h of focusHandlers)
        if (h({ type, id }, { map: true })) {
          ok = true;
          break;
        }
      if (!ok)
        UI.toast(
          "Atelier live",
          "Cet élément n’est pas visible dans l’atelier en ce moment.",
          "warn",
          "cube",
        );
    }, 60);
  }

  /* ---------- recherche globale ---------- */
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ");
  function search(q) {
    q = norm(q).trim();
    if (q.length < 2) return [];
    const S = CX.S,
      out = [],
      qn = q.replace(/\s/g, "");
    const m = (...a) =>
      a.some((s) => {
        const n = norm(s);
        return n.includes(q) || n.replace(/\s/g, "").includes(qn);
      });
    S.ros.forEach((r) => {
      const v = CX.veh(r.vehicleId) || {},
        c = CX.cust(r.customerId) || {};
      if (m(r.no, v.plate, c.name, v.make + " " + v.model))
        out.push({
          grp: "Ordres de réparation",
          ic: "wrench",
          t: r.no + " · " + CX.vlabel(v),
          s: (c.name || "") + " · " + CX.STAGES[r.stage].l,
          plate: v.plate,
          onMap: CX.ONSITE(r.slot),
          go: () => focus({ type: "vehicle", id: v.id }),
        });
    });
    S.customers.forEach((c) => {
      if (m(c.name, c.city, c.phone, c.email, c.contact))
        out.push({
          grp: "Clients",
          ic: "user",
          t: c.name,
          s:
            (c.type === "entreprise" ? "Entreprise · " : "") +
            c.city +
            " · " +
            c.phone,
          go: () => open("crm", { id: c.id }),
        });
    });
    S.vehicles.forEach((v) => {
      if (
        !S.ros.some((r) => r.vehicleId === v.id) &&
        m(v.plate, v.make + " " + v.model, v.vin)
      )
        out.push({
          grp: "Véhicules",
          ic: "car",
          t: v.make + " " + v.model,
          s: CX.custName(v.customerId),
          plate: v.plate,
          go: () => open("crm", { tab: "vehicules", veh: v.id }),
        });
    });
    S.quotes.forEach((x) => {
      if (m(x.no))
        out.push({
          grp: "Devis",
          ic: "calc",
          t: x.no + " · " + CX.vlabel(CX.veh(x.vehicleId)),
          s: x.status + " · " + chf(CX.quoteTotals(x).ttc),
          go: () => open("quotes", { id: x.id }),
        });
    });
    S.claims.forEach((k) => {
      if (m(k.no, (CX.ins(k.insurerId) || {}).short + " " + k.no))
        out.push({
          grp: "Sinistres",
          ic: "shield",
          t: "Sinistre " + k.no,
          s: (CX.ins(k.insurerId) || {}).short + " · " + k.approval,
          go: () => open("claims", { id: k.id }),
        });
    });
    S.invoices.forEach((i) => {
      if (m(i.no))
        out.push({
          grp: "Factures",
          ic: "invoice",
          t: i.no,
          s: i.label + " · " + U.chf2(i.amount),
          go: () => open("invoices", { id: i.id }),
        });
    });
    S.staff.forEach((e) => {
      if (m(e.name, e.title))
        out.push({
          grp: "Équipe",
          ic: "users",
          t: e.name,
          s: e.title,
          onMap: true,
          go: () => focus({ type: "employee", id: e.id }),
        });
    });
    S.parts.forEach((p) => {
      if (m(p.name, p.ref, p.loc))
        out.push({
          grp: "Pièces & stock",
          ic: "box",
          t: p.name,
          s: p.ref + " · " + p.loc + " · " + p.qty + " " + p.unit,
          go: () => focus({ type: "part", id: p.id }),
        });
    });
    S.orders.forEach((o) => {
      if (m(o.no))
        out.push({
          grp: "Commandes",
          ic: "truck",
          t: o.no,
          s: (CX.supplier(o.supplierId) || {}).name + " · " + o.status,
          go: () => open("parts", { tab: "commandes", id: o.id }),
        });
    });
    /* ---- dépannage : missions, véhicules au parc, factures, dépanneurs, bureau ---- */
    (S.missions || []).forEach((x) => {
      if (m(x.no, x.vehicle && x.vehicle.plate, x.vehicle && x.vehicle.make + " " + x.vehicle.model, x.address, x.customer && x.customer.name, x.mandant, x.ref))
        out.push({ grp: "Missions", ic: "truck", t: x.no + " · " + x.vehicle.make + " " + x.vehicle.model, s: x.status + " · " + x.kind + " · " + x.address, plate: x.vehicle.plate, go: () => open("missions", { id: x.id }) });
    });
    (S.dinvoices || []).forEach((i) => {
      if (m(i.no, i.payer, i.ref, i.plate))
        out.push({ grp: "Factures", ic: "invoice", t: i.no + " · " + i.payer, s: (i.label || "") + " · " + U.chf2(i.ttc) + " · " + i.status, go: () => open("invoices", { id: i.id }) });
    });
    (S.drivers || []).forEach((d) => {
      if (m(d.name, d.first)) out.push({ grp: "Équipe", ic: "user", t: d.first, s: d.title || "Dépanneur", go: () => open("chauffeur") });
    });
    (S.office || []).forEach((p) => {
      if (m(p.name, p.title)) out.push({ grp: "Équipe", ic: "users", t: p.name, s: p.title || "Bureau", go: () => open("fleet", { tab: "bureau" }) });
    });
    (window.MAP_SEARCH ? window.MAP_SEARCH(q) : []).forEach((x) => out.push(x));
    const ord = [
      "Missions",
      "Parc",
      "Camions",
      "Ordres de réparation",
      "Clients",
      "Véhicules",
      "Zones",
      "Postes",
      "Devis",
      "Sinistres",
      "Factures",
      "Équipe",
      "Commandes",
      "Pièces & stock",
    ];
    out.sort((a, b) => ord.indexOf(a.grp) - ord.indexOf(b.grp));
    return out.slice(0, 16);
  }
  function initSearch() {
    const inp = $("#q"),
      res = $("#sres");
    let items = [],
      hl = 0;
    const ph = () => {
      const dep = CX.activityOn("depannage") && !CX.activityOn("atelier");
      inp.placeholder = dep
        ? (mode === "bo" ? "Rechercher une plaque, une mission, un dossier assureur, une facture…" : "Plaque, mission, dossier, camion…")
        : mode === "bo"
          ? "Rechercher plaque, client, n° OR, devis, sinistre, facture…"
          : "Plaque, client, n° OR, sinistre…";
    };
    ph();
    onMode(ph);
    const draw = () => {
      const q = inp.value.trim();
      if (q.length < 2) {
        res.classList.remove("on");
        return;
      }
      if (!items.length) {
        res.innerHTML = `<div class="empty">Aucun résultat pour « ${esc(q)} »</div>`;
        res.classList.add("on");
        return;
      }
      let g = "";
      res.innerHTML = items
        .map(
          (it, i) =>
            (it.grp !== g
              ? `<div class="grp">${esc((g = it.grp))}</div>`
              : "") +
            `<div class="it ${i === hl ? "hl" : ""}" data-i="${i}"><span class="ic ${it.grp === "Zones" || it.grp === "Postes" ? "dk" : ""}">${UI.icon(it.ic, 14)}</span><div style="min-width:0"><div class="t">${it.plate ? `<span class="pl">${esc(it.plate)}</span>` : ""}${esc(it.t)}</div><div class="s">${esc(it.s)}</div></div><span class="go-tag">${mode === "map" && it.onMap ? "Atelier" : it.mapOnly ? "Atelier" : "Back-office"}</span></div>`,
        )
        .join("");
      res.classList.add("on");
    };
    inp.addEventListener("input", () => {
      items = search(inp.value);
      hl = 0;
      draw();
    });
    inp.addEventListener("focus", () => {
      if (inp.value.trim().length >= 2) {
        items = search(inp.value);
        draw();
      }
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        hl = Math.min(items.length - 1, hl + 1);
        draw();
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        hl = Math.max(0, hl - 1);
        draw();
        e.preventDefault();
      } else if (e.key === "Enter" && items[hl]) {
        const it = items[hl];
        inp.value = "";
        res.classList.remove("on");
        inp.blur();
        it.go();
      } else if (e.key === "Escape") {
        inp.value = "";
        res.classList.remove("on");
        inp.blur();
      }
    });
    res.addEventListener("mousedown", (e) => {
      const it = e.target.closest("[data-i]");
      if (!it) return;
      e.preventDefault();
      const x = items[+it.dataset.i];
      inp.value = "";
      res.classList.remove("on");
      inp.blur();
      x.go();
    });
    inp.addEventListener("blur", () =>
      setTimeout(() => res.classList.remove("on"), 130),
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          inp.focus();
        } else if (
          e.key === "/" &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) &&
          !document.querySelector(".mdl-bg")
        ) {
          e.preventDefault();
          inp.focus();
        }
      },
      true,
    );
  }

  /* ---------- cloche : alertes « à traiter » + fil d'activité ---------- */
  let unread = 0,
    lastSeen = CX.now();
  const LV = { high: "Urgent", mid: "À traiter", low: "Info" };
  const AIC = {
    ready: "car",
    expertise: "shield",
    accord: "shield",
    parts: "truck",
    late: "clock",
    qc: "check",
    invoice: "invoice",
    stock: "box",
    loan: "key",
    complaint: "alert",
  };
  function badge(bump) {
    const n = CX.alerts().filter((a) => a.level !== "low").length + unread,
      b = $("#bcount");
    b.textContent = n;
    b.style.display = n ? "" : "none";
    if (bump) {
      b.classList.add("bump");
      setTimeout(() => b.classList.remove("bump"), 220);
    }
  }
  function renderBell() {
    const al = CX.alerts(),
      feed = CX.S.feed.slice(0, 8),
      m = $("#nmenu");
    m.classList.add("al");
    m.innerHTML =
      `<div class="hd">À traiter<span data-all>Tableau de bord →</span></div>` +
      (al.length
        ? al
            .slice(0, 9)
            .map(
              (a, i) =>
                `<div class="nitem" data-a="${i}"><span class="ic ${a.level === "high" ? "red" : a.level === "mid" ? "amber" : "slate"}">${UI.icon(AIC[a.kind] || "alert", 15)}</span><div style="min-width:0"><div class="t">${esc(a.title)}<span class="lv ${a.level}">${LV[a.level]}</span></div><div class="s">${esc(a.text)}</div></div></div>`,
            )
            .join("") +
          (al.length > 9
            ? `<div class="gh"><span>+ ${al.length - 9} autres alertes</span></div>`
            : "")
        : '<div class="empty-al">Rien d’urgent — tout est sous contrôle.</div>') +
      `<div class="gh"><span>Fil d’activité</span><span>${unread ? unread + " nouveau" + (unread > 1 ? "x" : "") : ""}</span></div>` +
      feed
        .map(
          (n, i) =>
            `<div class="nitem" data-f="${i}"><span class="ic ${n.tone || "slate"}">${UI.icon(n.ic || "bell", 15)}</span><div style="min-width:0"><div class="t">${esc(n.t)}</div><div class="s">${esc(n.s)}</div></div><span class="tm">${esc(U.tOf(n.at))}</span></div>`,
        )
        .join("") +
      `<div class="ft"><button data-read>Tout marquer comme lu</button><button data-bo>Ouvrir le back-office</button></div>`;
    m.onclick = (e) => {
      e.stopPropagation();
      if (e.target.closest("[data-read]")) {
        unread = 0;
        lastSeen = CX.now();
        badge();
        renderBell();
        return;
      }
      if (e.target.closest("[data-all]") || e.target.closest("[data-bo]")) {
        m.classList.remove("on");
        open("dashboard");
        return;
      }
      const a = e.target.closest("[data-a]");
      if (a) {
        m.classList.remove("on");
        focus(al[+a.dataset.a].target, { bo: true });
        return;
      }
      const f = e.target.closest("[data-f]");
      if (f) {
        m.classList.remove("on");
        const t = feed[+f.dataset.f].target;
        if (t) focus(t);
      }
    };
  }
  function initBell() {
    const bell = $("#bell"),
      m = $("#nmenu");
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      renderBell();
      m.classList.toggle("on");
      const z = $("#zmenu");
      if (z) z.classList.remove("on");
      if (m.classList.contains("on")) {
        unread = 0;
        badge();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#nmenu")) m.classList.remove("on");
    });
    CX.on("feed", () => {
      unread++;
      badge(true);
    });
    let t;
    CX.on("change", () => {
      clearTimeout(t);
      t = setTimeout(() => badge(), 120);
    });
    badge();
  }

  /* ---------- boot ---------- */
  CX.on("notice", (d) =>
    UI.toast(
      d.kind === "warn" ? "Attention" : "Info",
      d.text,
      d.kind === "warn" ? "warn" : "info",
    ),
  );
  let navT;
  CX.on("change", () => {
    clearTimeout(navT);
    navT = setTimeout(renderNav, 150);
  });

  function boot() {
    initSearch();
    initBell();
    document
      .querySelectorAll(".modes button")
      .forEach((b) =>
        b.addEventListener("click", () => setMode(b.dataset.mode)),
      );
    $(".bo-nav").addEventListener("click", (e) => {
      const a = e.target.closest("[data-mod]");
      if (a) {
        e.preventDefault();
        open(a.dataset.mod);
      }
    });
    renderNav();
    initGloves();
    const h = location.hash.slice(1);
    const hasMap = CX.activityOn("atelier") || CX.activityOn("parc");
    if (!hasMap) document.body.classList.add("no-map");
    // L'horloge de l'en-tête vit ici (la scène 3D la met aussi à jour).
    const tick = () => { const c = $("#clock"); if (c) c.textContent = U.hm(U.nowMin()); };
    tick();
    setInterval(tick, 15000);
    if (h.startsWith("bo") || !hasMap) {
      current = h.split("/")[1] || "dashboard";
      setMode("bo");
    } else setMode("map");
  }

  /* ---------- mode gants (par appareil) et recherche compacte sur tablette ---------- */
  const GK = "motek-gants";
  const setGloves = (on, silent) => {
    document.body.classList.toggle("gants", !!on);
    try { localStorage.setItem(GK, on ? "1" : "0"); } catch (e) {}
    const b = $("#gbtn"); if (b) { b.classList.toggle("on", !!on); b.title = on ? "Mode gants activé" : "Mode gants (grandes cibles)"; }
    if (!silent) UI.toast(on ? "Mode gants activé" : "Mode gants désactivé", on ? "Boutons et champs agrandis sur cet appareil." : "", "info", "wrench");
  };
  const initGloves = () => {
    let on = false; try { on = localStorage.getItem(GK) === "1"; } catch (e) {}
    const bell = $("#bell");
    if (bell && !$("#gbtn")) { const b = document.createElement("button"); b.id = "gbtn"; b.className = "gbtn"; b.innerHTML = UI.icon("wrench", 17); b.addEventListener("click", () => setGloves(!document.body.classList.contains("gants"))); bell.insertAdjacentElement("beforebegin", b); }
    setGloves(on, true);
    const sr = $(".search");
    if (sr) { sr.addEventListener("click", (e) => { if (innerWidth <= 900 && !sr.classList.contains("open")) { sr.classList.add("open"); const q = $("#q"); q && q.focus(); } }); document.addEventListener("click", (e) => { if (!e.target.closest(".search")) sr.classList.remove("open"); }); }
  };
  /* ---------- état de sauvegarde (en-tête) et conflits entre postes ---------- */
  const syncPill = () => {
    let p = $("#syncpill");
    if (!p) {
      p = document.createElement("div");
      p.id = "syncpill";
      p.className = "syncpill";
      const live = $("header .live");
      if (live) live.insertAdjacentElement("afterend", p); else document.body.appendChild(p);
      p.addEventListener("click", () => { if (CX.sync.conflict) conflictDialog(); });
    }
    return p;
  };
  let savedTimer = null;
  const conflictDialog = () => {
    if (!CX.sync.conflict || document.querySelector(".mdl-bg")) return;
    UI.modal({ title: "Modifications en conflit", body: `<div class="form-note warn">${UI.icon("alert", 16)}<div>Un autre poste a enregistré des données pendant que vous travailliez. Vos dernières modifications ont été <b>mises de côté</b> (${esc(U.tOf(CX.sync.conflict.at))}) et l’écran affiche la version du serveur.</div></div><p class="sm-t mt">Que faire de vos modifications ?</p>`,
      foot: `<button class="btn" data-exp style="margin-right:auto">${UI.icon("download", 14)}Exporter ma version (JSON)</button><button class="btn" data-srv>Garder la version du serveur</button><button class="btn pri" data-loc>Reprendre mes modifications (écrase le serveur)</button>`,
      onMount: (el, close) => {
        el.querySelector("[data-exp]").addEventListener("click", () => BO.download("motek-conflit-" + U.today() + ".json", CX.sync.conflict.local, "application/json"));
        el.querySelector("[data-srv]").addEventListener("click", () => { CX.resolveConflict("serveur"); close(); refresh(); });
        el.querySelector("[data-loc]").addEventListener("click", () => { CX.resolveConflict("local"); close(); refresh(); });
      } });
  };
  CX.on("sync", (e) => {
    const p = syncPill();
    clearTimeout(savedTimer);
    if (e.conflict) { p.className = "syncpill conflict"; p.innerHTML = UI.icon("alert", 13) + "Conflit — cliquer"; conflictDialog(); return; }
    if (e.error) { p.className = "syncpill err"; p.innerHTML = UI.icon("alert", 13) + "Non enregistré · " + esc(e.error); return; }
    if (e.online === false) { p.className = "syncpill err"; p.innerHTML = UI.icon("alert", 13) + "Hors ligne — modifications non enregistrées"; return; }
    if (e.saved) { p.className = "syncpill ok"; p.innerHTML = UI.icon("check", 13) + "Enregistré"; savedTimer = setTimeout(() => { p.className = "syncpill"; p.innerHTML = ""; }, 2500); return; }
    p.className = "syncpill"; p.innerHTML = "";
  });
  CX.on("ro:refused", (e) => {
    const r = CX.ro(e.roId);
    if (!r) return;
    UI.toast("Transition refusée · " + r.no, e.reason === "qc" ? "Contrôle qualité à valider avant « prêt »." : e.reason === "unpaid" ? "Solde client dû : " + U.chf2(e.due) + "." : "Le dossier doit d’abord être prêt.", "warn", "alert");
  });

  window.APP = {
    register,
    modules: () => modules.slice(),
    open,
    refresh,
    setParams,
    setMode,
    onMode,
    focus,
    showInMap,
    focusHandlers,
    search,
    get mode() {
      return mode;
    },
    setGloves,
    get current() {
      return current;
    },
    get params() {
      return params;
    },
    boot,
    renderNav,
  };
})();
