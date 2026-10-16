/* ==========================================================================
   BO · Tableau de bord de Joseph : quatre chiffres, les quatre dépanneurs et
   ce qu'ils font maintenant, ce qu'il y a à traiter, le parc, et
   « Demander à MOTEK ». Pensé pour l'iPad : grandes cibles, peu de texte,
   chaque chiffre ouvre sa liste.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const plateNorm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const activeM = () => CX.S.missions.filter(m => !['Terminée', 'Facturée'].includes(m.status));
  const tel = p => 'tel:' + String(p || '').replace(/\s/g, '');

  /** Assistant : questions sur les missions, les dépanneurs, les camions et le parc ; actions confirmées. */
  function ask(text) {
    const S = CX.S, t = norm(text), out = { text, actions: [], warnings: [], reply: '' };
    if (!t.trim()) { out.warnings.push('Posez une question.'); return out; }
    DEP.refreshGardeStatus();
    const P = t.replace(/[^a-z0-9]/g, '').toUpperCase();
    const g = DEP.inPark().find(x => P.includes(plateNorm(x.vehicle.plate))), m = S.missions.find(x => P.includes(plateNorm(x.vehicle.plate)));
    const drv = S.drivers.find(d => t.includes(norm(d.first)));
    if (drv && !g && !m) { const cur = DEP.driverMission(drv.id), tr = cur ? DEP.truck(cur.truckId) : DEP.truckOfDriver(drv.id); out.reply = cur ? `${drv.first} est ${cur.status.toLowerCase()} · ${cur.no} · ${cur.kind} · ${cur.address}${tr ? ' · ' + tr.name : ''}.` : `${drv.first} est libre${tr ? ' (' + tr.name + ')' : ''}.`; if (cur) out.actions.push({ label: 'Ouvrir ' + cur.no, run: () => APP.open('missions', { id: cur.id }) }); else { const w = S.missions.find(x => x.status === 'Demandée'); if (w) out.actions.push({ label: 'Envoyer ' + drv.first + ' sur ' + w.no, run: () => { const tr2 = DEP.truckOfDriver(drv.id); if (tr2 && DEP.assign(w.id, tr2.id, drv.id)) DEP.setMissionStatus(w.id, 'En route'); } }); } return out; }
    if (/ou (est|se trouve)|localise|place/.test(t) && (g || m)) {
      if (g) { out.reply = `${g.vehicle.make} ${g.vehicle.model} (${g.vehicle.plate}) : parc ${g.level}, place ${g.slot.split('-')[1]}, en garde depuis ${DEP.gardeDays(g)} j (${chf(DEP.gardeFees(g))} de frais).`; out.actions.push({ label: 'Ouvrir la garde ' + g.no, run: () => APP.open('parc', { id: g.id }) }); return out; }
      const tr = m.truckId ? DEP.truck(m.truckId) : null, d = m.driverId ? DEP.driver(m.driverId) : null; out.reply = `${m.vehicle.make} ${m.vehicle.model} (${m.vehicle.plate}) : mission ${m.no}, ${m.status.toLowerCase()}${d ? ', ' + d.first + (tr ? ' · ' + tr.name : '') : ''} · ${m.address}.`; out.actions.push({ label: 'Ouvrir la mission ' + m.no, run: () => APP.open('missions', { id: m.id }) }); return out;
    }
    if (/qui.*(libre|dispo)|depanneur.*(libre|dispo)|(libre|dispo).*depanneur|chauffeur/.test(t)) { const f = DEP.freeDrivers(); out.reply = f.length ? f.map(d => d.first).join(', ') + (f.length > 1 ? ' sont libres' : ' est libre') + '.' : 'Personne n’est libre : ' + S.drivers.map(d => d.first + ' · ' + (DEP.driverMission(d.id) || {}).status.toLowerCase()).join(', ') + '.'; return out; }
    if (/camion.*(dispo|libre)|combien.*camion/.test(t)) { const f = S.trucks.filter(x => x.status === 'Disponible'); out.reply = f.length + ' camion' + (f.length > 1 ? 's' : '') + ' disponible' + (f.length > 1 ? 's' : '') + (f.length ? ' : ' + f.map(x => x.name).join(', ') : '') + ' · ' + S.trucks.filter(x => x.status === 'En mission').length + ' en mission.'; return out; }
    if (/mission.*(jour|aujourd|cours)|combien.*mission|en attente/.test(t)) { const a = activeM(), d = a.filter(x => x.status === 'Demandée'); out.reply = `${a.length} missions en cours, dont ${d.length} sans dépanneur` + (d.length ? ' : ' + d.map(x => x.no + ' ' + x.kind + ' · ' + x.address).join(' ; ') : '') + '.'; if (d.length) out.actions.push({ label: 'Envoyer quelqu’un sur ' + d[0].no, run: () => APP.open('missions', { id: d[0].id }) }); return out; }
    if (/parc|garde|place.*libre|combien.*(vehicule|voiture)/.test(t)) { const all = DEP.inPark(), cap = S.parc.levels.reduce((a, l) => a + l.slots, 0); out.reply = `${all.length} véhicules au parc sur ${cap} places (${S.parc.levels.map(l => l.name + ' : ' + all.filter(x => x.level === l.id).length + '/' + l.slots).join(', ')}) · ${all.filter(x => x.status !== 'En garde').length} à relancer ou abandonnés.`; return out; }
    if (/factur|encaiss|argent|impay/.test(t)) { const f = S.missions.filter(x => ['Déposée au parc', 'Terminée'].includes(x.status)), inv = (DEP.invoices ? DEP.invoices() : []).filter(i => i.status !== 'Payée'); out.reply = f.length + ' mission' + (f.length > 1 ? 's' : '') + ' à facturer (' + chf(f.reduce((a, x) => a + x.price, 0)) + ' HT) · ' + inv.length + ' facture' + (inv.length > 1 ? 's' : '') + ' à encaisser (' + chf(inv.reduce((a, i) => a + i.ttc - (i.paid || 0), 0)) + ' TTC).'; out.actions.push({ label: 'Ouvrir la facturation', run: () => APP.open('invoices') }); return out; }
    if (/relance|abandon/.test(t)) { const r = DEP.inPark().filter(x => x.status !== 'En garde'); out.reply = r.length + ' véhicule' + (r.length > 1 ? 's' : '') + ' à relancer ou en abandon présumé.'; if (r.length) out.actions.push({ label: 'Ouvrir le parc', run: () => APP.open('parc') }); return out; }
    if (m && /(termin|fini|sur place|arriv|remorqu|parti)/.test(t)) { const next = /sur place|arriv/.test(t) ? 'Sur place' : /remorqu/.test(t) ? 'Remorquage' : /parti|route/.test(t) ? 'En route' : 'Terminée'; out.actions.push({ label: `Passer ${m.no} en « ${next} »`, run: () => DEP.setMissionStatus(m.id, next) }); out.reply = out.actions[0].label; return out; }
    out.warnings.push('Non compris. Exemples : « où est la AB-123-CD ? », « qui est libre ? », « où est Damien ? », « missions en attente », « à facturer ».');
    return out;
  }
  function widget(host) {
    const ex = ['Qui est libre ?', 'Missions en attente', 'Véhicules au parc', 'À facturer'];
    host.innerHTML = `<div class="vw"><div class="row" style="gap:8px;align-items:stretch"><input class="inp" data-vq placeholder="« où est la AB-123-CD ? », « qui est libre ? », « où est Damien ? »…">${BO.micBtn('data-vmic', 'Parler')}<button class="btn pri" data-vgo aria-label="Demander">${BO.icon('arrowR', 15)}</button></div><div class="row mt1" style="gap:6px;flex-wrap:wrap">${ex.map(x => `<button class="btn sm" data-vex="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="mt1" data-vout></div></div>`;
    const inp = host.querySelector('[data-vq]'), out = host.querySelector('[data-vout]');
    const run = () => { if (!inp.value.trim()) return; const p = ask(inp.value); out.innerHTML = `<div class="form-note ${p.actions.length || p.reply ? 'ok' : 'warn'}">${BO.icon(p.actions.length ? 'check' : 'msg', 16)}<div><b>${esc(p.reply || p.warnings[0] || '')}</b>${p.actions.length ? `<div class="row mt1" style="gap:6px;flex-wrap:wrap">${p.actions.map((a, i) => `<button class="btn sm pri" data-vact="${i}">${esc(a.label)}</button>`).join('')}<button class="btn sm" data-vcancel>Annuler</button></div>` : ''}</div></div>`; out.querySelectorAll('[data-vact]').forEach(b => b.addEventListener('click', () => { p.actions[+b.dataset.vact].run(); out.innerHTML = ''; inp.value = ''; BO.now(); })); const c = out.querySelector('[data-vcancel]'); if (c) c.addEventListener('click', () => { out.innerHTML = ''; }); };
    host.querySelector('[data-vgo]').addEventListener('click', run);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    host.querySelectorAll('[data-vex]').forEach(b => b.addEventListener('click', () => { inp.value = b.dataset.vex; run(); }));
    host.querySelector('[data-vmic]').addEventListener('click', () => BO.dictate(inp, host.querySelector('[data-vmic]'), () => run()));
  }
  window.DEP = window.DEP || {}; DEP.ask = ask; DEP.widget = widget;

  /** Liste « à traiter » : priorités du dépanneur, chaque ligne ouvre l'écran concerné. */
  function todoList() {
    const S = CX.S, parked = DEP.inPark(), act = activeM();
    const inv = DEP.invoices ? DEP.invoices() : [], late = inv.filter(i => i.status !== 'Payée' && i.due < today());
    const waiting = act.filter(m => m.status === 'Demandée'), toBill = S.missions.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status));
    const out = [
      ...waiting.map(m => ({ lvl: 'high', ic: 'alert', t: 'Mission sans dépanneur · ' + m.no, s: m.kind + ' · ' + m.address + ' · demandée ' + U.tOf(m.at), go: () => APP.open('missions', { id: m.id }), act: 'Envoyer' })),
      ...parked.filter(g => g.step === 'Non traité').slice(0, 3).map(g => ({ lvl: 'high', ic: 'layers', t: 'Arrivé au parc, dossier à ouvrir · ' + g.vehicle.plate, s: g.vehicle.make + ' ' + g.vehicle.model + ' · ' + g.mandant + ' · ' + g.reason, go: () => APP.open('parc', { id: g.id }), act: 'Traiter' })),
      ...(S.insMail || []).filter(x => !x.handledAt).slice(0, 3).map(x => ({ lvl: 'mid', ic: 'mail', t: 'Courriel assureur · ' + x.subject, s: (x.summary || x.from), go: () => APP.open('mandats', { tab: 'mail' }), act: 'Lire' })),
      ...(toBill.length ? [{ lvl: 'mid', ic: 'invoice', t: toBill.length + ' mission' + (toBill.length > 1 ? 's' : '') + ' à facturer · ' + chf(toBill.reduce((a, m) => a + m.price, 0)) + ' HT', s: toBill.map(m => m.no + ' ' + m.mandant).join(' · '), go: () => APP.open('invoices'), act: 'Facturer' }] : []),
      ...(late.length ? [{ lvl: 'mid', ic: 'coins', t: late.length + ' facture' + (late.length > 1 ? 's' : '') + ' en retard · ' + chf(late.reduce((a, i) => a + i.ttc - (i.paid || 0), 0)) + ' TTC', s: late.map(i => i.payer + ' ' + i.no).join(' · '), go: () => APP.open('invoices'), act: 'Relancer' }] : []),
      ...(() => { const ab = parked.filter(g => g.status === 'Abandon présumé'), rel = parked.filter(g => g.status === 'Relance à faire'); const o = []; if (ab.length) o.push({ lvl: 'mid', ic: 'box', t: ab.length + ' abandon' + (ab.length > 1 ? 's' : '') + ' présumé' + (ab.length > 1 ? 's' : '') + ' au parc (plus de 60 j)', s: chf(ab.reduce((a, g) => a + DEP.gardeFees(g), 0)) + ' de frais · ' + ab.map(g => g.vehicle.plate).slice(0, 4).join(', ') + (ab.length > 4 ? '…' : ''), go: () => APP.open('parc'), act: 'Traiter' }); if (rel.length) o.push({ lvl: 'low', ic: 'send', t: rel.length + ' garde' + (rel.length > 1 ? 's' : '') + ' à relancer (plus de 30 j)', s: Object.entries(rel.reduce((a, g) => { a[g.mandant] = (a[g.mandant] || 0) + 1; return a; }, {})).map(([k, n]) => k + ' ' + n).join(' · '), go: () => APP.open('parc'), act: 'Relancer' }); return o; })(),
      ...(S.supplyOrders || []).filter(o => o.status === 'À commander').slice(0, 2).map(o => ({ lvl: 'low', ic: 'box', t: 'Commande à envoyer · ' + o.item, s: (o.plate ? o.plate + ' · ' : '') + 'bon de commande prêt', go: () => APP.open('supply', { id: o.id }), act: 'Commander' })),
      ...S.trucks.filter(t => t.status === 'Entretien').map(t => ({ lvl: 'low', ic: 'wrench', t: t.name + ' en entretien', s: t.notes || '', go: () => APP.open('fleet'), act: 'Voir' })),
      ...S.trucks.filter(t => t.ct && U.diffDays(today(), t.ct) < 30 && t.status !== 'Entretien').map(t => ({ lvl: 'low', ic: 'shieldok', t: 'Contrôle technique · ' + t.name, s: U.diffDays(today(), t.ct) < 0 ? 'dépassé' : 'dans ' + U.diffDays(today(), t.ct) + ' jours', go: () => APP.open('fleet'), act: 'Voir' })),
    ];
    return out;
  }

  function render(el) {
    DEP.refreshGardeStatus(); if (DEP.refreshTruckStatus) DEP.refreshTruckStatus();
    const S = CX.S, me = CX.emp(S.meId) || { first: '' }, h = U.nowMin() < 12 * 60 ? 'Bonjour' : U.nowMin() < 18 * 60 ? 'Bon après-midi' : 'Bonsoir';
    const act = activeM(), waiting = act.filter(m => m.status === 'Demandée'), free = DEP.freeDrivers();
    const parked = DEP.inPark(), cap = S.parc.levels.reduce((a, l) => a + l.slots, 0), toRemind = parked.filter(g => g.status !== 'En garde');
    const inv = DEP.invoices ? DEP.invoices() : [], open = inv.filter(i => i.status !== 'Payée'), late = open.filter(i => i.due < today());
    const toBill = S.missions.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status));
    const todayDone = S.missions.filter(m => m.doneAt && U.dOf(m.doneAt) === today()).length;
    const todo = todoList();
    const drv = d => { const m = DEP.driverMission(d.id), t = m && m.truckId ? DEP.truck(m.truckId) : DEP.truckOfDriver(d.id); const since = m ? (m.history || []).find(x => x.text === 'Statut : ' + m.status) : null; return `<div class="drv ${m ? 'busy' : 'free'}" ${m ? `data-open="missions:${m.id}"` : `data-open="missions"`}><div class="drv-h">${UI.av(d, 46)}<div><b>${esc(d.first)}</b><small>${t ? esc(t.name) + ' · ' + esc(t.kind) : 'sans camion'}</small></div><a class="drv-call" href="${tel(d.phone)}" title="Appeler ${esc(d.first)}" onclick="event.stopPropagation()">${BO.icon('phone', 16)}</a></div>${m ? `<div class="drv-m">${BO.chip(m.status, DEP.TONE[m.status], true)}<span class="drv-since">${since ? 'depuis ' + esc(U.tOf(since.at)) : ''}</span></div><div class="drv-k">${esc(m.kind)} · ${BO.plate(m.vehicle.plate)}</div><div class="drv-a">${BO.icon('pin', 12)} ${esc(m.address)}</div>` : `<div class="drv-m">${BO.chip('Libre', 'green', true)}</div><div class="drv-k muted">${waiting.length ? 'Une demande attend : envoyer ' + esc(d.first) : 'Disponible pour la prochaine demande'}</div>`}</div>`; };
    el.innerHTML = `<div class="bo-page dash">${BO.head(`${h} ${esc(me.first)}`, `${esc(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))} · ${todayDone} mission${todayDone > 1 ? 's' : ''} faite${todayDone > 1 ? 's' : ''} aujourd’hui · ${parked.length} véhicules au parc`, `<button class="btn pri big" data-open="missions::new">${BO.icon('plus', 16)}Nouvelle mission</button>`)}
      <div class="kpis k4 hero4">
        ${BO.kpi({ lb: 'Missions en cours', v: act.length, s: waiting.length ? `<b class="warn-t">${waiting.length} sans dépanneur</b>` : 'toutes affectées', icon: 'truck', cls: waiting.length ? 'warn' : '', go: 'missions' })}
        ${BO.kpi({ lb: 'Dépanneurs libres', v: `${free.length}<small>/${S.drivers.length}</small>`, s: free.length ? esc(free.map(d => d.first).join(', ')) : 'tous en mission', icon: 'users', cls: free.length === 0 && waiting.length ? 'warn' : '', go: 'fleet:chauffeurs' })}
        ${BO.kpi({ lb: 'Véhicules au parc', v: `${parked.length}<small>/${cap}</small>`, s: toRemind.length ? `<b class="warn-t">${toRemind.length} à relancer</b> · ${cap - parked.length} places libres` : (cap - parked.length) + ' places libres', icon: 'layers', go: 'parc' })}
        ${BO.kpi({ lb: 'À encaisser', v: chf(open.reduce((a, i) => a + i.ttc - (i.paid || 0), 0)), s: (late.length ? `<b class="bad-t">${late.length} en retard</b> · ` : '') + toBill.length + ' à facturer', icon: 'coins', cls: late.length ? 'warn' : '', go: 'invoices' })}
      </div>
      <h2 class="sec">${BO.icon('users', 16)}Mes dépanneurs <small>· en ce moment</small><span class="r"><a class="lnk sm-t" data-open="fleet:chauffeurs">Équipe →</a></span></h2>
      <div class="drivers">${S.drivers.map(drv).join('')}</div>
      <div class="g g-main dash-main">
        <div class="card"><div class="card-h"><h3>${BO.icon('alert', 16)}À traiter <small>· ${todo.length}</small></h3></div><div>${todo.length ? todo.slice(0, 8).map((a, i) => `<div class="todo"><span class="tic ${a.lvl}">${BO.icon(a.ic, 16)}</span><div class="tx"><b>${esc(a.t)}</b><span>${esc(a.s)}</span></div><div class="ta"><button class="btn sm ${a.lvl === 'high' ? 'pri' : ''}" data-todo="${i}">${esc(a.act)}</button></div></div>`).join('') + (todo.length > 8 ? `<div class="todo muted xs-t" style="justify-content:center">+ ${todo.length - 8} autres · voir Agent IA</div>` : '') : BO.empty('check', 'Rien à traiter', 'Tout est à jour.', '', true)}</div></div>
        <div class="g" style="align-content:start">
          <div class="card"><div class="card-h"><h3>${BO.icon('phone', 16)}Demander à MOTEK</h3></div><div class="card-b" data-voice></div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('layers', 16)}Parc</h3><a class="lnk sm-t" data-open="parc">Plan →</a></div><div class="card-b"><div class="mini-list">${S.parc.levels.map(l => { const n = parked.filter(g => g.level === l.id).length, r = parked.filter(g => g.level === l.id && g.status !== 'En garde').length; return `<div class="cl" data-open="parc"><b class="sm-t" style="width:84px">${esc(l.name)}</b>${BO.pbar(n / l.slots, n / l.slots > .9 ? '' : 'g', 110)}<span class="sm-t" style="margin-left:auto"><b>${n}</b> / ${l.slots}${r ? ` <span class="warn-t xs-t">· ${r} à relancer</span>` : ''}</span></div>`; }).join('')}</div></div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('truck', 16)}Camions</h3><a class="lnk sm-t" data-open="fleet">Flotte →</a></div><div class="card-b"><div class="trucks-mini">${S.trucks.map(t => { const m = S.missions.find(x => x.truckId === t.id && DEP.BUSY.includes(x.status)), d = m ? DEP.driver(m.driverId) : null; return `<span class="tm ${t.status === 'Entretien' ? 'ko' : m ? 'busy' : 'ok'}" title="${esc(t.name + ' · ' + t.status + (d ? ' · ' + d.first : ''))}" ${m ? `data-open="missions:${m.id}"` : 'data-open="fleet"'}>${UI.truckIcon(t.kind, 22, 'currentColor')}<small>${esc(t.name.replace(/^(Camion|Panier) /, ''))}</small></span>`; }).join('')}</div><div class="xs-t muted mt1">${S.trucks.filter(t => t.status === 'Disponible').length} disponibles · ${S.trucks.filter(t => t.status === 'En mission').length} en mission · ${S.trucks.filter(t => t.status === 'Entretien').length} en entretien</div></div></div>
        </div>
      </div></div>`;
    widget(el.querySelector('[data-voice]'));
    el.querySelectorAll('[data-todo]').forEach(b => b.addEventListener('click', () => todo[+b.dataset.todo].go()));
  }
  APP.register({ id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard', group: 'Pilotage', order: 1, activity: 'depannage', render, badge: () => CX.S.missions.filter(m => m.status === 'Demandée').length });
})();
