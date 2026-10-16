/* ==========================================================================
   BO · Missions de dépannage : demandes des assureurs et particuliers,
   affectation camion + chauffeur, suivi en route / sur place / remorquage,
   dépôt au parc, clôture, facturation.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { seg: 'actives', q: '' };
  const STATUSES = ['Demandée', 'Affectée', 'En route', 'Sur place', 'Remorquage', 'Déposée au parc', 'Terminée', 'Facturée'];
  const TONE = { 'Demandée': 'red', 'Affectée': 'amber', 'En route': 'amber', 'Sur place': 'amber', 'Remorquage': 'amber', 'Déposée au parc': 'green', 'Terminée': 'green', 'Facturée': 'dark' };
  const KINDS = ['Panne batterie', 'Bris de glace', 'Vandalisme', 'Accident', 'Remorquage simple', 'Crevaison', 'Panne carburant', 'Erreur carburant', 'Autre'];
  const MANDANTS = ['AXA', 'MAIF', 'Allianz', 'Macif', 'Groupama', 'Matmut', 'Generali', 'MMA', 'GMF', 'Leasing Arval', 'Police municipale', 'Particulier'];
  const mission = id => CX.S.missions.find(m => m.id === id);
  const truck = id => CX.S.trucks.find(x => x.id === id);
  const driver = id => CX.S.drivers.find(x => x.id === id);
  const active = m => !['Terminée', 'Facturée'].includes(m.status);
  const log = (m, text) => { m.history = m.history || []; m.history.unshift({ at: CX.now(), text, by: CX.S.meId }); };
  const nextNo = () => { CX.S.missionSeq = (CX.S.missionSeq || 2600) + 1; return 'MI-' + CX.S.missionSeq; };

  window.DEP = window.DEP || {};
  DEP.mission = mission; DEP.truck = truck; DEP.driver = driver; DEP.STATUSES = STATUSES; DEP.TONE = TONE;
  DEP.setMissionStatus = (id, status, extra = {}) => {
    const m = mission(id); if (!m) return null;
    const i = STATUSES.indexOf(status); if (i < 0) return null;
    if (status !== 'Demandée' && !m.truckId) { UI.toast('Affectez un camion', 'Une mission ne démarre pas sans camion ni chauffeur.', 'warn'); return null; }
    m.status = status;
    if (status === 'Sur place') m.arrivedAt = CX.now();
    if (status === 'Déposée au parc' || status === 'Terminée') { m.doneAt = CX.now(); const t = truck(m.truckId); if (t) t.status = 'Disponible'; }
    if (['En route', 'Sur place', 'Remorquage'].includes(status)) { const t = truck(m.truckId); if (t) t.status = 'En mission'; }
    Object.assign(m, extra);
    log(m, 'Statut : ' + status);
    CX.touch('mission', { id });
    CX.feed({ ic: 'truck', tone: status === 'Demandée' ? 'red' : 'green', t: m.no + ' · ' + status, s: m.vehicle.make + ' ' + m.vehicle.model + ' · ' + m.address, target: { type: 'mission', id } });
    return m;
  };
  DEP.assign = (id, truckId, driverId) => { const m = mission(id), t = truck(truckId); if (!m || !t) return; m.truckId = truckId; m.driverId = driverId || t.driverId; t.status = 'En mission'; if (m.status === 'Demandée') m.status = 'Affectée'; log(m, 'Affectée à ' + t.name + ' · ' + ((driver(m.driverId) || {}).name || '—')); CX.touch('mission', { id }); };
  DEP.depositToParc = (id, level, slot) => {
    const m = mission(id); if (!m) return null;
    const g = { id: U.uid('G'), no: 'GA-' + (5200 + CX.S.gardes.length), since: today(), mandant: m.mandant, ref: m.ref, vehicle: Object.assign({}, m.vehicle), reason: m.kind + ' — mission ' + m.no, level, slot, status: 'En garde', owner: Object.assign({}, m.customer), dailyFee: CX.S.parc.dailyFee, outAt: null, paid: 0, missionId: m.id, history: [{ at: CX.now(), text: 'Entrée au parc depuis ' + m.no }] };
    CX.S.gardes.unshift(g);
    DEP.setMissionStatus(id, 'Déposée au parc', { destination: 'Parc Dan Dépanne · ' + slot, gardeId: g.id });
    return g;
  };

  function missionForm(m) {
    const isNew = !m;
    BO.formModal({ title: isNew ? 'Nouvelle mission' : 'Modifier ' + m.no, wide: true, cols: 'c3',
      fields: [{ k: 'mandant', label: 'Mandant', type: 'select', opts: MANDANTS, req: true }, { k: 'ref', label: 'Référence sinistre / dossier', ph: 'SIN-48123' }, { k: 'kind', label: 'Motif', type: 'select', opts: KINDS, req: true },
        { k: 'address', label: 'Adresse d’intervention', req: true, full: true, ph: '12 rue de Paradis, 75010 Paris' },
        { k: 'plate', label: 'Immatriculation', req: true, ph: 'AB-123-CD' }, { k: 'make', label: 'Marque', req: true }, { k: 'model', label: 'Modèle', req: true },
        { k: 'hex', label: 'Couleur du véhicule', type: 'color' }, { k: 'cname', label: 'Conducteur / propriétaire', req: true }, { k: 'cphone', label: 'Téléphone', type: 'tel', req: true },
        { k: 'destination', label: 'Destination prévue', type: 'select', opts: ['Sur place', 'Parc Dan Dépanne', 'Garage du client', 'Domicile', 'Concession'] }, { k: 'price', label: 'Tarif prévu (€ HT)', type: 'number', min: 0 }, { k: 'eta', label: 'Heure prévue', type: 'time' },
        { k: 'notes', label: 'Consignes', type: 'textarea', full: true, ph: 'ex. véhicule en sous-sol, hauteur limitée 1,90 m' }],
      values: m ? Object.assign({}, m, { plate: m.vehicle.plate, make: m.vehicle.make, model: m.vehicle.model, hex: m.vehicle.hex, cname: m.customer.name, cphone: m.customer.phone, eta: U.tOf(m.eta) }) : { mandant: 'AXA', kind: 'Panne batterie', destination: 'Sur place', hex: '#c9cdd3', price: 120, eta: U.hm(U.nowMin() + 45) },
      submit: isNew ? 'Créer la mission' : 'Enregistrer', onSubmit: x => {
        const v = { plate: x.plate.toUpperCase().trim(), make: x.make, model: x.model, hex: x.hex || '#c9cdd3' }, c = { name: x.cname, phone: x.cphone };
        if (isNew) { const n = { id: U.uid('M'), no: nextNo(), at: CX.now(), mandant: x.mandant, ref: x.ref || '', kind: x.kind, status: 'Demandée', address: x.address, vehicle: v, customer: c, truckId: null, driverId: null, eta: today() + ' ' + (x.eta || U.hm(U.nowMin() + 45)), arrivedAt: null, doneAt: null, destination: x.destination, price: +x.price || 0, notes: x.notes || '', photos: [], history: [{ at: CX.now(), text: 'Mission créée (' + x.mandant + ')', by: CX.S.meId }] }; CX.S.missions.unshift(n); CX.touch('mission', { id: n.id }); UI.toast('Mission créée', n.no + ' · ' + v.plate, 'ok', 'truck'); }
        else { Object.assign(m, { mandant: x.mandant, ref: x.ref || '', kind: x.kind, address: x.address, vehicle: v, customer: c, destination: x.destination, price: +x.price || 0, notes: x.notes || '', eta: today() + ' ' + (x.eta || U.tOf(m.eta)) }); log(m, 'Mission modifiée'); CX.touch('mission', { id: m.id }); }
        BO.now();
      } });
  }
  function assignForm(m) {
    const free = CX.S.trucks.filter(t => t.status === 'Disponible');
    BO.formModal({ title: 'Affecter — ' + m.no, intro: free.length ? '' : `<div class="form-note warn">${BO.icon('alert', 16)}<div>Aucun camion disponible : la mission reste en attente.</div></div>`,
      fields: [{ k: 'truckId', label: 'Camion', type: 'select', opts: CX.S.trucks.map(t => [t.id, t.name + ' · ' + t.kind + ' · ' + t.status + (t.driverId ? ' · ' + ((driver(t.driverId) || {}).first || '') : '')]), req: true }, { k: 'driverId', label: 'Chauffeur', type: 'select', opts: CX.S.drivers.map(d => [d.id, d.name + (d.astreinte ? ' · astreinte' : '')]), req: true }],
      values: { truckId: (free[0] || CX.S.trucks[0]).id, driverId: (free[0] || CX.S.trucks[0]).driverId || CX.S.drivers[0].id }, submit: 'Affecter et envoyer',
      onMount: el => { const ts = el.querySelector('[name="truckId"]'), ds = el.querySelector('[name="driverId"]'); ts.addEventListener('change', () => { const t = truck(ts.value); if (t && t.driverId) ds.value = t.driverId; }); },
      onSubmit: x => { const t = truck(x.truckId); if (t.status === 'Entretien') { UI.toast('Camion indisponible', t.name + ' est en entretien.', 'warn'); return false; } DEP.assign(m.id, x.truckId, x.driverId); DEP.setMissionStatus(m.id, 'En route'); UI.toast('Mission envoyée', m.no + ' → ' + t.name, 'ok', 'truck'); BO.now(); } });
  }
  function parcForm(m) {
    const used = new Set(CX.S.gardes.filter(g => !g.outAt).map(g => g.slot));
    const opts = [];
    CX.S.parc.levels.forEach(l => { for (let i = 1; i <= l.slots; i++) { const s = l.id + '-' + U.pad(i); if (!used.has(s)) opts.push([l.id + '|' + s, l.name + ' · place ' + U.pad(i)]); } });
    BO.formModal({ title: 'Dépôt au parc — ' + m.vehicle.plate, fields: [{ k: 'slot', label: 'Place libre', type: 'select', opts: opts.slice(0, 200), req: true }], submit: 'Déposer', onSubmit: x => { const [level, slot] = x.slot.split('|'); const g = DEP.depositToParc(m.id, level, slot); UI.toast('Véhicule au parc', g.vehicle.plate + ' · ' + slot, 'ok', 'box'); BO.now(); } });
  }
  function detail(m) {
    const t = m.truckId ? truck(m.truckId) : null, d = m.driverId ? driver(m.driverId) : null, next = STATUSES[STATUSES.indexOf(m.status) + 1];
    BO.drawer({ wide: true, head: () => `<div style="width:70px">${UI.carPic(m.vehicle.hex, 70, 54)}</div>`, title: () => esc(m.no) + ' · ' + esc(m.vehicle.make + ' ' + m.vehicle.model), sub: () => `${BO.chip(m.status, TONE[m.status], true)} ${BO.plate(m.vehicle.plate)} · ${esc(m.kind)} · ${esc(m.mandant)}${m.ref ? ' · ' + esc(m.ref) : ''}`,
      render: () => `<div class="tiles"><div class="tile"><div class="tl">Demandée à</div><div class="tv">${esc(U.tOf(m.at))}</div></div><div class="tile"><div class="tl">Prévue</div><div class="tv">${esc(U.tOf(m.eta) || '—')}</div></div><div class="tile"><div class="tl">Sur place</div><div class="tv">${esc(m.arrivedAt ? U.tOf(m.arrivedAt) : '—')}</div></div><div class="tile"><div class="tl">Tarif HT</div><div class="tv">${chf(m.price)}</div></div></div>
        <div class="dsec"><dl class="kv"><dt>Adresse</dt><dd>${esc(m.address)}</dd><dt>Conducteur</dt><dd>${esc(m.customer.name)} · ${esc(m.customer.phone)}</dd><dt>Camion</dt><dd>${t ? esc(t.name + ' · ' + t.kind + ' · ' + t.plate) : '<span class="muted">non affecté</span>'}</dd><dt>Chauffeur</dt><dd>${d ? esc(d.name) : '—'}</dd><dt>Destination</dt><dd>${esc(m.destination || '—')}</dd>${m.notes ? `<dt>Consignes</dt><dd>${esc(m.notes)}</dd>` : ''}</dl></div>
        <div class="dsec"><h4>Historique</h4><ul class="hist">${(m.history || []).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul></div>`,
      foot: () => `<button class="btn" data-edit>${BO.icon('edit', 14)}Modifier</button><button class="btn" data-call>${BO.icon('phone', 14)}Appeler</button><span class="sp"></span>${m.status === 'Demandée' || m.status === 'Affectée' ? `<button class="btn pri" data-assign>${BO.icon('truck', 14)}${m.status === 'Demandée' ? 'Affecter un camion' : 'Envoyer'}</button>` : ''}${m.status === 'En route' ? `<button class="btn pri" data-st="Sur place">Sur place</button>` : ''}${m.status === 'Sur place' ? `<button class="btn" data-st="Terminée">Réparé sur place</button><button class="btn pri" data-st="Remorquage">${BO.icon('truck', 14)}Remorquage</button>` : ''}${m.status === 'Remorquage' ? `<button class="btn" data-st="Terminée">Livré (garage / domicile)</button><button class="btn pri" data-parc>${BO.icon('box', 14)}Déposer au parc</button>` : ''}${m.status === 'Déposée au parc' || m.status === 'Terminée' ? `<button class="btn pri" data-st="Facturée">${BO.icon('invoice', 14)}Facturer ${esc(m.mandant)}</button>` : ''}`,
      onMount: (dr, close) => {
        dr.querySelector('[data-edit]').addEventListener('click', () => { close(); missionForm(m); });
        dr.querySelector('[data-call]').addEventListener('click', () => { window.location.href = 'tel:' + m.customer.phone.replace(/\s/g, ''); });
        const a = dr.querySelector('[data-assign]'); if (a) a.addEventListener('click', () => { close(); assignForm(m); });
        const p = dr.querySelector('[data-parc]'); if (p) p.addEventListener('click', () => { close(); parcForm(m); });
        dr.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { if (b.dataset.st === 'Facturée') { BO.confirm('Facturer ' + m.no + ' à ' + esc(m.mandant) + ' ?', 'Montant ' + chf(m.price) + ' HT. La facture est émise dans Facturation ; aucun encaissement n’est enregistré.', 'Facturer', () => { DEP.setMissionStatus(m.id, 'Facturée'); close(); BO.now(); }); return; } DEP.setMissionStatus(m.id, b.dataset.st); close(); BO.now(); }));
      } });
  }

  function render(el, params) {
    if (params.id && mission(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(mission(id)), 0); }
    if (params.tab === 'new') { APP.setParams({ tab: null }); setTimeout(() => missionForm(), 0); }
    const S = CX.S, all = S.missions, act = all.filter(active), q = st.q.toLowerCase();
    let rows = st.seg === 'actives' ? act : st.seg === 'all' ? all : all.filter(m => m.status === st.seg);
    if (q) rows = rows.filter(m => (m.no + ' ' + m.vehicle.plate + ' ' + m.vehicle.make + ' ' + m.vehicle.model + ' ' + m.address + ' ' + m.customer.name + ' ' + m.mandant + ' ' + m.ref).toLowerCase().includes(q));
    const cnt = s => all.filter(m => m.status === s).length;
    el.innerHTML = `<div class="bo-page">${BO.head('Missions', `${act.length} en cours · ${cnt('Demandée')} en attente de camion · ${all.filter(m => m.doneAt && U.dOf(m.doneAt) === today()).length} terminées aujourd’hui`, `<button class="btn pri" data-new>${BO.icon('plus', 15)}Nouvelle mission</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">${BO.kpi({ lb: 'À affecter', v: cnt('Demandée'), icon: 'alert', cls: cnt('Demandée') ? 'warn' : '', s: 'demandes sans camion' })}${BO.kpi({ lb: 'En route / sur place', v: cnt('En route') + cnt('Sur place'), icon: 'truck', s: cnt('Remorquage') + ' remorquage en cours' })}${BO.kpi({ lb: 'Camions disponibles', v: S.trucks.filter(t => t.status === 'Disponible').length + '<small>/' + S.trucks.length + '</small>', icon: 'lift', s: S.trucks.filter(t => t.status === 'Entretien').length + ' en entretien' })}${BO.kpi({ lb: 'Déposés au parc aujourd’hui', v: all.filter(m => m.status === 'Déposée au parc' && m.doneAt && U.dOf(m.doneAt) === today()).length, icon: 'box', s: S.gardes.filter(g => !g.outAt).length + ' véhicules en garde' })}${BO.kpi({ lb: 'À facturer', v: cnt('Déposée au parc') + cnt('Terminée'), icon: 'invoice', s: chf(all.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status)).reduce((a, m) => a + m.price, 0)) + ' HT' })}</div>
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['actives', 'En cours', act.length], ...STATUSES.map(s => [s, s, cnt(s)]).filter(x => x[2]), ['all', 'Toutes', all.length]], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="Plaque, adresse, mandant, conducteur…" value="${esc(st.q)}"></div></div>
      <div class="g g2">${rows.map(m => { const t = m.truckId ? truck(m.truckId) : null, d = m.driverId ? driver(m.driverId) : null; return `<div class="card mcard" data-m="${m.id}"><div class="card-b"><div class="row" style="gap:12px;align-items:center">${UI.carPic(m.vehicle.hex, 64, 48)}<div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(m.vehicle.plate)}<b>${esc(m.vehicle.make)} ${esc(m.vehicle.model)}</b>${BO.chip(m.status, TONE[m.status], true)}</div><div class="sm-t mt1">${BO.icon('pin', 13)} ${esc(m.address)}</div><div class="xs-t muted mt1">${esc(m.no)} · ${esc(m.kind)} · ${esc(m.mandant)}${m.ref ? ' · ' + esc(m.ref) : ''} · demandée ${esc(U.tOf(m.at))}${m.eta ? ' · prévue ' + esc(U.tOf(m.eta)) : ''}</div></div><div style="text-align:right;flex:none">${t ? `<b class="sm-t">${esc(t.name)}</b><div class="xs-t muted">${esc(d ? d.first : '')}</div>` : `<span class="chip red">camion ?</span>`}<div class="xs-t muted mt1">${chf(m.price)} HT</div></div></div></div></div>`; }).join('') || `<div class="card"><div class="card-b">${BO.empty('check', 'Aucune mission', '', '', true)}</div></div>`}</div></div>`;
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelector('[data-new]').addEventListener('click', () => missionForm());
    el.querySelectorAll('[data-m]').forEach(c => c.addEventListener('click', () => detail(mission(c.dataset.m))));
  }
  APP.register({ id: 'missions', label: 'Missions', icon: 'truck', group: 'Dépannage', order: 1, activity: 'depannage', render, badge: () => CX.S.missions.filter(m => m.status === 'Demandée').length });
})();
