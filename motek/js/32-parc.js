/* ==========================================================================
   BO · Parc de gardiennage : trois niveaux souterrains, plan des places,
   véhicules en garde (mandant, motif, durée, frais), entrées / sorties,
   relances et abandons.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { level: 'N1', seg: 'all', q: '' };
  const TONE = { 'En garde': 'green', 'Relance à faire': 'amber', 'Abandon présumé': 'red', 'À restituer': 'amber', 'Restitué': 'dark' };
  const days = g => Math.max(1, U.diffDays(g.since, g.outAt ? U.dOf(g.outAt) : today()) + 1);
  const fees = g => days(g) * (g.dailyFee || CX.S.parc.dailyFee) + (CX.S.parc.adminFee || 0);
  const garde = id => CX.S.gardes.find(g => g.id === id);
  const inPark = () => CX.S.gardes.filter(g => !g.outAt);
  window.DEP = window.DEP || {};
  DEP.garde = garde; DEP.gardeDays = days; DEP.gardeFees = fees; DEP.inPark = inPark;
  DEP.refreshGardeStatus = () => { inPark().forEach(g => { if (g.status === 'À restituer') return; const d = days(g); g.status = d > 60 ? 'Abandon présumé' : d > 30 ? 'Relance à faire' : 'En garde'; }); };

  function gardeForm(g) {
    const used = new Set(inPark().filter(x => !g || x.id !== g.id).map(x => x.slot)), opts = [];
    CX.S.parc.levels.forEach(l => { for (let i = 1; i <= l.slots; i++) { const s = l.id + '-' + U.pad(i); if (!used.has(s)) opts.push([l.id + '|' + s, l.name + ' · place ' + U.pad(i)]); } });
    BO.formModal({ title: g ? 'Garde ' + g.no : 'Entrée au parc', wide: true, cols: 'c3',
      fields: [{ k: 'plate', label: 'Immatriculation', req: true }, { k: 'make', label: 'Marque', req: true }, { k: 'model', label: 'Modèle', req: true }, { k: 'hex', label: 'Couleur', type: 'color' }, { k: 'mandant', label: 'Mandant', req: true }, { k: 'ref', label: 'Référence sinistre' }, { k: 'reason', label: 'Motif de la garde', full: true, req: true }, { k: 'oname', label: 'Propriétaire' }, { k: 'ophone', label: 'Téléphone', type: 'tel' }, { k: 'slot', label: 'Place', type: 'select', opts: g ? [[g.level + '|' + g.slot, g.slot + ' (actuelle)']].concat(opts.slice(0, 150)) : opts.slice(0, 150), req: true }, { k: 'dailyFee', label: 'Frais / jour (€)', type: 'number', min: 0 }, { k: 'since', label: 'Entrée le', type: 'date', req: true }],
      values: g ? Object.assign({}, g, { plate: g.vehicle.plate, make: g.vehicle.make, model: g.vehicle.model, hex: g.vehicle.hex, oname: g.owner.name, ophone: g.owner.phone, slot: g.level + '|' + g.slot }) : { hex: '#c9cdd3', mandant: 'AXA', dailyFee: CX.S.parc.dailyFee, since: today() },
      submit: g ? 'Enregistrer' : 'Enregistrer l’entrée', onSubmit: x => { const [level, slot] = x.slot.split('|'); const o = { vehicle: { plate: x.plate.toUpperCase().trim(), make: x.make, model: x.model, hex: x.hex || '#c9cdd3' }, mandant: x.mandant, ref: x.ref || '', reason: x.reason, owner: { name: x.oname || '', phone: x.ophone || '' }, level, slot, dailyFee: +x.dailyFee || CX.S.parc.dailyFee, since: x.since }; if (g) { Object.assign(g, o); g.history.unshift({ at: CX.now(), text: 'Fiche modifiée' }); } else CX.S.gardes.unshift(Object.assign({ id: U.uid('G'), no: 'GA-' + (5200 + CX.S.gardes.length), status: 'En garde', outAt: null, paid: 0, history: [{ at: CX.now(), text: 'Entrée au parc' }] }, o)); DEP.refreshGardeStatus(); CX.touch('garde'); UI.toast(g ? 'Garde modifiée' : 'Véhicule entré au parc', o.vehicle.plate + ' · ' + slot, 'ok', 'box'); BO.now(); } });
  }
  function outForm(g) {
    const total = fees(g);
    BO.formModal({ title: 'Sortie — ' + g.vehicle.plate, intro: `<div class="form-note">${BO.icon('coins', 16)}<div>${days(g)} jour${days(g) > 1 ? 's' : ''} de garde × ${chf(g.dailyFee)} + frais de dossier ${chf(CX.S.parc.adminFee)} = <b>${chf(total)}</b> HT, facturés à <b>${esc(g.mandant)}</b>.</div></div>`,
      fields: [{ k: 'to', label: 'Remis à', type: 'select', opts: ['Propriétaire', 'Assureur / expert', 'Épaviste', 'Garage réparateur', 'Fourrière'], req: true }, { k: 'who', label: 'Nom de la personne', req: true }, { k: 'paid', label: 'Réglé sur place (€)', type: 'number', min: 0, v: 0 }, { k: 'notes', label: 'Remarques', full: true }],
      submit: 'Enregistrer la sortie', onSubmit: x => { g.outAt = CX.now(); g.status = 'Restitué'; g.paid = +x.paid || 0; g.total = total; g.history.unshift({ at: CX.now(), text: 'Sortie : remis à ' + x.who + ' (' + x.to + ')' + (x.notes ? ' — ' + x.notes : '') + ' · frais ' + chf(total) }); CX.touch('garde'); UI.toast('Véhicule sorti du parc', g.vehicle.plate + ' · ' + chf(total) + ' à facturer', 'ok', 'key'); BO.now(); } });
  }
  function detail(g) {
    UI.modal({ title: esc(g.no) + ' · ' + esc(g.vehicle.make + ' ' + g.vehicle.model), wide: true,
      body: `<div class="row" style="gap:18px;align-items:flex-start">${UI.carPic(g.vehicle.hex, 150, 110)}<div style="flex:1"><div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(g.vehicle.plate, true)}${BO.chip(g.status, TONE[g.status], true)}<span class="chip line">${esc(g.level)} · place ${esc(g.slot.split('-')[1])}</span></div>
        <div class="tiles mt"><div class="tile"><div class="tl">Entrée</div><div class="tv">${esc(U.fmtD(g.since))}</div></div><div class="tile"><div class="tl">Jours</div><div class="tv">${days(g)}</div></div><div class="tile"><div class="tl">Frais à ce jour</div><div class="tv">${chf(fees(g))}</div></div><div class="tile"><div class="tl">Mandant</div><div class="tv" style="font-size:14px">${esc(g.mandant)}</div></div></div>
        <dl class="kv mt"><dt>Motif</dt><dd>${esc(g.reason)}</dd><dt>Référence</dt><dd>${esc(g.ref || '—')}</dd><dt>Propriétaire</dt><dd>${esc(g.owner.name || '—')} · ${esc(g.owner.phone || '')}</dd>${g.outAt ? `<dt>Sortie</dt><dd>${esc(BO.dt(g.outAt))}</dd>` : ''}</dl>
        ${(g.history || []).length ? `<ul class="hist mt">${g.history.slice(0, 6).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul>` : ''}</div></div>`,
      foot: `<button class="btn" data-edit>${BO.icon('edit', 14)}Modifier</button>${!g.outAt && g.status !== 'En garde' ? `<button class="btn" data-relance>${BO.icon('send', 14)}Relancer ${esc(g.mandant)}</button>` : ''}<span class="sp"></span><button class="btn" data-close>Fermer</button>${!g.outAt ? `<button class="btn pri" data-out>${BO.icon('key', 14)}Sortie du parc</button>` : ''}`,
      onMount: (el, close) => {
        el.querySelector('[data-edit]').addEventListener('click', () => { close(); gardeForm(g); });
        const o = el.querySelector('[data-out]'); if (o) o.addEventListener('click', () => { close(); outForm(g); });
        const r = el.querySelector('[data-relance]'); if (r) r.addEventListener('click', () => { close(); BO.compose({ title: 'Relance — ' + g.vehicle.plate, to: '', channel: 'E-mail', subject: `Véhicule ${g.vehicle.plate} en garde depuis ${days(g)} jours — dossier ${g.ref || g.no}`, body: `Madame, Monsieur,\n\nLe véhicule ${g.vehicle.make} ${g.vehicle.model} immatriculé ${g.vehicle.plate} (dossier ${g.ref || g.no}) est en garde dans notre parc depuis le ${U.fmtD(g.since)}, soit ${days(g)} jours. Les frais de gardiennage s’élèvent à ce jour à ${chf(fees(g))} HT et continuent de courir.\n\nMerci de nous indiquer la suite à donner (expertise, enlèvement, cession, destruction) sous 8 jours.\n\nDan Dépanne · ${CX.S.company.phone}`, onSend: m => { g.history.unshift({ at: CX.now(), text: 'Relance ' + m.channel + ' déclarée envoyée à ' + m.to }); g.lastReminder = today(); CX.touch('garde'); UI.toast('Relance tracée', g.vehicle.plate, 'ok', 'send'); BO.now(); } }); });
      } });
  }

  function render(el, params) {
    DEP.refreshGardeStatus();
    if (params.id && garde(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(garde(id)), 0); }
    const S = CX.S, P = S.parc, all = inPark(), lvl = P.levels.find(l => l.id === st.level) || P.levels[0];
    const bySlot = Object.fromEntries(all.map(g => [g.slot, g]));
    const q = st.q.toLowerCase();
    let rows = st.seg === 'all' ? all : st.seg === 'out' ? S.gardes.filter(g => g.outAt) : all.filter(g => g.status === st.seg);
    if (q) rows = rows.filter(g => (g.no + ' ' + g.vehicle.plate + ' ' + g.vehicle.make + ' ' + g.vehicle.model + ' ' + g.mandant + ' ' + g.ref + ' ' + g.slot + ' ' + g.owner.name).toLowerCase().includes(q));
    rows.sort((a, b) => days(b) - days(a));
    const cap = P.levels.reduce((a, l) => a + l.slots, 0), feesTotal = all.reduce((a, g) => a + fees(g), 0);
    el.innerHTML = `<div class="bo-page">${BO.head('Parc de gardiennage', `${all.length} véhicules en garde sur ${cap} places · ${all.filter(g => g.status !== 'En garde').length} à relancer ou abandonnés · ${chf(feesTotal)} de frais en cours`, `<button class="btn pri" data-new>${BO.icon('plus', 15)}Entrée au parc</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">${P.levels.map(l => { const n = all.filter(g => g.level === l.id).length; return BO.kpi({ lb: l.name, v: `${n}<small>/${l.slots}</small>`, icon: 'layers', s: (l.slots - n) + ' places libres', cls: n >= l.slots ? 'warn' : '' }); }).join('')}${BO.kpi({ lb: 'Entrées / sorties du jour', v: S.gardes.filter(g => g.since === today()).length + ' / ' + S.gardes.filter(g => g.outAt && U.dOf(g.outAt) === today()).length, icon: 'key', s: 'aujourd’hui' })}${BO.kpi({ lb: 'Frais en cours', v: chf(feesTotal), icon: 'coins', s: all.filter(g => days(g) > 30).length + ' gardes de plus de 30 j', cls: 'click', go: 'invoices' })}</div>
      <div class="card mb"><div class="card-h"><h3>${BO.icon('layers', 16)}Plan du parc <small>· touchez une place</small></h3>${BO.seg('level', P.levels.map(l => [l.id, l.name, all.filter(g => g.level === l.id).length]), lvl.id)}</div>
        <div class="card-b"><div class="parc-grid">${Array.from({ length: lvl.slots }, (_, i) => { const s = lvl.id + '-' + U.pad(i + 1), g = bySlot[s]; return g ? `<button class="slot busy ${g.status === 'Abandon présumé' ? 'ab' : g.status === 'Relance à faire' ? 'rel' : ''}" data-g="${g.id}" title="${esc(g.vehicle.plate + ' · ' + g.vehicle.make + ' ' + g.vehicle.model + ' · ' + days(g) + ' j')}"><i style="background:${esc(g.vehicle.hex)}"></i><b>${U.pad(i + 1)}</b><span>${esc(g.vehicle.plate)}</span><small>${days(g)} j</small></button>` : `<button class="slot free" data-free="${s}" title="Place libre"><b>${U.pad(i + 1)}</b><span>libre</span></button>`; }).join('')}</div>
        <div class="legend mt1"><span><i style="background:#1b7f4c"></i>En garde</span><span><i style="background:#b96400"></i>Relance à faire (&gt; 30 j)</span><span><i style="background:#b42318"></i>Abandon présumé (&gt; 60 j)</span><span><i style="background:#dfe2e7"></i>Libre</span></div></div></div>
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['all', 'En garde', all.length], ['Relance à faire', 'À relancer', all.filter(g => g.status === 'Relance à faire').length], ['Abandon présumé', 'Abandons', all.filter(g => g.status === 'Abandon présumé').length], ['out', 'Sortis', S.gardes.filter(g => g.outAt).length]], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="Plaque, mandant, référence, place…" value="${esc(st.q)}"></div></div>
      <div data-t></div></div>`;
    BO.table(el.querySelector('[data-t]'), { rows, state: (st.tbl = st.tbl || { sort: 'days', dir: 'desc' }),
      cols: [{ k: 'veh', label: 'Véhicule', get: g => g.vehicle.plate, render: g => `<div class="row" style="gap:8px">${UI.carPic(g.vehicle.hex, 40, 30)}<div>${BO.plate(g.vehicle.plate)}<div class="xs-t muted">${esc(g.vehicle.make)} ${esc(g.vehicle.model)}</div></div></div>` }, { k: 'slot', label: 'Place', render: g => `<span class="tag">${esc(g.slot)}</span>` }, { k: 'mandant', label: 'Mandant', render: g => esc(g.mandant) + (g.ref ? ` <span class="xs-t muted">${esc(g.ref)}</span>` : '') }, { k: 'reason', label: 'Motif', render: g => esc(g.reason) }, { k: 'since', label: 'Entrée', render: g => esc(U.fmtD(g.since)) }, { k: 'days', label: 'Jours', num: true, get: g => days(g), render: g => `<b>${days(g)}</b>` }, { k: 'fees', label: 'Frais', num: true, get: g => fees(g), render: g => chf(fees(g)) }, { k: 'status', label: 'Statut', render: g => BO.chip(g.status, TONE[g.status], true) }, { k: 'act', label: '', nosort: true, render: g => `<button class="btn xs" data-open-g="${g.id}">Ouvrir</button>` }],
      after: h => h.querySelectorAll('[data-open-g]').forEach(b => b.addEventListener('click', () => detail(garde(b.dataset.openG)))) });
    BO.bindSeg(el, (n, v) => { if (n === 'level') st.level = v; else st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelector('[data-new]').addEventListener('click', () => gardeForm());
    el.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => detail(garde(b.dataset.g))));
    el.querySelectorAll('[data-free]').forEach(b => b.addEventListener('click', () => gardeForm()));
  }
  APP.register({ id: 'parc', label: 'Parc de gardiennage', icon: 'layers', group: 'Dépannage', order: 3, activity: 'parc', render, badge: () => { try { DEP.refreshGardeStatus(); return inPark().filter(g => g.status !== 'En garde').length; } catch (e) { return 0; } } });
})();
