/* ==========================================================================
   BO · Qualité & garanties : contrôle qualité avant livraison (checklist,
   photos après), réclamations & retouches, garanties travaux en cours.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { tab: 'cq', sel: null, cf: 'open' };
  const CST = { 'Ouverte': 'red', 'Planifiée': 'amber', 'Résolue': 'green' };
  const warrantyEnd = r => U.addDays(U.dOf(r.outAt), Math.round(CX.S.company.warrantyMonths * 30.44));

  function cplForm(c, pre = {}) {
    BO.formModal({ title: c ? 'Réclamation — ' + CX.custName(c.customerId) : 'Nouvelle réclamation / retouche', fields: [{ k: 'roId', label: 'OR concerné', type: 'select', opts: BO.optROs(() => true), req: true }, { k: 'type', label: 'Type', type: 'select', opts: ['Retouche garantie', 'Réclamation', 'Défaut pièce fournisseur', 'Dommage pendant les travaux'], req: true }, { k: 'desc', label: 'Description', type: 'textarea', full: true, req: true }, { k: 'warranty', label: 'Prise en charge sous garantie', type: 'checkbox' }, { k: 'status', label: 'Statut', type: 'select', opts: ['Ouverte', 'Planifiée', 'Résolue'] }, { k: 'due', label: 'Échéance', type: 'date', req: true }, { k: 'by', label: 'Responsable', type: 'select', opts: BO.optStaff() }, { k: 'cost', label: 'Coût interne (€)', type: 'number', min: 0, step: 10 }, { k: 'resolution', label: 'Résolution', type: 'textarea', full: true }],
      values: c || Object.assign({ type: 'Retouche garantie', warranty: true, status: 'Ouverte', due: U.wd(3), by: 'E1', cost: 0 }, pre), submit: c ? 'Enregistrer' : 'Créer',
      onSubmit: x => { const r = CX.ro(x.roId); if (x.status === 'Résolue' && !x.resolution) { UI.toast('Résolution manquante', 'Décrivez la solution apportée avant de clôturer.', 'warn'); return false; } CX.upsert('complaints', Object.assign({}, c || { id: U.uid('Q'), date: today() }, x, { customerId: r.customerId }), 'complaint'); if (!c && x.type === 'Retouche garantie') { CX.upsert('reminders', { id: U.uid('RM'), customerId: r.customerId, vehicleId: r.vehicleId, kind: 'Retouche garantie', due: x.due, status: 'Planifié', note: x.desc.slice(0, 60) }, 'reminder'); } UI.toast(c ? 'Réclamation mise à jour' : 'Réclamation enregistrée', CX.custName(r.customerId), 'ok', 'check'); BO.now(); } });
  }

  function cqTab(host) {
    const S = CX.S, list = S.ros.filter(r => r.stage === CX.ST.cq || (r.stage === CX.ST.remont && r.qc && r.qc.ok === false)).concat(S.ros.filter(r => r.stage === CX.ST.remont && !(r.qc && r.qc.ok === false))).filter((r, i, a) => a.indexOf(r) === i);
    if (!st.sel || !list.some(r => r.id === st.sel)) st.sel = (list[0] || {}).id || null;
    const r = st.sel ? CX.ro(st.sel) : null;
    host.innerHTML = `<div class="g" style="grid-template-columns:320px minmax(0,1fr);align-items:start"><div class="card"><div class="card-h"><h3>${BO.icon('check', 16)}À contrôler <small>${list.length}</small></h3></div><div class="card-b"><div class="mini-list">${list.map(x => { const v = CX.veh(x.vehicleId); return `<div class="cl" data-r="${x.id}" style="${x.id === st.sel ? 'background:#fdf3f3;margin:0 -8px;padding:9px 8px;border-radius:10px' : ''}">${UI.carPic(v.hex, 46, 36)}<div style="flex:1;min-width:0"><div>${BO.plate(v.plate)}</div><b class="sm-t" style="display:block;margin-top:3px">${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(x.no)} · ${esc(CX.STAGES[x.stage].s)}${x.qc && x.qc.ok === false ? ' · <span class="bad-t b">retouche</span>' : ''}</div></div></div>`; }).join('') || BO.empty('check', 'Aucun véhicule à contrôler', 'Les OR arrivent ici après le remontage.', '', true)}</div></div></div>
      <div>${r ? (() => { const v = CX.veh(r.vehicleId), qc = r.qc || { items: {} }, items = qc.items || {}, done = CX.QC_ITEMS.filter((_, i) => items[i]).length, ready = r.stage === CX.ST.cq; return `<div class="card"><div class="card-h"><h3>${BO.plate(v.plate)} ${esc(CX.vlabel(v))} <small>· ${esc(r.no)} · ${esc(CX.custName(r.customerId))}</small></h3>${CX.ONSITE(r.slot) ? BO.mapBtn('vehicle', v.id) : ''}</div><div class="card-b">
          ${!ready ? `<div class="form-note warn mb">${BO.icon('wrench', 16)}<div>Ce véhicule est encore au remontage${qc.ok === false ? ' (retouche demandée : ' + esc(qc.note || '') + ')' : ''}. Passez-le en contrôle qualité pour valider la checklist.</div><button class="btn sm" data-tocq style="margin-left:auto">Passer au CQ</button></div>` : ''}
          <div class="g g2"><div><div class="row mb"><b>Checklist avant livraison</b><span class="sp"></span><span class="chip ${done === CX.QC_ITEMS.length ? 'green' : 'amber'}">${done} / ${CX.QC_ITEMS.length}</span></div><ul class="check-l">${CX.QC_ITEMS.map((l, i) => `<li class="${items[i] ? 'done' : ''}"><span class="ck" data-qi="${i}">${items[i] ? BO.icon('check', 11) : ''}</span><span class="l">${esc(l)}</span></li>`).join('')}</ul><button class="btn xs mt1" data-all ${ready ? '' : 'disabled'}>Tout cocher</button></div>
            <div><b class="sm-t">Dommages réparés</b><div style="max-width:150px;margin-top:8px">${BO.carDiagram((r.checkin || {}).damages || {})}</div><div class="field mt"><label>Remarque du contrôleur</label><textarea class="inp" data-note rows="3" placeholder="Obligatoire en cas de refus">${esc(qc.note || '')}</textarea></div></div></div>
          <h2 class="sec mt">${BO.icon('camera', 15)}Photos après réparation</h2>${BO.photoGrid(r.photos.filter(p => p.k === 'apres'), true)}
          <div class="row mt" style="justify-content:flex-end;gap:8px"><button class="btn danger" data-ko ${ready ? '' : 'disabled'}>${BO.icon('x', 14)}Refuser — retouche</button><button class="btn pri" data-ok ${ready ? '' : 'disabled'}>${BO.icon('check', 14)}Valider le CQ → lavage</button></div></div></div>`; })() : `<div class="card">${BO.empty('check', 'Aucun véhicule sélectionné')}</div>`}</div></div>`;
    host.querySelectorAll('[data-r]').forEach(x => x.addEventListener('click', () => { st.sel = x.dataset.r; APP.refresh(); }));
    if (!r) return;
    const items = Object.assign({}, (r.qc || {}).items || {});
    host.querySelectorAll('[data-qi]').forEach(b => b.addEventListener('click', () => { if (r.stage !== CX.ST.cq) return; const i = b.dataset.qi; items[i] = !items[i]; CX.setQC(r.id, items, host.querySelector('[data-note]').value); BO.now(); }));
    const all = host.querySelector('[data-all]'); if (all) all.addEventListener('click', () => { CX.QC_ITEMS.forEach((_, i) => { items[i] = true; }); CX.setQC(r.id, items, host.querySelector('[data-note]').value); BO.now(); });
    const tocq = host.querySelector('[data-tocq]'); if (tocq) tocq.addEventListener('click', () => BO.moveStage(r.id, CX.ST.cq));
    host.querySelectorAll('[data-addph]').forEach(b => b.addEventListener('click', () => { r.photos.push({ id: U.uid('ph'), l: 'Après — ' + (r.photos.filter(p => p.k === 'apres').length + 1), k: 'apres', at: CX.now() }); CX.touch('ro', { roId: r.id }); BO.now(); }));
    host.querySelector('[data-ok]').addEventListener('click', () => { const n = CX.QC_ITEMS.filter((_, i) => items[i]).length; if (n < CX.QC_ITEMS.length) { UI.toast('Checklist incomplète', (CX.QC_ITEMS.length - n) + ' point(s) non contrôlé(s).', 'warn', 'check'); return; } CX.qcDecision(r.id, true, host.querySelector('[data-note]').value); UI.toast('Contrôle qualité validé', r.no + ' → lavage (le véhicule sort de l’atelier)', 'ok', 'check'); BO.now(); });
    host.querySelector('[data-ko]').addEventListener('click', () => { const note = host.querySelector('[data-note]').value.trim(); if (!note) { UI.toast('Motif requis', 'Indiquez la retouche à effectuer.', 'warn'); host.querySelector('[data-note]').focus(); return; } CX.qcDecision(r.id, false, note); UI.toast('Retouche demandée', r.no + ' → remontage', 'warn', 'wrench'); BO.now(); });
  }

  function render(el, params) {
    if (params.id && CX.ro(params.id)) { st.tab = 'cq'; st.sel = params.id; APP.setParams({ id: null }); }
    const S = CX.S, cq = S.ros.filter(r => r.stage === CX.ST.cq), open = S.complaints.filter(c => c.status !== 'Résolue');
    const delivered = S.ros.filter(r => r.stage === CX.ST.facture && r.outAt), active = delivered.filter(r => warrantyEnd(r) >= today());
    const firstPass = delivered.length ? 1 - S.complaints.filter(c => c.type !== 'Réclamation').length / delivered.length : 1;
    el.innerHTML = `<div class="bo-page">${BO.head('Qualité & garanties', `Contrôle avant livraison, réclamations, retouches et garanties ${S.company.warrantyMonths} mois sur les travaux`, `<button class="btn pri" data-nc>${BO.icon('plus', 15)}Réclamation</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">${BO.kpi({ lb: 'À contrôler', v: cq.length, s: 'véhicules en contrôle qualité', icon: 'check', cls: cq.length ? 'hero' : '' })}${BO.kpi({ lb: 'Bon du premier coup', v: Math.round(firstPass * 100) + '<small>%</small>', s: 'sans retouche après livraison', icon: 'trend' })}${BO.kpi({ lb: 'Réclamations ouvertes', v: open.length, s: chf(S.complaints.reduce((a, c) => a + (c.cost || 0), 0)) + ' de coûts internes', icon: 'alert' })}${BO.kpi({ lb: 'Garanties actives', v: active.length, s: 'travaux livrés < ' + S.company.warrantyMonths + ' mois (données démo)', icon: 'shieldok' })}</div>
      ${BO.tabs([['cq', 'Contrôle qualité', cq.length, 'red'], ['cpl', 'Réclamations & retouches', open.length], ['gar', 'Garanties']], st.tab)}<div data-b></div></div>`;
    const host = el.querySelector('[data-b]');
    if (st.tab === 'cq') cqTab(host);
    else if (st.tab === 'cpl') {
      const rows = S.complaints.filter(c => st.cf === 'all' || (st.cf === 'open' ? c.status !== 'Résolue' : c.status === 'Résolue'));
      host.innerHTML = `<div class="toolbar">${BO.seg('cf', [['open', 'En cours'], ['done', 'Résolues'], ['all', 'Toutes']], st.cf)}</div><div data-t></div>`;
      BO.table(host.querySelector('[data-t]'), { rows, state: (st.ct = st.ct || { sort: 'date', dir: 'desc' }), onRow: c => cplForm(c),
        empty: BO.empty('shieldok', 'Aucune réclamation', 'Rien à signaler — bon travail.', '', true),
        cols: [{ k: 'date', label: 'Date', render: c => esc(BO.dateS(c.date)) }, { k: 'cust', label: 'Client', get: c => CX.custName(c.customerId), render: c => BO.custCell(CX.cust(c.customerId)) }, { k: 'ro', label: 'OR', render: c => CX.ro(c.roId) ? BO.roLink(CX.ro(c.roId)) : '—' },
          { k: 'type', label: 'Type', render: c => BO.chip(c.type, c.type === 'Réclamation' ? 'red' : '') }, { k: 'desc', label: 'Description', render: c => `<span class="sm-t">${esc(c.desc)}</span>${c.resolution ? `<div class="xs-t ok-t">${esc(c.resolution)}</div>` : ''}` },
          { k: 'warranty', label: 'Garantie', render: c => c.warranty ? '<span class="chip green">oui</span>' : '<span class="muted">non</span>' }, { k: 'due', label: 'Échéance', render: c => esc(BO.dateS(c.due)) }, { k: 'by', label: 'Responsable', render: c => BO.av(c.by, 26) },
          { k: 'status', label: 'Statut', render: c => BO.chip(c.status, CST[c.status], true) }] });
    } else {
      const rows = delivered.slice().sort((a, b) => b.outAt.localeCompare(a.outAt));
      host.innerHTML = `<div class="form-note mb">${BO.icon('shieldok', 16)}<div>Garantie de ${S.company.warrantyMonths} mois sur la main-d’œuvre et la peinture à compter de la restitution (paramétrable). Une retouche sous garantie se déclare depuis l’OR concerné.</div></div><div data-t></div>`;
      BO.table(host.querySelector('[data-t]'), { rows, state: (st.gt = st.gt || { sort: 'out', dir: 'desc' }),
        cols: [{ k: 'no', label: 'OR', render: r => BO.roLink(r) }, { k: 'veh', label: 'Véhicule', render: r => BO.vehCell(CX.veh(r.vehicleId), CX.custName(r.customerId)) }, { k: 'dmg', label: 'Travaux', render: r => `<span class="sm-t">${esc(r.damage)}</span>` },
          { k: 'out', label: 'Restitué', get: r => r.outAt, render: r => esc(BO.dateS(r.outAt)) }, { k: 'end', label: 'Fin de garantie', get: warrantyEnd, render: r => esc(BO.date(warrantyEnd(r))) },
          { k: 'cl', label: 'Réclamations', num: true, get: r => S.complaints.filter(c => c.roId === r.id).length, render: r => { const n = S.complaints.filter(c => c.roId === r.id).length; return n ? `<span class="chip amber">${n}</span>` : '<span class="muted">—</span>'; } },
          { k: 'act', label: '', nosort: true, render: r => `<button class="btn xs" data-ret="${r.id}">${BO.icon('spray', 11)}Retouche</button>` }],
        after: h => h.querySelectorAll('[data-ret]').forEach(b => b.addEventListener('click', () => cplForm(null, { roId: b.dataset.ret }))) });
    }
    BO.bindTabs(el, t => { st.tab = t; APP.refresh(); });
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    el.querySelector('[data-nc]').addEventListener('click', () => cplForm(null));
  }

  APP.register({ id: 'quality', label: 'Qualité & garanties', icon: 'shieldok', group: 'Atelier', order: 5, activity: 'atelier', render, badge: () => CX.S.ros.filter(r => r.stage === CX.ST.cq).length });
})();
