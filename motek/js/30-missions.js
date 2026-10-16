/* ==========================================================================
   BO · Missions de dépannage : demandes des assureurs et particuliers,
   affectation d'un dépanneur (et de son camion), suivi en route / sur place /
   remorquage, dépôt au parc, clôture, facturation.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { seg: 'actives', q: '', view: 'cards' };
  const STATUSES = ['Demandée', 'Affectée', 'En route', 'Sur place', 'Remorquage', 'Déposée au parc', 'Terminée', 'Facturée'];
  const BUSY = ['Affectée', 'En route', 'Sur place', 'Remorquage'];
  const TONE = { 'Demandée': 'red', 'Affectée': 'amber', 'En route': 'amber', 'Sur place': 'amber', 'Remorquage': 'amber', 'Déposée au parc': 'green', 'Terminée': 'green', 'Facturée': 'dark' };
  const KINDS = ['Panne batterie', 'Bris de glace', 'Vandalisme', 'Accident', 'Remorquage simple', 'Crevaison', 'Panne carburant', 'Erreur carburant', 'Autre'];
  const MANDANTS = ['AXA', 'MAIF', 'Allianz', 'Macif', 'Groupama', 'Matmut', 'Generali', 'MMA', 'GMF', 'Leasing Arval', 'Police municipale', 'Particulier'];
  const mission = id => CX.S.missions.find(m => m.id === id);
  const truck = id => CX.S.trucks.find(x => x.id === id);
  const driver = id => CX.S.drivers.find(x => x.id === id);
  const active = m => !['Terminée', 'Facturée'].includes(m.status);
  const parcName = () => 'Parc ' + ((CX.S.company || {}).name || 'Dan Dépann');
  const log = (m, text) => { m.history = m.history || []; m.history.unshift({ at: CX.now(), text, by: CX.S.meId }); };
  const nextNo = () => { const max = CX.S.missions.reduce((a, m) => Math.max(a, +String(m.no).replace(/\D/g, '') || 0), CX.S.missionSeq || 2600); CX.S.missionSeq = max + 1; return 'MI-' + CX.S.missionSeq; };

  window.DEP = window.DEP || {};
  DEP.mission = mission; DEP.truck = truck; DEP.driver = driver; DEP.STATUSES = STATUSES; DEP.TONE = TONE; DEP.BUSY = BUSY; DEP.KINDS = KINDS; DEP.MANDANTS = MANDANTS;
  /** Mission en cours d'un dépanneur (affectée, en route, sur place ou en remorquage). */
  DEP.driverMission = id => CX.S.missions.find(m => m.driverId === id && BUSY.includes(m.status)) || null;
  DEP.freeDrivers = () => CX.S.drivers.filter(d => !DEP.driverMission(d.id));
  /** Camion habituel d'un dépanneur (sinon premier camion disponible). */
  DEP.truckOfDriver = id => CX.S.trucks.find(t => t.driverId === id && t.status !== 'Entretien') || CX.S.trucks.find(t => t.status === 'Disponible') || null;
  /** Recalcule le statut des camions à partir des missions (source de vérité). */
  DEP.refreshTruckStatus = () => { CX.S.trucks.forEach(t => { if (t.status === 'Entretien') return; t.status = CX.S.missions.some(m => m.truckId === t.id && BUSY.includes(m.status)) ? 'En mission' : 'Disponible'; }); };
  DEP.setMissionStatus = (id, status, extra = {}) => {
    const m = mission(id); if (!m) return null;
    const i = STATUSES.indexOf(status); if (i < 0) return null;
    if (status !== 'Demandée' && !m.truckId) { UI.toast('Affectez un dépanneur', 'Une mission ne démarre pas sans dépanneur ni camion.', 'warn'); return null; }
    m.status = status;
    if (status === 'Sur place' && !m.arrivedAt) m.arrivedAt = CX.now();
    if (status === 'Déposée au parc' || status === 'Terminée') m.doneAt = m.doneAt || CX.now();
    Object.assign(m, extra);
    DEP.refreshTruckStatus();
    log(m, 'Statut : ' + status);
    CX.touch('mission', { id });
    CX.feed({ ic: 'truck', tone: status === 'Demandée' ? 'red' : 'green', t: m.no + ' · ' + status, s: m.vehicle.make + ' ' + m.vehicle.model + ' · ' + m.address, target: { type: 'mission', id } });
    return m;
  };
  /** Affecte un dépanneur (et son camion) ; refuse un dépanneur déjà en mission ou un camion en entretien. */
  DEP.assign = (id, truckId, driverId) => {
    const m = mission(id), t = truck(truckId); if (!m || !t) return null;
    if (t.status === 'Entretien') { UI.toast('Camion indisponible', t.name + ' est en entretien.', 'warn'); return null; }
    const d = driver(driverId || t.driverId);
    const other = d ? DEP.driverMission(d.id) : null;
    if (other && other.id !== m.id) { UI.toast(d.first + ' est déjà en mission', other.no + ' · ' + other.status, 'warn'); return null; }
    m.truckId = truckId; m.driverId = d ? d.id : null;
    if (m.status === 'Demandée') m.status = 'Affectée';
    DEP.refreshTruckStatus();
    log(m, 'Affectée à ' + (d ? d.first + ' · ' : '') + t.name); CX.touch('mission', { id });
    return m;
  };
  DEP.depositToParc = (id, level, slot) => {
    const m = mission(id); if (!m) return null;
    const used = CX.S.gardes.some(g => !g.outAt && g.slot === slot);
    if (used) { UI.toast('Place occupée', slot + ' est déjà prise.', 'warn'); return null; }
    const no = 'GA-' + (CX.S.gardes.reduce((a, g) => Math.max(a, +String(g.no).replace(/\D/g, '') || 0), 5200) + 1);
    const g = { id: U.uid('G'), no, since: today(), mandant: m.mandant, ref: m.ref, vehicle: Object.assign({}, m.vehicle), reason: m.kind + ' — mission ' + m.no, level, slot, status: 'En garde', step: 'Non traité', owner: Object.assign({}, m.customer), dailyFee: CX.S.parc.dailyFee, outAt: null, paid: 0, missionId: m.id, history: [{ at: CX.now(), text: 'Entrée au parc depuis ' + m.no }], insurance: m.mandant === 'Particulier' ? undefined : { status: 'À déclarer', history: [] } };
    CX.S.gardes.unshift(g);
    DEP.setMissionStatus(id, 'Déposée au parc', { destination: parcName() + ' · ' + slot, gardeId: g.id });
    return g;
  };
  /** Facture la mission (facture réelle dans Facturation) ; repli sur le simple statut si le module n'est pas chargé. */
  DEP.invoiceMission = id => { const m = mission(id); if (!m) return null; if (DEP.billMission) return DEP.billMission(m); return DEP.setMissionStatus(id, 'Facturée'); };

  function missionForm(m) {
    const isNew = !m;
    BO.formModal({ title: isNew ? 'Nouvelle mission' : 'Modifier ' + m.no, wide: true, cols: 'c3',
      fields: [{ k: 'mandant', label: 'Mandant', type: 'select', opts: MANDANTS, req: true }, { k: 'ref', label: 'Référence sinistre / dossier', ph: 'SIN-48123' }, { k: 'kind', label: 'Motif', type: 'select', opts: KINDS, req: true },
        { k: 'address', label: 'Adresse d’intervention', req: true, full: true, ph: '12 rue de Paradis, 75010 Paris' },
        { k: 'plate', label: 'Immatriculation', req: true, ph: 'AB-123-CD' }, { k: 'make', label: 'Marque', req: true }, { k: 'model', label: 'Modèle', req: true },
        { k: 'hex', label: 'Couleur du véhicule', type: 'color' }, { k: 'cname', label: 'Conducteur / propriétaire', req: true }, { k: 'cphone', label: 'Téléphone', type: 'tel', req: true },
        { k: 'destination', label: 'Destination prévue', type: 'select', opts: ['Sur place', parcName(), 'Garage du client', 'Domicile', 'Concession'] }, { k: 'price', label: 'Tarif prévu (€ HT)', type: 'number', min: 0 }, { k: 'eta', label: 'Heure prévue', type: 'time' },
        { k: 'notes', label: 'Consignes', type: 'textarea', full: true, ph: 'ex. véhicule en sous-sol, hauteur limitée 1,90 m' }],
      values: m ? Object.assign({}, m, { plate: m.vehicle.plate, make: m.vehicle.make, model: m.vehicle.model, hex: m.vehicle.hex, cname: m.customer.name, cphone: m.customer.phone, eta: U.tOf(m.eta) }) : { mandant: 'AXA', kind: 'Panne batterie', destination: 'Sur place', hex: '#c9cdd3', price: DEP.priceOf ? DEP.priceOf('Panne batterie') : 120, eta: U.hm(U.nowMin() + 45) },
      onMount: el => { const k = el.querySelector('[name="kind"]'), p = el.querySelector('[name="price"]'); if (k && p && DEP.priceOf) k.addEventListener('change', () => { p.value = DEP.priceOf(k.value); }); },
      submit: isNew ? 'Créer la mission' : 'Enregistrer', onSubmit: x => {
        const v = { plate: x.plate.toUpperCase().trim(), make: x.make, model: x.model, hex: x.hex || '#c9cdd3' }, c = { name: x.cname, phone: x.cphone };
        if (isNew) { const n = { id: U.uid('M'), no: nextNo(), at: CX.now(), mandant: x.mandant, ref: x.ref || '', kind: x.kind, status: 'Demandée', address: x.address, vehicle: v, customer: c, truckId: null, driverId: null, eta: today() + ' ' + (x.eta || U.hm(U.nowMin() + 45)), arrivedAt: null, doneAt: null, destination: x.destination, price: +x.price || 0, notes: x.notes || '', photos: [], history: [{ at: CX.now(), text: 'Mission créée (' + x.mandant + ')', by: CX.S.meId }] }; CX.S.missions.unshift(n); CX.touch('mission', { id: n.id }); UI.toast('Mission créée', n.no + ' · ' + v.plate, 'ok', 'truck'); if (DEP.freeDrivers().length) setTimeout(() => assignForm(n), 150); }
        else { Object.assign(m, { mandant: x.mandant, ref: x.ref || '', kind: x.kind, address: x.address, vehicle: v, customer: c, destination: x.destination, price: +x.price || 0, notes: x.notes || '', eta: today() + ' ' + (x.eta || U.tOf(m.eta)) }); log(m, 'Mission modifiée'); CX.touch('mission', { id: m.id }); }
        BO.now();
      } });
  }
  function assignForm(m) {
    const free = DEP.freeDrivers();
    const dOpts = CX.S.drivers.map(d => { const cur = DEP.driverMission(d.id), t = DEP.truckOfDriver(d.id); return [d.id, d.first + (cur && cur.id !== m.id ? ' · en mission (' + cur.no + ')' : ' · libre') + (t ? ' · ' + t.name : '')]; });
    const first = free[0] || CX.S.drivers[0];
    BO.formModal({ title: 'Envoyer un dépanneur — ' + m.no, intro: free.length ? `<div class="form-note">${BO.icon('users', 16)}<div>${free.length} dépanneur${free.length > 1 ? 's' : ''} libre${free.length > 1 ? 's' : ''} : <b>${esc(free.map(d => d.first).join(', '))}</b>. Le camion habituel est proposé ; vous pouvez en choisir un autre.</div></div>` : `<div class="form-note warn">${BO.icon('alert', 16)}<div>Tous les dépanneurs sont en mission : la demande reste en attente, ou choisissez quelqu’un qui va se libérer.</div></div>`,
      fields: [{ k: 'driverId', label: 'Dépanneur', type: 'select', opts: dOpts, req: true }, { k: 'truckId', label: 'Camion', type: 'select', opts: CX.S.trucks.map(t => [t.id, t.name + ' · ' + t.kind + ' · ' + t.status]), req: true }],
      values: { driverId: first.id, truckId: (DEP.truckOfDriver(first.id) || CX.S.trucks[0]).id }, submit: 'Envoyer en mission',
      onMount: el => { const ts = el.querySelector('[name="truckId"]'), ds = el.querySelector('[name="driverId"]'); ds.addEventListener('change', () => { const t = DEP.truckOfDriver(ds.value); if (t) ts.value = t.id; }); },
      onSubmit: x => { const t = truck(x.truckId); if (!DEP.assign(m.id, x.truckId, x.driverId)) return false; DEP.setMissionStatus(m.id, 'En route'); UI.toast('Mission envoyée', m.no + ' → ' + (driver(x.driverId) || {}).first + ' · ' + t.name, 'ok', 'truck'); BO.now(); } });
  }
  function parcForm(m) {
    const used = new Set(CX.S.gardes.filter(g => !g.outAt).map(g => g.slot));
    const opts = [];
    CX.S.parc.levels.forEach(l => { for (let i = 1; i <= l.slots; i++) { const s = l.id + '-' + U.pad(i); if (!used.has(s)) opts.push([l.id + '|' + s, l.name + ' · place ' + U.pad(i)]); } });
    BO.formModal({ title: 'Dépôt au parc — ' + m.vehicle.plate, fields: [{ k: 'slot', label: 'Place libre', type: 'select', opts: opts.slice(0, 200), req: true }], submit: 'Déposer', onSubmit: x => { const [level, slot] = x.slot.split('|'); const g = DEP.depositToParc(m.id, level, slot); if (!g) return false; UI.toast('Véhicule au parc', g.vehicle.plate + ' · ' + slot, 'ok', 'box'); BO.now(); } });
  }
  const tel = p => 'tel:' + String(p || '').replace(/\s/g, '');
  function detail(m) {
    const t = m.truckId ? truck(m.truckId) : null, d = m.driverId ? driver(m.driverId) : null;
    const billed = DEP.invoices ? DEP.invoices().find(i => i.kind === 'mission' && i.srcId === m.id) : null;
    BO.drawer({ wide: true, head: () => `<div style="width:70px">${UI.carPic(m.vehicle.hex, 70, 54)}</div>`, title: () => esc(m.no) + ' · ' + esc(m.vehicle.make + ' ' + m.vehicle.model), sub: () => `${BO.chip(m.status, TONE[m.status], true)} ${BO.plate(m.vehicle.plate)} · ${esc(m.kind)} · ${esc(m.mandant)}${m.ref ? ' · ' + esc(m.ref) : ''}`,
      render: () => `<div class="mflow">${STATUSES.filter(s => s !== 'Déposée au parc' || m.status === s || m.gardeId).map(s => `<span class="${STATUSES.indexOf(s) < STATUSES.indexOf(m.status) ? 'done' : s === m.status ? 'cur' : ''}">${esc(s)}</span>`).join('')}</div>
        <div class="tiles"><div class="tile"><div class="tl">Demandée à</div><div class="tv">${esc(U.tOf(m.at))}</div></div><div class="tile"><div class="tl">Prévue</div><div class="tv">${esc(U.tOf(m.eta) || '—')}</div></div><div class="tile"><div class="tl">Sur place</div><div class="tv">${esc(m.arrivedAt ? U.tOf(m.arrivedAt) : '—')}</div></div><div class="tile"><div class="tl">Tarif HT</div><div class="tv">${chf(m.price)}</div></div></div>
        ${d ? `<div class="drv-line mt">${UI.av(d, 40)}<div><b>${esc(d.first)}</b><small>${t ? esc(t.name + ' · ' + t.kind + ' · ' + t.plate) : ''}</small></div><a class="btn sm" href="${tel(d.phone)}">${BO.icon('phone', 14)}Appeler ${esc(d.first)}</a></div>` : `<div class="form-note warn mt">${BO.icon('alert', 16)}<div>Aucun dépanneur affecté. ${DEP.freeDrivers().length ? '<b>' + esc(DEP.freeDrivers().map(x => x.first).join(', ')) + '</b> ' + (DEP.freeDrivers().length > 1 ? 'sont libres' : 'est libre') + '.' : 'Tous les dépanneurs sont en mission.'}</div></div>`}
        <div class="dsec"><dl class="kv"><dt>Adresse</dt><dd>${esc(m.address)} <a class="lnk xs-t" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.address)}">Itinéraire</a></dd><dt>Client</dt><dd>${esc(m.customer.name)} · <a class="lnk" href="${tel(m.customer.phone)}">${esc(m.customer.phone)}</a></dd><dt>Destination</dt><dd>${esc(m.destination || '—')}</dd>${billed ? `<dt>Facture</dt><dd><a class="lnk" data-open="invoices:${billed.id}">${esc(billed.no)}</a> · ${esc(billed.status)}</dd>` : ''}${m.gardeId ? `<dt>Garde</dt><dd><a class="lnk" data-open="parc:${m.gardeId}">Dossier au parc</a></dd>` : ''}${m.notes ? `<dt>Consignes</dt><dd>${esc(m.notes)}</dd>` : ''}</dl></div>
        <div class="dsec"><h4>Historique</h4><ul class="hist">${(m.history || []).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul></div>`,
      foot: () => `<button class="btn" data-edit>${BO.icon('edit', 14)}Modifier</button><a class="btn" href="${tel(m.customer.phone)}">${BO.icon('phone', 14)}Client</a><span class="sp"></span>${m.status === 'Demandée' || m.status === 'Affectée' ? `<button class="btn pri" data-assign>${BO.icon('truck', 14)}${m.status === 'Demandée' ? 'Envoyer un dépanneur' : 'Envoyer'}</button>` : ''}${m.status === 'En route' ? `<button class="btn pri" data-st="Sur place">Sur place</button>` : ''}${m.status === 'Sur place' ? `<button class="btn" data-st="Terminée">Réparé sur place</button><button class="btn pri" data-st="Remorquage">${BO.icon('truck', 14)}Remorquage</button>` : ''}${m.status === 'Remorquage' ? `<button class="btn" data-st="Terminée">Livré (garage / domicile)</button><button class="btn pri" data-parc>${BO.icon('box', 14)}Déposer au parc</button>` : ''}${(m.status === 'Déposée au parc' || m.status === 'Terminée') && !billed ? `<button class="btn pri" data-bill>${BO.icon('invoice', 14)}Facturer ${esc(m.mandant)}</button>` : ''}`,
      onMount: (dr, close) => {
        dr.querySelector('[data-edit]').addEventListener('click', () => { close(); missionForm(m); });
        const a = dr.querySelector('[data-assign]'); if (a) a.addEventListener('click', () => { close(); assignForm(m); });
        const p = dr.querySelector('[data-parc]'); if (p) p.addEventListener('click', () => { close(); parcForm(m); });
        const b = dr.querySelector('[data-bill]'); if (b) b.addEventListener('click', () => BO.confirm('Facturer ' + m.no + ' à ' + esc(m.mandant) + ' ?', 'Montant ' + chf(m.price) + ' HT. La facture est créée dans Facturation ; l’encaissement se saisit à réception du paiement.', 'Facturer', () => { DEP.invoiceMission(m.id); close(); BO.now(); }));
        dr.querySelectorAll('[data-st]').forEach(x => x.addEventListener('click', () => { DEP.setMissionStatus(m.id, x.dataset.st); close(); BO.now(); }));
      } });
  }
  DEP.missionDetail = detail; DEP.missionForm = missionForm; DEP.assignForm = assignForm; DEP.parcForm = parcForm;

  /* ---------- planning du jour : une ligne par dépanneur, blocs horaires, glisser une demande ---------- */
  const startOf = m => { const h = (m.history || []).slice().reverse().find(x => /^Statut : En route|^Affectée/.test(x.text)); return U.toMin(U.tOf(h ? h.at : m.at)); };
  const endOf = m => m.doneAt ? U.toMin(U.tOf(m.doneAt)) : active(m) ? Math.max(U.nowMin(), startOf(m) + 15) : startOf(m) + 60;
  function journee(el) {
    const S = CX.S, now = U.nowMin();
    const todayM = S.missions.filter(m => U.dOf(m.at) === today());
    const mins = todayM.map(startOf).concat([now]);
    const t0 = Math.max(0, Math.floor(Math.min(...mins) / 60) * 60 - 60), t1 = Math.min(24 * 60, Math.ceil(Math.max(now + 90, ...todayM.map(endOf)) / 60) * 60);
    const pct = t => Math.max(0, Math.min(100, (t - t0) / (t1 - t0) * 100));
    const hours = []; for (let h = t0; h <= t1; h += 60) hours.push(h);
    const waiting = S.missions.filter(m => m.status === 'Demandée');
    const block = (m, i, arr) => { const a = startOf(m), b = endOf(m), wait = m.status === 'Demandée', n = arr ? arr.length : 1; const left = wait ? i * (100 / n) : pct(a), width = wait ? Math.min(32, 100 / n - 1) : Math.max(3, pct(b) - pct(a)); return `<div class="tlb st-${esc(m.status.replace(/\s|é/g, c => c === 'é' ? 'e' : '-').toLowerCase())} ${BUSY.includes(m.status) ? 'act' : ''}" style="left:${left}%;width:${width}%" data-m="${m.id}" ${m.status === 'Affectée' ? 'draggable="true"' : ''} title="${esc(m.no + ' · ' + m.kind + ' · ' + m.status + ' · ' + U.hm(a) + (m.doneAt ? ' → ' + U.hm(b) : ''))}"><b>${esc(m.kind)}</b><small>${esc(m.vehicle.plate)} · ${esc(m.status)}</small></div>`; };
    el.innerHTML = `<div class="card tl-card"><div class="card-h"><h3>${BO.icon('cal', 16)}Journée par dépanneur <small>· ${esc(U.hm(t0))} → ${esc(U.hm(t1))} · glissez une demande sur un dépanneur libre</small></h3></div>
      <div class="tl"><div class="tl-row tl-hours"><div class="tl-who"></div><div class="tl-track">${hours.map(h => `<span style="left:${pct(h)}%">${esc(U.hm(h))}</span>`).join('')}</div></div>
      ${S.drivers.map(d => { const ms = todayM.filter(m => m.driverId === d.id), cur = DEP.driverMission(d.id), t = cur && cur.truckId ? truck(cur.truckId) : DEP.truckOfDriver(d.id); return `<div class="tl-row" data-drop="${d.id}"><div class="tl-who">${UI.av(d, 34)}<div><b>${esc(d.first)}</b><small>${t ? esc(t.name) : ''} · ${cur ? esc(cur.status) : 'libre'}</small></div></div><div class="tl-track">${ms.map(m => block(m)).join('')}<i class="tl-now" style="left:${pct(now)}%"></i></div></div>`; }).join('')}
      <div class="tl-row tl-wait"><div class="tl-who"><span class="tic high" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--red-soft);color:var(--red)">${BO.icon('bell', 16)}</span><div><b>En attente</b><small>${waiting.length} demande${waiting.length > 1 ? 's' : ''}</small></div></div><div class="tl-track">${waiting.map((m, i) => block(m, i, waiting)).join('') || '<span class="muted xs-t" style="position:absolute;left:8px;top:14px">Aucune demande en attente</span>'}<i class="tl-now" style="left:${pct(now)}%"></i></div></div></div>
      <div class="legend" style="padding:10px 16px 14px"><span><i style="background:#1768ee"></i>En route / sur place / remorquage</span><span><i style="background:#b96400"></i>Affectée (glissable)</span><span><i style="background:#1b7f4c"></i>Terminée / déposée</span><span><i style="background:#2a2e35"></i>Facturée</span><span><i style="background:#d7261e"></i>Demandée (glissable)</span></div></div>`;
    el.querySelectorAll('.tlb[data-m]').forEach(b => { b.addEventListener('click', () => detail(mission(b.dataset.m))); b.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', b.dataset.m); e.dataTransfer.effectAllowed = 'move'; BO.dragging = true; }); b.addEventListener('dragend', () => { BO.dragging = false; }); });
    el.querySelectorAll('[data-drop]').forEach(r => {
      r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('over'); });
      r.addEventListener('dragleave', () => r.classList.remove('over'));
      r.addEventListener('drop', e => { e.preventDefault(); r.classList.remove('over'); BO.dragging = false; const m = mission(e.dataTransfer.getData('text/plain')); const d = driver(r.dataset.drop); if (!m || !d) return; const tr = DEP.truckOfDriver(d.id); if (!tr) { UI.toast('Aucun camion disponible', '', 'warn'); return; } if (DEP.assign(m.id, tr.id, d.id)) { if (m.status === 'Affectée') DEP.setMissionStatus(m.id, 'En route'); UI.toast(d.first + ' part sur ' + m.no, m.kind + ' · ' + m.address, 'ok', 'truck'); BO.now(); } });
    });
  }
  DEP.journee = journee;

  function render(el, params) {
    if (params.id && mission(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(mission(id)), 0); }
    if (params.tab === 'new') { APP.setParams({ tab: null }); setTimeout(() => missionForm(), 0); }
    if (params.tab === 'journee' || params.tab === 'cards') { st.view = params.tab; APP.setParams({ tab: null }); }
    const S = CX.S, all = S.missions, act = all.filter(active), q = st.q.toLowerCase();
    let rows = st.seg === 'actives' ? act : st.seg === 'all' ? all : all.filter(m => m.status === st.seg);
    if (q) rows = rows.filter(m => (m.no + ' ' + m.vehicle.plate + ' ' + m.vehicle.make + ' ' + m.vehicle.model + ' ' + m.address + ' ' + m.customer.name + ' ' + m.mandant + ' ' + m.ref).toLowerCase().includes(q));
    const cnt = s => all.filter(m => m.status === s).length, free = DEP.freeDrivers();
    const toBill = all.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status));
    el.innerHTML = `<div class="bo-page">${BO.head('Missions', `${act.length} en cours · ${cnt('Demandée')} en attente d’un dépanneur · ${all.filter(m => m.doneAt && U.dOf(m.doneAt) === today()).length} terminées aujourd’hui`, `<button class="btn pri" data-new>${BO.icon('plus', 15)}Nouvelle mission</button>`)}
      <div class="kpis k4">${BO.kpi({ lb: 'À envoyer', v: cnt('Demandée'), icon: 'alert', cls: cnt('Demandée') ? 'warn' : '', s: cnt('Demandée') ? 'demandes sans dépanneur' : 'tout est affecté' })}${BO.kpi({ lb: 'Dépanneurs libres', v: free.length + '<small>/' + S.drivers.length + '</small>', icon: 'users', s: free.length ? free.map(d => d.first).join(', ') : S.drivers.map(d => d.first + ' · ' + ((DEP.driverMission(d.id) || {}).status || '').toLowerCase()).join(' · '), cls: 'click', go: 'fleet:chauffeurs' })}${BO.kpi({ lb: 'Sur la route', v: cnt('En route') + cnt('Sur place') + cnt('Remorquage'), icon: 'truck', s: cnt('Remorquage') + ' remorquage' + (cnt('Remorquage') > 1 ? 's' : '') + ' · ' + cnt('Sur place') + ' sur place' })}${BO.kpi({ lb: 'À facturer', v: toBill.length, icon: 'invoice', s: chf(toBill.reduce((a, m) => a + m.price, 0)) + ' HT', cls: 'click', go: 'invoices' })}</div>
      <div class="row wrap mb" style="gap:10px">${BO.seg('view', [['cards', 'Liste'], ['journee', 'Journée par dépanneur']], st.view)}${st.view === 'cards' ? BO.seg('seg', [['actives', 'En cours', act.length], ...STATUSES.map(s => [s, s, cnt(s)]).filter(x => x[2]), ['all', 'Toutes', all.length]], st.seg) : ''}<span class="sp"></span>${st.view === 'cards' ? `<div class="box" style="width:280px;max-width:100%"><input class="inp" data-q placeholder="Plaque, adresse, mandant, client…" value="${esc(st.q)}"></div>` : ''}</div>
      ${st.view === 'journee' ? '<div data-journee></div>' : `<div class="g g2">${rows.map(m => { const t = m.truckId ? truck(m.truckId) : null, d = m.driverId ? driver(m.driverId) : null; return `<div class="card mcard" data-m="${m.id}"><div class="card-b"><div class="row" style="gap:12px;align-items:center">${UI.carPic(m.vehicle.hex, 64, 48)}<div style="flex:1;min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(m.vehicle.plate)}<b>${esc(m.vehicle.make)} ${esc(m.vehicle.model)}</b>${BO.chip(m.status, TONE[m.status], true)}</div><div class="sm-t mt1">${BO.icon('pin', 13)} ${esc(m.address)}</div><div class="xs-t muted mt1">${esc(m.no)} · ${esc(m.kind)} · ${esc(m.mandant)}${m.ref ? ' · ' + esc(m.ref) : ''} · demandée ${esc(U.tOf(m.at))}${m.eta && active(m) ? ' · prévue ' + esc(U.tOf(m.eta)) : ''}</div></div><div class="mwho">${d ? `${UI.av(d, 30)}<b class="sm-t">${esc(d.first)}</b><span class="xs-t muted">${t ? esc(t.name) : ''}</span>` : `<span class="chip red">à envoyer</span>`}<span class="xs-t muted">${chf(m.price)} HT</span></div></div></div></div>`; }).join('') || `<div class="card"><div class="card-b">${BO.empty('check', 'Aucune mission', '', '', true)}</div></div>`}</div>`}</div>`;
    if (st.view === 'journee') journee(el.querySelector('[data-journee]'));
    BO.bindSeg(el, (n, v) => { if (n === 'view') st.view = v; else st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelector('[data-new]').addEventListener('click', () => missionForm());
    el.querySelectorAll('[data-m]').forEach(c => c.addEventListener('click', () => detail(mission(c.dataset.m))));
  }
  APP.register({ id: 'missions', label: 'Missions', icon: 'truck', group: 'Dépannage', order: 1, activity: 'depannage', render, badge: () => CX.S.missions.filter(m => m.status === 'Demandée').length });
})();
