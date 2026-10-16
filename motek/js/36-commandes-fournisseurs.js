/* ==========================================================================
   BO · Commandes fournisseurs du dépanneur : batteries (le gros du volume),
   pneus, carburant. Un besoin relevé sur une mission « panne batterie »
   devient une commande ; le bon de commande part par e-mail au fournisseur
   (texte préparé, envoi tracé par l'humain). Suivi : à commander →
   commandée → reçue → posée, et stock embarqué dans les paniers.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { seg: 'open', q: '' };
  const STATUSES = ['À commander', 'Commandée', 'Reçue', 'Posée', 'Annulée'];
  const TONE = { 'À commander': 'red', 'Commandée': 'amber', 'Reçue': 'blue', 'Posée': 'green', 'Annulée': '' };
  const list = () => (CX.S.supplyOrders = CX.S.supplyOrders || []);
  const suppliers = () => (CX.S.depSuppliers = CX.S.depSuppliers || []);
  const supplier = id => suppliers().find(s => s.id === id) || null;
  const nextNo = () => 'CB-' + (1040 + list().length + 1);
  const BATT = ['Batterie 12 V 60 Ah L2 (Clio, 208, C3)', 'Batterie 12 V 70 Ah L3 (Golf, 308)', 'Batterie AGM 12 V 80 Ah L4 (start-stop)', 'Batterie EFB 12 V 70 Ah L3', 'Batterie 12 V 95 Ah L5 (utilitaires)', 'Pneu 205/55 R16', 'Pneu 195/65 R15', 'Jerrican 20 L SP95', 'Jerrican 20 L gazole'];

  function setStatus(o, s, text) { o.status = s; o.history.unshift({ at: CX.now(), text: text || s, by: CX.S.meId }); if (s === 'Posée' && o.missionId) { const m = DEP.mission(o.missionId); if (m) m.history.unshift({ at: CX.now(), text: 'Batterie posée : ' + o.item, by: CX.S.meId }); } CX.touch('supply'); }
  function orderForm(o, preset = {}) {
    BO.formModal({ title: o ? o.no + ' · ' + o.item : 'Nouvelle commande', wide: true, cols: 'c3',
      fields: [{ k: 'item', label: 'Article', req: true, full: true, list: BATT, ph: 'Batterie 12 V 70 Ah L3…' }, { k: 'qty', label: 'Quantité', type: 'number', min: 1, req: true }, { k: 'price', label: 'Prix unitaire HT (€)', type: 'number', min: 0 }, { k: 'supplierId', label: 'Fournisseur', type: 'select', opts: suppliers().map(s => [s.id, s.name]), req: true }, { k: 'plate', label: 'Véhicule concerné (plaque)' }, { k: 'missionId', label: 'Mission', type: 'select', opts: CX.S.missions.filter(m => !['Facturée'].includes(m.status)).map(m => [m.id, m.no + ' · ' + m.vehicle.plate + ' · ' + m.kind]), empty: '— Stock / aucune —' }, { k: 'notes', label: 'Notes', full: true }],
      values: o || Object.assign({ qty: 1, supplierId: 'DS1' }, preset), submit: o ? 'Enregistrer' : 'Créer la commande',
      onSubmit: x => { const v = { item: x.item, qty: +x.qty || 1, price: +x.price || 0, supplierId: x.supplierId, plate: (x.plate || '').toUpperCase().trim(), missionId: x.missionId || null, notes: x.notes || '' }; if (o) Object.assign(o, v); else list().unshift(Object.assign({ id: U.uid('SO'), no: nextNo(), at: CX.now(), status: 'À commander', history: [{ at: CX.now(), text: 'Besoin relevé', by: CX.S.meId }] }, v)); CX.touch('supply'); UI.toast(o ? 'Commande modifiée' : 'Commande créée', v.item, 'ok', 'box'); BO.now(); } });
  }
  /** Prépare le bon de commande par e-mail au fournisseur (plusieurs commandes « à commander » du même fournisseur regroupées). */
  function sendOrder(supId, ids) {
    const s = supplier(supId); if (!s) return;
    const os = list().filter(o => o.supplierId === supId && o.status === 'À commander' && (!ids || ids.includes(o.id)));
    if (!os.length) { UI.toast('Rien à commander', 'Aucune commande en attente chez ' + s.name, 'warn'); return; }
    const total = os.reduce((a, o) => a + o.qty * o.price, 0);
    BO.compose({ title: 'Bon de commande — ' + s.name, to: s.email, channel: 'E-mail', subject: `Commande ${os.map(o => o.no).join(', ')} — ${CX.S.company.name}`,
      body: `Bonjour,\n\nMerci de nous livrer ${s.delay ? '(' + s.delay + ') ' : ''}au 25 avenue Claude Vellefaux, 75010 Paris :\n\n${os.map(o => `- ${o.qty} × ${o.item}${o.price ? ' — ' + chf(o.price) + ' HT l’unité' : ''}${o.plate ? ' (véhicule ' + o.plate + ')' : ''}`).join('\n')}\n\nTotal estimé : ${chf(total)} HT. Conditions habituelles (${s.terms || 'selon contrat'}).\n\nCordialement,\n${CX.S.company.name} · ${CX.S.company.phone}`,
      note: `Fournisseur : <b>${esc(s.name)}</b> · ${esc(s.kind)} · ${esc(s.email)}`, okLabel: 'J’ai envoyé la commande',
      onSend: m => { os.forEach(o => setStatus(o, 'Commandée', 'Commandée par ' + m.channel + ' à ' + m.to)); UI.toast('Commande envoyée', os.length + ' ligne' + (os.length > 1 ? 's' : '') + ' · ' + s.name, 'ok', 'send'); BO.now(); } });
  }
  function detail(o) {
    const s = supplier(o.supplierId), m = o.missionId ? DEP.mission(o.missionId) : null, i = STATUSES.indexOf(o.status);
    UI.modal({ title: esc(o.no) + ' · ' + esc(o.item),
      body: `<div class="row" style="gap:8px;flex-wrap:wrap">${BO.chip(o.status, TONE[o.status], true)}${o.plate ? BO.plate(o.plate) : ''}${m ? `<span class="chip line">${esc(m.no)} · ${esc(m.kind)}</span>` : '<span class="chip line">Stock</span>'}</div>
        <div class="tiles mt"><div class="tile"><div class="tl">Quantité</div><div class="tv">${o.qty}</div></div><div class="tile"><div class="tl">PU HT</div><div class="tv">${chf(o.price)}</div></div><div class="tile"><div class="tl">Total HT</div><div class="tv">${chf(o.qty * o.price)}</div></div><div class="tile"><div class="tl">Fournisseur</div><div class="tv" style="font-size:13px">${esc(s ? s.name.replace(' (démo)', '') : '—')}</div></div></div>
        ${o.notes ? `<p class="sm-t mt">${esc(o.notes)}</p>` : ''}
        <ul class="hist mt">${o.history.slice(0, 6).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul>`,
      foot: `<button class="btn" data-edit>${BO.icon('edit', 14)}Modifier</button>${m ? `<button class="btn" data-open-m>${BO.icon('truck', 14)}Mission</button>` : ''}<span class="sp"></span><button class="btn" data-close>Fermer</button>${o.status === 'À commander' ? `<button class="btn pri" data-send>${BO.icon('send', 14)}Commander par e-mail</button>` : ''}${o.status === 'Commandée' ? `<button class="btn pri" data-st="Reçue">${BO.icon('box', 14)}Reçue</button>` : ''}${o.status === 'Reçue' ? `<button class="btn pri" data-st="Posée">${BO.icon('check', 14)}Posée sur le véhicule</button>` : ''}${i >= 0 && i < 2 ? `<button class="btn" data-st="Annulée">Annuler</button>` : ''}`,
      onMount: (el, close) => {
        el.querySelector('[data-edit]').addEventListener('click', () => { close(); orderForm(o); });
        const om = el.querySelector('[data-open-m]'); if (om) om.addEventListener('click', () => { close(); APP.open('missions', { id: m.id }); });
        const sd = el.querySelector('[data-send]'); if (sd) sd.addEventListener('click', () => { close(); sendOrder(o.supplierId, [o.id]); });
        el.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { setStatus(o, b.dataset.st); close(); UI.toast(b.dataset.st, o.no, 'ok', 'box'); BO.now(); }));
      } });
  }
  window.DEP = window.DEP || {}; DEP.orders = list; DEP.orderForm = orderForm; DEP.sendOrder = sendOrder; DEP.setOrderStatus = (id, s) => { const o = list().find(x => x.id === id); if (o) setStatus(o, s); };

  function render(el, params) {
    const all = list(), q = st.q.toLowerCase();
    if (params.id) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => { const o = all.find(x => x.id === id); if (o) detail(o); }, 0); }
    if (params.tab === 'new') { APP.setParams({ tab: null }); setTimeout(() => orderForm(null, params.preset || {}), 0); }
    const open = all.filter(o => !['Posée', 'Annulée'].includes(o.status)), toSend = all.filter(o => o.status === 'À commander');
    // besoins non encore transformés en commande : missions « panne batterie » du jour sans commande liée
    const needs = CX.S.missions.filter(m => /batterie/i.test(m.kind) && !['Terminée', 'Facturée'].includes(m.status) && !all.some(o => o.missionId === m.id));
    let rows = st.seg === 'open' ? open : st.seg === 'send' ? toSend : st.seg === 'done' ? all.filter(o => o.status === 'Posée') : all;
    if (q) rows = rows.filter(o => (o.no + ' ' + o.item + ' ' + o.plate + ' ' + (supplier(o.supplierId) || {}).name).toLowerCase().includes(q));
    const bySup = {}; toSend.forEach(o => { (bySup[o.supplierId] = bySup[o.supplierId] || []).push(o); });
    el.innerHTML = `<div class="bo-page">${BO.head('Commandes fournisseurs', `${open.length} commandes en cours · ${toSend.length} à envoyer · ${needs.length} besoin${needs.length > 1 ? 's' : ''} relevé${needs.length > 1 ? 's' : ''} sur les missions`, `<button class="btn pri" data-new>${BO.icon('plus', 15)}Commande</button>`)}
      <div class="kpis">${BO.kpi({ lb: 'À envoyer', v: toSend.length, icon: 'send', s: Object.keys(bySup).length + ' fournisseur' + (Object.keys(bySup).length > 1 ? 's' : ''), cls: toSend.length ? 'warn' : '' })}${BO.kpi({ lb: 'En livraison', v: all.filter(o => o.status === 'Commandée').length, icon: 'box', s: 'commandées, non reçues' })}${BO.kpi({ lb: 'À poser', v: all.filter(o => o.status === 'Reçue').length, icon: 'wrench', s: 'reçues au dépôt' })}${BO.kpi({ lb: 'Batteries ce mois', v: all.filter(o => /batterie/i.test(o.item) && o.at.slice(0, 7) === today().slice(0, 7)).reduce((a, o) => a + o.qty, 0), icon: 'calc', s: chf(all.filter(o => /batterie/i.test(o.item) && o.at.slice(0, 7) === today().slice(0, 7)).reduce((a, o) => a + o.qty * o.price, 0)) + ' HT' })}</div>
      ${needs.length ? `<div class="card mb"><div class="card-h"><h3>${BO.icon('alert', 16)}Besoins relevés sur les missions <small>· ${needs.length}</small></h3></div><div>${needs.map(m => `<div class="todo"><span class="tic high">${BO.icon('car', 16)}</span><div class="tx"><b>${esc(m.no)} · ${esc(m.vehicle.make)} ${esc(m.vehicle.model)} · ${esc(m.vehicle.plate)}</b><span>${esc(m.kind)} · ${esc(m.address)} · ${esc(m.status)}</span></div><div class="ta"><button class="btn sm pri" data-need="${m.id}">Commander une batterie</button></div></div>`).join('')}</div></div>` : ''}
      ${Object.keys(bySup).length ? `<div class="card mb"><div class="card-h"><h3>${BO.icon('mail', 16)}Bons de commande à envoyer</h3></div><div class="card-b row wrap" style="gap:8px">${Object.keys(bySup).map(id => { const s = supplier(id); return `<button class="btn" data-send="${id}">${BO.icon('send', 14)}${esc(s ? s.name.replace(' (démo)', '') : id)} · ${bySup[id].length} ligne${bySup[id].length > 1 ? 's' : ''} · ${chf(bySup[id].reduce((a, o) => a + o.qty * o.price, 0))} HT</button>`; }).join('')}</div></div>` : ''}
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['open', 'En cours', open.length], ['send', 'À envoyer', toSend.length], ['done', 'Posées', all.filter(o => o.status === 'Posée').length], ['all', 'Toutes', all.length]], st.seg)}<span class="sp"></span><div class="box" style="width:260px"><input class="inp" data-q placeholder="N°, article, plaque, fournisseur…" value="${esc(st.q)}"></div></div>
      <div data-t></div>
      <h2 class="sec mt2">${BO.icon('users', 16)}Fournisseurs</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${suppliers().map(s => `<div class="card pad"><b>${esc(s.name)}</b><div class="xs-t muted">${esc(s.kind)} · délai ${esc(s.delay)} · ${esc(s.terms)}</div><div class="sm-t mt1">${esc(s.email)}<br>${esc(s.phone)}</div></div>`).join('')}</div></div>`;
    BO.table(el.querySelector('[data-t]'), { rows, state: (st.tbl = st.tbl || { sort: 'at', dir: 'desc' }),
      cols: [{ k: 'no', label: 'N°', render: o => `<b>${esc(o.no)}</b>` }, { k: 'at', label: 'Date', render: o => esc(BO.dt(o.at)) }, { k: 'item', label: 'Article', render: o => esc(o.item) + (o.qty > 1 ? ` <span class="tag">× ${o.qty}</span>` : '') }, { k: 'plate', label: 'Véhicule', render: o => o.plate ? BO.plate(o.plate) : '<span class="muted">stock</span>' }, { k: 'sup', label: 'Fournisseur', get: o => (supplier(o.supplierId) || {}).name || '', render: o => esc(((supplier(o.supplierId) || {}).name || '—').replace(' (démo)', '')) }, { k: 'tot', label: 'HT', num: true, get: o => o.qty * o.price, render: o => chf(o.qty * o.price) }, { k: 'status', label: 'Statut', render: o => BO.chip(o.status, TONE[o.status], true) }, { k: 'a', label: '', render: o => `<button class="btn sm" data-open-o="${o.id}">Ouvrir</button>` }],
      after: h => h.querySelectorAll('[data-open-o]').forEach(b => b.addEventListener('click', () => detail(all.find(x => x.id === b.dataset.openO)))) });
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelector('[data-new]').addEventListener('click', () => orderForm());
    el.querySelectorAll('[data-send]').forEach(b => b.addEventListener('click', () => sendOrder(b.dataset.send)));
    el.querySelectorAll('[data-need]').forEach(b => b.addEventListener('click', () => { const m = DEP.mission(b.dataset.need); orderForm(null, { item: BATT[0], plate: m.vehicle.plate, missionId: m.id, price: 89 }); }));
  }
  APP.register({ id: 'supply', label: 'Commandes fournisseurs', icon: 'box', group: 'Dépannage', order: 5, activity: 'depannage', render, badge: () => { try { return list().filter(o => o.status === 'À commander').length; } catch (e) { return 0; } } });
})();
