/* ==========================================================================
   BO · Tableau de bord atelier
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chfK, today } = U;
  const AIC = { ready: 'car', expertise: 'shield', accord: 'shield', parts: 'truck', late: 'clock', qc: 'check', invoice: 'invoice', stock: 'box', loan: 'key', complaint: 'alert' };
  const ACT = { notify: ['msg', 'Prévenir'], expertise: ['cal', 'Planifier'], relance: ['send', 'Relancer'], order: ['phone', 'Relancer fournisseur'], qc: ['check', 'Contrôler'], remind: ['send', 'Relancer'], reorder: ['box', 'Commander'] };
  let filt = 'all';

  function runAction(a) {
    const t = a.target;
    if (a.action === 'notify') BO.notifyReady(t.id);
    else if (a.action === 'expertise') BO.claimPlan ? BO.claimPlan(t.id) : APP.open('claims', { id: t.id });
    else if (a.action === 'relance') BO.quoteRemind ? BO.quoteRemind(t.id) : APP.open('quotes', { id: t.id });
    else if (a.action === 'order') BO.orderChase ? BO.orderChase(t.id) : APP.open('parts', { tab: 'commandes', id: t.id });
    else if (a.action === 'qc') APP.open('quality', { id: t.id });
    else if (a.action === 'remind') BO.invoiceRemind ? BO.invoiceRemind(t.id) : APP.open('invoices', { id: t.id });
    else if (a.action === 'reorder') BO.reorder ? BO.reorder(t.id) : APP.open('parts', { tab: 'stock' });
    else APP.focus(t, { bo: true });
  }

  function render(el) {
    const S = CX.S, k = CX.kpis(), al = CX.alerts(), me = CX.emp(S.meId), co = S.company;
    const h = U.nowMin() < 12 * 60 ? 'Bonjour' : 'Bon après-midi';
    const target = 180000, monthDays = 22, wdDone = Math.max(1, Array.from({ length: 31 }, (_, i) => U.addDays(today().slice(0, 8) + '01', i)).filter(d => d.slice(0, 7) === today().slice(0, 7) && d <= today() && !U.isWeekend(d)).length);
    const pace = k.caMonth / wdDone * monthDays;
    const notNotified = S.ros.filter(r => r.stage === CX.ST.pret && !r.notified).length;
    const counts = CX.STAGES.map((s, i) => S.ros.filter(r => r.stage === i && (i < CX.ST.facture || U.dOf(r.outAt) === today())).length);
    const shown = filt === 'all' ? al : al.filter(a => a.level === filt);
    const appts = S.appts.filter(a => a.date === today()).sort((a, b) => a.time - b.time);
    const nowM = U.nowMin();
    const late = S.ros.filter(r => r.stage < CX.ST.pret && r.dueAt && U.dOf(r.dueAt) <= U.wd(1)).sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 6);
    const ins = {}; S.invoices.filter(i => i.date.slice(0, 7) === today().slice(0, 7) && i.kind === 'assurance').forEach(i => { ins[i.payerId] = (ins[i.payerId] || 0) + i.ht; });
    const insParts = Object.entries(ins).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => [CX.ins(id).short, v, CX.ins(id).color]);
    const priv = S.invoices.filter(i => i.date.slice(0, 7) === today().slice(0, 7) && i.kind === 'client').reduce((a, i) => a + i.ht, 0);
    const months = S.ext.months.concat([[new Date().toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '') + '.*', Math.round(k.caMonth)]]);

    // Indicateurs utiles à la première ouverture : la journée du garage, puis les chiffres du gérant.
    const apptsAll = S.appts.filter(a => a.date === today()), deps = apptsAll.filter(a => a.kind === 'Réception'), livs = apptsAll.filter(a => a.kind === 'Livraison');
    const inWork = S.ros.filter(r => r.stage >= CX.ST.demont && r.stage <= CX.ST.cq), toStart = S.ros.filter(r => r.stage >= CX.ST.accord && r.stage < CX.ST.demont && CX.ONSITE(r.slot));
    const postes = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], freeP = postes.filter(p => CX.slotFree(p)).length, boothFree = CX.slotFree('BOOTH');
    const delivered = S.ros.filter(r => r.outAt && U.dOf(r.outAt) === today()), waitingQ = S.quotes.filter(q => q.status === 'Envoyé'), waitingQAmt = waitingQ.reduce((a, q) => a + CX.quoteTotals(q).ttc, 0);
    const unpaid = S.invoices.filter(i => i.kind !== 'acompte' && i.status !== 'Payée'), unpaidAmt = unpaid.reduce((a, i) => a + i.amount - i.paid, 0);
    const PHASES = [['Avant atelier', ['rdv', 'recep', 'devis', 'accord']], ['Pièces & démontage', ['pieces', 'demont']], ['Réparation', ['tole', 'prep', 'peint', 'remont']], ['Sortie', ['cq', 'lavage', 'pret', 'facture']]];
    el.innerHTML = `<div class="bo-page">
      ${BO.head(`${h} ${esc(me.first)}`, `${esc(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} · ${k.onsite} véhicules sur site · ${al.filter(a => a.level === 'high').length} urgence${al.filter(a => a.level === 'high').length > 1 ? 's' : ''}`,
        `<button class="btn" data-act="newdos">${BO.icon('plus', 15)}Nouveau dossier</button><button class="btn" data-open="quotes::new">${BO.icon('calc', 15)}Nouveau devis</button><button class="btn dark" data-act="map">${BO.icon('cube', 15)}Atelier live</button>`)}
      <div class="kpis today">
        ${BO.kpi({ lb: 'Rendez-vous du jour', v: apptsAll.length, s: `${deps.length} dépôt${deps.length > 1 ? 's' : ''} · ${livs.length} restitution${livs.length > 1 ? 's' : ''}`, icon: 'cal', cls: 'click', go: 'reception' })}
        ${BO.kpi({ lb: 'Interventions en cours', v: inWork.length, s: toStart.length ? `${toStart.length} à démarrer (véhicule sur place)` : 'tout est démarré', icon: 'wrench', cls: 'click', go: 'ros' })}
        ${BO.kpi({ lb: 'Postes libres', v: `${freeP}<small>/${postes.length}</small>`, s: CX.activityOn('peinture') ? `cabine ${boothFree ? 'libre' : 'occupée'}` : `${postes.length - freeP} occupé${postes.length - freeP > 1 ? 's' : ''}`, icon: 'lift', cls: 'click ' + (freeP === 0 ? 'warn' : ''), go: 'planning' })}
        ${BO.kpi({ lb: 'Livrés aujourd’hui', v: delivered.length, s: `${k.ready} prêt${k.ready > 1 ? 's' : ''} à livrer${notNotified ? ` · <span class="chip red">${notNotified} non prévenu${notNotified > 1 ? 's' : ''}</span>` : ''}`, icon: 'car', cls: 'click', go: 'ros' })}
        ${BO.kpi({ lb: 'Devis en attente', v: waitingQ.length, s: waitingQ.length ? chf(waitingQAmt) + ' à confirmer' : 'aucun accord à relancer', icon: 'calc', cls: 'click', go: 'quotes' })}
        ${BO.kpi({ lb: 'Paiements à confirmer', v: unpaid.length, s: unpaid.length ? chf(unpaidAmt) + ' en attente' : 'tout est réglé', icon: 'coins', cls: 'click', go: 'invoices' })}
      </div>
      <div class="kpis manager">
        ${BO.kpi({ lb: 'CA du mois (HT)', v: chfK(k.caMonth), s: `<span class="delta ${pace >= target ? '' : 'neg'}">${pace >= target ? '▲' : '▼'} proj. ${chfK(pace)}</span> objectif ${chfK(target)}`, icon: 'trend', cls: 'hero click', go: 'invoices' })}
        ${BO.kpi({ lb: 'Immobilisation moyenne', v: BO.num(k.imm, 1) + '<small>jours</small>', s: `${Math.round(k.ontime * 100)} % livrés à l’heure`, icon: 'clock', cls: 'click', go: 'ros' })}
        ${CX.activityOn('assurances') ? BO.kpi({ lb: 'Part assurances', v: Math.round(k.insShare * 100) + '<small>%</small>', s: `privés ${100 - Math.round(k.insShare * 100)} % du CA`, icon: 'shield', cls: 'click', go: 'claims' }) : BO.kpi({ lb: 'Marge brute', v: BO.num(k.margin * 100, 1) + '<small>%</small>', s: 'OR clôturés', icon: 'coins', cls: 'click', go: 'invoices' })}
      </div>
      <div class="card mb"><div class="card-h"><h3>${BO.icon('phone', 16)}Demander à MOTEK <small>· où est un véhicule, livraisons du jour, devis en attente…</small></h3><a class="lnk sm-t" data-open="intelligence::vocal">Assistant complet →</a></div><div class="card-b" data-voice></div></div>
      <div class="card mb"><div class="card-h"><h3>${BO.icon('kanban', 16)}Flux atelier <small>· chaque dossier avance de gauche à droite · touchez une étape pour voir les dossiers</small></h3><span class="muted sm-t">${S.ros.filter(r => r.stage < CX.ST.facture).length} dossiers ouverts</span></div>
        <div class="card-b"><div class="flow2">${PHASES.map(([ph, keys]) => { const idx = keys.map(kk => CX.ST[kk]); const tot = idx.reduce((a, i) => a + counts[i], 0); return `<div class="phase"><div class="ph-h"><b>${esc(ph)}</b><span class="chip ${tot ? 'dark' : ''}">${tot}</span></div><div class="ph-steps">${idx.map(i => `<button class="step ${counts[i] ? 'has' : ''}" data-open="ros::${i}" title="${esc(CX.STAGES[i].l)}"><i style="background:${CX.STAGES[i].c}"></i><b>${counts[i]}</b><span>${esc(CX.STAGES[i].s)}</span></button>`).join('')}</div></div>`; }).join('')}</div></div></div>
      <div class="g g-main">
        <div class="card" style="min-height:420px"><div class="card-h"><h3>${BO.icon('alert', 16)}À traiter aujourd’hui <small>· ${al.length} point${al.length > 1 ? 's' : ''}</small></h3>${BO.seg('lv', [['all', 'Tout', al.length], ['high', 'Urgent', al.filter(a => a.level === 'high').length], ['mid', 'À traiter', al.filter(a => a.level === 'mid').length], ['low', 'Info', al.filter(a => a.level === 'low').length]], filt)}</div>
          <div>${shown.length ? shown.map((a, i) => `<div class="todo"><span class="tic ${a.level}">${BO.icon(AIC[a.kind] || 'alert', 16)}</span><div class="tx"><b>${esc(a.title)}</b><span>${esc(a.text)}</span></div><div class="ta">${a.action ? `<button class="btn sm ${a.level === 'high' ? 'pri' : ''}" data-run="${i}">${BO.icon(ACT[a.action][0], 13)}${ACT[a.action][1]}</button>` : ''}<button class="icon-btn" data-go="${i}" title="Ouvrir">${BO.icon('chevR', 15)}</button></div></div>`).join('') : BO.empty('check', 'Rien à traiter', 'Tous les dossiers sont à jour — beau travail.', '', true)}</div></div>
        <div class="g" style="align-content:start">
          <div class="card"><div class="card-h"><h3>${BO.icon('cal', 16)}Agenda du jour</h3><a class="lnk sm-t" data-open="reception">Réception →</a></div>
            <div class="card-b">${appts.length ? `<ul class="hist">${appts.map(a => `<li style="${a.status === 'Fait' ? 'opacity:.55' : ''}"><b>${U.hm(a.time)} · ${esc(a.kind)}</b> ${a.time <= nowM && a.time + a.dur >= nowM ? '<span class="chip red">maintenant</span>' : ''}<small>${esc(a.title)}${a.vehicleId ? ' · ' + esc((CX.veh(a.vehicleId) || {}).plate || '') : ''}</small></li>`).join('')}</ul>` : BO.empty('cal', 'Aucun rendez-vous', '', '', true)}</div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('lift', 16)}Postes</h3><button class="btn sm" data-map="map:Z-atelier">${BO.icon('cube', 13)}Voir</button></div>
            <div class="card-b"><div class="postes" style="grid-template-columns:repeat(2,minmax(0,1fr))">${['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'BOOTH', 'RECV'].filter(p => p !== 'BOOTH' || CX.activityOn('peinture')).map(p => { const r = CX.slotRO(p), v = r ? CX.veh(r.vehicleId) : null; return `<div class="poste ${r ? 'busy' : ''}" ${r ? `data-open="ros:${r.id}"` : ''}><div class="pn"><i></i>${esc(CX.slotLabel(p).replace('Poste ', 'P').replace(' · Marbre', ' marbre').replace('Réception véhicules', 'Réception'))}</div><div class="pv">${v ? esc(v.plate) : 'Libre'}</div><div class="ps">${r ? esc(CX.STAGES[r.stage].s) + ' · ' + esc((CX.emp(r.lead) || {}).first || '—') : '—'}</div></div>`; }).join('')}</div></div></div>
        </div>
      </div>
      <details class="mt analyse"><summary class="sm-t b">${BO.icon('trend', 14)} Analyse du mois (chiffre d’affaires, assurances, échéances)</summary>
      <div class="g g3 mt">
        <div class="card"><div class="card-h"><h3>${BO.icon('trend', 16)}Chiffre d’affaires HT <small>· 6 mois</small></h3></div><div class="card-b chart">${BO.bars(months.map(([l, v]) => [l.replace('*', ''), v]), { fmt: v => Math.round(v / 1000) + 'k' })}<div class="xs-t muted">* mois en cours au ${U.fmtD(today())}</div></div></div>
        <div class="card"><div class="card-h"><h3>${BO.icon('shield', 16)}Assurances vs privés <small>· ce mois</small></h3></div><div class="card-b"><div class="donut-w">${BO.donut(insParts.concat([['Privés & flottes', priv, '#1768ee']]))}<div class="legend" style="flex-direction:column;gap:7px">${insParts.concat([['Privés & flottes', priv, '#1768ee']]).map(([l, v, c]) => `<span><i style="background:${c}"></i>${esc(l)} <b style="margin-left:auto;padding-left:10px">${chfK(v)}</b></span>`).join('')}</div></div></div></div>
        <div class="card"><div class="card-h"><h3>${BO.icon('clock', 16)}Échéances proches</h3><a class="lnk sm-t" data-open="planning">Planning →</a></div><div class="card-b">${late.length ? `<div class="mini-list">${late.map(r => { const v = CX.veh(r.vehicleId), lt = CX.isLate(r); return `<div class="cl" data-open="ros:${r.id}">${BO.plate(v.plate)}<div style="flex:1;min-width:0"><b class="sm-t">${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(CX.STAGES[r.stage].s)} · ${r.prog} %</div></div><span class="chip ${lt ? 'red' : U.dOf(r.dueAt) === today() ? 'amber' : ''}">${esc(BO.dt(r.dueAt))}</span></div>`; }).join('')}</div>` : BO.empty('check', 'Aucune échéance proche', '', '', true)}</div></div>
      </div></details>
    </div>`;
    if (window.SMART && SMART.widget) SMART.widget(el.querySelector('[data-voice]'), { after: () => BO.now() });
    BO.bindSeg(el, (n, v) => { filt = v; APP.refresh(); });
    el.querySelectorAll('[data-run]').forEach(b => b.addEventListener('click', () => runAction(shown[+b.dataset.run])));
    el.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => APP.focus(shown[+b.dataset.go].target, { bo: true })));
    el.querySelector('[data-act="newdos"]').addEventListener('click', () => BO.newDossier({ onDone: r => APP.open('ros', { id: r.id }) }));
    el.querySelector('[data-act="map"]').addEventListener('click', () => APP.setMode('map'));
  }

  APP.register({ id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard', group: 'Pilotage', order: 1, render, badge: () => CX.alerts().filter(a => a.level === 'high').length });
})();
