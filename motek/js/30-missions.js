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
  const active = m => ['Demandée', 'Affectée', 'En route', 'Sur place', 'Remorquage'].includes(m.status);
  const log = (m, text) => { m.history = m.history || []; m.history.unshift({ at: CX.now(), text, by: CX.S.meId }); };
  const nextNo = () => { CX.S.missionSeq = (CX.S.missionSeq || 2600) + 1; return 'MI-' + CX.S.missionSeq; };

  window.DEP = window.DEP || {};
  DEP.missionForm = (m, preset) => missionForm(m, preset);
  DEP.mission = mission; DEP.truck = truck; DEP.driver = driver; DEP.STATUSES = STATUSES; DEP.TONE = TONE;
  DEP.activeMission = active;
  const fail = text => { UI.toast('Action impossible', text, 'warn'); return null; };
  const reconcile = () => CX.S.trucks.forEach(t => { if (t.status !== 'Entretien') t.status = CX.S.missions.some(m => active(m) && m.truckId === t.id) ? 'En mission' : 'Disponible'; });
  DEP.reconcileTrucks = reconcile;
  const transitions = { 'Demandée': ['Affectée'], 'Affectée': ['En route'], 'En route': ['Sur place'], 'Sur place': ['Remorquage', 'Terminée'], 'Remorquage': ['Déposée au parc', 'Terminée'], 'Déposée au parc': ['Facturée'], 'Terminée': ['Facturée'], 'Facturée': [] };
  DEP.setMissionStatus = (id, status, extra = {}) => {
    const m = mission(id); if (!m || !STATUSES.includes(status)) return null;
    if (m.status === status) return m;
    if (!(transitions[m.status] || []).includes(status)) return fail('Respectez les étapes de la mission.');
    if (status === 'Facturée' && !(CX.S.dinvoices || []).some(i => i.kind === 'mission' && i.srcId === id)) return DEP.billMission ? DEP.billMission(m) && m : null;
    if (!m.truckId || !driver(m.driverId)) return fail('Affectez un camion et un chauffeur.');
    if (['En route', 'Sur place', 'Remorquage'].includes(status) && (!truck(m.truckId) || truck(m.truckId).status === 'Entretien')) return fail('Camion en entretien.');
    if (status === 'Déposée au parc' && !(extra.gardeId || m.gardeId)) return fail('Choisissez une place libre au parc.');
    m.status = status;
    if (status === 'Sur place' && !m.arrivedAt) m.arrivedAt = CX.now();
    if (['Déposée au parc', 'Terminée'].includes(status)) m.doneAt = CX.now();
    for (const key of ['destination', 'gardeId']) if (extra[key] !== undefined) m[key] = extra[key];
    reconcile(); log(m, 'Statut : ' + status); CX.touch('mission', { id });
    CX.feed({ ic: 'truck', tone: 'green', t: m.no + ' · ' + status, s: m.vehicle.plate, target: { type: 'mission', id } });
    return m;
  };
  DEP.assign = (id, truckId, driverId) => {
    const m = mission(id), t = truck(truckId), d = driver(driverId || (t && t.driverId));
    if (!m || !t || !d || !['Demandée', 'Affectée'].includes(m.status)) return fail('Seules les missions à affecter peuvent changer de camion.');
    if (t.status === 'Entretien') return fail(t.name + ' est en entretien.');
    if (CX.S.missions.some(x => x.id !== id && active(x) && (x.truckId === t.id || x.driverId === d.id))) return fail('Ce camion ou ce chauffeur a déjà une mission en cours.');
    Object.assign(m, { truckId: t.id, driverId: d.id, status: 'Affectée' }); reconcile();
    log(m, 'Affectée à ' + t.name + ' · ' + d.name); CX.touch('mission', { id }); return m;
  };
  DEP.depositToParc = (id, level, slot) => {
    const m = mission(id); if (!m) return null;
    const existing = CX.S.gardes.find(g => g.missionId === id); if (existing) return existing;
    if (m.status !== 'Remorquage') return fail('Le véhicule doit être en remorquage.');
    const l = CX.S.parc.levels.find(x => x.id === level), n = Number((slot || '').split('-')[1]);
    if (!l || !Number.isInteger(n) || n < 1 || n > l.slots || slot !== level + '-' + U.pad(n)) return fail('Place inconnue.');
    if (CX.S.gardes.some(g => !g.outAt && (g.slot === slot || g.vehicle.plate === m.vehicle.plate))) return fail('Place occupée ou véhicule déjà au parc.');
    const g = { id: U.uid('G'), no: 'GA-' + (5200 + CX.S.gardes.length), since: today(), mandant: m.mandant, ref: m.ref, vehicle: { ...m.vehicle }, reason: m.kind + ' — mission ' + m.no, level, slot, status: 'En garde', step: 'Non traité', owner: { ...m.customer }, dailyFee: CX.S.parc.dailyFee, adminFee: CX.S.parc.adminFee, outAt: null, paid: 0, missionId: m.id, history: [{ at: CX.now(), text: 'Entrée au parc depuis ' + m.no }] };
    CX.S.gardes.unshift(g);
    if (!DEP.setMissionStatus(id, 'Déposée au parc', { destination: 'Parc Dan Dépann · ' + slot, gardeId: g.id })) { CX.S.gardes.splice(CX.S.gardes.indexOf(g),1); return null; }
    return g;
  };
  DEP.depositFirstFree = id => {
    const used = new Set(CX.S.gardes.filter(g => !g.outAt).map(g => g.slot));
    for (const l of CX.S.parc.levels) for (let n = 1; n <= l.slots; n++) { const slot = l.id + '-' + U.pad(n); if (!used.has(slot)) return DEP.depositToParc(id, l.id, slot); }
    return fail('Parc complet : aucune place libre.');
  };

  function missionForm(m, preset) {
    const isNew = !m;
    preset = isNew ? preset || null : null;
    const defaultService=CX.S.serviceCatalog.find(x=>x.id===m?.serviceId) || CX.S.serviceCatalog.find(x=>x.missionKind===m?.kind) || CX.S.serviceCatalog.find(x=>x.id==='depannage-batterie');
    BO.formModal({ intro:'<div class="form-note warn">Repère web « dès … TTC », pas un devis ferme. Le montant final doit être accepté par le client avant facturation.</div>', title: isNew ? 'Nouvelle mission' : 'Modifier ' + m.no, wide: true, cols: 'c3',
      fields: [{ k: 'mandant', label: 'Mandant', type: 'select', opts: MANDANTS, req: true }, { k: 'ref', label: 'Référence sinistre / dossier', ph: 'SIN-48123' }, { k: 'serviceId', label: 'Prestation', type: 'select', opts: CX.S.serviceCatalog.map(x=>[x.id,x.label]), req: true },
        { k: 'address', label: 'Adresse d’intervention', req: true, full: true, ph: '12 rue de Paradis, 75010 Paris' },
        { k: 'plate', label: 'Immatriculation', req: true, ph: 'AB-123-CD' }, { k: 'make', label: 'Marque', req: true }, { k: 'model', label: 'Modèle', req: true },
        { k: 'hex', label: 'Couleur du véhicule', type: 'color' }, { k: 'cname', label: 'Conducteur / propriétaire', req: true }, { k: 'cphone', label: 'Téléphone', type: 'tel', req: true },
        { k: 'destination', label: 'Destination prévue', type: 'select', opts: ['Sur place', 'Parc Dan Dépanne', 'Garage du client', 'Domicile', 'Concession'] }, { k:'department',label:'Département',type:'select',opts:CX.S.commercial.departments.map(d=>[d.code,d.code+' · '+d.name]),req:true },{ k: 'price', label: 'Montant HT proposé (€)', type: 'number', min: 0 },{ k:'priceConfirmed',label:'Prix accepté par le client (déclaration manuelle)',type:'checkbox',full:true }, { k: 'eta', label: 'Heure prévue', type: 'time' },
        { k: 'notes', label: 'Consignes', type: 'textarea', full: true, ph: 'ex. véhicule en sous-sol, hauteur limitée 1,90 m' }],
      values: m ? Object.assign({}, m, {serviceId:defaultService.id,department:m.department || '75', plate: m.vehicle.plate, make: m.vehicle.make, model: m.vehicle.model, hex: m.vehicle.hex, cname: m.customer.name, cphone: m.customer.phone, eta: U.tOf(m.eta) }) : Object.assign({ mandant: 'AXA', serviceId:defaultService.id, department:'75', priceConfirmed:false, destination: 'Sur place', hex: '#c9cdd3', price:Math.round(defaultService.variants[0].fromTtc/(1+(CX.S.company.tvaRate ?? .2))*100)/100, eta: U.hm(U.nowMin() + 45) }, preset || {}),
      submit: isNew ? 'Créer la mission' : 'Enregistrer', onMount:el=>{const note=document.createElement('div');note.className='form-note mt';el.querySelector('.mdl-b').appendChild(note);const show=()=>{const svc=CX.S.serviceCatalog.find(s=>s.id===el.querySelector('[name=serviceId]').value);note.textContent=svc.label+' · dès '+svc.variants[0].fromTtc+' € TTC · '+(svc.issue || 'Montant variable selon accès, distance et horaire.');};el.querySelector('[name=serviceId]').addEventListener('change',()=>{const svc=CX.S.serviceCatalog.find(s=>s.id===el.querySelector('[name=serviceId]').value);el.querySelector('[name=price]').value=Math.round(svc.variants[0].fromTtc/(1+(CX.S.company.tvaRate ?? .2))*100)/100;el.querySelector('[name=priceConfirmed]').checked=false;show();});el.querySelector('[name=price]').addEventListener('input',()=>{el.querySelector('[name=priceConfirmed]').checked=false;});show();}, onSubmit: x => {
        const svc=CX.S.serviceCatalog.find(s=>s.id===x.serviceId);if(!svc)return false;x.kind=svc.missionKind;const commercial={serviceId:svc.id,department:x.department,priceConfirmed:!!x.priceConfirmed,priceSource:svc.source,priceConfirmation:x.priceConfirmed?{mode:'manual',at:CX.now(),by:CX.S.meId}:null};
        const v = { plate: x.plate.toUpperCase().trim(), make: x.make, model: x.model, hex: x.hex || '#c9cdd3' }, c = { name: x.cname, phone: x.cphone };
        if (isNew) { const n = { id: U.uid('M'), no: nextNo(), at: CX.now(), mandant: x.mandant, ref: x.ref || '', kind: x.kind, status: 'Demandée', address: x.address, vehicle: v, customer: c, truckId: null, driverId: null, eta: today() + ' ' + (x.eta || U.hm(U.nowMin() + 45)), arrivedAt: null, doneAt: null, destination: x.destination, price: +x.price || 0, notes: x.notes || '', photos: [], history: [{ at: CX.now(), text: 'Mission créée (' + x.mandant + ')', by: CX.S.meId }] }; Object.assign(n,commercial); if (preset && preset.origin) n.origin = preset.origin; CX.S.missions.unshift(n); CX.touch('mission', { id: n.id }); if (preset && preset.onCreated) try { preset.onCreated(n); } catch (e) { console.warn(e); } UI.toast('Mission créée', n.no + ' · ' + v.plate, 'ok', 'truck'); }
        else { Object.assign(m, commercial, { mandant: x.mandant, ref: x.ref || '', kind: x.kind, address: x.address, vehicle: v, customer: c, destination: x.destination, price: +x.price || 0, notes: x.notes || '', eta: today() + ' ' + (x.eta || U.tOf(m.eta)) }); log(m, 'Mission modifiée'); CX.touch('mission', { id: m.id }); }
        BO.now();
      } });
  }
  function assignForm(m) {
    const free = CX.S.trucks.filter(t => t.status === 'Disponible');
    BO.formModal({ title: 'Affecter — ' + m.no, intro: free.length ? '' : `<div class="form-note warn">${BO.icon('alert', 16)}<div>Aucun camion disponible : la mission reste en attente.</div></div>`,
      fields: [{ k: 'truckId', label: 'Camion', type: 'select', opts: CX.S.trucks.map(t => [t.id, t.name + ' · ' + t.kind + ' · ' + t.status + (t.driverId ? ' · ' + ((driver(t.driverId) || {}).first || '') : '')]), req: true }, { k: 'driverId', label: 'Chauffeur', type: 'select', opts: CX.S.drivers.map(d => [d.id, d.name + (d.astreinte ? ' · astreinte' : '')]), req: true }],
      values: { truckId: (free[0] || CX.S.trucks[0]).id, driverId: (free[0] || CX.S.trucks[0]).driverId || CX.S.drivers[0].id }, submit: 'Affecter et envoyer',
      onMount: el => { const ts = el.querySelector('[name="truckId"]'), ds = el.querySelector('[name="driverId"]'); ts.addEventListener('change', () => { const t = truck(ts.value); if (t && t.driverId) ds.value = t.driverId; }); },
      onSubmit: x => { const t = truck(x.truckId); if (t.status === 'Entretien') { UI.toast('Camion indisponible', t.name + ' est en entretien.', 'warn'); return false; } if (!DEP.assign(m.id, x.truckId, x.driverId)) return false; DEP.setMissionStatus(m.id, 'En route'); UI.toast('Mission envoyée', m.no + ' → ' + t.name, 'ok', 'truck'); BO.now(); } });
  }
  function parcForm(m) {
    const used = new Set(CX.S.gardes.filter(g => !g.outAt).map(g => g.slot));
    const opts = [];
    CX.S.parc.levels.forEach(l => { for (let i = 1; i <= l.slots; i++) { const s = l.id + '-' + U.pad(i); if (!used.has(s)) opts.push([l.id + '|' + s, l.name + ' · place ' + U.pad(i)]); } });
    BO.formModal({ title: 'Dépôt au parc — ' + m.vehicle.plate, fields: [{ k: 'slot', label: 'Place libre', type: 'select', opts: opts.slice(0, 200), req: true }], submit: 'Déposer', onSubmit: x => { const [level, slot] = x.slot.split('|'); const g = DEP.depositToParc(m.id, level, slot); if (!g) return false; UI.toast('Véhicule au parc', g.vehicle.plate + ' · ' + slot, 'ok', 'box'); BO.now(); } });
  }
  function detail(m) {
    const t = m.truckId ? truck(m.truckId) : null, d = m.driverId ? driver(m.driverId) : null, next = STATUSES[STATUSES.indexOf(m.status) + 1];
    BO.drawer({ wide: true, head: () => `<div style="width:70px">${UI.carPic(m.vehicle.hex, 70, 54)}</div>`, title: () => esc(m.no) + ' · ' + esc(m.vehicle.make + ' ' + m.vehicle.model), sub: () => `${BO.chip(m.status, TONE[m.status], true)} ${BO.plate(m.vehicle.plate)} · ${esc(m.kind)} · ${esc(m.mandant)}${m.ref ? ' · ' + esc(m.ref) : ''}`,
      render: () => `<div class="tiles"><div class="tile"><div class="tl">Demandée à</div><div class="tv">${esc(U.tOf(m.at))}</div></div><div class="tile"><div class="tl">Prévue</div><div class="tv">${esc(U.tOf(m.eta) || '—')}</div></div><div class="tile"><div class="tl">Sur place</div><div class="tv">${esc(m.arrivedAt ? U.tOf(m.arrivedAt) : '—')}</div></div><div class="tile"><div class="tl">Tarif HT</div><div class="tv">${chf(m.price)}</div></div></div>
        <div class="dsec"><dl class="kv">${m.origin ? `<dt>Origine</dt><dd>${esc(m.origin.label || m.origin.channel || '')}${m.origin.no ? ' · ' + esc(m.origin.no) : ''}</dd>` : ''}<dt>Adresse</dt><dd>${esc(m.address)}</dd><dt>Conducteur</dt><dd>${esc(m.customer.name)} · ${esc(m.customer.phone)}</dd><dt>Camion</dt><dd>${t ? esc(t.name + ' · ' + t.kind + ' · ' + t.plate) : '<span class="muted">non affecté</span>'}</dd><dt>Chauffeur</dt><dd>${d ? esc(d.name) : '—'}</dd><dt>Destination</dt><dd>${esc(m.destination || '—')}</dd>${m.notes ? `<dt>Consignes</dt><dd>${esc(m.notes)}</dd>` : ''}</dl></div>
        <div class="form-note ${m.priceConfirmed?'ok':'warn'}">${m.priceConfirmed?'Prix accepté '+(m.priceConfirmation?.mode==='demo'?'(simulation de démonstration)':'(déclaré manuellement)'):'Prix non confirmé — à convenir avec le client avant facturation.'}${m.priceSource?' · <a href="'+esc(m.priceSource)+'" target="_blank" rel="noopener">Source tarifaire</a>':''}</div><div class="dsec"><h4>Historique</h4><ul class="hist">${(m.history || []).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul></div>`,
      foot: () => `<button class="btn" data-edit ${m.status==='Facturée' ? 'disabled title="Mission facturée"' : ''}>${BO.icon('edit', 14)}Modifier</button>${m.status!=='Facturée' ? '<button class="btn" data-deposit-money>Acompte</button>' : ''}<button class="btn" data-call>${BO.icon('phone', 14)}Appeler</button><span class="sp"></span>${m.status === 'Demandée' || m.status === 'Affectée' ? `<button class="btn pri" data-assign>${BO.icon('truck', 14)}${m.status === 'Demandée' ? 'Affecter un camion' : 'Envoyer'}</button>` : ''}${m.status === 'En route' ? `<button class="btn pri" data-st="Sur place">Sur place</button>` : ''}${m.status === 'Sur place' ? `<button class="btn" data-st="Terminée">Réparé sur place</button><button class="btn pri" data-st="Remorquage">${BO.icon('truck', 14)}Remorquage</button>` : ''}${m.status === 'Remorquage' ? `<button class="btn" data-st="Terminée">Livré (garage / domicile)</button><button class="btn pri" data-parc>${BO.icon('box', 14)}Déposer au parc</button>` : ''}${m.status === 'Déposée au parc' || m.status === 'Terminée' ? `<button class="btn pri" data-st="Facturée">${BO.icon('invoice', 14)}Facturer ${esc(m.mandant)}</button>` : ''}`,
      onMount: (dr, close) => {
        dr.querySelector('[data-edit]').addEventListener('click', () => { close(); missionForm(m); });
        dr.querySelector('[data-call]').addEventListener('click', () => { window.location.href = 'tel:' + m.customer.phone.replace(/\s/g, ''); });
        const ac=dr.querySelector('[data-deposit-money]');if(ac)ac.addEventListener('click',()=>{close();DEP.depositForm(m);});
        const a = dr.querySelector('[data-assign]'); if (a) a.addEventListener('click', () => { close(); assignForm(m); });
        const p = dr.querySelector('[data-parc]'); if (p) p.addEventListener('click', () => { close(); parcForm(m); });
        dr.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { if (b.dataset.st === 'Facturée') { BO.confirm('Facturer ' + m.no + ' à ' + esc(m.mandant) + ' ?', 'Montant ' + chf(m.price) + ' HT. La facture est émise dans Facturation ; aucun encaissement n’est enregistré.', 'Facturer', () => { DEP.setMissionStatus(m.id, 'Facturée'); close(); BO.now(); }); return; } DEP.setMissionStatus(m.id, b.dataset.st); close(); BO.now(); }));
      } });
  }

  function render(el, params) {
    if (params.seg) { st.seg = params.seg; APP.setParams({ seg: null }); }
    if (params.id && mission(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(mission(id)), 0); }
    if (params.tab === 'new') { APP.setParams({ tab: null }); setTimeout(() => missionForm(), 0); }
    const S = CX.S, all = S.missions, act = all.filter(active), q = st.q.toLowerCase();
    let rows = st.seg === 'actives' ? act : st.seg === 'all' ? all : st.seg === 'road' ? all.filter(m => ['En route','Sur place','Remorquage'].includes(m.status)) : st.seg === 'bill' ? all.filter(m => ['Terminée','Déposée au parc'].includes(m.status)) : st.seg === 'done' ? all.filter(m => m.doneAt && U.dOf(m.doneAt) === today()) : st.seg === 'deposits' ? all.filter(m => m.gardeId && m.doneAt && U.dOf(m.doneAt) === today()) : all.filter(m => m.status === st.seg);
    if (q) rows = rows.filter(m => (m.no + ' ' + m.vehicle.plate + ' ' + m.vehicle.make + ' ' + m.vehicle.model + ' ' + m.address + ' ' + m.customer.name + ' ' + m.mandant + ' ' + m.ref).toLowerCase().includes(q));
    const cnt = s => all.filter(m => m.status === s).length;
    el.innerHTML = `<div class="bo-page">${BO.head('Missions', `${act.length} en cours · ${cnt('Demandée')} en attente de camion · ${all.filter(m => m.doneAt && U.dOf(m.doneAt) === today()).length} terminées aujourd’hui`, `<button class="btn pri" data-new>${BO.icon('plus', 15)}Nouvelle mission</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">${BO.kpi({ lb: 'À affecter', v: cnt('Demandée'), icon: 'alert', cls: cnt('Demandée') ? 'warn' : '', s: 'demandes sans camion' })}${BO.kpi({ lb: 'En intervention', v: cnt('En route') + cnt('Sur place') + cnt('Remorquage'), icon: 'truck', s: cnt('Remorquage') + ' remorquage en cours' })}${BO.kpi({ lb: 'Camions disponibles', v: S.trucks.filter(t => t.status === 'Disponible').length + '<small>/' + S.trucks.length + '</small>', icon: 'lift', s: S.trucks.filter(t => t.status === 'Entretien').length + ' en entretien' })}${BO.kpi({ lb: 'Déposés au parc aujourd’hui', v: all.filter(m => m.gardeId && m.doneAt && U.dOf(m.doneAt) === today()).length, icon: 'box', s: S.gardes.filter(g => !g.outAt).length + ' véhicules en garde' })}${BO.kpi({ lb: 'À facturer', v: cnt('Déposée au parc') + cnt('Terminée'), icon: 'invoice', s: chf(all.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status)).reduce((a, m) => a + m.price, 0)) + ' HT' })}</div>
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['actives', 'En cours', act.length], ...STATUSES.map(s => [s, s, cnt(s)]).filter(x => x[2]), ['all', 'Toutes', all.length]], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="Plaque, adresse, mandant, conducteur…" value="${esc(st.q)}"></div></div>
      <div class="g g2">${rows.map(m => { const t = m.truckId ? truck(m.truckId) : null, d = m.driverId ? driver(m.driverId) : null; return `<div class="card mcard" data-m="${m.id}"><div class="card-b"><div class="row" style="gap:12px;align-items:center">${UI.carPic(m.vehicle.hex, 64, 48)}<div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(m.vehicle.plate)}<b>${esc(m.vehicle.make)} ${esc(m.vehicle.model)}</b>${BO.chip(m.status, TONE[m.status], true)}</div><div class="sm-t mt1">${BO.icon('pin', 13)} ${esc(m.address)}</div><div class="xs-t muted mt1">${esc(m.no)} · ${esc(m.kind)} · ${esc(m.mandant)}${m.ref ? ' · ' + esc(m.ref) : ''} · demandée ${esc(U.tOf(m.at))}${m.eta ? ' · prévue ' + esc(U.tOf(m.eta)) : ''}</div></div><div style="text-align:right;flex:none">${t ? `<b class="sm-t">${esc(t.name)}</b><div class="xs-t muted">${esc(d ? d.first : '')}</div>` : `<span class="chip red">camion ?</span>`}<div class="xs-t muted mt1">${chf(m.price)} HT</div></div></div></div></div>`; }).join('') || `<div class="card"><div class="card-b">${BO.empty('check', 'Aucune mission', '', '', true)}</div></div>`}</div></div>`;
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelector('[data-new]').addEventListener('click', () => missionForm());
    el.querySelectorAll('[data-m]').forEach(c => c.addEventListener('click', () => detail(mission(c.dataset.m))));
  }
  APP.register({ id: 'missions', label: 'Missions', icon: 'truck', group: 'Dépannage', order: 1, activity: 'depannage', render, badge: () => CX.S.missions.filter(m => m.status === 'Demandée').length });
})();
