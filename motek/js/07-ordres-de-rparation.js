/* ==========================================================================
   BO · Ordres de réparation : kanban du workflow (glisser-déposer), liste,
   fiche OR complète (frise, dégâts, travaux, temps, pièces, photos, historique)
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2, today } = U;
  const st = { view: 'kanban', q: '', ins: '', tech: '', hideDone: true, tab: 'apercu', tbl: { sort: 'due', dir: 'asc' } };
  const POSTE_L = { tole: 'Tôlerie / démontage', prep: 'Préparation', peint: 'Peinture', montage: 'Remontage / mécanique', demont: 'Démontage' };

  const filtered = () => CX.S.ros.filter(r => {
    if (st.hideDone && r.stage === CX.ST.facture && U.dOf(r.outAt) !== today()) return false;
    const v = CX.veh(r.vehicleId) || {}, c = CX.cust(r.customerId) || {}, k = r.claimId ? CX.claim(r.claimId) : null;
    if (st.ins && (st.ins === 'prive' ? !!k : !k || k.insurerId !== st.ins)) return false;
    if (st.tech && r.lead !== st.tech && !r.team.includes(st.tech)) return false;
    if (st.q) { const q = st.q.toLowerCase(); if (![r.no, v.plate, c.name, v.make + ' ' + v.model, r.damage].some(x => String(x || '').toLowerCase().includes(q))) return false; }
    return true;
  });

  function card(r) {
    const v = CX.veh(r.vehicleId) || {}, c = CX.cust(r.customerId) || {}, k = r.claimId ? CX.claim(r.claimId) : null, late = CX.isLate(r), e = CX.emp(r.lead);
    const pend = CX.S.orders.some(o => o.roId === r.id && !['Reçue', 'Annulée', 'Brouillon'].includes(o.status));
    const flags = [];
    if (late) flags.push(`<span class="ft bad">${BO.icon('clock', 12)}En retard</span>`);
    else if (r.dueAt && r.stage < CX.ST.pret) flags.push(`<span class="ft ${U.dOf(r.dueAt) === today() ? 'warn' : ''}">${BO.icon('clock', 12)}${esc(BO.dt(r.dueAt))}</span>`);
    if (r.waitingParts || pend) flags.push(`<span class="ft warn">${BO.icon('truck', 12)}Pièces</span>`);
    if (k && ['Déclaré', 'Expertise planifiée'].includes(k.approval)) flags.push(`<span class="ft warn">${BO.icon('shield', 12)}${esc(k.approval === 'Déclaré' ? 'Accord' : 'Expertise')}</span>`);
    if (r.courtesyId) flags.push(`<span class="ft">${BO.icon('key', 12)}VR</span>`);
    if (r.stage === CX.ST.pret && !r.notified) flags.push(`<span class="ft bad">${BO.icon('msg', 12)}À prévenir</span>`);
    return `<div class="orc ${late ? 'late' : r.waitingParts ? 'wait' : ''}" draggable="true" data-id="${r.id}">
      <div class="o1">${BO.plate(v.plate)}<span class="no">${esc(r.no)}</span></div>
      <div class="mdl">${esc(CX.vlabel(v))}</div><div class="cu">${esc(c.name || '—')}</div>
      <div class="o3">${k ? BO.ins(k.insurerId) : c.fleet ? '<span class="ins pill"><i style="background:#16181c"></i>Flotte</span>' : BO.ins(null)}${flags.join('')}</div>
      <div class="o4">${e ? UI.av(e, 22) : '<span class="bav" style="width:22px;height:22px;background:#d9dce1;color:#59606b;font-size:9px">?</span>'}${BO.pbar((r.prog || 0) / 100, r.stage >= CX.ST.pret ? 'g' : r.waitingParts ? 'a' : '')}<span class="xs-t b">${Math.round(r.prog || 0)}%</span></div></div>`;
  }

  function kanban(el, rows) {
    const hl = APP.params.tab != null && /^\d+$/.test(APP.params.tab) ? +APP.params.tab : null;
    el.innerHTML = `<div class="wf-board">${CX.STAGES.map((s, i) => { const rs = rows.filter(r => r.stage === i); const hrs = rs.reduce((a, r) => a + CX.roSold(r), 0); return `<div class="wf-col ${hl != null && hl !== i ? 'dim' : ''}" data-stage="${i}"><div class="wf-h"><span class="no" style="background:${s.c}">${i + 1}</span>${esc(s.l)}<span class="n">${rs.length}</span>${hrs ? `<span class="h">${BO.h(hrs)}</span>` : ''}</div>${rs.length ? rs.sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt))).map(card).join('') : '<div class="wf-empty">Déposez un OR ici</div>'}</div>`; }).join('')}</div>`;
    let drag = null;
    el.querySelectorAll('.orc').forEach(c => {
      c.addEventListener('dragstart', e => { drag = c.dataset.id; BO.dragging = true; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', drag); });
      c.addEventListener('dragend', () => { c.classList.remove('dragging'); BO.dragging = false; el.querySelectorAll('.wf-col').forEach(x => x.classList.remove('over')); });
      c.addEventListener('click', () => APP.open('ros', { id: c.dataset.id }));
    });
    el.querySelectorAll('.wf-col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
      col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); BO.dragging = false; const id = e.dataTransfer.getData('text/plain') || drag; moveStage(id, +col.dataset.stage); });
    });
  }

  /** passage d'étape avec garde-fous métier */
  function moveStage(id, stage, after) {
    const r = CX.ro(id); if (!r || r.stage === stage) return;
    const go = () => {
      const before = r.slot; CX.setStage(id, stage);
      const moved = CX.ro(id).slot !== before;
      UI.toast(CX.STAGES[stage].l, r.no + (moved ? ' → ' + CX.slotLabel(CX.ro(id).slot) + ' (atelier live)' : ''), 'ok', CX.STAGES[stage].ic);
      after && after(); BO.now();
    };
    const k = r.claimId ? CX.claim(r.claimId) : null;
    if (stage === CX.ST.facture) { const t = CX.roTotals(r); BO.confirm('Facturer et restituer ' + r.no + ' ?', `Les factures seront émises automatiquement : ${t.insurer > 0 ? `<b>${chf(t.insurer)}</b> à ${esc((CX.ins(k.insurerId) || {}).short)} (cession de créance) et ` : ''}<b>${chf(t.client)}</b> à la charge du client${t.franchise ? ' (franchise)' : ''}, encaissée à la restitution. Le véhicule quitte l’atelier.`, 'Facturer & restituer', go); return; }
    if (stage > CX.ST.accord && stage < CX.ST.pret && r.stage <= CX.ST.accord && k && !['Accordé', 'Partiel'].includes(k.approval)) { BO.confirm('Accord assureur manquant', `Le sinistre ${esc(k.no)} (${esc((CX.ins(k.insurerId) || {}).short)}) est au statut « ${esc(k.approval)} ». Démarrer les travaux sans accord reste à vos risques.`, 'Continuer quand même', go); return; }
    if (stage >= CX.ST.pret && r.stage < CX.ST.cq && !(r.qc && r.qc.ok)) { BO.confirm('Contrôle qualité non effectué', 'Ce véhicule n’a pas passé le contrôle qualité. Le marquer prêt quand même ?', 'Marquer prêt', go); return; }
    go();
  }
  BO.moveStage = moveStage;

  function list(el, rows) {
    BO.table(el, { rows, state: st.tbl, onRow: r => APP.open('ros', { id: r.id }), rowCls: r => CX.isLate(r) ? 'late' : '',
      cols: [
        { k: 'no', label: 'OR', render: r => `<b>${esc(r.no)}</b>` },
        { k: 'veh', label: 'Véhicule', get: r => (CX.veh(r.vehicleId) || {}).plate, render: r => BO.vehCell(CX.veh(r.vehicleId), r.damage) },
        { k: 'cust', label: 'Client', get: r => CX.custName(r.customerId), render: r => BO.custCell(CX.cust(r.customerId)) },
        { k: 'ins', label: 'Assurance', get: r => r.claimId ? (CX.ins(CX.claim(r.claimId).insurerId) || {}).short : 'Privé', render: r => r.claimId ? BO.ins(CX.claim(r.claimId).insurerId) : BO.ins(null) },
        { k: 'stage', label: 'Étape', get: r => r.stage, render: r => BO.stage(r) },
        { k: 'status', label: 'Statut', get: r => CX.statusOf(r), render: r => BO.status(r) },
        { k: 'lead', label: 'Technicien', get: r => (CX.emp(r.lead) || {}).name || '', render: r => r.lead ? BO.empCell(CX.emp(r.lead), CX.slotLabel(r.slot)) : '<span class="muted">—</span>' },
        { k: 'prog', label: 'Avancement', num: true, get: r => r.prog, render: r => BO.prog((r.prog || 0) / 100, r.stage >= CX.ST.pret ? 'g' : '') },
        { k: 'due', label: 'Restitution', get: r => r.dueAt || 'z', render: r => `<span class="${CX.isLate(r) ? 'bad-t b' : ''}">${esc(BO.dt(r.dueAt))}</span>` },
        { k: 'ttc', label: 'Montant TTC', num: true, get: r => CX.roTotals(r).ttc, render: r => chf(CX.roTotals(r).ttc) },
      ] });
  }

  /* ---------------- fiche OR ---------------- */
  function detail(el, r) {
    const v = CX.veh(r.vehicleId) || {}, c = CX.cust(r.customerId) || {}, k = r.claimId ? CX.claim(r.claimId) : null, q = CX.roQuote(r), t = CX.roTotals(r), e = CX.emp(r.lead);
    const dep = CX.S.invoices.filter(i => i.roId === r.id && i.kind === 'acompte').reduce((a, i) => a + i.paid, 0);
    const invs = CX.S.invoices.filter(i => i.roId === r.id), orders = CX.S.orders.filter(o => o.roId === r.id), loan = CX.S.loans.find(l => l.roId === r.id && l.status !== 'Rendu') || CX.S.loans.find(l => l.roId === r.id);
    const next = Math.min(r.stage + 1, CX.ST.facture);
    const tab = st.tab;
    const planned = r.planned || {}, spentBy = p => CX.roSpent(r, p);
    const postes = ['tole', 'prep', 'peint', 'montage'].filter(p => planned[p] || spentBy(p) || (p === 'tole' && spentBy('demont')));
    el.innerHTML = `<div class="bo-page">
      ${BO.crumb([['Ordres de réparation', 'ros'], [r.no]])}
      <div class="card mb"><div class="ro-head">
        <div class="car">${UI.carPic(v.hex, 78, 60)}</div>
        <div style="min-width:0"><h1>${BO.plate(v.plate, true)} ${esc(v.make)} ${esc(v.model)} ${BO.status(r)}</h1>
          <div class="meta"><span>${BO.icon('wrench', 14)}<b>${esc(r.no)}</b></span><span>${BO.icon('user', 14)}<a class="lnk" data-open="crm:${c.id}">${esc(c.name)}</a></span>${k ? `<span>${BO.icon('shield', 14)}${BO.ins(k.insurerId, false)} · <a class="lnk" data-open="claims:${k.id}">sinistre ${esc(k.no)}</a></span>` : `<span>${BO.icon('shield', 14)}${c.fleet ? 'Flotte · ' + esc(c.fleet.contract) : 'Client privé'}</span>`}<span>${BO.icon('pin', 14)}${esc(CX.slotLabel(r.slot))}</span><span>${BO.icon('clock', 14)}Restitution ${esc(BO.dt(r.dueAt))}${CX.isLate(r) ? ' <span class="chip red">retard</span>' : ''}</span></div></div>
        <div class="act">${r.stage < CX.ST.facture ? `<button class="btn pri" data-next>${BO.icon(CX.STAGES[next].ic, 15)}${esc(CX.STAGES[next].s)} →</button>` : ''}${CX.ONSITE(r.slot) ? BO.mapBtn('vehicle', v.id, 'Voir dans l’atelier', '') : ''}<button class="btn" data-notify>${BO.icon('msg', 15)}${r.stage >= CX.ST.pret ? 'Prévenir : prêt' : 'Informer le client'}</button>${r.stage >= CX.ST.pret ? `<button class="btn" data-open="invoices:${invs[0] ? invs[0].id : ''}">${BO.icon('invoice', 15)}Facturation</button>` : ''}</div>
      </div><div style="padding:4px 20px 18px">${BO.wfLine(r, { click: true })}</div></div>
      ${BO.tabs([['apercu', 'Aperçu'], ['temps', 'Temps & postes', BO.h(CX.roSpent(r))], ['pieces', 'Pièces', orders.length || (q ? q.lines.filter(l => +l.price > 0 && l.op !== 'F').length : 0)], ['photos', 'Photos', r.photos.length], ['hist', 'Historique', r.history.length], ['docs', 'Documents']], tab)}
      <div data-tabbody></div></div>`;
    const body = el.querySelector('[data-tabbody]');
    if (tab === 'apercu') {
      const ci = r.checkin;
      body.innerHTML = `<div class="g g-main2">
        <div class="g" style="align-content:start">
          <div class="card"><div class="card-h"><h3>${BO.icon('car', 16)}Dommages & réception</h3>${ci ? `<span class="chip green">${BO.icon('check', 12)}État des lieux signé</span>` : r.stage <= CX.ST.recep ? `<button class="btn sm pri" data-open="reception:${r.id}:checkin">${BO.icon('key', 13)}Faire le check-in</button>` : ''}</div>
            <div class="card-b"><div class="g" style="grid-template-columns:200px 1fr;align-items:start">${BO.carDiagram(ci ? ci.damages : {})}<div><div class="note-box mb"><b>${esc(r.damage || '—')}</b></div><div class="row wrap mb">${BO.dmgList(ci ? ci.damages : {})}</div>
            ${ci ? `<dl class="kv"><dt>Réception</dt><dd>${esc(BO.dt(ci.at))} · ${esc((CX.emp(ci.by) || {}).name || '')}</dd><dt>Kilométrage</dt><dd>${BO.km(ci.km)}</dd><dt>Carburant / charge</dt><dd>${BO.pbar(ci.fuel, 'k', 120)} ${Math.round(ci.fuel * 100)} %</dd><dt>Objets laissés</dt><dd>${esc(ci.objects || '—')}</dd><dt>Photos</dt><dd>${ci.photos || r.photos.length} prises</dd></dl>` : '<div class="muted sm-t">Véhicule pas encore réceptionné.</div>'}</div></div></div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('clip', 16)}Travaux <small>${r.tasks.filter(x => x.p >= 1).length}/${r.tasks.length}</small></h3><button class="btn sm" data-addtask>${BO.icon('plus', 13)}Tâche</button></div>
            <div class="card-b"><ul class="check-l">${r.tasks.map((x, i) => `<li class="${x.p >= 1 ? 'done' : x.p > 0 ? 'doing' : ''}" style="--p:${Math.round(x.p * 100)}%"><span class="ck" data-task="${i}">${x.p >= 1 ? BO.icon('check', 11) : ''}</span><span class="l">${esc(x.l)}</span>${x.p > 0 && x.p < 1 ? `<em>${Math.round(x.p * 100)} %</em>` : ''}</li>`).join('')}</ul></div></div>
        </div>
        <div class="g" style="align-content:start">
          <div class="card"><div class="card-h"><h3>${BO.icon('users', 16)}Équipe & poste</h3><button class="btn sm" data-assign>${BO.icon('plus', 13)}Affecter</button></div>
            <div class="card-b"><div class="mini-list">${r.team.length ? r.team.map(id => { const x = CX.emp(id); return x ? `<div>${UI.av(x, 32)}<div style="flex:1"><b class="sm-t">${esc(x.name)}</b> ${id === r.lead ? '<span class="chip red">Responsable</span>' : ''}<div class="xs-t muted">${esc(x.title)} · ${BO.h(CX.S.time.filter(t2 => t2.roId === r.id && t2.emp === id).reduce((a, t2) => a + t2.h, 0))} passées</div></div>${id !== r.lead ? `<button class="btn xs" data-lead="${id}">Responsable</button>` : ''}${CX.ONSITE(r.slot) ? `<button class="icon-btn" data-map="employee:${id}" title="Voir dans l’atelier">${BO.icon('cube', 14)}</button>` : ''}<button class="icon-btn" data-unteam="${id}" title="Retirer">${BO.icon('x', 14)}</button></div>` : ''; }).join('') : BO.empty('users', 'Aucun technicien', 'Affectez un responsable : il se rendra au véhicule dans l’atelier live.', '', true)}</div>
            <div class="sepl"></div><div class="row"><span class="sm-t muted b" style="width:110px">Emplacement</span><select class="inp sm" data-slot style="flex:1">${BO.opts(Object.keys(CX.SLOTS).filter(s => s !== 'OUT' && s !== 'ROAD' || s === r.slot).map(s => [s, CX.slotLabel(s) + (s !== r.slot && !CX.slotFree(s) ? ' (occupé)' : '')]), r.slot)}</select></div></div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('calc', 16)}Montants</h3>${q ? `<a class="lnk sm-t" data-open="quotes:${q.id}">Devis ${esc(q.no)} →</a>` : `<button class="btn sm pri" data-open="quotes:${r.id}:new">${BO.icon('plus', 13)}Créer le devis</button>`}</div>
            <div class="card-b">${q ? `<dl class="kv" style="grid-template-columns:1fr auto"><dt>Main-d’œuvre carrosserie</dt><dd class="r-al">${chf2(t.labAmt)}</dd><dt>Peinture (MO + ingrédients)</dt><dd class="r-al">${chf2(t.paintAmt + t.mat)}</dd><dt>Pièces</dt><dd class="r-al">${chf2(t.parts)}</dd><dt>Forfaits & petite fourniture</dt><dd class="r-al">${chf2(t.forf + t.small)}</dd><dt>TVA ${BO.tvaLbl()}</dt><dd class="r-al">${chf2(t.tva)}</dd><dt><b>Total TTC</b></dt><dd class="r-al"><b>${chf2(t.ttc)}</b></dd></dl><div class="mt">${BO.split(t, dep)}</div>` : BO.empty('calc', 'Pas encore de devis', '', '', true)}</div></div>
          <div class="card"><div class="card-h"><h3>${BO.icon('shield', 16)}Sinistre & véhicule de remplacement</h3></div>
            <div class="card-b"><dl class="kv">${k ? `<dt>Assureur</dt><dd>${BO.ins(k.insurerId)}</dd><dt>N° sinistre</dt><dd><a class="lnk" data-open="claims:${k.id}">${esc(k.no)}</a></dd><dt>Couverture</dt><dd>${esc(k.cover)} · franchise ${chf(k.franchise)}</dd><dt>Expert</dt><dd>${esc(k.expert || 'à désigner')}${k.expertiseAt ? ' · ' + esc(BO.dt(k.expertiseAt)) : ''}</dd><dt>Accord</dt><dd>${BO.chip(k.approval, k.approval === 'Accordé' ? 'green' : k.approval === 'Refusé' ? 'red' : 'amber')}${k.approvedAmount ? ' ' + chf(k.approvedAmount) : ''}</dd><dt>Cession de créance</dt><dd>${k.cession ? '<span class="ok-t b">Signée</span> ' + esc(BO.dt(k.cessionAt)) : '<span class="warn-t b">À faire signer</span>'}</dd>` : `<dt>Assurance</dt><dd>Aucune — ${c.fleet ? 'facturation flotte' : 'client privé'}</dd>`}
              <dt>Véh. de remplacement</dt><dd>${loan ? `<a class="lnk" data-open="courtesy:${loan.id}">${esc((CX.car(loan.carId) || {}).plate)} · ${esc((CX.car(loan.carId) || {}).model)}</a> <span class="chip ${loan.status === 'En cours' ? 'amber' : ''}">${esc(loan.status)}</span>` : `<button class="btn xs" data-open="courtesy:${r.id}:new">${BO.icon('key', 12)}Prêter un véhicule</button>`}</dd></dl></div></div>
        </div></div>`;
      body.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.task; CX.setTask(r.id, i, r.tasks[i].p >= 1 ? 0 : 1); BO.now(); }));
      body.querySelector('[data-addtask]').addEventListener('click', () => BO.formModal({ title: 'Ajouter une tâche', fields: [{ k: 'l', label: 'Intitulé', req: true, full: true, ph: 'ex. Calibrage radar AV' }], onSubmit: x => { CX.addTask(r.id, x.l); BO.now(); } }));
      body.querySelector('[data-assign]').addEventListener('click', () => BO.pickTech({ roId: r.id, onPick: id => { CX.assignTech(r.id, id); UI.toast('Technicien affecté', CX.emp(id).name + ' → ' + r.no + (CX.ONSITE(r.slot) ? ' (se rend au véhicule)' : ''), 'ok', 'user'); BO.now(); } }));
      body.querySelectorAll('[data-lead]').forEach(b => b.addEventListener('click', () => { CX.assignTech(r.id, b.dataset.lead); BO.now(); }));
      body.querySelectorAll('[data-unteam]').forEach(b => b.addEventListener('click', () => { CX.unassignTech(r.id, b.dataset.unteam); BO.now(); }));
      body.querySelector('[data-slot]').addEventListener('change', ev => { if (CX.moveRO(r.id, ev.target.value)) UI.toast('Véhicule déplacé', r.no + ' → ' + CX.slotLabel(ev.target.value), 'ok', 'arrowR'); BO.now(); });
    } else if (tab === 'temps') {
      const ents = CX.S.time.filter(x => x.roId === r.id).sort((a, b) => b.date.localeCompare(a.date));
      const sold = t.hours.T1 + t.hours.T2 + t.hours.T3 + t.paintH, spent = CX.roSpent(r);
      body.innerHTML = `<div class="g g2"><div class="card"><div class="card-h"><h3>${BO.icon('gauge', 16)}Temps prévus vs passés <small>par poste</small></h3></div><div class="card-b">
        ${postes.length ? postes.map(p => { const pl = planned[p] || 0, sp = spentBy(p) + (p === 'tole' ? spentBy('demont') : 0), mx = Math.max(pl, sp, .1); return `<div class="tp-row"><span class="b">${esc(POSTE_L[p])}</span><div class="tb"><span class="pl" style="width:${pl / mx * 100}%"></span><span class="sp2 ${sp > pl ? 'over' : ''}" style="width:${sp / mx * 100}%"></span></div><b class="${sp > pl ? 'warn-t' : ''}">${BO.num(sp, 1)} / ${BO.num(pl, 1)} h</b></div>`; }).join('') : BO.empty('clock', 'Aucun temps planifié', '', '', true)}
        <div class="legend mt"><span><i style="background:#d9dce1"></i>Prévu (devis)</span><span><i style="background:var(--red)"></i>Passé (pointage)</span><span><i style="background:#b96400"></i>Dépassement</span></div>
        <div class="tiles mt" style="grid-template-columns:repeat(3,1fr)"><div class="tile"><div class="tl">Temps vendus</div><div class="tv">${BO.num(sold, 1)}<small>h</small></div></div><div class="tile"><div class="tl">Temps passés</div><div class="tv">${BO.num(spent, 1)}<small>h</small></div></div><div class="tile"><div class="tl">Efficacité</div><div class="tv ${spent && sold / spent >= 1 ? 'ok-t' : 'warn-t'}">${spent ? Math.round(sold / spent * 100) : '—'}<small>%</small></div></div></div></div></div>
        <div class="card"><div class="card-h"><h3>${BO.icon('clock', 16)}Pointages</h3><button class="btn sm pri" data-addtime>${BO.icon('plus', 13)}Saisir du temps</button></div><div class="card-b">${ents.length ? `<div class="mini-list">${ents.map(x => `<div>${UI.av(CX.emp(x.emp), 28)}<div style="flex:1"><b class="sm-t">${esc((CX.emp(x.emp) || {}).name)}</b><div class="xs-t muted">${esc(BO.dateS(x.date))} · ${esc(POSTE_L[x.poste] || x.poste)}</div></div><span class="hcell ${x.validated ? 'val' : 'pend'}">${BO.num(x.h, 2)}</span></div>`).join('')}</div>` : BO.empty('clock', 'Aucun temps saisi', '', '', true)}</div></div></div>`;
      body.querySelector('[data-addtime]').addEventListener('click', () => BO.timeForm ? BO.timeForm({ roId: r.id, emp: r.lead }) : APP.open('time'));
    } else if (tab === 'pieces') {
      const lines = q ? q.lines.filter(l => l.op !== 'F' && +l.price > 0) : [];
      const stateOf = l => { const o = orders.find(o2 => o2.lines.some(x => x.ref === l.ref)); if (o) return [o.status === 'Reçue' ? 'Reçue' : o.status, o.status === 'Reçue' ? 'green' : o.status === 'En retard' ? 'red' : 'amber', o]; const p = CX.S.parts.find(p2 => p2.ref === l.ref); if (p && p.qty > 0) return ['En stock · ' + p.loc, 'green', null]; return ['À commander', '', null]; };
      const toOrder = lines.filter(l => stateOf(l)[0] === 'À commander');
      body.innerHTML = `<div class="card"><div class="card-h"><h3>${BO.icon('box', 16)}Pièces du devis</h3>${toOrder.length ? `<button class="btn sm pri" data-order>${BO.icon('truck', 13)}Commander ${toOrder.length} pièce${toOrder.length > 1 ? 's' : ''}</button>` : ''}</div>
        ${lines.length ? `<div style="padding:0 16px 16px"><table class="tbl compact"><thead><tr><th>Pièce</th><th>Référence</th><th class="num">Qté</th><th class="num">Prix</th><th>État</th><th>Commande</th></tr></thead><tbody>${lines.map(l => { const [s2, tone, o] = stateOf(l); return `<tr><td class="b">${esc(l.piece)}</td><td class="code">${esc(l.ref || '—')}</td><td class="num">${l.qty}</td><td class="num">${chf2(l.price * l.qty * (1 - (l.disc || 0) / 100))}</td><td>${BO.chip(s2, tone)}</td><td>${o ? `<a class="lnk" data-open="parts:${o.id}:commandes">${esc(o.no)}</a> <span class="muted xs-t">${o.eta ? 'ETA ' + esc(BO.dt(o.eta)) : ''}</span>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>` : `<div class="card-b">${BO.empty('box', 'Aucune pièce', 'Ce devis ne comporte que de la main-d’œuvre.', '', true)}</div>`}</div>
        ${orders.length ? `<div class="card mt"><div class="card-h"><h3>${BO.icon('truck', 16)}Commandes liées</h3></div><div class="card-b"><div class="mini-list">${orders.map(o => `<div class="cl" data-open="parts:${o.id}:commandes"><span class="tag">${esc(o.no)}</span><div style="flex:1"><b class="sm-t">${esc((CX.supplier(o.supplierId) || {}).name)}</b><div class="xs-t muted">${esc(o.lines.map(x => x.label).join(', '))}</div></div>${BO.chip(o.status, o.status === 'Reçue' ? 'green' : o.status === 'En retard' ? 'red' : 'amber')}</div>`).join('')}</div></div></div>` : ''}`;
      const ob = body.querySelector('[data-order]'); if (ob) ob.addEventListener('click', () => { const sid = { VW: 'SU1', Audi: 'SU1', Škoda: 'SU1', BMW: 'SU2', Tesla: 'SU3', Toyota: 'SU4', Mercedes: 'SU4', Peugeot: 'SU9', Renault: 'SU10' }[v.make] || 'SU5'; const o = CX.saveOrder({ supplierId: sid, roId: r.id, status: 'Commandée', lines: toOrder.map(l => ({ ref: l.ref, label: l.piece, qty: l.qty, price: +l.price, partId: null })), eta: U.addDays(today(), (CX.supplier(sid) || {}).leadDays || 1) + ' 08:00', notes: 'Commande générée depuis ' + r.no }); if (r.stage < CX.ST.pieces) CX.setStage(r.id, CX.ST.pieces); UI.toast('Commande envoyée', o.no + ' · ' + (CX.supplier(sid) || {}).name, 'ok', 'truck'); BO.now(); });
    } else if (tab === 'photos') {
      const av = r.photos.filter(p => p.k !== 'apres'), ap = r.photos.filter(p => p.k === 'apres');
      body.innerHTML = `<div class="g g2"><div class="card"><div class="card-h"><h3>${BO.icon('camera', 16)}Avant réparation <small>${av.length}</small></h3></div><div class="card-b">${BO.photoGrid(av, true)}</div></div><div class="card"><div class="card-h"><h3>${BO.icon('camera', 16)}Après réparation <small>${ap.length}</small></h3></div><div class="card-b">${ap.length || r.stage >= CX.ST.remont ? BO.photoGrid(ap, true) : BO.empty('camera', 'Pas encore de photos « après »', 'Elles sont prises au contrôle qualité.', '', true)}</div></div></div><div class="form-note mt">${BO.icon('camera', 16)}<div>Photos simulées pour la démonstration : en production, elles sont prises depuis la tablette de réception ou le smartphone du technicien et jointes automatiquement au rapport d’expertise.</div></div>`;
      body.querySelectorAll('[data-addph]').forEach((b, i) => b.addEventListener('click', () => { r.photos.push({ id: U.uid('ph'), l: i === 0 ? 'Détail ' + (av.length + 1) : 'Après — ' + (ap.length + 1), k: i === 0 ? 'avant' : 'apres', at: CX.now() }); CX.log(r, 'Photo ajoutée'); CX.touch('ro', { roId: r.id }); BO.now(); }));
    } else if (tab === 'hist') {
      body.innerHTML = `<div class="card"><div class="card-b" style="padding-top:16px">${r.history.length ? `<ul class="hist">${r.history.map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))} · ${esc((CX.emp(h.by) || {}).name || 'Système')}</small></li>`).join('')}</ul>` : BO.empty('clock', 'Aucun historique', '', '', true)}</div></div>`;
    } else if (tab === 'docs') {
      const docs = [['calc', 'Devis ' + (q ? q.no : '—'), q ? 'quote' : null], ['shield', 'Cession de créance', k ? 'cession' : null], ['clip', 'État des lieux de réception', r.checkin ? 'checkin' : null], ['file', 'Ordre de réparation (fiche atelier)', 'or'], ['key', 'Contrat de prêt véhicule', loan ? 'loan' : null], ...invs.map(i => ['invoice', 'Facture ' + i.no + ' (' + i.kind + ')', 'inv:' + i.id])];
      body.innerHTML = `<div class="card"><div class="card-b" style="padding-top:16px"><div class="g g3">${docs.map(([i, l, a]) => `<div class="card pad flat row" style="${a ? 'cursor:pointer' : 'opacity:.45'}" ${a ? `data-doc="${a}"` : ''}><span class="tile" style="padding:8px;display:grid;place-items:center">${BO.icon(i, 18)}</span><div style="flex:1"><b class="sm-t">${esc(l)}</b><div class="xs-t muted">${a ? 'Aperçu PDF' : 'Non disponible'}</div></div>${a ? BO.icon('eye', 15) : ''}</div>`).join('')}</div></div></div>`;
      body.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.doc; if (a === 'quote' && BO.printQuote) BO.printQuote(q); else if (a === 'cession' && BO.printCession) BO.printCession(k.id); else if (a.startsWith('inv:') && BO.printInvoice) BO.printInvoice(CX.invoice(a.slice(4))); else if (a === 'loan' && BO.printLoan) BO.printLoan(loan.id); else printOR(r); }));
    }
    BO.bindTabs(el, tb => { st.tab = tb; APP.refresh(); });
    el.querySelectorAll('.wfl [data-stage]').forEach(b => b.addEventListener('click', () => { const s2 = +b.dataset.stage; if (s2 === r.stage) return; BO.confirm('Passer à « ' + CX.STAGES[s2].l + ' » ?', `${esc(r.no)} · ${esc(CX.vlabel(v))}. ${s2 < r.stage ? 'Retour en arrière dans le workflow.' : 'Le véhicule sera déplacé automatiquement si nécessaire (atelier live).'}`, 'Confirmer', () => moveStage(r.id, s2)); }));
    const nb = el.querySelector('[data-next]'); if (nb) nb.addEventListener('click', () => moveStage(r.id, next));
    el.querySelector('[data-notify]').addEventListener('click', () => { if (r.stage >= CX.ST.pret) BO.notifyReady(r.id, BO.now); else BO.compose({ title: 'Informer le client', to: c.pref === 'E-mail' ? c.email : c.phone, channel: c.pref === 'E-mail' ? 'E-mail' : 'SMS', subject: 'Suivi de votre véhicule ' + v.plate, body: `Bonjour ${c.name.split(' ')[0]}, petit point sur votre ${CX.vlabel(v)} : étape « ${CX.STAGES[r.stage].l} », avancement ${r.prog} %. Restitution prévue ${BO.dt(r.dueAt)}. MOTEK`, okLabel: 'Envoyer', onSend: m => { CX.notifyCustomer(r.id, m.channel, 'Suivi des travaux'); UI.toast('Message envoyé', c.name, 'ok', 'msg'); BO.now(); } }); });
  }

  function printOR(r) {
    const v = CX.veh(r.vehicleId), c = CX.cust(r.customerId);
    BO.preview('Ordre de réparation ' + r.no, BO.printHtml('OR ' + r.no, `${BO.printHeader()}<h1>Ordre de réparation ${esc(r.no)}</h1><div class="meta">${esc(v.plate)} · ${esc(v.make)} ${esc(v.model)} · VIN ${esc(v.vin)} · teinte ${esc(v.colorCode)} ${esc(v.colorName)} · ${BO.km(v.km)}</div>
      <table><tr><th>Client</th><th>Responsable</th><th>Entrée</th><th>Restitution prévue</th></tr><tr><td>${esc(c.name)}<br>${esc(c.phone)}</td><td>${esc((CX.emp(r.lead) || {}).name || '—')}</td><td>${esc(BO.dt(r.inAt))}</td><td>${esc(BO.dt(r.dueAt))}</td></tr></table>
      <h3 style="margin-top:18px">Dommage : ${esc(r.damage)}</h3><table><thead><tr><th>Travaux</th><th class="n">Fait</th></tr></thead><tbody>${r.tasks.map(x => `<tr><td>${esc(x.l)}</td><td class="n">${x.p >= 1 ? '✔' : '☐'}</td></tr>`).join('')}</tbody></table>
      <div class="sig"><div>Visa réception</div><div>Visa contrôle qualité</div><div>Signature client</div></div>`), r.no + '.html');
  }

  function render(el, params) {
    if (params.id) { const r = CX.ro(params.id); if (r) { if (params.tab && !/^\d+$/.test(params.tab)) st.tab = params.tab; detail(el, r); return; } }
    st.tab = 'apercu';
    const rows = filtered(), open = CX.S.ros.filter(r => r.stage < CX.ST.facture);
    el.innerHTML = `<div class="bo-page">${BO.head('Ordres de réparation', `${open.length} OR ouverts · ${open.filter(CX.isLate).length} en retard · ${open.filter(r => r.waitingParts).length} en attente de pièces — glissez une carte pour changer d’étape : le véhicule se déplace dans l’atelier live.`,
      `<button class="btn" data-exp>${BO.icon('download', 15)}Export CSV</button><button class="btn pri" data-new>${BO.icon('plus', 15)}Nouveau dossier</button>`)}
      <div class="toolbar"><div class="srch"><input class="inp" data-q placeholder="Plaque, client, n° OR…" value="${esc(st.q)}">${BO.icon('search', 16)}</div>
        <select class="inp" data-f="ins">${BO.opts([['prive', 'Privés & flottes']].concat(BO.optInsurers()), st.ins, 'Toutes assurances')}</select>
        <select class="inp" data-f="tech">${BO.opts(BO.optTechs(), st.tech, 'Tous techniciens')}</select>
        <label class="chk"><input type="checkbox" data-hide ${st.hideDone ? 'checked' : ''}>Masquer les OR facturés</label><span class="sp"></span>
        ${BO.seg('view', [['kanban', BO.icon('kanban', 14) + 'Workflow'], ['list', BO.icon('list', 14) + 'Liste']], st.view)}</div>
      <div data-host></div></div>`;
    const host = el.querySelector('[data-host]');
    if (st.view === 'kanban') kanban(host, rows); else list(host, rows);
    BO.bindSearch(el, v => { st.q = v; });
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    el.querySelectorAll('select[data-f]').forEach(s => s.addEventListener('change', () => { st[s.dataset.f] = s.value; APP.refresh(); }));
    el.querySelector('[data-hide]').addEventListener('change', e => { st.hideDone = e.target.checked; APP.refresh(); });
    el.querySelector('[data-new]').addEventListener('click', () => BO.newDossier({ onDone: r => APP.open('ros', { id: r.id }) }));
    el.querySelector('[data-exp]').addEventListener('click', () => BO.download('ordres-reparation.csv', BO.csv([['OR', 'Plaque', 'Véhicule', 'Client', 'Assurance', 'Étape', 'Statut', 'Responsable', 'Avancement %', 'Restitution', 'Total TTC']].concat(rows.map(r => { const v = CX.veh(r.vehicleId); return [r.no, v.plate, CX.vlabel(v), CX.custName(r.customerId), r.claimId ? CX.ins(CX.claim(r.claimId).insurerId).short : 'Privé', CX.STAGES[r.stage].l, CX.statusOf(r), (CX.emp(r.lead) || {}).name || '', r.prog, r.dueAt || '', CX.roTotals(r).ttc]; }))), 'text/csv;charset=utf-8'));
  }

  APP.register({ id: 'ros', label: 'Ordres de réparation', icon: 'wrench', group: 'Atelier', order: 2, render, badge: () => CX.S.ros.filter(CX.isLate).length });
})();
