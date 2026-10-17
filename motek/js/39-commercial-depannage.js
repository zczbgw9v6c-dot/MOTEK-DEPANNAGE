/* Préparation commerciale locale : aucun raccordement publicitaire ni envoi. */
(function () {
  const { esc, chf } = CX.util;
  const stages = ["Nouveau", "À rappeler", "Qualifié", "Converti", "Perdu"];
  const service = (id) => CX.S.serviceCatalog.find((s) => s.id === id);
  const zone = (code) =>
    CX.S.commercial.departments.find((d) => d.code === code);
  const audit = (text) => {
    CX.S.marketing.history.unshift({ at: CX.now(), by: CX.S.meId, text });
    CX.touch("marketing");
  };
  function draft(input) {
    const s = service(input.serviceId),
      d = zone(input.department);
    const budget = Number(input.budget),
      days = Number(input.days);
    if (!s || !d || !["google", "meta"].includes(input.channel))
      throw Error("Prestation, zone ou canal invalide.");
    if (
      !Number.isFinite(budget) ||
      budget < 1 ||
      budget > 100000 ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 90
    )
      throw Error("Budget total et durée invalides.");
    const id = CX.util.uid("CMP");
    const url = new URL(CX.S.commercial.website);
    if (url.protocol !== "https:" || url.hostname !== "depanneuse.net")
      throw Error("Adresse du site à vérifier.");
    url.search = new URLSearchParams({
      utm_source: input.channel,
      utm_medium: "cpc",
      utm_campaign: id,
    }).toString();
    const price = s.approved
      ? `Dès ${s.approvedFromTtc} € TTC, selon conditions.`
      : "Prix sur devis.";
    // Atouts : uniquement ceux déclarés par le bureau (modifiables), trois au plus.
    const assets = Array.isArray(input.assets)
      ? input.assets.filter((x) => (CX.S.commercial.assets || []).includes(x)).slice(0, 3)
      : [];
    const goal = input.goal === "form" ? "form" : "call";
    const why = [
      `Prestation « ${s.label} » : page publiée sur ${new URL(s.source).hostname}, tarif ${s.approved ? "validé par le bureau (dès " + s.approvedFromTtc + " € TTC)" : "non validé → « Prix sur devis », aucun chiffre inventé"}.`,
      `Zone ${d.code} (${d.name}) : département couvert, annoncé sur le site.`,
      `${input.channel === "google" ? "Google Ads : capter une recherche urgente (« dépannage », « remorquage »)." : "Facebook / Instagram : notoriété locale et rappel de l'enseigne."}`,
      `Budget total prévu ${budget} € sur ${days} jour${days > 1 ? "s" : ""} ≈ ${Math.round((budget / days) * 100) / 100} €/jour, répartition indicative sans plafond imposé à la plateforme.`,
      goal === "call" ? "Objectif : l'appel direct au bureau, le canal que l'entreprise traite le mieux aujourd'hui." : "Objectif : la demande écrite via le formulaire du site, traitée dans « Demandes entrantes ».",
    ];
    if (assets.length) why.push("Atouts mis en avant (déclarés par le bureau) : " + assets.join(" · ") + ".");
    const c = {
      id,
      at: CX.now(),
      serviceId: s.id,
      department: d.code,
      channel: input.channel,
      budget,
      days,
      dailyPlan: Math.round((budget / days) * 100) / 100,
      status: "Brouillon",
      validatedAt: null,
      headlines: [
        "Dan Dépanne",
        "Dépannage · " + d.code,
        "Demandez votre devis",
      ],
      descriptions: [
        `${s.label}. ${price}`.slice(0, 90),
        `Intervention dans le ${d.code}. Disponibilité à confirmer avec le bureau.`,
        ...(assets.length ? [assets[0].slice(0, 90)] : []),
      ],
      social: `Dan Dépanne · ${s.label} dans le ${d.name}. ${price}${assets.length ? " " + assets.join(" · ") + "." : ""} ${goal === "call" ? "Appelez le bureau : " + (CX.S.company.phone || "") + "." : "Décrivez votre panne sur notre site, le bureau vous rappelle."}`,
      assets,
      goal,
      why,
      url: url.href,
      metrics: null,
      priceApprovedAt: s.approvedAt || null,
    };
    CX.S.marketing.campaigns.unshift(c);
    audit("Brouillon " + id + " créé ; aucune diffusion.");
    return c;
  }
  function validate(c) {
    if (!c || c.status !== "Brouillon") throw Error("Brouillon requis.");
    c.status = "Validé pour export";
    c.validatedAt = CX.now();
    audit(c.id + " validé pour export uniquement.");
  }
  function metrics(c, input) {
    const spend = Number(input.spend),
      clicks = Number(input.clicks);
    if (
      !c ||
      !Number.isFinite(spend) ||
      spend < 0 ||
      !Number.isSafeInteger(clicks) ||
      clicks < 0 ||
      !String(input.source || "").trim()
    )
      throw Error("Dépense, clics et source du relevé requis.");
    c.metrics = {
      spend,
      clicks,
      source: String(input.source).trim(),
      at: CX.now(),
      mode: "manual",
    };
    audit(c.id + " : relevé saisi manuellement.");
    return c.metrics;
  }
  function addLead(input) {
    const name = String(input.name || "").trim(),
      phone = String(input.phone || "").trim(),
      email = String(input.email || "").trim();
    if (
      !name ||
      (!phone && !email) ||
      (phone && !/^[+\d][\d\s().-]{6,}$/.test(phone)) ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
      throw Error("Nom et téléphone ou courriel valide requis.");
    if (
      !service(input.serviceId) ||
      !zone(input.department) ||
      !String(input.source || "").trim()
    )
      throw Error("Prestation, département et origine requis.");
    const campaignId = input.campaignId || null;
    if (
      campaignId &&
      !CX.S.marketing.campaigns.some((c) => c.id === campaignId)
    )
      throw Error("Campagne inconnue.");
    const l = {
      id: CX.util.uid("LEAD"),
      at: CX.now(),
      name,
      phone,
      email,
      serviceId: input.serviceId,
      department: input.department,
      campaignId,
      source: String(input.source).trim(),
      status: "Nouveau",
      notes: String(input.notes || ""),
      missionId: null,
    };
    CX.S.marketing.leads.unshift(l);
    audit("Prospect " + l.id + " enregistré manuellement.");
    return l;
  }
  function leadStage(l, status) {
    if (!l || !stages.includes(status)) throw Error("Étape invalide.");
    l.status = status;
    audit("Prospect " + l.id + " : " + status + " (déclaré manuellement).");
  }
  function approveService(s, input) {
    const amount = Number(input.amount),
      note = String(input.note || "").trim();
    if (!s || !Number.isFinite(amount) || amount <= 0 || !note)
      throw Error("Montant TTC positif et conditions de validation requis.");
    s.approved = true;
    s.approvedFromTtc = amount;
    s.approvedAt = CX.now();
    s.approvalNote = note;
    audit(
      "Tarif commercial validé manuellement : " +
        s.id +
        ". Les missions existantes restent inchangées.",
    );
  }
  window.DEP = window.DEP || {};
  DEP.commercial = {
    draft,
    validate,
    metrics,
    addLead,
    leadStage,
    approveService,
  };
  const attempt = (fn) => {
    try {
      fn();
      BO.now();
    } catch (e) {
      UI.toast("À vérifier", e.message, "warn");
      return false;
    }
  };
  const serviceOpts = () => CX.S.serviceCatalog.map((s) => [s.id, s.label]);
  const zoneOpts = () =>
    CX.S.commercial.departments.map((d) => [d.code, d.code + " · " + d.name]);
  function campaignForm(pre) {
    pre = pre || {};
    const assetList = CX.S.commercial.assets || [];
    BO.formModal({
      title: "Préparer une publicité",
      intro:
        (pre.why ? `<div class="form-note">${BO.icon("cube", 16)}<div><b>Proposition de MOTEK :</b> ${esc(pre.why)}</div></div>` : "") +
        '<div class="form-note warn">Brouillon local. Aucun compte connecté, aucune dépense ni diffusion : vous verrez un aperçu avant de valider.</div>',
      wide: true,
      fields: [
        {
          k: "serviceId",
          label: "Prestation",
          type: "select",
          opts: serviceOpts(),
        },
        {
          k: "department",
          label: "Département",
          type: "select",
          opts: zoneOpts(),
        },
        {
          k: "channel",
          label: "Canal",
          type: "select",
          opts: [
            ["google", "Google Ads"],
            ["meta", "Facebook / Instagram"],
          ],
        },
        {
          k: "budget",
          label: "Budget total prévu (€)",
          type: "number",
          min: 1,
          req: true,
        },
        {
          k: "days",
          label: "Durée prévue (jours)",
          type: "number",
          min: 1,
          max: 90,
          req: true,
        },
        {
          k: "goal",
          label: "Objectif",
          type: "select",
          opts: [
            ["call", "Des appels au bureau"],
            ["form", "Des demandes via le formulaire du site"],
          ],
        },
        { type: "html", full: true, html: '<div class="sm-t" style="font-weight:700;margin:4px 0 2px">Atouts à mettre en avant <span class="muted" style="font-weight:500">· trois au plus, déclarés par le bureau</span></div>' },
        ...assetList.map((label, i) => ({ k: "asset" + i, label, type: "checkbox" })),
      ],
      values: Object.assign({ budget: 50, days: 5, channel: "google", goal: "call", asset0: true, asset1: true }, pre.values || {}),
      submit: "Générer l’aperçu",
      onSubmit: (x) =>
        attempt(() => {
          const c = draft(Object.assign({}, x, { assets: assetList.filter((a, i) => x["asset" + i]) }));
          setTimeout(() => campaignDetail(c), 120);
        }),
    });
  }
  /** Proposition locale et déterministe : prestation la plus demandée, zone la plus fréquente, 50 € sur 5 jours. */
  function suggestCampaign() {
    const count = {};
    CX.S.missions.forEach((m) => { if (m.serviceId) count[m.serviceId] = (count[m.serviceId] || 0) + 1; });
    (CX.S.marketing.leads || []).forEach((l) => { if (l.serviceId) count[l.serviceId] = (count[l.serviceId] || 0) + 2; });
    const serviceId = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || CX.S.serviceCatalog[0].id;
    const dep = {};
    CX.S.missions.forEach((m) => { if (m.department) dep[m.department] = (dep[m.department] || 0) + 1; });
    const department = Object.entries(dep).sort((a, b) => b[1] - a[1])[0]?.[0] || "75";
    const svc = service(serviceId);
    campaignForm({
      values: { serviceId, department, budget: 50, days: 5, channel: "google", goal: "call" },
      why: `« ${svc.label} » est la prestation la plus demandée dans vos missions et prospects, et le ${department} votre zone la plus fréquente. Budget proposé : 50 € au total sur 5 jours, à ajuster. Rien n'est lancé : vous verrez l'aperçu, puis vous validerez (ou pas).`,
    });
  }
  function leadForm() {
    BO.formModal({
      title: "Enregistrer un prospect",
      intro:
        "Contact reçu par le bureau. Un clic anonyme ne devient pas automatiquement un prospect.",
      wide: true,
      fields: [
        { k: "name", label: "Nom", req: true },
        { k: "phone", label: "Téléphone", type: "tel" },
        { k: "email", label: "Courriel", type: "email" },
        {
          k: "serviceId",
          label: "Prestation",
          type: "select",
          opts: serviceOpts(),
        },
        {
          k: "department",
          label: "Département",
          type: "select",
          opts: zoneOpts(),
        },
        {
          k: "campaignId",
          label: "Campagne",
          type: "select",
          empty: "Aucune / origine directe",
          opts: CX.S.marketing.campaigns.map((c) => [
            c.id,
            c.id + " · " + c.channel,
          ]),
        },
        {
          k: "source",
          label: "Origine du contact",
          req: true,
          ph: "Appel reçu, formulaire du site…",
        },
        {
          k: "notes",
          label: "Besoin et prochaine action",
          type: "textarea",
          full: true,
        },
      ],
      submit: "Enregistrer",
      onSubmit: (x) => attempt(() => addLead(x)),
    });
  }
  function campaignDetail(c) {
    BO.drawer({
      head: "",
      title: () => esc("Publicité · " + c.id),
      sub: () => esc(c.status + " · " + c.channel),
      render: () => { const svcL = service(c.serviceId)?.label || ""; const leads = CX.S.marketing.leads.filter((l) => l.campaignId === c.id).length; return `
      <div class="commercial-copy">
      <h4 style="margin-top:0">Aperçu avant validation</h4>
      ${c.channel === "google"
        ? `<div class="ad-preview google"><div class="ap-tag">Aperçu Google · simulation locale</div><div class="ap-spons">Sponsorisé</div><div class="ap-url">${esc(new URL(c.url).hostname)}</div><div class="ap-title">${esc(c.headlines.slice(0, 2).join(" | "))}</div><div class="ap-desc">${esc(c.descriptions[0] || "")} ${esc(c.descriptions[2] || c.descriptions[1] || "")}</div></div>`
        : `<div class="ad-preview meta"><div class="ap-tag">Aperçu Facebook / Instagram · simulation locale</div><div class="ap-head"><span class="ap-logo">DD</span><div><b>Dan Dépanne</b><small>Sponsorisé</small></div></div><div class="ap-body">${esc(c.social)}</div><div class="ap-cta">${c.goal === "form" ? "Envoyer une demande" : "Appeler"}</div></div>`}
      <h4>Pourquoi ces choix</h4>${(c.why || []).map((w) => `<p>· ${esc(w)}</p>`).join("") || "<p>Brouillon créé avant l'assistant : choix non documentés.</p>"}
      <h4>Les chiffres, sans mélange</h4>
      <p>· Budget <b>prévu</b> : ${chf(c.budget)} — une intention, pas une dépense.<br>· Dépense <b>réelle</b> : ${c.metrics ? chf(c.metrics.spend) + " (relevé manuel)" : "non relevée"}.<br>· Clics <b>anonymes</b> (un clic n'est pas une personne) : ${c.metrics ? c.metrics.clicks : "non relevés"}.<br>· Prospects <b>identifiés</b> reliés à cette campagne : ${leads} (saisis par le bureau).</p>
      <div class="form-note warn">Préparation locale uniquement. Aucun compte connecté ni diffusion. La répartition journalière est indicative, sans plafond imposé à une plateforme.</div>
      <p><b>${chf(c.budget)} au total · ${c.days} jours · environ ${chf(c.dailyPlan)}/jour</b></p>
      <h4>Titres Google</h4>${c.headlines.map((t) => `<p>${esc(t)}</p>`).join("")}<h4>Descriptions</h4>${c.descriptions.map((t) => `<p>${esc(t)}</p>`).join("")}
      <h4>Facebook / Instagram</h4><p>${esc(c.social)}</p><h4>Lien de destination avec suivi</h4><p style="overflow-wrap:anywhere">${esc(c.url)}</p>
      <p>Relisez les prestations, les conditions tarifaires et le ciblage dans votre compte publicitaire avant toute publication manuelle.</p>
      ${c.metrics ? `<p>Relevé manuel : ${c.metrics.clicks} clics · ${chf(c.metrics.spend)} dépensés. Source : ${esc(c.metrics.source)}.</p>${c.metrics.spend > c.budget ? '<div class="form-note warn">Dépassement du budget prévu.</div>' : ""}` : "<p>Aucun relevé : performances non renseignées.</p>"}</div>`; },
      foot: () =>
        `<button class="btn" data-metrics>Saisir un relevé</button>${c.status === "Brouillon" ? '<button class="btn pri" data-validate>Valider pour export</button>' : '<button class="btn pri" data-export>Exporter le brouillon</button>'}`,
      onMount: (el, close) => {
        el.querySelector("[data-validate]")?.addEventListener("click", () =>
          attempt(() => {
            validate(c);
            close();
            campaignDetail(c);
          }),
        );
        el.querySelector("[data-export]")?.addEventListener("click", () => {
          BO.download(
            c.id + ".json",
            JSON.stringify(
              {
                ...c,
                publication:
                  "À effectuer manuellement dans le compte publicitaire ; aucun envoi effectué",
              },
              null,
              2,
            ),
            "application/json",
          );
          audit(c.id + " exporté, sans diffusion.");
        });
        el.querySelector("[data-metrics]").addEventListener("click", () =>
          BO.formModal({
            title: "Relevé manuel de performance",
            intro:
              "Chiffres réellement relevés sur la plateforme, aucune estimation de prospects.",
            fields: [
              {
                k: "spend",
                label: "Dépense totale relevée (€)",
                type: "number",
                min: 0,
                req: true,
              },
              {
                k: "clicks",
                label: "Clics relevés",
                type: "number",
                min: 0,
                req: true,
              },
              { k: "source", label: "Source et période du relevé", req: true },
            ],
            values: c.metrics || {},
            onSubmit: (x) =>
              attempt(() => {
                metrics(c, x);
                close();
                campaignDetail(c);
              }),
          }),
        );
      },
    });
  }
  function render(el, params = {}) {
    const tab = params.tab || "campaigns",
      mk = CX.S.marketing;
    const nav = [
      ["campaigns", "Publicités"],
      ["leads", "Prospects"],
      ["services", "Prestations & tarifs"],
    ];
    el.innerHTML = `<div class="bo-page commercial-page"><style>.commercial-page .card p { margin: 8px 0; line-height: 1.5; }.commercial-copy p { margin: 10px 0; line-height: 1.55; }.commercial-copy h4 { margin: 22px 0 8px; font-size: 14px; }.commercial-copy .form-note { margin-bottom: 18px; }</style>${BO.head("Développement commercial", "Dan Dépanne · préparation locale, validation humaine", `<button class="btn" data-lead>Ajouter un prospect</button><button class="btn" data-suggest>${BO.icon("cube", 15)}Proposer une campagne</button><button class="btn pri" data-campaign>Préparer une publicité</button>`)}
      <nav class="mb" style="display:flex;gap:8px;flex-wrap:wrap">${nav.map(([id, label]) => `<button class="btn ${id === tab ? "pri" : ""}" data-tab="${id}">${label}</button>`).join("")}</nav>
      <div class="form-note warn mb">Aucune publicité diffusée depuis cette application. Connexions officielles : Google ${mk.connections?.google ? "reliée" : "à raccorder"} · Meta ${mk.connections?.meta ? "reliée" : "à raccorder"} (comptes et autorisations de Joseph requis). En attendant : brouillons, aperçus et export JSON à saisir manuellement. Les relevés sont saisis à la main ; les clics restent anonymes.</div>
      ${
        tab === "services"
          ? `<p>Sources consultées le 16/10/2026. Prix « dès … TTC », à confirmer par Joseph. Gardiennage : aucun tarif publié trouvé ; les valeurs du parc restent de démonstration.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px">${CX.S.serviceCatalog.map((s) => `<section class="card" style="padding:16px"><h3>${esc(s.label)}</h3>${s.variants.map((v) => `<p>${esc(v.label)} · dès ${chf(v.fromTtc)} TTC</p>`).join("")}${s.issue ? `<p class="form-note warn">${esc(s.issue)}</p>` : ""}<p>${s.approved ? "Validé manuellement : dès " + chf(s.approvedFromTtc) + " TTC · " + esc(s.approvalNote) : "Non validé : les annonces indiquent « Prix sur devis »."}</p><a href="${esc(s.source)}" target="_blank" rel="noopener">Consulter la source</a> <button class="btn sm" data-approve="${s.id}">Valider un tarif</button></section>`).join("")}</div>`
          : tab === "leads"
            ? `<p>${mk.leads.length} contacts enregistrés · ${mk.leads.filter((l) => l.status === "À rappeler").length} à rappeler</p>${mk.leads.length ? mk.leads.map((l) => `<section class="card mb" style="padding:16px"><h3>${esc(l.name)} · ${esc(service(l.serviceId)?.label || "")}</h3><p>${esc(l.phone || l.email)} · ${esc(l.department)} · ${esc(l.source)}</p><p>${esc(l.notes)}</p><label>Suivi <select class="inp" data-stage="${l.id}">${BO.opts(stages, l.status)}</select></label> ${l.missionId ? `<button class="btn sm" data-open-lm="${l.missionId}">Mission ${esc((DEP.mission(l.missionId) || {}).no || "")}</button>` : `<button class="btn sm" data-lead-mission="${l.id}">Préparer la mission</button>`}</section>`).join("") : '<div class="form-note">Aucun prospect. Enregistrez un appel ou un formulaire réellement reçu.</div>'}`
            : `<p>${mk.campaigns.length} préparations · ${mk.campaigns.filter((c) => c.status === "Validé pour export").length} validées pour export · aucune diffusion raccordée</p>${mk.campaigns.length ? mk.campaigns.map((c) => `<button class="btn mb" style="display:block;width:100%;text-align:left;white-space:normal;height:auto;padding:16px" data-campaign-detail="${c.id}"><b>${esc(service(c.serviceId)?.label || "")} · ${esc(c.department)} · ${esc(c.channel)}</b><br>${chf(c.budget)} prévus · ${esc(c.status)}<br>${c.metrics ? c.metrics.clicks + " clics · " + chf(c.metrics.spend) + " dépensés (saisie manuelle)" : "Performances non renseignées"}</button>`).join("") : '<div class="form-note">Aucune publicité préparée. Commencez avec un budget total prévu de 50 € ; rien ne sera dépensé.</div>'}`
      }
      </div>`;
    el.querySelector("[data-campaign]").onclick = () => campaignForm();
    el.querySelector("[data-suggest]").onclick = suggestCampaign;
    el.querySelector("[data-lead]").onclick = leadForm;
    el.querySelectorAll("[data-tab]").forEach(
      (b) =>
        (b.onclick = () => APP.open("acquisition", { tab: b.dataset.tab })),
    );
    el.querySelectorAll("[data-campaign-detail]").forEach(
      (b) =>
        (b.onclick = () =>
          campaignDetail(
            mk.campaigns.find((c) => c.id === b.dataset.campaignDetail),
          )),
    );
    el.querySelectorAll("[data-lead-mission]").forEach(
      (b) =>
        (b.onclick = () => {
          const l = mk.leads.find((x) => x.id === b.dataset.leadMission);
          const preset = { origin: { channel: "lead", label: "Prospect " + l.source, no: l.id }, onCreated: (n) => { l.missionId = n.id; audit("Prospect " + l.id + " relié à la mission " + n.no + " (création confirmée par le bureau)."); } };
          if (l.name) preset.cname = l.name;
          if (l.phone) preset.cphone = l.phone;
          if (l.serviceId) preset.serviceId = l.serviceId;
          if (l.department) preset.department = l.department;
          DEP.missionForm(null, preset);
        }),
    );
    el.querySelectorAll("[data-open-lm]").forEach(
      (b) => (b.onclick = () => APP.open("missions", { id: b.dataset.openLm })),
    );
    el.querySelectorAll("[data-stage]").forEach(
      (b) =>
        (b.onchange = () =>
          attempt(() =>
            leadStage(
              mk.leads.find((l) => l.id === b.dataset.stage),
              b.value,
            ),
          )),
    );
    el.querySelectorAll("[data-approve]").forEach(
      (b) =>
        (b.onclick = () => {
          const s = service(b.dataset.approve);
          BO.formModal({
            title: "Valider le tarif · " + s.label,
            intro:
              "Validation déclarée par le bureau. Le montant publié reste conservé comme source.",
            fields: [
              {
                k: "amount",
                label: "À partir de (€ TTC)",
                type: "number",
                min: 0.01,
                req: true,
              },
              {
                k: "note",
                label: "Conditions et validation par Joseph",
                type: "textarea",
                req: true,
              },
            ],
            values: {
              amount: s.approvedFromTtc ?? s.variants[0].fromTtc,
              note: s.approvalNote || "",
            },
            onSubmit: (x) => attempt(() => approveService(s, x)),
          });
        }),
    );
  }
  APP.register({
    id: "acquisition",
    label: "Publicités & prospects",
    icon: "send",
    group: "Dépannage",
    order: 8,
    activity: "depannage",
    render,
  });
})();
