/* ==========================================================================
   BO · Ma tournée : l'écran du dépanneur sur son téléphone. Il choisit son
   prénom une fois (mémorisé sur l'appareil), voit sa mission en cours et les
   demandes à prendre, et avance d'un gros bouton : En route → Sur place →
   Remorquage → Déposée au parc / Terminée. Appel du client et itinéraire en
   un geste. Même données que le bureau : Joseph voit tout en direct.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const KEY = 'motek-depanneur';
  let who = null; try { who = localStorage.getItem(KEY); } catch (e) {}
  const tel = p => 'tel:' + String(p || '').replace(/\s/g, '');
  const maps = a => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(a);
  const NEXT = { 'Affectée': [['En route', 'Je pars', 'truck']], 'En route': [['Sur place', 'Je suis sur place', 'pin']], 'Sur place': [['Terminée', 'Réparé sur place', 'check'], ['Remorquage', 'Je remorque', 'truck']], 'Remorquage': [['Terminée', 'Livré (garage / domicile)', 'check'], ['parc', 'Déposé au parc', 'box']] };

  function pick(el) {
    el.innerHTML = `<div class="bo-page tour-page"><div class="tp-pick"><h1>Qui êtes-vous ?</h1><p class="muted">Votre prénom est mémorisé sur ce téléphone.</p><div class="tp-people">${CX.S.drivers.map(d => `<button class="tp-person" data-who="${d.id}">${UI.av(d, 56)}<b>${esc(d.first)}</b><small>${esc((DEP.truckOfDriver(d.id) || {}).name || '')}</small></button>`).join('')}</div></div></div>`;
    el.querySelectorAll('[data-who]').forEach(b => b.addEventListener('click', () => { who = b.dataset.who; try { localStorage.setItem(KEY, who); } catch (e) {} APP.refresh(); }));
  }
  function render(el, params) {
    if (params.who) { who = params.who; try { localStorage.setItem(KEY, who); } catch (e) {} APP.setParams({ who: null }); }
    const d = CX.S.drivers.find(x => x.id === who);
    if (!d) return pick(el);
    const S = CX.S, cur = DEP.driverMission(d.id), t = cur && cur.truckId ? DEP.truck(cur.truckId) : DEP.truckOfDriver(d.id);
    const waiting = S.missions.filter(m => m.status === 'Demandée').sort((a, b) => (a.at < b.at ? -1 : 1));
    const done = S.missions.filter(m => m.driverId === d.id && m.doneAt && U.dOf(m.doneAt) === today()).sort((a, b) => (a.doneAt < b.doneAt ? 1 : -1));
    const step = (m) => `<div class="tp-steps">${['Affectée', 'En route', 'Sur place', 'Remorquage', m.gardeId || m.status === 'Déposée au parc' ? 'Déposée au parc' : 'Terminée'].map(s => `<span class="${DEP.STATUSES.indexOf(s) < DEP.STATUSES.indexOf(m.status) ? 'done' : s === m.status ? 'cur' : ''}">${esc(s)}</span>`).join('')}</div>`;
    el.innerHTML = `<div class="bo-page tour-page">
      <div class="tp-head">${UI.av(d, 44)}<div><b>${esc(d.first)}</b><small>${t ? esc(t.name + ' · ' + t.plate) : 'sans camion'} · ${esc(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</small></div><button class="btn sm" data-switch>Changer</button></div>
      ${cur ? `<div class="card tp-cur"><div class="card-b"><div class="row" style="gap:10px;flex-wrap:wrap">${BO.chip(cur.status, DEP.TONE[cur.status], true)}<span class="xs-t muted">${esc(cur.no)} · ${esc(cur.mandant)}${cur.ref ? ' · ' + esc(cur.ref) : ''}</span></div>
          <h2>${esc(cur.kind)}</h2><div class="tp-veh">${UI.carPic(cur.vehicle.hex, 60, 46)}<div>${BO.plate(cur.vehicle.plate, true)}<div class="sm-t mt1">${esc(cur.vehicle.make)} ${esc(cur.vehicle.model)}</div></div></div>
          <a class="tp-addr" href="${maps(cur.address)}" target="_blank" rel="noopener">${BO.icon('pin', 18)}<span>${esc(cur.address)}</span><em>Itinéraire</em></a>
          <div class="tp-dest">${BO.icon('arrowR', 14)} ${esc(cur.destination || 'destination à confirmer')}${cur.notes ? `<div class="tp-note">${BO.icon('alert', 14)} ${esc(cur.notes)}</div>` : ''}</div>
          ${step(cur)}
          <div class="tp-actions">${(NEXT[cur.status] || []).map(([s, l, ic]) => `<button class="btn big ${s === 'Remorquage' || s === 'En route' || s === 'Sur place' ? 'pri' : ''}" data-st="${esc(s)}">${BO.icon(ic, 20)}${esc(l)}</button>`).join('')}</div>
          <div class="tp-contact"><a class="btn big" href="${tel(cur.customer.phone)}">${BO.icon('phone', 18)}Appeler ${esc(cur.customer.name.split(' ')[0])}</a><button class="btn big" data-photo>${BO.icon('camera', 18)}Photo${cur.photos && cur.photos.length ? ' (' + cur.photos.length + ')' : ''}</button><a class="btn big" href="${tel(S.company.phone)}">${BO.icon('users', 18)}Bureau</a></div>
          ${cur.photos && cur.photos.length ? `<div class="ph-grid mt">${cur.photos.map(p => BO.photoSrc(p) ? `<div class="ph real"><img src="${esc(BO.photoSrc(p))}" alt="${esc(p.l || '')}"><span class="lb">${esc(p.l || '')}</span></div>` : '').join('')}</div>` : ''}
          <input type="file" accept="image/*" capture="environment" data-photo-file style="display:none"></div></div>`
        : `<div class="card tp-free"><div class="card-b"><h2>${BO.icon('check', 22)} Libre</h2><p class="muted">Aucune mission en cours. ${waiting.length ? 'Une demande attend : prenez-la ci-dessous ou attendez le bureau.' : 'Le bureau vous enverra la prochaine mission.'}</p></div></div>`}
      ${waiting.length ? `<h2 class="sec mt2">${BO.icon('bell', 16)}Demandes en attente <small>· ${waiting.length}</small></h2><div class="g">${waiting.map(m => `<div class="card"><div class="card-b row" style="gap:12px;align-items:center">${UI.carPic(m.vehicle.hex, 52, 40)}<div style="flex:1;min-width:0"><b>${esc(m.kind)}</b> · ${BO.plate(m.vehicle.plate)}<div class="sm-t muted mt1">${esc(m.address)} · demandée ${esc(U.tOf(m.at))} · ${esc(m.mandant)}</div></div>${cur ? '' : `<button class="btn pri" data-take="${m.id}">Je prends</button>`}</div></div>`).join('')}</div>` : ''}
      ${done.length ? `<h2 class="sec mt2">${BO.icon('check', 16)}Faites aujourd’hui <small>· ${done.length}</small></h2><div class="card"><div>${done.map(m => `<div class="todo"><span class="tic low">${BO.icon('check', 16)}</span><div class="tx"><b>${esc(m.kind)} · ${esc(m.vehicle.plate)}</b><span>${esc(m.address)} · ${esc(m.status)} ${esc(U.tOf(m.doneAt))}</span></div></div>`).join('')}</div></div>` : ''}
      <p class="xs-t muted mt2">Chaque bouton est horodaté et visible au bureau immédiatement. Pas de réseau ? Les actions attendent et se synchronisent dès le retour de la connexion.</p></div>`;
    el.querySelector('[data-switch]').addEventListener('click', () => { who = null; try { localStorage.removeItem(KEY); } catch (e) {} APP.refresh(); });
    el.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { const s = b.dataset.st; if (s === 'parc') { DEP.parcForm(cur); return; } DEP.setMissionStatus(cur.id, s); UI.toast(s, cur.no, 'ok', 'truck'); BO.now(); }));
    el.querySelectorAll('[data-take]').forEach(b => b.addEventListener('click', () => { const m = DEP.mission(b.dataset.take), tr = DEP.truckOfDriver(d.id); if (!tr) { UI.toast('Aucun camion disponible', '', 'warn'); return; } if (DEP.assign(m.id, tr.id, d.id)) { DEP.setMissionStatus(m.id, 'En route'); UI.toast('Mission prise', m.no + ' · ' + tr.name, 'ok', 'truck'); BO.now(); } }));
    const pb = el.querySelector('[data-photo]'), pf = el.querySelector('[data-photo-file]');
    if (pb && pf) { pb.addEventListener('click', () => pf.click()); pf.addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { const up = await BO.uploadPhoto(f); cur.photos = cur.photos || []; cur.photos.push(Object.assign({ id: U.uid('ph'), l: cur.kind + ' · ' + U.hm(U.nowMin()), k: 'avant', at: CX.now(), by: d.id }, up)); cur.history.unshift({ at: CX.now(), text: 'Photo ajoutée par ' + d.first, by: d.id }); CX.touch('mission', { id: cur.id }); UI.toast('Photo ajoutée', cur.vehicle.plate, 'ok', 'camera'); BO.now(); } catch (err) { UI.toast('Photo refusée', err.message, 'warn'); } }); }
  }
  // Sur un téléphone, un dépanneur déjà identifié retombe directement sur sa tournée.
  setTimeout(() => { try { if (who && innerWidth <= 760 && !/#bo\//.test(location.hash)) APP.open('tournee'); } catch (e) {} }, 400);
  APP.register({ id: 'tournee', label: 'Ma tournée', icon: 'phone', group: 'Dépannage', order: 0, activity: 'depannage', render, badge: () => { const d = CX.S.drivers.find(x => x.id === who); return d && DEP.driverMission(d.id) ? 1 : 0; } });
})();
