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
      ],
      social: `Dan Dépanne · ${s.label} dans le ${d.name}. ${price} Contactez le bureau pour organiser votre intervention.`,
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
  function campaignForm() {
    BO.formModal({
      title: "Préparer une publicité",
      intro:
        "Brouillon local. Aucun compte connecté, aucune dépense ni diffusion.",
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
      ],
      values: { budget: 50, days: 5, channel: "google" },
      submit: "Générer le brouillon",
      onSubmit: (x) => attempt(() => draft(x)),
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
      render: () => `
      <div class="commercial-copy"><div class="form-note warn">Préparation locale uniquement. Aucun compte connecté ni diffusion. La répartition journalière est indicative, sans plafond imposé à une plateforme.</div>
      <p><b>${chf(c.budget)} au total · ${c.days} jours · environ ${chf(c.dailyPlan)}/jour</b></p>
      <h4>Titres Google</h4>${c.headlines.map((t) => `<p>${esc(t)}</p>`).join("")}<h4>Descriptions</h4>${c.descriptions.map((t) => `<p>${esc(t)}</p>`).join("")}
      <h4>Facebook / Instagram</h4><p>${esc(c.social)}</p><h4>Lien de destination avec suivi</h4><p style="overflow-wrap:anywhere">${esc(c.url)}</p>
      <p>Relisez les prestations, les conditions tarifaires et le ciblage dans votre compte publicitaire avant toute publication manuelle.</p>
      ${c.metrics ? `<p>Relevé manuel : ${c.metrics.clicks} clics · ${chf(c.metrics.spend)} dépensés. Source : ${esc(c.metrics.source)}.</p>${c.metrics.spend > c.budget ? '<div class="form-note warn">Dépassement du budget prévu.</div>' : ""}` : "<p>Aucun relevé : performances non renseignées.</p>"}</div>`,
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
    el.innerHTML = `<div class="bo-page commercial-page"><style>.commercial-page .card p { margin: 8px 0; line-height: 1.5; }.commercial-copy p { margin: 10px 0; line-height: 1.55; }.commercial-copy h4 { margin: 22px 0 8px; font-size: 14px; }.commercial-copy .form-note { margin-bottom: 18px; }</style>${BO.head("Développement commercial", "Dan Dépanne · préparation locale, validation humaine", `<button class="btn" data-lead>Ajouter un prospect</button><button class="btn pri" data-campaign>Préparer une publicité</button>`)}
      <nav class="mb" style="display:flex;gap:8px;flex-wrap:wrap">${nav.map(([id, label]) => `<button class="btn ${id === tab ? "pri" : ""}" data-tab="${id}">${label}</button>`).join("")}</nav>
      <div class="form-note warn mb">Aucune publicité diffusée depuis cette application. Aucun compte Google/Meta connecté. Les contacts et les relevés sont saisis manuellement ; les clics restent anonymes.</div>
      ${
        tab === "services"
          ? `<p>Sources consultées le 16/10/2026. Prix « dès … TTC », à confirmer par Joseph. Gardiennage : aucun tarif publié trouvé ; les valeurs du parc restent de démonstration.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px">${CX.S.serviceCatalog.map((s) => `<section class="card" style="padding:16px"><h3>${esc(s.label)}</h3>${s.variants.map((v) => `<p>${esc(v.label)} · dès ${chf(v.fromTtc)} TTC</p>`).join("")}${s.issue ? `<p class="form-note warn">${esc(s.issue)}</p>` : ""}<p>${s.approved ? "Validé manuellement : dès " + chf(s.approvedFromTtc) + " TTC · " + esc(s.approvalNote) : "Non validé : les annonces indiquent « Prix sur devis »."}</p><a href="${esc(s.source)}" target="_blank" rel="noopener">Consulter la source</a> <button class="btn sm" data-approve="${s.id}">Valider un tarif</button></section>`).join("")}</div>`
          : tab === "leads"
            ? `<p>${mk.leads.length} contacts enregistrés · ${mk.leads.filter((l) => l.status === "À rappeler").length} à rappeler</p>${mk.leads.length ? mk.leads.map((l) => `<section class="card mb" style="padding:16px"><h3>${esc(l.name)} · ${esc(service(l.serviceId)?.label || "")}</h3><p>${esc(l.phone || l.email)} · ${esc(l.department)} · ${esc(l.source)}</p><p>${esc(l.notes)}</p><label>Suivi <select class="inp" data-stage="${l.id}">${BO.opts(stages, l.status)}</select></label></section>`).join("") : '<div class="form-note">Aucun prospect. Enregistrez un appel ou un formulaire réellement reçu.</div>'}`
            : `<p>${mk.campaigns.length} préparations · ${mk.campaigns.filter((c) => c.status === "Validé pour export").length} validées pour export · aucune diffusion raccordée</p>${mk.campaigns.length ? mk.campaigns.map((c) => `<button class="btn mb" style="display:block;width:100%;text-align:left;white-space:normal;height:auto;padding:16px" data-campaign-detail="${c.id}"><b>${esc(service(c.serviceId)?.label || "")} · ${esc(c.department)} · ${esc(c.channel)}</b><br>${chf(c.budget)} prévus · ${esc(c.status)}<br>${c.metrics ? c.metrics.clicks + " clics · " + chf(c.metrics.spend) + " dépensés (saisie manuelle)" : "Performances non renseignées"}</button>`).join("") : '<div class="form-note">Aucune publicité préparée. Commencez avec un budget total prévu de 50 € ; rien ne sera dépensé.</div>'}`
      }
      </div>`;
    el.querySelector("[data-campaign]").onclick = campaignForm;
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
