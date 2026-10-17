/* ==========================================================================
   BO · Flotte, chauffeurs & bureau : camions (pictogramme par type : panier
   Toyota Hilux 2025, plateau, porte-voitures, légère), disponibilité,
   entretien, chauffeurs et astreintes, collaborateurs du bureau et leurs
   accès MOTEK.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const st = { tab: 'camions', seg:'all' };
  const TONE = { 'Disponible': 'green', 'En mission': 'amber', 'Entretien': 'red' };
  const KINDS = ['Panier', 'Plateau', 'Porte-voitures', 'Dépanneuse légère'];
  const driver = id => CX.S.drivers.find(d => d.id === id);
  const missionOf = t => CX.S.missions.find(m => m.truckId === t.id && DEP.activeMission(m));
  const office = () => (CX.S.office = CX.S.office || []);
  function truckForm(t) {
    BO.formModal({ title: t ? t.name + ' · ' + t.plate : 'Nouveau camion', cols: 'c3', wide: true,
      fields: [{ k: 'name', label: 'Nom', req: true }, { k: 'plate', label: 'Immatriculation', req: true }, { k: 'kind', label: 'Type', type: 'select', opts: KINDS }, { k: 'brand', label: 'Marque / modèle' }, { k: 'year', label: 'Année', type: 'number', min: 1990, max: 2030 }, { k: 'km', label: 'Kilométrage', type: 'number', min: 0 }, { k: 'status', label: 'Statut', type: 'select', opts: ['Disponible', 'En mission', 'Entretien'] }, { k: 'driverId', label: 'Chauffeur habituel', type: 'select', opts: CX.S.drivers.map(d => [d.id, d.name]), empty: '— Aucun —' }, { k: 'ct', label: 'Contrôle technique', type: 'date' }, { k: 'notes', label: 'Notes', full: true }],
      values: t || { kind: 'Panier', brand: 'Toyota Hilux', year: 2025, status: 'Disponible' }, submit: t ? 'Enregistrer' : 'Ajouter',
      onSubmit: x => { if(t && missionOf(t) && x.status!=='En mission'){UI.toast('Camion affecté','Terminez ou réaffectez la mission avant de modifier son statut.','warn');return false;} if(x.status==='En mission' && (!t || !missionOf(t))){UI.toast('Aucune mission','Affectez ce camion depuis Missions.','warn');return false;} const v = Object.assign({}, x, { km: +x.km || 0, year: +x.year || null, driverId: x.driverId || null }); if (t) Object.assign(t, v); else CX.S.trucks.push(Object.assign({ id: U.uid('T') }, v)); CX.touch('truck'); UI.toast(t ? 'Camion modifié' : 'Camion ajouté', x.name, 'ok', 'truck'); BO.now(); } });
  }
  function driverForm(d) {
    BO.formModal({ title: d ? d.name : 'Nouveau chauffeur', cols: 'c3', wide: true,
      fields: [{ k: 'first', label: 'Prénom', req: true }, { k: 'last', label: 'Nom', req: true }, { k: 'phone', label: 'Téléphone', type: 'tel' }, { k: 'title', label: 'Fonction' }, { k: 'astreinte', label: 'D’astreinte cette semaine', type: 'checkbox' }, { k: 'skills', label: 'Permis / compétences', full: true, ph: 'Permis C, remorquage, panier' }],
      values: d ? Object.assign({}, d, { skills: (d.skills || []).join(', ') }) : { title: 'Chauffeur-dépanneur' }, submit: d ? 'Enregistrer' : 'Ajouter',
      onSubmit: x => { const o = Object.assign(d || { id: U.uid('D'), role: 'chauffeur', since: new Date().getFullYear(), color: '#1768ee', costH: 32, email: '' }, x, { name: x.first + ' ' + x.last, ini: x.first[0] + x.last[0], skills: x.skills.split(',').map(s => s.trim()).filter(Boolean), astreinte: !!x.astreinte }); if (!d) CX.S.drivers.push(o); CX.touch('driver'); UI.toast(d ? 'Chauffeur modifié' : 'Chauffeur ajouté', o.name, 'ok', 'user'); BO.now(); } });
  }
  function staffForm(p) {
    const mods = APP.modules().filter(m => CX.activityOn(m.activity || 'depannage') && m.id !== 'settings');
    BO.formModal({ title: p ? p.name : 'Nouveau collaborateur', cols: 'c2', wide: true,
      intro: `<div class="form-note">${BO.icon('key', 16)}<div>Profils prévus pour le bureau. Aucun droit individuel n’est appliqué tant que l’authentification serveur n’est pas activée. Joseph est le gérant.</div></div>`,
      fields: [{ k: 'first', label: 'Prénom', req: true }, { k: 'last', label: 'Nom', req: true }, { k: 'title', label: 'Fonction', req: true, full: true, ph: 'Gestion sinistres & assureurs' }, { k: 'phone', label: 'Téléphone', type: 'tel' }, { k: 'email', label: 'E-mail', type: 'email' }, { k: 'access', label: 'Accès aux modules (séparés par des virgules)', full: true, ph: mods.map(m => m.id).join(', ') }],
      values: p ? Object.assign({}, p, { access: (p.access || []).join(', ') }) : { access: 'missions, parc' }, submit: p ? 'Enregistrer' : 'Ajouter',
      onSubmit: x => { const o = Object.assign(p || { id: U.uid('B'), role: 'bureau', color: ['#7c3aed', '#0e7490', '#b45309', '#be185d'][office().length % 4], since: new Date().getFullYear() }, x, { name: x.first + ' ' + x.last, ini: x.first[0] + x.last[0], access: String(x.access || '').split(',').map(s => s.trim()).filter(Boolean) }); if (!p) office().push(o); CX.touch('office'); UI.toast(p ? 'Collaborateur modifié' : 'Collaborateur ajouté', o.name, 'ok', 'users'); BO.now(); } });
  }
  function render(el, params) {
    if (params.seg) { st.seg=params.seg; st.tab='camions'; APP.setParams({seg:null}); }
    if (params.tab) { st.tab = params.tab; APP.setParams({ tab: null }); }
    const S = CX.S, free = S.trucks.filter(t => t.status === 'Disponible'), busy = S.trucks.filter(t => t.status === 'En mission'), maint = S.trucks.filter(t => t.status === 'Entretien');
    el.innerHTML = `<div class="bo-page">${BO.head('Flotte, chauffeurs & bureau', `${S.trucks.length} camions · ${free.length} disponibles · ${busy.length} en mission · ${maint.length} en entretien · ${S.drivers.length} chauffeurs · ${office().length} au bureau`, `<button class="btn" data-newp>${BO.icon('plus', 15)}Collaborateur</button><button class="btn" data-newd>${BO.icon('plus', 15)}Chauffeur</button><button class="btn pri" data-newt>${BO.icon('plus', 15)}Camion</button>`)}
      ${BO.tabs([['camions', 'Camions', S.trucks.length], ['chauffeurs', 'Chauffeurs', S.drivers.length], ['bureau', 'Bureau & accès', office().length]], st.tab)}
      <div class="mt" data-body></div></div>`;
    const body = el.querySelector('[data-body]');
    if (st.tab === 'camions') {
      const groups = KINDS.map(k => [k, S.trucks.filter(t => t.kind === k && (st.seg==='all' || st.seg==='ct' ? st.seg==='all' || t.ct && U.diffDays(today(),t.ct)<30 : t.status===st.seg))]).filter(x => x[1].length);
      body.innerHTML = `<div class="row mb"><button class="btn sm" data-all>Tous les camions</button><span class="muted">${esc(st.seg==='all'?'Toute la flotte':st.seg)}</span></div><div class="kpis">${BO.kpi({ lb: 'Disponibles', v: free.length, icon: 'check', s: free.filter(t => t.kind === 'Panier').length + ' paniers · ' + free.filter(t => t.kind !== 'Panier').length + ' plateaux / porte-voitures' })}${BO.kpi({ lb: 'En mission', v: busy.length, icon: 'truck', s: 'affectés ou en intervention' })}${BO.kpi({ lb: 'En entretien', v: maint.length, icon: 'wrench', s: maint.map(t => t.name).join(', ') || 'aucun', cls: maint.length ? 'warn' : '' })}${BO.kpi({ lb: 'Contrôles techniques', v: S.trucks.filter(t => t.ct && U.diffDays(today(), t.ct) < 30).length, icon: 'shieldok', s: 'à passer sous 30 jours' })}</div>
        ${groups.map(([k, ts]) => `<h2 class="sec">${UI.truckIcon(k, 22)}${esc(k)} <small>· ${ts.length}${k === 'Panier' ? ' · Toyota Hilux 2025' : ''}</small></h2>
        <div class="fleet showroom mb">${ts.map(t => { const d = t.driverId ? driver(t.driverId) : null, m = missionOf(t), ctd = t.ct ? U.diffDays(today(), t.ct) : null; return `<div class="kcar tk ${t.status === 'En mission' ? 'busy' : t.status === 'Entretien' ? 'ko' : 'ok'}" data-t="${t.id}"><div class="pic">${UI.truckIcon(t.kind, 84, t.status === 'Entretien' ? '#b42318' : t.status === 'En mission' ? '#b96400' : '#1768ee')}</div><div class="bd"><div class="row"><b>${esc(t.name)}</b><span class="sp"></span>${BO.chip(t.status, TONE[t.status], true)}</div><div class="xs-t muted" style="margin-top:2px">${esc(t.brand || '')}${t.year ? ' ' + t.year : ''} · ${esc(t.plate)}</div>
          <div class="row mt1" style="gap:8px;align-items:center">${d ? UI.av(d, 26) + '<span class="sm-t">' + esc(d.name) + '</span>' : '<span class="muted sm-t">Sans chauffeur</span>'}</div>
          ${m ? `<div class="form-note mt1" style="padding:8px 10px">${BO.icon('pin', 14)}<div class="xs-t"><b>${esc(m.no)}</b> · ${esc(m.status)} · ${esc(m.address)}</div></div>` : ''}
          <div class="row mt1 xs-t muted"><span>${BO.num(t.km)} km</span><span class="sp"></span><span>${ctd != null ? (ctd < 0 ? '<span class="chip red">CT dépassé</span>' : ctd < 30 ? '<span class="chip amber">CT dans ' + ctd + ' j</span>' : 'CT ' + esc(U.fmtD(t.ct))) : ''}</span></div>
          ${t.notes ? `<div class="xs-t muted mt1">${esc(t.notes)}</div>` : ''}</div></div>`; }).join('')}</div>`).join('')}`;
      body.querySelector('[data-all]').addEventListener('click',()=>{st.seg='all';APP.refresh();});
      body.querySelectorAll('[data-t]').forEach(c => c.addEventListener('click', () => truckForm(S.trucks.find(t => t.id === c.dataset.t))));
    }
    if (st.tab === 'chauffeurs') {
      body.innerHTML = `<div class="techs">${S.drivers.map(d => { const t = S.trucks.find(x => x.driverId === d.id), m = t ? missionOf(t) : null; return `<button class="techbtn" data-d="${d.id}">${UI.av(d, 40)}<span><b>${esc(d.name)}</b><small>${t ? UI.truckIcon(t.kind, 16) + ' ' + esc(t.name) + ' · ' : ''}${m ? esc(m.status) : t ? esc(t.status) : 'sans camion'}</small><small>${esc((d.skills || []).join(', '))}</small></span>${d.astreinte ? '<em title="D’astreinte">astreinte</em>' : ''}</button>`; }).join('')}</div>`;
      body.querySelectorAll('[data-d]').forEach(c => c.addEventListener('click', () => driverForm(driver(c.dataset.d))));
    }
    if (st.tab === 'bureau') {
      const me = CX.emp(S.meId), mods = APP.modules();
      const lbl = id => { const m = mods.find(x => x.id === id); return m ? m.label : id; };
      body.innerHTML = `<div class="form-note mb">${BO.icon('users', 16)}<div><b>Le bureau de Dan Dépanne.</b> Moïse et Florence assurent l’administration avec Joseph, le gérant. Profils de démonstration : les droits individuels ne sont pas encore actifs.</div></div>
        <div class="g g-2">${me ? `<div class="card pad staff"><div class="row" style="gap:10px"><span class="bav" style="width:44px;height:44px;font-size:16px;background:#121418">${esc(me.ini)}</span><div><b>${esc(me.first)}</b><div class="xs-t muted">${esc(me.title || 'Gérant')} · ${esc(S.company.name)}</div></div><span class="sp"></span>${BO.chip('Tous les accès', 'dark')}</div></div>` : ''}
        ${office().map(p => `<div class="card pad staff" data-p="${p.id}"><div class="row" style="gap:10px"><span class="bav" style="width:44px;height:44px;font-size:16px;background:${esc(p.color)}">${esc(p.ini)}</span><div><b>${esc(p.name)}</b><div class="xs-t muted">${esc(p.title)}</div></div><span class="sp"></span><button class="btn sm" data-edit="${p.id}">${BO.icon('edit', 13)}Modifier</button></div><div class="row wrap mt1" style="gap:6px">${(p.access || []).map(a => `<span class="chip line">${esc(lbl(a))}</span>`).join('') || '<span class="muted xs-t">Aucun module</span>'}</div><div class="xs-t muted mt1">${esc(p.email || '')}${p.phone ? ' · ' + esc(p.phone) : ''}</div></div>`).join('')}</div>`;
      body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => staffForm(office().find(p => p.id === b.dataset.edit))));
    }
    el.querySelectorAll('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => { st.tab = b.dataset.tab; APP.refresh(); }));
    el.querySelector('[data-newt]').addEventListener('click', () => truckForm());
    el.querySelector('[data-newd]').addEventListener('click', () => driverForm());
    el.querySelector('[data-newp]').addEventListener('click', () => staffForm());
  }
  APP.register({ id: 'fleet', label: 'Flotte & chauffeurs', icon: 'lift', group: 'Dépannage', order: 2, activity: 'depannage', render, badge: () => CX.S.trucks.filter(t => t.status === 'Entretien').length });
})();
