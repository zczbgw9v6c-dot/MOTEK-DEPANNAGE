/* ==========================================================================
   BO · Sinistres & assurances : dossiers par assureur, coordination expert
   (date d'expertise, rapport, accord / refus, montant accordé vs devis),
   cession de créance, franchise à charge du client, relances assureurs.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2, today } = U;
  const st = { f: 'open', ins: '', q: '', tbl: { sort: 'date', dir: 'desc' } };
  const APC = { 'Déclaré': '', 'Expertise planifiée': 'amber', 'Accordé': 'green', 'Partiel': 'amber', 'Refusé': 'red' };
  const STEPS = ['Déclaré', 'Expertise', 'Rapport', 'Accord', 'Payé'];
  const stepOf = k => { const inv = CX.S.invoices.filter(i => i.roId === k.roId && i.kind === 'assurance'); if (inv.length && inv.every(i => i.status === 'Payée')) return 4; if (['Accordé', 'Partiel', 'Refusé'].includes(k.approval)) return 3; if (k.report) return 2; if (k.expertiseAt) return 1; return 0; };
  const isOpen = k => { const r = k.roId ? CX.ro(k.roId) : null; const inv = CX.S.invoices.filter(i => i.roId === k.roId && i.kind === 'assurance'); return !(r && r.stage === CX.ST.facture && inv.every(i => i.status === 'Payée')); };
  const quoteOf = k => CX.S.quotes.find(q => q.claimId === k.id && q.status !== 'Refusé' && (!q.version || q.version === 1)) || CX.S.quotes.find(q => q.claimId === k.id);

  /* ---------------- actions partagées ---------------- */
  BO.claimPlan = id => {
    const k = CX.claim(id), i = CX.ins(k.insurerId);
    BO.formModal({ title: 'Planifier l’expertise — ' + (i ? i.short : '') + ' ' + k.no, intro: `<div class="form-note">${BO.icon('shield', 16)}<div>${esc(CX.vlabel(CX.veh(k.vehicleId)))} · ${esc(CX.custName(k.customerId))} · ${esc(k.kind)}. Un rendez-vous « Expertise » est ajouté à l’agenda de réception.</div></div>`,
      fields: [{ k: 'expert', label: 'Expert', type: 'select', opts: (i ? i.experts : []).concat(['Autre expert indépendant']), req: true }, { k: 'mode', label: 'Mode', type: 'select', opts: ['Sur place', 'Photos', 'Centre d’expertise'], req: true },
        { k: 'date', label: 'Date', type: 'date', req: true, v: U.wd(1), validate: v => U.isWeekend(v) ? 'Jour ouvré requis' : v < today() ? 'Date passée' : '' }, { k: 'time', label: 'Heure', type: 'time', req: true, v: '10:00' }],
      submit: 'Planifier', onSubmit: x => { CX.planExpertise(id, x.date + ' ' + x.time, x.expert, x.mode); UI.toast('Expertise planifiée', x.expert + ' · ' + BO.date(x.date) + ' ' + x.time, 'ok', 'cal'); BO.now(); } });
  };
  BO.claimRemind = id => {
    const k = CX.claim(id), i = CX.ins(k.insurerId), v = CX.veh(k.vehicleId), q = quoteOf(k), t = q ? CX.quoteTotals(q) : null, n = (k.reminders || []).length + 1;
    BO.compose({ title: `Relance ${n === 1 ? '' : n + 'e '}— ${i.short} · ${k.no}`, to: i.email, channel: 'E-mail', subject: `Sinistre ${k.no} — ${v.plate} — relance ${n}`,
      body: `Madame, Monsieur,\n\nSauf erreur de notre part, nous restons sans nouvelles concernant le sinistre ${k.no} (${k.kind.toLowerCase()}) de votre assuré·e ${CX.custName(k.customerId)}, véhicule ${v.make} ${v.model} ${v.plate}.\n\n${k.expertiseAt ? `L’expertise a eu lieu le ${U.fmtD(U.dOf(k.expertiseAt))} (${k.expert}).` : 'Aucune expertise n’a encore été planifiée.'}${q ? `\nNotre devis ${q.no} s’élève à ${chf2(t.ttc)} TTC.` : ''}\n\nLe véhicule étant immobilisé, nous vous remercions de nous transmettre votre décision de prise en charge sous 48 heures.\n\nMeilleures salutations,\nMarc Dubois — MOTEK Garage · ${CX.S.company.phone}`,
      okLabel: 'Envoyer la relance', onSend: () => { k.reminders = k.reminders || []; k.reminders.push({ at: CX.now(), to: i.short }); CX.updateClaim(id, {}, 'Relance n° ' + n + ' envoyée à ' + i.short); UI.toast('Relance envoyée', i.short + ' · ' + k.no, 'ok', 'send'); BO.now(); } });
  };
  BO.printCession = id => {
    const k = CX.claim(id), i = CX.ins(k.insurerId), c = CX.cust(k.customerId), v = CX.veh(k.vehicleId), co = CX.S.company;
    const inner = `${BO.printHeader()}<h1>Cession de créance</h1><div class="meta">Sinistre ${esc(k.no)} · ${esc(i.name)}</div>
      <p style="line-height:1.7">Le/la soussigné·e <b>${esc(c.name)}</b>, ${esc(c.addr)}, ${esc(c.city)}, détenteur/trice du véhicule <b>${esc(v.make)} ${esc(v.model)}</b> immatriculé <b>${esc(v.plate)}</b> (VIN ${esc(v.vin)}), cède par la présente à <b>${esc(co.name)}</b>, ${esc(co.address)}, la créance qu’il/elle détient envers <b>${esc(i.name)}</b> au titre du sinistre n° <b>${esc(k.no)}</b> du ${esc(U.fmtD(k.date))}, à concurrence du montant des réparations facturées, sous déduction de la franchise contractuelle de <b>${chf(k.franchise)}</b> qui reste à sa charge.</p>
      <p style="line-height:1.7">L’assureur est invité à verser directement l’indemnité due sur le compte ${esc(co.iban)} (${esc(co.bank)}). La présente cession est faite conformément aux art. 164 ss CO. Les montants non couverts par l’assureur (franchise, travaux hors sinistre, refus de prise en charge) restent dus par le/la détenteur/trice.</p>
      <div class="sig"><div>Lieu, date</div><div>Signature du/de la cédant·e</div><div>Pour ${esc(co.name)}</div></div>`;
    BO.preview('Cession de créance — ' + k.no, BO.printHtml('Cession ' + k.no, inner), 'Cession-' + k.no + '.html');
  };
  function decide(id) {
    const k = CX.claim(id), q = quoteOf(k), t = q ? CX.quoteTotals(q) : null;
    BO.formModal({ title: 'Rapport d’expertise / décision — ' + k.no, intro: q ? `<div class="form-note">${BO.icon('calc', 16)}<div>Devis ${esc(q.no)} : <b>${chf2(t.ttc)}</b> TTC — part assureur prévue ${chf2(t.insurer)}, franchise ${chf(t.franchise)}.</div></div>` : '',
      fields: [{ k: 'decision', label: 'Décision', type: 'select', opts: ['Accordé', 'Partiel', 'Refusé'], req: true }, { k: 'amount', label: 'Montant accordé (€ TTC)', type: 'number', min: 0, step: .05, v: t ? t.insurer + t.franchise : '', validate: (v2, a) => a.decision !== 'Refusé' && !(v2 > 0) ? 'Montant requis' : '' }, { k: 'note', label: 'Commentaire de l’expert', type: 'textarea', full: true, ph: 'ex. remplacement du capot refusé, réparation admise' }],
      submit: 'Enregistrer', onSubmit: x => { CX.decideClaim(id, x.decision, x.amount || 0, x.note); UI.toast(x.decision === 'Refusé' ? 'Refus enregistré' : 'Accord enregistré', k.no + (x.amount ? ' · ' + chf(x.amount) : ''), x.decision === 'Refusé' ? 'warn' : 'ok', 'shieldok'); BO.now(); } });
  }
  function editClaim(id) {
    const k = CX.claim(id);
    BO.formModal({ title: 'Modifier le sinistre ' + k.no, fields: [{ k: 'no', label: 'N° de sinistre', req: true }, { k: 'insurerId', label: 'Assureur', type: 'select', opts: BO.optInsurers(), req: true }, { k: 'kind', label: 'Nature', type: 'select', opts: ['Collision', 'Collision (tiers identifié)', 'Collision frontale', 'Accrochage parking', 'Grêle', 'Vandalisme', 'Bris de glace', 'Animal', 'Dégâts fin de leasing'] }, { k: 'cover', label: 'Couverture', type: 'select', opts: ['Tous risques', 'Tiers étendu', 'RC adverse', 'Hors assurance (bailleur)'] }, { k: 'franchise', label: 'Franchise client (€)', type: 'number', min: 0, step: 50, req: true }, { k: 'date', label: 'Date du sinistre', type: 'date', req: true }, { k: 'notes', label: 'Notes', type: 'textarea', full: true }],
      values: k, onSubmit: x => { CX.updateClaim(id, x, 'Sinistre modifié (franchise ' + chf(x.franchise) + ')'); UI.toast('Sinistre mis à jour', x.no, 'ok', 'check'); BO.now(); } });
  }

  function drawer(id) {
    BO.drawer({ wide: true,
      title: () => { const k = CX.claim(id); return k ? 'Sinistre ' + esc(k.no) : null; },
      sub: () => { const k = CX.claim(id); return `${BO.ins(k.insurerId)} ${BO.chip(k.approval, APC[k.approval] || '', true)} <span>${esc(k.kind)} · ${esc(k.cover)}</span>`; },
      render: () => {
        const k = CX.claim(id), i = CX.ins(k.insurerId), v = CX.veh(k.vehicleId), c = CX.cust(k.customerId), r = k.roId ? CX.ro(k.roId) : null, q = quoteOf(k), t = q ? CX.quoteTotals(q) : null, s = stepOf(k);
        const inv = CX.S.invoices.filter(x => x.roId === k.roId && x.kind === 'assurance');
        return `<div class="dsec"><div class="wfl">${STEPS.map((l, n) => `<div class="${n < s ? 'done' : n === s ? 'cur' : 'fut'}"><span class="c">${n < s ? BO.icon('check', 12) : BO.icon(['file', 'cal', 'clip', 'shieldok', 'coins'][n], 12)}</span><div class="n">${l}</div><div class="t">${n === 0 ? esc(BO.dateS(k.declaredAt)) : n === 1 && k.expertiseAt ? esc(BO.dt(k.expertiseAt)) : n === 3 && k.approvedAmount != null ? chf(k.approvedAmount) : ''}</div></div>`).join('')}</div></div>
          <div class="g g2 dsec"><div><h4 style="font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--ink3);margin-bottom:9px">Dossier</h4><dl class="kv"><dt>Véhicule</dt><dd>${BO.plate(v.plate)} ${esc(CX.vlabel(v))}</dd><dt>Assuré·e</dt><dd><a class="lnk" data-open="crm:${c.id}">${esc(c.name)}</a></dd><dt>Date du sinistre</dt><dd>${esc(BO.date(k.date))}</dd><dt>OR</dt><dd>${r ? BO.roLink(r) + ' · ' + esc(CX.STAGES[r.stage].s) : '—'}</dd><dt>Franchise</dt><dd><b>${chf(k.franchise)}</b> à charge du client</dd><dt>Cession de créance</dt><dd>${k.cession ? `<span class="ok-t b">Signée</span> · ${esc(BO.dt(k.cessionAt))}` : '<span class="warn-t b">Non signée</span>'}</dd></dl></div>
            <div><h4 style="font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--ink3);margin-bottom:9px">Assureur & expert</h4><dl class="kv"><dt>Compagnie</dt><dd>${esc(i.name)}</dd><dt>Service sinistres</dt><dd>${esc(i.phone)}<br><span class="xs-t">${esc(i.email)}</span></dd><dt>Expert</dt><dd>${esc(k.expert || 'non désigné')}</dd><dt>Expertise</dt><dd>${k.expertiseAt ? esc(BO.dt(k.expertiseAt)) + ' · ' + esc(k.expertiseMode) : '<span class="warn-t b">à planifier</span>'}</dd><dt>Rapport</dt><dd>${k.report ? '<span class="ok-t b">Reçu</span>' : 'en attente'}</dd><dt>Délai moyen ${esc(i.short)}</dt><dd>${i.payDays} j de paiement</dd></dl></div></div>
          <div class="dsec"><h4>Montants</h4>${t ? `<div class="g g3" style="gap:10px"><div class="tile"><div class="tl">Devis ${esc(q.no)}</div><div class="tv">${chf(t.ttc)}</div></div><div class="tile"><div class="tl">Accordé</div><div class="tv ${k.approvedAmount != null && k.approvedAmount + 1 < t.insurer + t.franchise ? 'warn-t' : ''}">${k.approvedAmount != null ? chf(k.approvedAmount) : '—'}</div></div><div class="tile"><div class="tl">Facturé assureur</div><div class="tv">${inv.length ? chf(inv.reduce((a, x) => a + x.amount, 0)) : '—'}</div></div></div><div class="mt">${BO.split(t)}</div>` : BO.empty('calc', 'Pas encore de devis', '', `<button class="btn sm pri" data-open="quotes:${k.roId || ''}:new">${BO.icon('plus', 13)}Créer le devis</button>`, true)}</div>
          ${(k.reminders || []).length ? `<div class="dsec"><h4>Relances <span class="chip amber">${k.reminders.length}</span></h4><div class="mini-list">${k.reminders.map((x, n) => `<div>${BO.icon('send', 14)}<span class="sm-t">Relance ${n + 1} · ${esc(x.to)}</span><span class="sp"></span><span class="xs-t muted">${esc(BO.dt(x.at))}</span></div>`).join('')}</div></div>` : ''}
          <div class="dsec"><h4>Journal du dossier</h4>${(k.log || []).length ? `<ul class="hist">${k.log.map(l => `<li><b>${esc(l.text)}</b><small>${esc(BO.dt(l.at))}</small></li>`).join('')}</ul>` : '<div class="muted sm-t">Aucun événement.</div>'}${k.notes ? `<div class="note-box mt1">${esc(k.notes)}</div>` : ''}</div>`;
      },
      foot: () => { const k = CX.claim(id); return `<button class="btn" data-edit>${BO.icon('edit', 14)}Modifier</button><button class="btn" data-ces>${BO.icon('file', 14)}Cession de créance</button>${!k.cession ? `<button class="btn" data-sign>${BO.icon('pen', 14)}Marquer signée</button>` : ''}<span class="sp"></span>${!['Accordé', 'Refusé', 'Partiel'].includes(k.approval) ? `<button class="btn" data-rem>${BO.icon('send', 14)}Relancer</button>${!k.expertiseAt ? `<button class="btn" data-plan>${BO.icon('cal', 14)}Planifier l’expertise</button>` : ''}<button class="btn pri" data-dec>${BO.icon('shieldok', 14)}Décision assureur</button>` : `<button class="btn" data-dec>${BO.icon('edit', 14)}Corriger la décision</button>`}`; },
      onMount: d => {
        const on = (s, f) => { const b = d.querySelector(s); if (b) b.addEventListener('click', f); };
        on('[data-edit]', () => editClaim(id)); on('[data-ces]', () => BO.printCession(id)); on('[data-sign]', () => { CX.updateClaim(id, { cession: true, cessionAt: CX.now() }, 'Cession de créance signée par le client'); UI.toast('Cession signée', CX.claim(id).no, 'ok', 'pen'); BO.now(); });
        on('[data-rem]', () => BO.claimRemind(id)); on('[data-plan]', () => BO.claimPlan(id)); on('[data-dec]', () => decide(id));
      } });
  }

  function render(el, params) {
    if (params.id && CX.claim(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => drawer(id), 0); }
    const S = CX.S, all = S.claims.filter(k => k.roId);
    const rows = all.filter(k => {
      if (st.f === 'open' && !isOpen(k)) return false;
      if (st.f !== 'open' && st.f !== 'all' && k.approval !== st.f) return false;
      if (st.ins && k.insurerId !== st.ins) return false;
      if (st.q) { const v = CX.veh(k.vehicleId) || {}, q = st.q.toLowerCase(); if (![k.no, v.plate, CX.custName(k.customerId), (CX.ins(k.insurerId) || {}).short].some(x => String(x).toLowerCase().includes(q))) return false; }
      return true;
    });
    const open = all.filter(isOpen), pendingAmt = open.filter(k => !['Accordé', 'Partiel', 'Refusé'].includes(k.approval)).reduce((a, k) => { const q = quoteOf(k); return a + (q ? CX.quoteTotals(q).ttc : 0); }, 0);
    const dueIns = S.invoices.filter(i => i.kind === 'assurance' && i.status !== 'Payée').reduce((a, i) => a + i.amount - i.paid, 0);
    const delays = all.filter(k => k.approvedAmount != null && k.declaredAt).map(k => { const q = quoteOf(k); return q && q.decidedAt ? Math.max(0, U.diffDays(k.declaredAt, U.dOf(q.decidedAt))) : null; }).filter(x => x != null);
    el.innerHTML = `<div class="bo-page">${BO.head('Sinistres & assurances', `${open.length} dossiers ouverts · ${open.filter(k => !k.expertiseAt && k.approval === 'Déclaré').length} expertises à planifier · ${open.filter(k => !k.cession && !/hors/i.test(k.cover)).length} cessions à faire signer`, `<button class="btn pri" data-new>${BO.icon('plus', 15)}Déclarer un sinistre</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">${BO.kpi({ lb: 'Dossiers ouverts', v: open.length, s: `${open.filter(k => k.approval === 'Expertise planifiée').length} expertises planifiées`, icon: 'shield' })}${BO.kpi({ lb: 'En attente d’accord', v: chf(pendingAmt), s: `${open.filter(k => !['Accordé', 'Partiel', 'Refusé'].includes(k.approval)).length} dossiers`, icon: 'clock', cls: 'hero' })}${BO.kpi({ lb: 'À encaisser des assureurs', v: chf(dueIns), s: `${S.invoices.filter(i => i.kind === 'assurance' && i.status !== 'Payée').length} factures ouvertes`, icon: 'coins', go: 'invoices' })}${BO.kpi({ lb: 'Délai moyen d’accord', v: (delays.length ? BO.num(delays.reduce((a, b) => a + b, 0) / delays.length, 1) : '—') + '<small>jours</small>', s: 'déclaration → accord', icon: 'gauge' })}</div>
      <div class="ins-cards">${S.insurers.map(i => { const ks = open.filter(k => k.insurerId === i.id); const amt = S.invoices.filter(x => x.kind === 'assurance' && x.payerId === i.id && x.status !== 'Payée').reduce((a, x) => a + x.amount - x.paid, 0); return `<div class="ins-card ${st.ins === i.id ? 'on' : ''}" data-ins="${i.id}"><span class="bnd" style="background:${i.color}"></span><b>${esc(i.short)}</b><div class="nn"><span><b>${ks.length}</b>dossiers</span><span><b>${U.chfK(amt)}</b>à encaisser</span></div></div>`; }).join('')}</div>
      <div class="toolbar"><div class="srch"><input class="inp" data-q placeholder="N° sinistre, plaque, client…" value="${esc(st.q)}">${BO.icon('search', 16)}</div>${BO.seg('f', [['open', 'Ouverts'], ['Déclaré', 'Déclarés'], ['Expertise planifiée', 'Expertise'], ['Accordé', 'Accordés'], ['Partiel', 'Partiels'], ['Refusé', 'Refusés'], ['all', 'Tous']], st.f)}${st.ins ? `<button class="btn sm" data-clr>${BO.icon('x', 13)}${esc(CX.ins(st.ins).short)}</button>` : ''}</div>
      <div data-t></div></div>`;
    BO.table(el.querySelector('[data-t]'), { rows, state: st.tbl, onRow: k => drawer(k.id),
      empty: BO.empty('shield', 'Aucun sinistre', 'Aucun dossier ne correspond aux filtres.', '', true),
      cols: [
        { k: 'no', label: 'Sinistre', render: k => `<b class="nowrap">${esc(k.no)}</b><div class="xs-t muted nowrap">${esc(k.kind)}</div>` },
        { k: 'ins', label: 'Assureur', get: k => (CX.ins(k.insurerId) || {}).short, render: k => BO.ins(k.insurerId) },
        { k: 'veh', label: 'Véhicule / assuré', get: k => (CX.veh(k.vehicleId) || {}).plate, render: k => BO.vehCell(CX.veh(k.vehicleId), CX.custName(k.customerId)) },
        { k: 'exp', label: 'Expert', get: k => k.expertiseAt || 'z', render: k => k.expertiseAt ? `<div class="t1 sm-t nowrap">${esc(k.expert || '—')}</div><div class="t2">${esc(BO.dt(k.expertiseAt))} · ${esc(k.expertiseMode)}</div>` : (/hors/i.test(k.cover) ? '<span class="muted xs-t">sans expert</span>' : `<button class="btn xs" data-plan="${k.id}">${BO.icon('cal', 11)}Planifier</button>`) },
        { k: 'approval', label: 'Accord', render: k => BO.chip(k.approval, APC[k.approval] || '', true) },
        { k: 'amt', label: 'Devis / accordé', num: true, get: k => { const q = quoteOf(k); return q ? CX.quoteTotals(q).ttc : 0; }, render: k => { const q = quoteOf(k); if (!q) return '<span class="muted">—</span>'; const t = CX.quoteTotals(q); return `<div class="cmp" style="min-width:150px"><span>${chf(t.ttc)}</span><b>${k.approvedAmount != null ? chf(k.approvedAmount) : '—'}</b>${BO.pbar(k.approvedAmount != null ? Math.min(1, k.approvedAmount / Math.max(1, t.insurer + t.franchise)) : 0, k.approvedAmount != null && k.approvedAmount + 1 < t.insurer + t.franchise ? 'a' : 'g')}<span></span></div>`; } },
        { k: 'franchise', label: 'Franchise', num: true, render: k => chf(k.franchise) },
        { k: 'cession', label: 'Cession', get: k => k.cession ? 1 : 0, render: k => k.cession ? `<span class="chip green">${BO.icon('check', 11)}signée</span>` : /hors/i.test(k.cover) ? '<span class="muted">—</span>' : '<span class="chip amber">à signer</span>' },
        { k: 'rel', label: 'Relances', num: true, get: k => (k.reminders || []).length, render: k => !['Accordé', 'Partiel', 'Refusé'].includes(k.approval) ? `<button class="btn xs" data-rel="${k.id}">${BO.icon('send', 11)}${(k.reminders || []).length ? (k.reminders || []).length + ' · ' : ''}Relancer</button>` : `<span class="muted">${(k.reminders || []).length || '—'}</span>` },
      ], after: host => { host.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', () => BO.claimPlan(b.dataset.plan))); host.querySelectorAll('[data-rel]').forEach(b => b.addEventListener('click', () => BO.claimRemind(b.dataset.rel))); } });
    BO.bindSearch(el, v => { st.q = v; });
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    el.querySelectorAll('[data-ins]').forEach(c => c.addEventListener('click', () => { st.ins = st.ins === c.dataset.ins ? '' : c.dataset.ins; APP.refresh(); }));
    const clr = el.querySelector('[data-clr]'); if (clr) clr.addEventListener('click', () => { st.ins = ''; APP.refresh(); });
    el.querySelector('[data-new]').addEventListener('click', () => BO.formModal({ title: 'Déclarer un sinistre', fields: [{ k: 'roId', label: 'OR concerné', type: 'select', opts: BO.optROs(r => r.stage < CX.ST.facture && !r.claimId), req: true }, { k: 'insurerId', label: 'Assureur', type: 'select', opts: BO.optInsurers(), req: true }, { k: 'no', label: 'N° de sinistre', req: true, ph: 'communiqué par l’assureur' }, { k: 'kind', label: 'Nature', type: 'select', opts: ['Collision', 'Accrochage parking', 'Grêle', 'Vandalisme', 'Bris de glace', 'Animal'] }, { k: 'cover', label: 'Couverture', type: 'select', opts: ['Tous risques', 'Tiers étendu', 'RC adverse'] }, { k: 'franchise', label: 'Franchise (€)', type: 'number', min: 0, step: 50, v: 500, req: true }, { k: 'date', label: 'Date du sinistre', type: 'date', v: today(), req: true }],
      onSubmit: x => { const r = CX.ro(x.roId); const k = CX.upsert('claims', { id: U.uid('K'), no: x.no, insurerId: x.insurerId, vehicleId: r.vehicleId, customerId: r.customerId, roId: r.id, kind: x.kind, cover: x.cover, franchise: x.franchise, date: x.date, declaredAt: today(), expert: null, expertiseAt: null, expertiseMode: 'Sur place', report: null, approval: 'Déclaré', approvedAmount: null, cession: false, cessionAt: null, reminders: [], notes: '', log: [{ at: CX.now(), text: 'Sinistre déclaré' }] }, 'claim'); r.claimId = k.id; const q = CX.roQuote(r); if (q && !q.claimId) q.claimId = k.id; CX.touch('ro', { roId: r.id }); UI.toast('Sinistre déclaré', x.no + ' · ' + CX.ins(x.insurerId).short, 'ok', 'shield'); BO.now(); } }));
  }

  APP.register({ id: 'claims', label: 'Sinistres & assurances', icon: 'shield', group: 'Commercial & assurances', order: 2, activity: 'atelier', render, badge: () => CX.S.claims.filter(k => k.roId && !k.expertiseAt && k.approval === 'Déclaré' && !/hors/i.test(k.cover) && (CX.ro(k.roId) || {}).stage < CX.ST.facture).length });
})();
