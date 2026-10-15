/* ==========================================================================
   BO · Showroom / vente (activité « concession ») : véhicules exposés,
   fiches avec kilométrage, prix, nombre de mains, statut, réservation,
   vente, affiche vitrine imprimable, export CSV.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { seg: 'all', q: '', sort: 'entry' };
  const STATUS = ['Préparation', 'En vente', 'Réservé', 'Vendu'];
  const TONE = { 'En vente': 'green', 'Réservé': 'amber', 'Préparation': '', 'Vendu': 'dark' };
  const FUEL = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
  const hands = n => n === 1 ? '1ʳᵉ main' : n + ' mains';
  const age = v => U.diffDays(v.entry, today());
  const veh = id => CX.S.showroom.find(v => v.id === id);
  const title = v => `${v.make} ${v.model}`;
  const margin = v => (v.soldPrice || v.price) - (v.buyPrice || 0);

  /* ---------- affiche vitrine (A4) ---------- */
  BO.printShowroom = id => {
    const v = veh(id), co = CX.S.company;
    const inner = `${BO.printHeader()}<h1 style="font-size:26pt">${esc(title(v))}</h1><div class="meta" style="font-size:12pt">${esc(v.version)} · ${v.year} · ${esc(v.colorName || '')}</div>
      <div style="display:flex;gap:28px;align-items:center;margin:18px 0 26px"><div style="flex:none">${UI.carPic(v.color, 260, 200)}</div>
      <div style="flex:1"><div style="font-size:34pt;font-weight:800;color:#1768ee;letter-spacing:-.02em">${chf(v.price)}</div><div style="color:#454b55;margin-top:4px">TTC · reprise possible · financement sur demande</div>
      <table style="margin-top:18px"><tr><th>Kilométrage</th><td>${BO.num(v.km)} km</td><th>Mise en circulation</th><td>${v.year}</td></tr><tr><th>Nombre de mains</th><td>${esc(hands(v.hands))}</td><th>Énergie</th><td>${esc(v.fuel)}</td></tr><tr><th>Boîte</th><td>${esc(v.gearbox)}</td><th>Garantie</th><td>${v.warranty} mois</td></tr><tr><th>Contrôle technique</th><td>valide jusqu’au ${esc(U.fmtD(v.ct))}</td><th>Immatriculation</th><td>${esc(v.plate || 'véhicule neuf')}</td></tr></table></div></div>
      ${v.notes ? `<p style="line-height:1.6">${esc(v.notes)}</p>` : ''}
      <p style="margin-top:28px;color:#454b55;font-size:9.5pt">${esc(co.name)} · ${esc(co.address)} · ${esc(co.phone)} · ${esc(co.email)}. Prix affiché TTC, hors frais d’immatriculation. Photos et caractéristiques non contractuelles.</p>`;
    BO.preview('Affiche — ' + title(v), BO.printHtml('Affiche ' + title(v), inner), 'Vitrine-' + (v.plate || v.id).replace(/\s/g, '') + '.html');
  };

  /* ---------- formulaire véhicule ---------- */
  const FIELDS = [
    { k: 'make', label: 'Marque', req: true }, { k: 'model', label: 'Modèle', req: true }, { k: 'version', label: 'Version / finition' },
    { k: 'year', label: 'Année', type: 'number', min: 1990, max: 2030, req: true }, { k: 'km', label: 'Kilométrage', type: 'number', min: 0, req: true }, { k: 'hands', label: 'Nombre de mains', type: 'number', min: 1, max: 9, req: true },
    { k: 'price', label: 'Prix de vente TTC (€)', type: 'number', min: 0, req: true }, { k: 'buyPrice', label: 'Prix d’achat / reprise (€)', type: 'number', min: 0, help: 'Visible uniquement en back-office.' }, { k: 'warranty', label: 'Garantie (mois)', type: 'number', min: 0, max: 60 },
    { k: 'fuel', label: 'Énergie', type: 'select', opts: FUEL }, { k: 'gearbox', label: 'Boîte', type: 'select', opts: ['Manuelle', 'Automatique'] }, { k: 'status', label: 'Statut', type: 'select', opts: STATUS },
    { k: 'plate', label: 'Immatriculation', ph: 'AA-123-AA (vide si neuf)' }, { k: 'colorName', label: 'Teinte' }, { k: 'color', label: 'Couleur (aperçu)', type: 'color' },
    { k: 'ct', label: 'Contrôle technique valide jusqu’au', type: 'date' }, { k: 'entry', label: 'Entrée en stock', type: 'date', req: true },
    { k: 'notes', label: 'Points forts / remarques', type: 'textarea', full: true, ph: 'ex. carnet d’entretien complet, 2 jeux de pneus, attelage…' },
  ];
  function form(v) {
    const isNew = !v;
    BO.formModal({ title: isNew ? 'Nouveau véhicule en vente' : title(v) + ' · ' + (v.plate || 'neuf'), wide: true, fields: FIELDS,
      values: v || { year: new Date().getFullYear() - 2, hands: 1, warranty: 12, fuel: 'Essence', gearbox: 'Manuelle', status: 'Préparation', color: '#c9ced6', entry: today() },
      danger: isNew ? null : { label: 'Retirer', title: 'Retirer ce véhicule ?', text: 'La fiche disparaît du showroom. Les ventes enregistrées restent dans l’historique si le statut est « Vendu ».', run: () => { if (v.status === 'Vendu') { v.archived = true; } else CX.S.showroom = CX.S.showroom.filter(x => x.id !== v.id); CX.touch('showroom'); UI.toast(v.status === 'Vendu' ? 'Vente archivée' : 'Véhicule retiré', title(v), 'ok', 'tag'); BO.now(); } },
      onSubmit: x => {
        ['year', 'km', 'hands', 'price', 'buyPrice', 'warranty'].forEach(k => { x[k] = x[k] === '' ? null : +x[k]; });
        x.plate = (x.plate || '').toUpperCase().trim() || null;
        if (isNew) { const n = Object.assign({ id: U.uid('SR-'), photos: 0, leads: 0, customerId: null, soldAt: null, soldPrice: null }, x); CX.S.showroom.unshift(n); }
        else Object.assign(v, x);
        CX.touch('showroom'); UI.toast(isNew ? 'Véhicule ajouté' : 'Fiche enregistrée', `${x.make} ${x.model} · ${chf(x.price)}`, 'ok', 'tag'); BO.now();
      } });
  }
  function reserve(v) {
    BO.formModal({ title: 'Réserver — ' + title(v), fields: [{ k: 'customerId', label: 'Client', type: 'select', opts: BO.optCustomers(), req: true }, { k: 'deposit', label: 'Acompte (€)', type: 'number', min: 0, v: Math.round(v.price * .1) }, { k: 'notes', label: 'Conditions', full: true, ph: 'ex. sous réserve de financement, reprise Clio 2015' }],
      submit: 'Réserver', onSubmit: x => { v.status = 'Réservé'; v.customerId = x.customerId; v.reservedAt = today(); v.deposit = +x.deposit || 0; if (x.notes) v.notes = (v.notes ? v.notes + ' · ' : '') + x.notes; CX.touch('showroom'); UI.toast('Véhicule réservé', title(v) + ' → ' + CX.custName(x.customerId), 'ok', 'tag'); BO.now(); } });
  }
  function sell(v) {
    BO.formModal({ title: 'Vente — ' + title(v), fields: [{ k: 'customerId', label: 'Acheteur', type: 'select', opts: BO.optCustomers(), req: true }, { k: 'soldPrice', label: 'Prix de vente final (€)', type: 'number', min: 0, req: true, v: v.price }, { k: 'soldAt', label: 'Date de livraison', type: 'date', req: true, v: today() }, { k: 'tradeIn', label: 'Reprise d’un véhicule', type: 'checkbox' }],
      values: { customerId: v.customerId || '' }, submit: 'Enregistrer la vente',
      onSubmit: x => { v.status = 'Vendu'; v.customerId = x.customerId; v.soldAt = x.soldAt; v.soldPrice = +x.soldPrice; v.tradeIn = !!x.tradeIn; CX.touch('showroom'); UI.toast('Vente enregistrée', `${title(v)} · ${chf(v.soldPrice)} · ${CX.custName(x.customerId)}`, 'ok', 'tag'); BO.now(); } });
  }
  function detail(v) {
    const c = v.customerId ? CX.cust(v.customerId) : null;
    const row = (l, val) => `<div class="field"><label>${esc(l)}</label><div class="b">${val}</div></div>`;
    UI.modal({ title: esc(title(v)) + ' <span class="muted" style="font-weight:500">· ' + esc(v.version || '') + '</span>', wide: true,
      body: `<div class="row" style="gap:22px;align-items:flex-start"><div style="flex:none;text-align:center">${UI.carPic(v.color, 220, 170)}<div class="mt1">${v.plate ? UI.plate(v.plate, true) : '<span class="chip">Véhicule neuf</span>'}</div></div>
        <div style="flex:1"><div class="row" style="gap:8px;flex-wrap:wrap">${BO.chip(v.status, TONE[v.status], true)}<span class="chip line">${esc(hands(v.hands))}</span><span class="chip line">${BO.num(v.km)} km</span><span class="chip line">${v.year}</span><span class="chip line">${esc(v.fuel)} · ${esc(v.gearbox)}</span></div>
        <div style="font-size:30px;font-weight:800;letter-spacing:-.02em;margin:12px 0 2px;color:var(--blue,#1768ee)">${v.status === 'Vendu' && v.soldPrice ? chf(v.soldPrice) : chf(v.price)}</div><div class="xs-t muted">${v.status === 'Vendu' ? 'prix de vente final · affiché ' + chf(v.price) : 'prix affiché TTC'} · marge brute ${chf(margin(v))}${v.buyPrice ? ' (' + Math.round(margin(v) / v.buyPrice * 100) + ' %)' : ''}</div>
        <div class="fgrid c3 mt">${row('Teinte', esc(v.colorName || '—'))}${row('Garantie', v.warranty + ' mois')}${row('Contrôle technique', v.ct ? 'jusqu’au ' + esc(U.fmtD(v.ct)) : '—')}${row('En stock depuis', age(v) + ' j (' + esc(U.fmtD(v.entry)) + ')')}${row('Demandes reçues', v.leads || 0)}${row(v.status === 'Vendu' ? 'Acheteur' : 'Client intéressé', c ? BO.custCell(c) : '<span class="muted">—</span>')}</div>
        ${v.notes ? `<div class="form-note mt">${BO.icon('file', 16)}<div>${esc(v.notes)}</div></div>` : ''}</div></div>`,
      foot: `<button class="btn" data-print>${BO.icon('print', 15)}Affiche vitrine</button><button class="btn" data-lead>${BO.icon('msg', 15)}+1 demande</button><span class="sp"></span><button class="btn" data-edit>${BO.icon('edit', 15)}Modifier</button>${v.status === 'En vente' ? `<button class="btn" data-reserve>${BO.icon('tag', 15)}Réserver</button>` : ''}${v.status === 'Réservé' ? `<button class="btn" data-release>Libérer</button>` : ''}${v.status === 'Préparation' ? `<button class="btn pri" data-onsale>${BO.icon('check', 15)}Mettre en vente</button>` : ''}${v.status === 'En vente' || v.status === 'Réservé' ? `<button class="btn pri" data-sell>${BO.icon('check', 15)}Vendre</button>` : ''}`,
      onMount: (el, close) => {
        const on = (sel, fn) => { const b = el.querySelector(sel); if (b) b.addEventListener('click', () => { close(); fn(); }); };
        on('[data-print]', () => BO.printShowroom(v.id)); on('[data-edit]', () => form(v)); on('[data-reserve]', () => reserve(v)); on('[data-sell]', () => sell(v));
        on('[data-lead]', () => { v.leads = (v.leads || 0) + 1; CX.touch('showroom'); UI.toast('Demande notée', title(v) + ' · ' + v.leads + ' demande' + (v.leads > 1 ? 's' : ''), 'ok', 'msg'); BO.now(); });
        on('[data-release]', () => { v.status = 'En vente'; v.customerId = null; v.deposit = 0; CX.touch('showroom'); UI.toast('Réservation levée', title(v) + ' est de nouveau en vente', 'ok', 'tag'); BO.now(); });
        on('[data-onsale]', () => { v.status = 'En vente'; CX.touch('showroom'); UI.toast('Mis en vente', title(v) + ' · ' + chf(v.price), 'ok', 'tag'); BO.now(); });
      } });
  }

  function render(el, params) {
    const S = CX.S, all = S.showroom || [];
    if (params.id && veh(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(veh(id)), 0); }
    const m = today().slice(0, 7), onSale = all.filter(v => v.status === 'En vente'), sold = all.filter(v => v.status === 'Vendu' && (v.soldAt || '').slice(0, 7) === m);
    const stockVal = onSale.concat(all.filter(v => v.status === 'Réservé')).reduce((a, v) => a + v.price, 0);
    const avgAge = onSale.length ? Math.round(onSale.reduce((a, v) => a + age(v), 0) / onSale.length) : 0;
    const q = st.q.toLowerCase();
    let rows = all.filter(v => !v.archived).filter(v => st.seg === 'all' ? v.status !== 'Vendu' : st.seg === 'Vendu' ? v.status === 'Vendu' : v.status === st.seg);
    if (q) rows = rows.filter(v => (title(v) + ' ' + v.version + ' ' + (v.plate || '') + ' ' + v.year + ' ' + (v.colorName || '')).toLowerCase().includes(q));
    rows.sort((a, b) => st.sort === 'price' ? a.price - b.price : st.sort === 'km' ? a.km - b.km : st.sort === 'leads' ? (b.leads || 0) - (a.leads || 0) : a.entry < b.entry ? 1 : -1);
    const counts = s => all.filter(v => v.status === s).length;
    el.innerHTML = `<div class="bo-page">${BO.head('Showroom / vente', `${onSale.length} véhicule${onSale.length > 1 ? 's' : ''} en vente · valeur du stock ${chf(stockVal)} · ${sold.length} vendu${sold.length > 1 ? 's' : ''} ce mois`, `<button class="btn" data-csv>${BO.icon('download', 15)}Export CSV</button><button class="btn pri" data-new>${BO.icon('plus', 15)}Nouveau véhicule</button>`)}
      <div class="kpis">${BO.kpi({ lb: 'En vente', v: onSale.length, icon: 'tag', s: counts('Préparation') + ' en préparation' })}${BO.kpi({ lb: 'Valeur du stock (TTC)', v: chf(stockVal), icon: 'trend', s: 'en vente + réservés' })}${BO.kpi({ lb: 'Réservés', v: counts('Réservé'), icon: 'check', s: 'acomptes en cours' })}${BO.kpi({ lb: 'Vendus ce mois', v: sold.length, icon: 'invoice', s: 'marge brute ' + chf(sold.reduce((a, v) => a + margin(v), 0)) })}${BO.kpi({ lb: 'Âge moyen du stock', v: avgAge + ' j', icon: 'clock', s: onSale.filter(v => age(v) > 60).length + ' au-delà de 60 j', cls: onSale.some(v => age(v) > 90) ? 'warn' : '' })}${BO.kpi({ lb: 'Demandes reçues', v: all.reduce((a, v) => a + (v.leads || 0), 0), icon: 'msg', s: 'sur l’ensemble des fiches' })}</div>
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['all', 'Tous', all.filter(v => v.status !== 'Vendu').length], ['En vente', 'En vente', counts('En vente')], ['Réservé', 'Réservés', counts('Réservé')], ['Préparation', 'Préparation', counts('Préparation')], ['Vendu', 'Vendus', counts('Vendu')]], st.seg)}<span class="sp"></span>${BO.seg('sort', [['entry', 'Récents'], ['price', 'Prix'], ['km', 'Km'], ['leads', 'Demandes']], st.sort)}<div class="box" style="width:260px"><input class="inp" data-q placeholder="Marque, modèle, plaque, teinte…" value="${esc(st.q)}"></div></div>
      ${rows.length ? `<div class="fleet showroom">${rows.map(v => `<div class="kcar" data-v="${v.id}"><div class="pic">${UI.carPic(v.color, 150, 110)}</div><div class="bd"><div class="row"><b>${esc(title(v))}</b><span class="sp"></span>${BO.chip(v.status, TONE[v.status], true)}</div><div class="xs-t muted" style="margin-top:2px">${esc(v.version || '')}</div>
        <div class="row mt1" style="gap:6px;flex-wrap:wrap"><span class="chip line">${v.year}</span><span class="chip line">${BO.num(v.km)} km</span><span class="chip line">${esc(hands(v.hands))}</span><span class="chip line">${esc(v.fuel)}</span></div>
        <div class="row mt1" style="align-items:baseline"><span style="font-size:21px;font-weight:800;letter-spacing:-.02em">${chf(v.status === 'Vendu' && v.soldPrice ? v.soldPrice : v.price)}</span><span class="sp"></span><span class="xs-t muted">${v.status === 'Vendu' ? 'vendu le ' + esc(BO.dateS(v.soldAt)) : age(v) + ' j en stock' + (v.leads ? ' · ' + v.leads + ' demande' + (v.leads > 1 ? 's' : '') : '')}</span></div></div></div>`).join('')}</div>` : BO.empty('Aucun véhicule', 'Ajoutez une fiche ou changez de filtre.')}</div>`;
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelector('[data-new]').addEventListener('click', () => form());
    el.querySelector('[data-csv]').addEventListener('click', () => BO.download('showroom-' + today() + '.csv', BO.csv([['Marque', 'Modèle', 'Version', 'Année', 'Km', 'Mains', 'Énergie', 'Boîte', 'Prix TTC', 'Statut', 'Immatriculation', 'Entrée stock', 'Demandes']].concat(all.map(v => [v.make, v.model, v.version, v.year, v.km, v.hands, v.fuel, v.gearbox, v.price, v.status, v.plate || '', v.entry, v.leads || 0]))), 'text/csv'));
    el.querySelectorAll('[data-v]').forEach(c => c.addEventListener('click', () => detail(veh(c.dataset.v))));
  }

  APP.register({ id: 'showroom', label: 'Showroom / vente', icon: 'tag', group: 'Commercial & assurances', order: 0, activity: 'showroom', render, badge: () => (CX.S.showroom || []).filter(v => v.status === 'Réservé').length });
})();
