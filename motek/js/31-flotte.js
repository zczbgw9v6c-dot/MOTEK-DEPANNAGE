/* ==========================================================================
   BO · Flotte & chauffeurs : camions (plateau, panier, porte-voitures),
   disponibilité, entretien, chauffeurs et astreintes.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const TONE = { 'Disponible': 'green', 'En mission': 'amber', 'Entretien': 'red' };
  const driver = id => CX.S.drivers.find(d => d.id === id);
  const missionOf = t => CX.S.missions.find(m => m.truckId === t.id && !['Terminée', 'Facturée'].includes(m.status));
  function truckForm(t) {
    BO.formModal({ title: t ? t.name + ' · ' + t.plate : 'Nouveau camion', cols: 'c3', wide: true,
      fields: [{ k: 'name', label: 'Nom', req: true }, { k: 'plate', label: 'Immatriculation', req: true }, { k: 'kind', label: 'Type', type: 'select', opts: ['Plateau', 'Panier', 'Porte-voitures', 'Dépanneuse légère'] }, { k: 'brand', label: 'Marque / modèle' }, { k: 'km', label: 'Kilométrage', type: 'number', min: 0 }, { k: 'status', label: 'Statut', type: 'select', opts: ['Disponible', 'En mission', 'Entretien'] }, { k: 'driverId', label: 'Chauffeur habituel', type: 'select', opts: CX.S.drivers.map(d => [d.id, d.name]), empty: '— Aucun —' }, { k: 'ct', label: 'Contrôle technique', type: 'date' }, { k: 'notes', label: 'Notes', full: true }],
      values: t || { kind: 'Plateau', status: 'Disponible' }, submit: t ? 'Enregistrer' : 'Ajouter',
      onSubmit: x => { if (t) Object.assign(t, x, { km: +x.km || 0, driverId: x.driverId || null }); else CX.S.trucks.push(Object.assign({ id: U.uid('T') }, x, { km: +x.km || 0, driverId: x.driverId || null })); CX.touch('truck'); UI.toast(t ? 'Camion modifié' : 'Camion ajouté', x.name, 'ok', 'truck'); BO.now(); } });
  }
  function driverForm(d) {
    BO.formModal({ title: d ? d.name : 'Nouveau chauffeur', cols: 'c3', wide: true,
      fields: [{ k: 'first', label: 'Prénom', req: true }, { k: 'last', label: 'Nom', req: true }, { k: 'phone', label: 'Téléphone', type: 'tel' }, { k: 'title', label: 'Fonction' }, { k: 'astreinte', label: 'D’astreinte cette semaine', type: 'checkbox' }, { k: 'skills', label: 'Permis / compétences', full: true, ph: 'Permis C, remorquage, panier' }],
      values: d ? Object.assign({}, d, { skills: (d.skills || []).join(', ') }) : { title: 'Chauffeur-dépanneur' }, submit: d ? 'Enregistrer' : 'Ajouter',
      onSubmit: x => { const o = Object.assign(d || { id: U.uid('D'), role: 'chauffeur', since: new Date().getFullYear(), color: '#1768ee', costH: 32, email: '' }, x, { name: x.first + ' ' + x.last, ini: x.first[0] + x.last[0], skills: x.skills.split(',').map(s => s.trim()).filter(Boolean), astreinte: !!x.astreinte }); if (!d) CX.S.drivers.push(o); CX.touch('driver'); UI.toast(d ? 'Chauffeur modifié' : 'Chauffeur ajouté', o.name, 'ok', 'user'); BO.now(); } });
  }
  function render(el) {
    const S = CX.S, free = S.trucks.filter(t => t.status === 'Disponible'), busy = S.trucks.filter(t => t.status === 'En mission'), maint = S.trucks.filter(t => t.status === 'Entretien');
    el.innerHTML = `<div class="bo-page">${BO.head('Flotte & chauffeurs', `${S.trucks.length} camions · ${free.length} disponibles · ${busy.length} en mission · ${maint.length} en entretien · ${S.drivers.length} chauffeurs`, `<button class="btn" data-newd>${BO.icon('plus', 15)}Chauffeur</button><button class="btn pri" data-newt>${BO.icon('plus', 15)}Camion</button>`)}
      <div class="fleet showroom">${S.trucks.map(t => { const d = t.driverId ? driver(t.driverId) : null, m = missionOf(t), ctd = t.ct ? U.diffDays(today(), t.ct) : null; return `<div class="kcar" data-t="${t.id}"><div class="pic" style="background:${t.status === 'En mission' ? 'linear-gradient(180deg,#fff7e6,#ffe9c2)' : t.status === 'Entretien' ? 'linear-gradient(180deg,#fdecea,#f9d4d0)' : 'linear-gradient(180deg,#eaf4ee,#d4ead9)'}">${BO.icon('truck', 54)}</div><div class="bd"><div class="row"><b>${esc(t.name)}</b><span class="sp"></span>${BO.chip(t.status, TONE[t.status], true)}</div><div class="xs-t muted" style="margin-top:2px">${esc(t.kind)} · ${esc(t.brand || '')} · ${esc(t.plate)}</div>
        <div class="row mt1" style="gap:8px;align-items:center">${d ? UI.av(d, 26) + '<span class="sm-t">' + esc(d.name) + '</span>' : '<span class="muted sm-t">Sans chauffeur</span>'}</div>
        ${m ? `<div class="form-note mt1" style="padding:8px 10px">${BO.icon('pin', 14)}<div class="xs-t"><b>${esc(m.no)}</b> · ${esc(m.status)} · ${esc(m.address)}</div></div>` : ''}
        <div class="row mt1 xs-t muted"><span>${BO.num(t.km)} km</span><span class="sp"></span><span>${ctd != null ? (ctd < 0 ? '<span class="chip red">CT dépassé</span>' : ctd < 30 ? '<span class="chip amber">CT dans ' + ctd + ' j</span>' : 'CT ' + esc(U.fmtD(t.ct))) : ''}</span></div>
        ${t.notes ? `<div class="xs-t muted mt1">${esc(t.notes)}</div>` : ''}</div></div>`; }).join('')}</div>
      <h2 class="sec mt2">${BO.icon('users', 16)}Chauffeurs</h2>
      <div class="techs">${S.drivers.map(d => { const t = S.trucks.find(x => x.driverId === d.id); return `<button class="techbtn" data-d="${d.id}">${UI.av(d, 40)}<span><b>${esc(d.name)}</b><small>${t ? esc(t.name) + ' · ' : ''}${esc((d.skills || []).join(', '))}</small></span>${d.astreinte ? '<em title="D’astreinte">astreinte</em>' : ''}</button>`; }).join('')}</div></div>`;
    el.querySelector('[data-newt]').addEventListener('click', () => truckForm());
    el.querySelector('[data-newd]').addEventListener('click', () => driverForm());
    el.querySelectorAll('[data-t]').forEach(c => c.addEventListener('click', () => truckForm(S.trucks.find(t => t.id === c.dataset.t))));
    el.querySelectorAll('[data-d]').forEach(c => c.addEventListener('click', () => driverForm(driver(c.dataset.d))));
  }
  APP.register({ id: 'fleet', label: 'Flotte & chauffeurs', icon: 'lift', group: 'Dépannage', order: 2, activity: 'depannage', render, badge: () => CX.S.trucks.filter(t => t.status === 'Entretien').length });
})();
