/* ==========================================================================
   BO · À rappeler : la file d'appels du bureau. MOTEK propose des rappels
   utiles depuis les dossiers (prospects, mandats sans réponse, factures
   échues, gardes prêtes à sortir, demandes sans suite), chacun avec le
   dossier, le motif, un résumé et un script adapté. Le bureau décide, appelle
   avec son téléphone, puis saisit le compte rendu. Aucun appel automatique,
   aucun enregistrement : l'intégration téléphonique viendra plus tard.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { seg: 'open' };
  const S = () => CX.S;
  const list = () => S().callbacks;
  const cb = (id) => list().find((c) => c.id === id);
  const tel = (p) => 'tel:' + String(p || '').replace(/\s/g, '');
  const OUTCOMES = ['Joint — accord', 'Joint — à suivre', 'Répondeur, message laissé', 'Pas de réponse', 'Mauvais numéro'];
  const open = () => list().filter((c) => c.status === 'À rappeler');
  const hasOpen = (targetType, targetId, kind) => open().some((c) => c.targetType === targetType && c.targetId === targetId && c.kind === kind);
  const audit = (text) => { if (S().agent) { S().agent.log.unshift({ at: CX.now(), kind: 'agent', text, done: [] }); } };

  /* ---------- règles ---------- */
  window.DEP = window.DEP || {};
  DEP.callbacks = list;
  DEP.callbackAdd = (input) => {
    const name = String(input.name || '').trim(), phone = String(input.phone || '').trim();
    if (!name || !/^[+\d][\d\s().-]{6,}$/.test(phone)) { UI.toast('Rappel incomplet', 'Nom et téléphone valide requis.', 'warn'); return null; }
    if (input.targetType && input.targetId && hasOpen(input.targetType, input.targetId, input.kind || 'Rappel')) { UI.toast('Déjà dans la file', 'Un rappel est déjà ouvert pour ce dossier et ce motif.', 'warn'); return null; }
    const c = { id: U.uid('CB'), at: CX.now(), due: input.due || today(), kind: input.kind || 'Rappel', targetType: input.targetType || null, targetId: input.targetId || null, name, phone, summary: String(input.summary || ''), script: String(input.script || ''), status: 'À rappeler', attempts: [], doneAt: null };
    list().unshift(c); CX.touch('callbacks'); audit('Rappel ajouté à la file · ' + c.kind + ' · ' + name);
    return c;
  };
  DEP.callbackReport = (id, input) => {
    const c = cb(id); if (!c || c.status !== 'À rappeler') return null;
    const outcome = String(input.outcome || '').trim();
    if (!OUTCOMES.includes(outcome)) { UI.toast('Compte rendu requis', 'Choisissez le résultat de l’appel.', 'warn'); return null; }
    c.attempts.push({ at: CX.now(), by: S().meId, outcome, note: String(input.note || '') });
    if (input.close) { c.status = 'Fait'; c.doneAt = CX.now(); }
    if (input.abandon) { c.status = 'Abandonné'; c.doneAt = CX.now(); }
    CX.touch('callbacks'); audit('Appel · ' + c.name + ' · ' + outcome + (input.close ? ' · rappel clos' : ''));
    return c;
  };

  /* ---------- propositions depuis les dossiers : le bureau décide ---------- */
  const SCRIPTS = {
    lead: (l, svc) => `Bonjour ${l.name}, ici le bureau de ${S().company.name}. Vous nous avez contactés pour ${svc ? svc.label.toLowerCase() : 'un dépannage'}${l.department ? ' dans le ' + l.department : ''}. Je vous appelle pour préciser votre besoin et vous proposer une intervention. Avez-vous deux minutes ?`,
    mandat: (x) => `Bonjour, ${S().company.name}, au sujet du dossier ${x.ref || x.no} (véhicule ${x.vehicle.plate}). Nous attendons votre accord de prise en charge depuis plusieurs jours : pouvez-vous m'indiquer où en est le dossier et s'il vous manque une pièce ?`,
    invoice: (i) => `Bonjour, ${S().company.name}. Sauf erreur, la facture ${i.no} de ${U.chf2(i.ttc)} TTC (véhicule ${i.plate}${i.ref ? ', dossier ' + i.ref : ''}) est échue. Pouvez-vous me donner une date de règlement, ou me signaler ce qui manque au dossier ?`,
    garde: (g, fees) => `Bonjour ${g.owner.name || ''}, ${S().company.name}. Votre véhicule ${g.vehicle.plate} est prêt à sortir de notre parc (25 avenue Claude Vellefaux, Paris 10e). Les frais de garde s'élèvent à ce jour à ${fees}. Quand pouvez-vous passer, avec pièce d'identité et carte grise ?`,
    mission: (m) => `Bonjour ${m.customer.name ? m.customer.name.split(' ')[0] : ''}, ${S().company.name}. Vous nous avez demandé une intervention (${m.kind.toLowerCase()}, ${m.address}). Je vous confirme la prise en charge et je précise avec vous l'accès au véhicule.`,
  };
  function proposals() {
    const out = [], s = S();
    if (DEP.commercial) (s.marketing.leads || []).filter((l) => l.status === 'À rappeler' && l.phone && !hasOpen('lead', l.id, 'Prospect à rappeler')).forEach((l) => { const svc = s.serviceCatalog.find((x) => x.id === l.serviceId); out.push({ kind: 'Prospect à rappeler', targetType: 'lead', targetId: l.id, name: l.name, phone: l.phone, summary: 'Prospect · ' + (svc ? svc.label : '') + (l.department ? ' · ' + l.department : '') + ' · origine : ' + l.source, script: SCRIPTS.lead(l, svc), go: () => APP.open('acquisition', { tab: 'leads' }) }); });
    (DEP.mandats ? DEP.mandats() : []).forEach((x) => { const last = x.ins.history[0]; const d = last ? U.diffDays(U.dOf(last.at), today()) : 99; const i = (s.insurers || []).find((i) => i.short === x.mandant); if (x.ins.status === 'Prise en charge demandée' && d >= 5 && i && i.phone && !hasOpen('mandat', x.id, 'Accord assureur sans réponse')) out.push({ kind: 'Accord assureur sans réponse', targetType: 'mandat', targetId: x.id, name: x.mandant + ' · service sinistres', phone: i.phone, summary: x.no + ' · ' + x.vehicle.plate + ' · demandé il y a ' + d + ' j · ' + chf(x.amount) + ' HT', script: SCRIPTS.mandat(x), go: () => APP.open('mandats', { id: x.src.id }) }); });
    (DEP.invoices ? DEP.invoices() : []).filter((i) => i.status !== 'Payée' && i.due < today()).forEach((i) => { const ins = (s.insurers || []).find((x) => x.short === i.payer); if (ins && ins.phone && !hasOpen('invoice', i.id, 'Facture échue')) out.push({ kind: 'Facture échue', targetType: 'invoice', targetId: i.id, name: i.payer + ' · comptabilité', phone: ins.phone, summary: i.no + ' · ' + U.chf2(i.ttc) + ' TTC · échue le ' + U.fmtD(i.due), script: SCRIPTS.invoice(i), go: () => APP.open('invoices', { id: i.id }) }); });
    DEP.inPark().filter((g) => g.step === 'Prêt à sortir' && g.owner.phone && !hasOpen('garde', g.id, 'Véhicule prêt à sortir')).forEach((g) => out.push({ kind: 'Véhicule prêt à sortir', targetType: 'garde', targetId: g.id, name: g.owner.name || 'Propriétaire', phone: g.owner.phone, summary: g.vehicle.plate + ' · ' + DEP.gardeDays(g) + ' j de garde · ' + chf(DEP.gardeFees(g)) + ' de frais', script: SCRIPTS.garde(g, chf(DEP.gardeFees(g))), go: () => APP.open('parc', { id: g.id }) }));
    S().missions.filter((m) => m.status === 'Demandée' && m.customer.phone && !hasOpen('mission', m.id, 'Demande à confirmer')).forEach((m) => out.push({ kind: 'Demande à confirmer', targetType: 'mission', targetId: m.id, name: m.customer.name, phone: m.customer.phone, summary: m.no + ' · ' + m.kind + ' · ' + m.address, script: SCRIPTS.mission(m), go: () => APP.open('missions', { id: m.id }) }));
    return out;
  }
  DEP.callbackProposals = proposals;

  /* ---------- écran ---------- */
  function reportForm(c, close0) {
    BO.formModal({ title: 'Compte rendu — ' + c.name,
      fields: [{ k: 'outcome', label: 'Résultat de l’appel', type: 'select', opts: OUTCOMES, req: true }, { k: 'note', label: 'Notes (engagements, suite à donner)', type: 'textarea', rows: 3, full: true }, { k: 'close', label: 'Clore ce rappel (fait)', type: 'checkbox' }],
      values: { close: true }, submit: 'Enregistrer le compte rendu',
      onSubmit: (x) => { if (!DEP.callbackReport(c.id, x)) return false; if (close0) close0(); UI.toast('Compte rendu enregistré', c.name + ' · ' + x.outcome, 'ok', 'check'); BO.now(); } });
  }
  function detail(c) {
    const openTarget = () => { if (!c.targetType || !c.targetId) return; const M = { mission: ['missions', c.targetId], garde: ['parc', c.targetId], invoice: ['invoices', c.targetId], lead: ['acquisition', null], mandat: ['mandats', null] }[c.targetType]; if (M) APP.open(M[0], M[1] ? { id: M[1] } : { tab: c.targetType === 'lead' ? 'leads' : undefined }); };
    UI.modal({ title: esc(c.kind) + ' · ' + esc(c.name), wide: true,
      body: `<div class="row wrap" style="gap:8px">${BO.chip(c.status, c.status === 'À rappeler' ? 'amber' : c.status === 'Fait' ? 'green' : '', true)}<span class="xs-t muted">ajouté ${esc(BO.dt(c.at))} · à rappeler le ${esc(U.fmtD(c.due))}</span></div>
        <dl class="kv mt"><dt>Dossier</dt><dd>${esc(c.summary || '—')}</dd><dt>Téléphone</dt><dd><a class="lnk" href="${tel(c.phone)}">${esc(c.phone)}</a></dd></dl>
        ${c.script ? `<h4 class="sm-t mt" style="margin-bottom:6px">Script proposé <span class="muted xs-t">· à adapter, bien sûr</span></h4><div class="intake-raw">${esc(c.script)}</div>` : ''}
        ${c.attempts.length ? `<h4 class="sm-t mt" style="margin-bottom:6px">Historique des appels</h4><ul class="hist">${c.attempts.slice().reverse().map((a) => `<li><b>${esc(a.outcome)}</b>${a.note ? ' · ' + esc(a.note) : ''}<small>${esc(BO.dt(a.at))}</small></li>`).join('')}</ul>` : ''}`,
      foot: `<button class="btn" data-open-target>${BO.icon('eye', 14)}Ouvrir le dossier</button><span class="sp"></span><button class="btn" data-close>Fermer</button>${c.status === 'À rappeler' ? `<a class="btn" href="${tel(c.phone)}">${BO.icon('phone', 14)}Appeler</a><button class="btn pri" data-report>${BO.icon('check', 14)}Compte rendu</button>` : ''}`,
      onMount: (el, close) => {
        el.querySelector('[data-open-target]').addEventListener('click', () => { close(); openTarget(); });
        const r = el.querySelector('[data-report]'); if (r) r.addEventListener('click', () => reportForm(c, close));
      } });
  }
  function addForm() {
    BO.formModal({ title: 'Ajouter un rappel', fields: [{ k: 'name', label: 'Qui rappeler', req: true }, { k: 'phone', label: 'Téléphone', type: 'tel', req: true }, { k: 'kind', label: 'Motif', req: true, ph: 'Rappel demandé, devis, réclamation…' }, { k: 'due', label: 'À rappeler le', type: 'date', req: true }, { k: 'summary', label: 'Résumé pour celui qui appelle', type: 'textarea', full: true }],
      values: { due: today(), kind: 'Rappel demandé' }, submit: 'Ajouter à la file',
      onSubmit: (x) => { if (!DEP.callbackAdd(x)) return false; UI.toast('Ajouté à la file', x.name, 'ok', 'phone'); BO.now(); } });
  }
  function render(el, params) {
    if (params.id && cb(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(cb(id)), 0); }
    const props = proposals(), o = open(), done = list().filter((c) => c.status !== 'À rappeler');
    const rows = (st.seg === 'open' ? o : st.seg === 'done' ? done : list()).slice().sort((a, b) => (a.due < b.due ? -1 : 1));
    el.innerHTML = `<div class="bo-page">${BO.head('À rappeler', `${o.length} appel${o.length > 1 ? 's' : ''} dans la file · ${props.length} proposition${props.length > 1 ? 's' : ''} depuis les dossiers`, `<button class="btn pri" data-add>${BO.icon('plus', 15)}Ajouter un rappel</button>`)}
      <div class="form-note mb">${BO.icon('phone', 16)}<div><b>Appels passés par le bureau, avec son téléphone.</b> MOTEK prépare la file, le résumé et un script ; le compte rendu est saisi à la main et conservé. Aucune intégration téléphonique n’est raccordée, aucun appel automatique, aucun enregistrement.</div></div>
      ${props.length ? `<div class="card mb"><div class="card-h"><h3>${BO.icon('bell', 16)}Propositions depuis les dossiers <small>· ${props.length} · le bureau décide</small></h3></div><div>${props.map((p, i) => `<div class="todo"><span class="tic mid">${BO.icon('phone', 16)}</span><div class="tx"><b>${esc(p.kind)} · ${esc(p.name)}</b><span>${esc(p.summary)}</span></div><div class="ta"><button class="btn sm" data-see="${i}">Voir</button><button class="btn sm pri" data-queue="${i}">Ajouter à la file</button></div></div>`).join('')}</div></div>` : ''}
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['open', 'À rappeler', o.length], ['done', 'Faits', done.length], ['all', 'Tous', list().length]], st.seg)}</div>
      <div class="g">${rows.map((c) => `<div class="card" data-c="${c.id}"><div class="card-b row" style="gap:12px;align-items:center"><span class="tic ${c.status === 'À rappeler' ? (c.due < today() ? 'high' : 'mid') : 'low'}" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${BO.icon('phone', 16)}</span><div style="flex:1;min-width:0"><div class="row wrap" style="gap:8px"><b>${esc(c.name)}</b><span class="chip line">${esc(c.kind)}</span>${BO.chip(c.status, c.status === 'À rappeler' ? 'amber' : c.status === 'Fait' ? 'green' : '', true)}${c.due < today() && c.status === 'À rappeler' ? '<span class="chip red">en retard</span>' : ''}</div><div class="xs-t muted mt1" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.summary || '')}${c.attempts.length ? ' · ' + c.attempts.length + ' appel' + (c.attempts.length > 1 ? 's' : '') + ' (' + esc(c.attempts[c.attempts.length - 1].outcome) + ')' : ''}</div></div><div class="ta" style="flex:none">${c.status === 'À rappeler' ? `<a class="btn sm" href="${tel(c.phone)}" onclick="event.stopPropagation()">${BO.icon('phone', 13)}Appeler</a><button class="btn sm pri" data-rep="${c.id}">Compte rendu</button>` : ''}</div></div></div>`).join('') || `<div class="card"><div class="card-b">${BO.empty('check', 'File vide', 'Ajoutez un rappel ou prenez une proposition ci-dessus.', '', true)}</div></div>`}</div></div>`;
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    el.querySelector('[data-add]').addEventListener('click', addForm);
    el.querySelectorAll('[data-queue]').forEach((b) => b.addEventListener('click', () => { const p = props[+b.dataset.queue]; if (DEP.callbackAdd(p)) { UI.toast('Ajouté à la file', p.name, 'ok', 'phone'); BO.now(); } }));
    el.querySelectorAll('[data-see]').forEach((b) => b.addEventListener('click', () => props[+b.dataset.see].go()));
    el.querySelectorAll('[data-rep]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); reportForm(cb(b.dataset.rep)); }));
    el.querySelectorAll('[data-c]').forEach((c) => c.addEventListener('click', (e) => { if (e.target.closest('button,a')) return; detail(cb(c.dataset.c)); }));
  }
  APP.register({ id: 'callbacks', label: 'À rappeler', icon: 'phone', group: 'Pilotage', order: 2, activity: 'depannage', render, badge: () => { try { return open().length; } catch (e) { return 0; } } });
})();
