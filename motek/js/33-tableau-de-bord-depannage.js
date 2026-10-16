/* ==========================================================================
   BO · Tableau de bord dépanneur : la journée (missions, camions, parc,
   à facturer), « Demander à MOTEK » adapté au dépannage, à traiter.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const plateNorm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const activeM = () => CX.S.missions.filter(m => !['Terminée', 'Facturée'].includes(m.status));

  /** Assistant dépannage : questions sur les missions, les camions et le parc ; actions confirmées. */
  function ask(text) {
    const S = CX.S, t = norm(text), out = { text, actions: [], warnings: [], reply: '' };
    if (!t.trim()) { out.warnings.push('Posez une question.'); return out; }
    DEP.refreshGardeStatus();
    const P = t.replace(/[^a-z0-9]/g, '').toUpperCase();
    const g = DEP.inPark().find(x => P.includes(plateNorm(x.vehicle.plate))), m = S.missions.find(x => P.includes(plateNorm(x.vehicle.plate)));
    if (/ou (est|se trouve)|localise|place/.test(t) && (g || m)) {
      if (g) { out.reply = `${g.vehicle.make} ${g.vehicle.model} (${g.vehicle.plate}) : parc ${g.level}, place ${g.slot.split('-')[1]}, en garde depuis ${DEP.gardeDays(g)} j (${chf(DEP.gardeFees(g))} de frais).`; out.actions.push({ label: 'Ouvrir la garde ' + g.no, run: () => APP.open('parc', { id: g.id }) }); return out; }
      const tr = m.truckId ? DEP.truck(m.truckId) : null; out.reply = `${m.vehicle.make} ${m.vehicle.model} (${m.vehicle.plate}) : mission ${m.no}, ${m.status.toLowerCase()}${tr ? ', ' + tr.name + ' · ' + ((DEP.driver(m.driverId) || {}).first || '') : ''} · ${m.address}.`; out.actions.push({ label: 'Ouvrir la mission ' + m.no, run: () => APP.open('missions', { id: m.id }) }); return out;
    }
    if (/camion.*(dispo|libre)|combien.*camion/.test(t)) { const f = S.trucks.filter(x => x.status === 'Disponible'); out.reply = f.length + ' camion' + (f.length > 1 ? 's' : '') + ' disponible' + (f.length > 1 ? 's' : '') + (f.length ? ' : ' + f.map(x => x.name).join(', ') : '') + ' · ' + S.trucks.filter(x => x.status === 'En mission').length + ' en mission.'; return out; }
    if (/mission.*(jour|aujourd|cours)|combien.*mission|en attente/.test(t)) { const a = activeM(), d = a.filter(x => x.status === 'Demandée'); out.reply = `${a.length} missions en cours, dont ${d.length} sans camion` + (d.length ? ' : ' + d.map(x => x.no + ' ' + x.kind + ' · ' + x.address).join(' ; ') : '') + '.'; if (d.length) out.actions.push({ label: 'Affecter ' + d[0].no, run: () => APP.open('missions', { id: d[0].id }) }); return out; }
    if (/parc|garde|place.*libre|combien.*(vehicule|voiture)/.test(t)) { const all = DEP.inPark(), cap = S.parc.levels.reduce((a, l) => a + l.slots, 0); out.reply = `${all.length} véhicules au parc sur ${cap} places (${S.parc.levels.map(l => l.name + ' : ' + all.filter(x => x.level === l.id).length + '/' + l.slots).join(', ')}) · ${all.filter(x => x.status !== 'En garde').length} à relancer ou abandonnés.`; return out; }
    if (/factur/.test(t)) { const f = S.missions.filter(x => ['Déposée au parc', 'Terminée'].includes(x.status)); out.reply = f.length + ' mission' + (f.length > 1 ? 's' : '') + ' à facturer : ' + chf(f.reduce((a, x) => a + x.price, 0)) + ' HT.'; if (f.length) out.actions.push({ label: 'Voir les missions à facturer', run: () => APP.open('missions') }); return out; }
    if (/relance|abandon/.test(t)) { const r = DEP.inPark().filter(x => x.status !== 'En garde'); out.reply = r.length + ' véhicule' + (r.length > 1 ? 's' : '') + ' à relancer ou en abandon présumé.'; if (r.length) out.actions.push({ label: 'Ouvrir le parc', run: () => APP.open('parc') }); return out; }
    if (m && /(termin|fini|sur place|arriv|remorqu|parti)/.test(t)) { const next = /sur place|arriv/.test(t) ? 'Sur place' : /remorqu/.test(t) ? 'Remorquage' : /parti|route/.test(t) ? 'En route' : 'Terminée'; out.actions.push({ label: `Passer ${m.no} en « ${next} »`, run: () => DEP.setMissionStatus(m.id, next) }); out.reply = out.actions[0].label; return out; }
    out.warnings.push('Non compris. Exemples : « où est la Clio AB-123-CD ? », « camions disponibles », « missions en attente », « véhicules au parc », « à facturer », « la AB-123-CD est sur place ».');
    return out;
  }
  function widget(host) {
    const ex = ['Missions en attente', 'Camions disponibles', 'Véhicules au parc', 'À facturer'];
    host.innerHTML = `<div class="vw"><div class="row" style="gap:8px;align-items:stretch"><input class="inp" data-vq placeholder="Demandez : « où est la AB-123-CD ? », « camions disponibles », « à relancer »…">${BO.micBtn('data-vmic', 'Parler')}<button class="btn pri" data-vgo>${BO.icon('arrowR', 15)}</button></div><div class="row mt1" style="gap:6px;flex-wrap:wrap">${ex.map(x => `<button class="btn sm" data-vex="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="mt1" data-vout></div></div>`;
    const inp = host.querySelector('[data-vq]'), out = host.querySelector('[data-vout]');
    const run = () => { if (!inp.value.trim()) return; const p = ask(inp.value); out.innerHTML = `<div class="form-note ${p.actions.length || p.reply ? 'ok' : 'warn'}">${BO.icon(p.actions.length ? 'check' : 'msg', 16)}<div><b>${esc(p.reply || p.warnings[0] || '')}</b>${p.actions.length ? `<div class="row mt1" style="gap:6px;flex-wrap:wrap">${p.actions.map((a, i) => `<button class="btn sm pri" data-vact="${i}">${esc(a.label)}</button>`).join('')}<button class="btn sm" data-vcancel>Annuler</button></div>` : ''}</div></div>`; out.querySelectorAll('[data-vact]').forEach(b => b.addEventListener('click', () => { p.actions[+b.dataset.vact].run(); out.innerHTML = ''; inp.value = ''; BO.now(); })); const c = out.querySelector('[data-vcancel]'); if (c) c.addEventListener('click', () => { out.innerHTML = ''; }); };
    host.querySelector('[data-vgo]').addEventListener('click', run);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    host.querySelectorAll('[data-vex]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.vex; run(); }));
    host.querySelector('[data-vmic]').addEventListener('click', () => BO.dictate(inp, host.querySelector('[data-vmic]'), () => run()));
  }
  window.DEP = window.DEP || {}; DEP.ask = ask; DEP.widget = widget;

  function render(el) {
    DEP.refreshGardeStatus();
    const S = CX.S, me = CX.emp(S.meId) || { first: '' }, h = U.nowMin() < 12 * 60 ? 'Bonjour' : 'Bon après-midi';
    const act = activeM(), waiting = act.filter(m => m.status === 'Demandée'), onRoad = act.filter(m => ['En route', 'Sur place', 'Remorquage'].includes(m.status));
    const trucksFree = S.trucks.filter(t => t.status === 'Disponible'), parked = DEP.inPark(), cap = S.parc.levels.reduce((a, l) => a + l.slots, 0);
    const toBill = S.missions.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status)), toRemind = parked.filter(g => g.status !== 'En garde');
    const todayDone = S.missions.filter(m => m.doneAt && U.dOf(m.doneAt) === today()).length;
    const todo = [
      ...waiting.map(m => ({ lvl: 'high', ic: 'alert', t: 'Mission sans camion · ' + m.no, s: m.kind + ' · ' + m.address + ' · demandée ' + U.tOf(m.at), go: () => APP.open('missions', { id: m.id }), act: 'Affecter' })),
      ...toBill.slice(0, 5).map(m => ({ lvl: 'mid', ic: 'invoice', t: 'À facturer · ' + m.no + ' (' + m.mandant + ')', s: m.vehicle.make + ' ' + m.vehicle.model + ' · ' + chf(m.price) + ' HT', go: () => APP.open('missions', { id: m.id }), act: 'Facturer' })),
      ...parked.filter(g => g.status === 'Abandon présumé').slice(0, 4).map(g => ({ lvl: 'high', ic: 'box', t: 'Abandon présumé · ' + g.vehicle.plate, s: g.mandant + ' · ' + DEP.gardeDays(g) + ' j · ' + chf(DEP.gardeFees(g)) + ' de frais', go: () => APP.open('parc', { id: g.id }), act: 'Traiter' })),
      ...parked.filter(g => g.status === 'Relance à faire').slice(0, 4).map(g => ({ lvl: 'mid', ic: 'send', t: 'Relancer ' + g.mandant + ' · ' + g.vehicle.plate, s: DEP.gardeDays(g) + ' j de garde · ' + g.reason, go: () => APP.open('parc', { id: g.id }), act: 'Relancer' })),
      ...parked.filter(g => g.step === 'Non traité').slice(0, 4).map(g => ({ lvl: 'high', ic: 'layers', t: 'Véhicule arrivé non traité · ' + g.vehicle.plate, s: g.vehicle.make + ' ' + g.vehicle.model + ' · ' + g.mandant + ' · ' + g.reason, go: () => APP.open('parc', { id: g.id }), act: 'Traiter' })),
      ...(S.supplyOrders || []).filter(o => o.status === 'À commander').slice(0, 3).map(o => ({ lvl: 'mid', ic: 'box', t: 'Commande à envoyer · ' + o.item, s: (o.plate ? o.plate + ' · ' : '') + 'bon de commande prêt', go: () => APP.open('supply', { id: o.id }), act: 'Commander' })),
      ...(S.insMail || []).filter(x => !x.handledAt).slice(0, 3).map(x => ({ lvl: 'mid', ic: 'mail', t: 'Courriel assureur · ' + x.subject, s: x.from + ' · ' + (x.summary || ''), go: () => APP.open('agent', { tab: 'mail' }), act: 'Lire' })),
      ...S.trucks.filter(t => t.status === 'Entretien').map(t => ({ lvl: 'low', ic: 'truck', t: t.name + ' en entretien', s: t.notes || '', go: () => APP.open('fleet'), act: 'Voir' })),
    ];
    el.innerHTML = `<div class="bo-page">${BO.head(`${h} ${esc(me.first)}`, `${esc(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} · ${act.length} missions en cours · ${parked.length} véhicules au parc`, `<button class="btn pri" data-open="missions::new">${BO.icon('plus', 15)}Nouvelle mission</button><button class="btn" data-open="parc">${BO.icon('layers', 15)}Parc</button>`)}
      <div class="kpis today">
        ${BO.kpi({ lb: 'Missions en attente', v: waiting.length, s: waiting.length ? 'sans camion affecté' : 'toutes affectées', icon: 'alert', cls: 'click ' + (waiting.length ? 'warn' : ''), go: 'missions' })}
        ${BO.kpi({ lb: 'Camions sur la route', v: onRoad.length, s: `${act.filter(m => m.status === 'Remorquage').length} remorquage${act.filter(m => m.status === 'Remorquage').length > 1 ? 's' : ''} en cours`, icon: 'truck', cls: 'click', go: 'missions' })}
        ${BO.kpi({ lb: 'Camions disponibles', v: `${trucksFree.length}<small>/${S.trucks.length}</small>`, s: S.trucks.filter(t => t.status === 'Entretien').length + ' en entretien', icon: 'lift', cls: 'click ' + (trucksFree.length === 0 ? 'warn' : ''), go: 'fleet' })}
        ${BO.kpi({ lb: 'Véhicules au parc', v: `${parked.length}<small>/${cap}</small>`, s: (cap - parked.length) + ' places libres', icon: 'layers', cls: 'click', go: 'parc' })}
        ${BO.kpi({ lb: 'Terminées aujourd’hui', v: todayDone, s: toBill.length + ' à facturer · ' + chf(toBill.reduce((a, m) => a + m.price, 0)) + ' HT', icon: 'check', cls: 'click', go: 'missions' })}
        ${BO.kpi({ lb: 'Gardes à relancer', v: toRemind.length, s: parked.filter(g => g.status === 'Abandon présumé').length + ' abandon' + (parked.filter(g => g.status === 'Abandon présumé').length > 1 ? 's' : '') + ' présumé' + (parked.filter(g => g.status === 'Abandon présumé').length > 1 ? 's' : ''), icon: 'send', cls: 'click ' + (toRemind.length ? 'warn' : ''), go: 'parc' })}
      </div>
      <div class="card mb"><div class="card-h"><h3>${BO.icon('phone', 16)}Demander à MOTEK <small>· où est un véhicule, camions disponibles, missions en attente, à facturer…</small></h3></div><div class="card-b" data-voice></div></div>
      <div class="g g-main">
        <div class="card"><div class="card-h"><h3>${BO.icon('alert', 16)}À traiter maintenant <small>· ${todo.length}</small></h3></div><div>${todo.length ? todo.map((a, i) => `<div class="todo"><span class="tic ${a.lvl}">${BO.icon(a.ic, 16)}</span><div class="tx"><b>${esc(a.t)}</b><span>${esc(a.s)}</span></div><div class="ta"><button class="btn sm ${a.lvl === 'high' ? 'pri' : ''}" data-todo="${i}">${esc(a.act)}</button></div></div>`).join('') : BO.empty('check', 'Rien à traiter', '', '', true)}</div></div>
        <div class="g" style="align-content:start">
          <div class="card"><div class="card-h"><h3>${BO.icon('truck', 16)}Camions</h3><a class="lnk sm-t" data-open="fleet">Flotte →</a></div><div class="card-b"><div class="postes" style="grid-template-columns:repeat(2,minmax(0,1fr))">${S.trucks.map(t => { const m = S.missions.find(x => x.truckId === t.id && !['Terminée', 'Facturée'].includes(x.status)), d = t.driverId ? DEP.driver(t.driverId) : null; return `<div class="poste ${t.status !== 'Disponible' ? 'busy' : ''}" ${m ? `data-open="missions:${m.id}"` : ''}><div class="pn"><i style="${t.status === 'Entretien' ? 'background:#b42318' : ''}"></i>${esc(t.name)}</div><div class="pv">${m ? esc(m.vehicle.plate) : esc(t.status)}</div><div class="ps">${m ? esc(m.status) + ' · ' : ''}${d ? esc(d.first) : '—'}</div></div>`; }).join('')}</div></div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('layers', 16)}Parc</h3><a class="lnk sm-t" data-open="parc">Plan →</a></div><div class="card-b"><div class="mini-list">${S.parc.levels.map(l => { const n = parked.filter(g => g.level === l.id).length; return `<div class="cl" data-open="parc"><b class="sm-t" style="width:90px">${esc(l.name)}</b>${BO.pbar(n / l.slots, n / l.slots > .9 ? '' : 'g', 120)}<span class="sm-t" style="margin-left:auto"><b>${n}</b> / ${l.slots}</span></div>`; }).join('')}</div></div></div>
        </div>
      </div></div>`;
    widget(el.querySelector('[data-voice]'));
    el.querySelectorAll('[data-todo]').forEach(b => b.addEventListener('click', () => todo[+b.dataset.todo].go()));
  }
  APP.register({ id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard', group: 'Pilotage', order: 1, activity: 'depannage', render, badge: () => CX.S.missions.filter(m => m.status === 'Demandée').length });
})();
