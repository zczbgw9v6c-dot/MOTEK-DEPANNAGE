/* ==========================================================================
   BO · Mandats & assurances (dépannage) : chaque mission ou garde mandatée
   par un assureur est un mandat à faire prendre en charge, accorder,
   facturer et encaisser. Boîte mail assureurs en mode simulé : les courriels
   reçus sont lus, classés (accord, refus, paiement, demande de pièces) et
   transformés en actions à confirmer. Aucun compte mail n'est raccordé.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, today } = U;
  const st = { seg: 'all', tab: 'mandats', q: '' };
  const STATUSES = ['À déclarer', 'Prise en charge demandée', 'Accordée', 'Refusée', 'Facturée', 'Payée'];
  const TONE = { 'À déclarer': 'red', 'Prise en charge demandée': 'amber', 'Accordée': 'green', 'Refusée': 'red', 'Facturée': 'amber', 'Payée': 'dark' };
  const insurer = name => CX.S.insurers.find(i => i.short === name || i.name === name) || null;

  /** Un mandat = une mission ou une garde dont le mandant n'est pas un particulier. */
  function mandats() {
    const S = CX.S, out = [];
    S.missions.forEach(m => { if (m.mandant === 'Particulier') return; m.insurance = m.insurance || { status: m.status === 'Facturée' ? 'Facturée' : 'À déclarer', history: [] }; out.push({ id: 'M:' + m.id, kind: 'mission', ref: m.ref || '', no: m.no, mandant: m.mandant, vehicle: m.vehicle, amount: m.price, date: U.dOf(m.at), ins: m.insurance, src: m, label: m.kind + ' · ' + m.address }); });
    S.gardes.forEach(g => { if (g.mandant === 'Particulier') return; g.insurance = g.insurance || { status: 'À déclarer', history: [] }; out.push({ id: 'G:' + g.id, kind: 'garde', ref: g.ref || '', no: g.no, mandant: g.mandant, vehicle: g.vehicle, amount: g.outAt ? g.total || DEP.gardeFees(g) : DEP.gardeFees(g), date: g.since, ins: g.insurance, src: g, label: 'Gardiennage · ' + DEP.gardeDays(g) + ' j · ' + g.reason }); });
    return out;
  }
  const byId = id => mandats().find(x => x.id === id);
  const setStatus = (x, status, text) => { x.ins.status = status; x.ins.history.unshift({ at: CX.now(), text: text || status, by: CX.S.meId }); if (status === 'Payée') { x.ins.paidAt = today(); const inv = DEP.invoiceOf ? DEP.invoiceOf(x.kind, x.src.id) : null; if (inv && inv.status !== 'Payée') DEP.payInvoice(inv, inv.ttc - (inv.paid || 0), today(), text || 'paiement assureur'); } CX.touch(x.kind === 'mission' ? 'mission' : 'garde'); };
  /** Délai moyen de paiement constaté (jours entre facture et règlement) par compagnie. */
  function payDelay(name) { const inv = (DEP.invoices ? DEP.invoices() : []).filter(i => i.payer === name && i.paidAt && i.at); if (!inv.length) return null; return Math.round(inv.reduce((a, i) => a + U.diffDays(i.at, i.paidAt), 0) / inv.length); }
  function insurerForm(name) { const i = insurer(name); BO.formModal({ title: 'Contact ' + name, fields: [{ k: 'email', label: 'E-mail sinistres', type: 'email' }, { k: 'phone', label: 'Téléphone', type: 'tel' }, { k: 'payDays', label: 'Délai de paiement convenu (jours)', type: 'number', min: 0, max: 120 }], values: i || { payDays: 30 }, submit: 'Enregistrer', onSubmit: v => { if (i) Object.assign(i, { email: v.email || '', phone: v.phone || '', payDays: +v.payDays || i.payDays }); else CX.S.insurers.push({ id: U.uid('ins'), short: name, name, color: '#59606b', email: v.email || '', phone: v.phone || '', experts: [], payDays: +v.payDays || 30, convention: true }); CX.touch('insurer'); UI.toast('Contact enregistré', name, 'ok', 'shield'); BO.now(); } }); }
  window.DEP = window.DEP || {}; DEP.mandats = mandats; DEP.setMandatStatus = (id, status, text) => { const x = typeof id === 'string' ? byId(id) : id; if (x) setStatus(x, status, text); }; DEP.applyMail = m => applyMail(typeof m === 'string' ? inbox().find(x => x.id === m) : m);

  function askCoverage(x) {
    const i = insurer(x.mandant);
    BO.compose({ title: 'Demande de prise en charge — ' + x.no, to: i ? i.email || '' : '', channel: 'E-mail', subject: `Demande de prise en charge — ${x.ref || x.no} — ${x.vehicle.plate}`,
      body: `Madame, Monsieur,\n\nNous sommes intervenus pour votre assuré sur le véhicule ${x.vehicle.make} ${x.vehicle.model} immatriculé ${x.vehicle.plate} (${x.label}).\n\nRéférence sinistre : ${x.ref || 'à nous communiquer'}\nMontant : ${chf(x.amount)} HT\n\nMerci de nous confirmer la prise en charge et de nous indiquer la suite à donner.\n\n${CX.S.company.name} · agréé toutes compagnies · ${CX.S.company.phone}`,
      note: `Mandant : <b>${esc(x.mandant)}</b>${i && i.email ? ' · ' + esc(i.email) : ' · adresse à renseigner dans Clients & véhicules'}`, okLabel: 'J’ai envoyé la demande',
      onSend: m => { setStatus(x, 'Prise en charge demandée', 'Prise en charge demandée (' + m.channel + ', déclaré envoyé à ' + m.to + ')'); UI.toast('Demande tracée', x.no, 'ok', 'send'); BO.now(); } });
  }
  function detail(x) {
    UI.modal({ title: esc(x.no) + ' · ' + esc(x.mandant), wide: true,
      body: `<div class="row" style="gap:18px;align-items:flex-start">${UI.carPic(x.vehicle.hex, 120, 90)}<div style="flex:1"><div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(x.vehicle.plate, true)}<b>${esc(x.vehicle.make)} ${esc(x.vehicle.model)}</b>${BO.chip(x.ins.status, TONE[x.ins.status], true)}</div>
        <div class="tiles mt"><div class="tile"><div class="tl">Type</div><div class="tv" style="font-size:14px">${x.kind === 'mission' ? 'Mission' : 'Gardiennage'}</div></div><div class="tile"><div class="tl">Référence</div><div class="tv" style="font-size:14px">${esc(x.ref || '—')}</div></div><div class="tile"><div class="tl">Montant HT</div><div class="tv">${chf(x.amount)}</div></div><div class="tile"><div class="tl">Date</div><div class="tv" style="font-size:14px">${esc(U.fmtD(x.date))}</div></div></div>
        <p class="sm-t mt">${esc(x.label)}</p>
        ${x.ins.history.length ? `<ul class="hist mt">${x.ins.history.slice(0, 8).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul>` : '<div class="muted sm-t mt">Aucune démarche enregistrée.</div>'}</div></div>`,
      foot: `<button class="btn" data-open-src>${BO.icon('eye', 14)}Ouvrir ${x.kind === 'mission' ? 'la mission' : 'la garde'}</button><span class="sp"></span><button class="btn" data-close>Fermer</button>${x.ins.status === 'À déclarer' ? `<button class="btn pri" data-ask>${BO.icon('send', 14)}Demander la prise en charge</button>` : ''}${x.ins.status === 'Prise en charge demandée' ? `<button class="btn" data-st="Refusée">Refus reçu</button><button class="btn pri" data-st="Accordée">${BO.icon('check', 14)}Accord reçu (téléphone / courrier)</button>` : ''}${x.ins.status === 'Accordée' ? `<button class="btn pri" data-st="Facturée">${BO.icon('invoice', 14)}Facturée</button>` : ''}${x.ins.status === 'Facturée' ? `<button class="btn pri" data-st="Payée">${BO.icon('coins', 14)}Paiement reçu</button>` : ''}`,
      onMount: (el, close) => {
        el.querySelector('[data-open-src]').addEventListener('click', () => { close(); APP.open(x.kind === 'mission' ? 'missions' : 'parc', { id: x.src.id }); });
        const a = el.querySelector('[data-ask]'); if (a) a.addEventListener('click', () => { close(); askCoverage(x); });
        el.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { const s = b.dataset.st; if (s === 'Payée') { BO.formModal({ title: 'Paiement reçu — ' + x.no, fields: [{ k: 'amount', label: 'Montant reçu (€)', type: 'number', min: 0, req: true, v: x.amount }, { k: 'date', label: 'Date de valeur', type: 'date', req: true, v: today() }, { k: 'ref', label: 'Référence du virement' }], submit: 'Enregistrer', onSubmit: y => { x.ins.paid = +y.amount; setStatus(x, 'Payée', 'Paiement reçu ' + chf(+y.amount) + (y.ref ? ' · ' + y.ref : '') + ' · valeur ' + U.fmtD(y.date)); close(); UI.toast('Paiement enregistré', x.no + ' · ' + chf(+y.amount), 'ok', 'coins'); BO.now(); } }); return; } setStatus(x, s, s + (s === 'Accordée' ? ' — saisie manuelle' : '')); close(); UI.toast(s, x.no, 'ok', 'shield'); BO.now(); }));
      } });
  }

  /* ---------- boîte mail assureurs (simulée) ---------- */
  function inbox() { return CX.S.insMail || []; }
  function applyMail(mail) {
    const x = mandats().find(m => (mail.ref && m.ref === mail.ref) || (mail.plate && m.vehicle.plate === mail.plate));
    if (!x) { UI.toast('Dossier introuvable', 'Aucun mandat ne porte cette référence ou cette plaque.', 'warn'); return; }
    if (mail.intent === 'accord') setStatus(x, 'Accordée', 'Accord reçu par e-mail de ' + mail.from + (mail.amount ? ' · ' + chf(mail.amount) : ''));
    else if (mail.intent === 'refus') setStatus(x, 'Refusée', 'Refus reçu par e-mail : ' + (mail.reason || ''));
    else if (mail.intent === 'paiement') { x.ins.paid = mail.amount; setStatus(x, 'Payée', 'Virement annoncé par e-mail : ' + chf(mail.amount)); }
    else if (mail.intent === 'pieces') x.ins.history.unshift({ at: CX.now(), text: 'Pièces demandées par ' + mail.from + ' : ' + (mail.asked || ''), by: 'agent' });
    mail.handledAt = CX.now(); CX.touch('insMail');
    CX.S.agent.log.unshift({ at: CX.now(), kind: 'agent', text: 'E-mail assureur traité · ' + x.no + ' · ' + mail.intent, done: [mail.subject] });
    UI.toast('E-mail appliqué', x.no + ' · ' + x.ins.status, 'ok', 'check'); BO.now();
  }

  function render(el, params) {
    if (params.id) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => { const x = byId('M:' + id) || byId('G:' + id); if (x) detail(x); }, 0); }
    if (params.tab) { st.tab = params.tab; APP.setParams({ tab: null }); }
    const all = mandats(), q = st.q.toLowerCase();
    let rows = st.seg === 'all' ? all.filter(x => x.ins.status !== 'Payée') : st.seg === 'Payée' ? all.filter(x => x.ins.status === 'Payée') : all.filter(x => x.ins.status === st.seg);
    if (q) rows = rows.filter(x => (x.no + ' ' + x.ref + ' ' + x.mandant + ' ' + x.vehicle.plate + ' ' + x.vehicle.make + ' ' + x.vehicle.model).toLowerCase().includes(q));
    rows.sort((a, b) => STATUSES.indexOf(a.ins.status) - STATUSES.indexOf(b.ins.status) || (a.date < b.date ? -1 : 1));
    const cnt = s => all.filter(x => x.ins.status === s).length, amt = s => all.filter(x => x.ins.status === s).reduce((a, x) => a + x.amount, 0);
    const byIns = {}; all.forEach(x => { const b = byIns[x.mandant] = byIns[x.mandant] || { n: 0, open: 0, wait: 0, toBill: 0, unpaid: 0 }; b.n++; if (x.ins.status !== 'Payée') b.open += x.amount; if (['À déclarer', 'Prise en charge demandée'].includes(x.ins.status)) b.wait++; if (x.ins.status === 'Accordée') b.toBill++; if (x.ins.status === 'Facturée') b.unpaid += x.amount; });
    const mails = inbox(), pending = mails.filter(m => !m.handledAt);
    el.innerHTML = `<div class="bo-page">${BO.head('Assureurs & mandats', `${all.length} mandats · ${cnt('À déclarer')} à déclarer · ${chf(amt('Facturée'))} facturés en attente de paiement`, `<button class="btn ${pending.length ? 'pri' : ''}" data-tab-go="mail">${BO.icon('mail', 15)}Boîte mail assureurs${pending.length ? ' <em style="font-style:normal;background:#fff;color:var(--red);border-radius:6px;padding:0 6px;margin-left:6px">' + pending.length + '</em>' : ''}</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">${BO.kpi({ lb: 'À déclarer', v: cnt('À déclarer'), icon: 'alert', cls: cnt('À déclarer') ? 'warn' : '', s: chf(amt('À déclarer')) + ' HT' })}${BO.kpi({ lb: 'En attente d’accord', v: cnt('Prise en charge demandée'), icon: 'shield', s: chf(amt('Prise en charge demandée')) + ' HT' })}${BO.kpi({ lb: 'Accordés, à facturer', v: cnt('Accordée'), icon: 'check', s: chf(amt('Accordée')) + ' HT' })}${BO.kpi({ lb: 'Facturés, à encaisser', v: cnt('Facturée'), icon: 'invoice', s: chf(amt('Facturée')) + ' HT' })}${BO.kpi({ lb: 'E-mails à traiter', v: pending.length, icon: 'mail', cls: pending.length ? 'warn' : '', s: 'boîte mail simulée' })}</div>
      ${BO.tabs([['mandats', 'Mandats', all.filter(x => x.ins.status !== 'Payée').length], ['mail', 'Boîte mail assureurs', pending.length, pending.length ? 'red' : ''], ['compagnies', 'Compagnies']], st.tab)}
      <div class="mt">${st.tab === 'mandats' ? `<div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['all', 'En cours', all.filter(x => x.ins.status !== 'Payée').length], ...STATUSES.map(s => [s, s, cnt(s)]).filter(x => x[2])], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="Référence, plaque, compagnie…" value="${esc(st.q)}"></div></div><div data-t></div>`
        : st.tab === 'mail' ? `<div class="form-note mb">${BO.icon('mail', 16)}<div><b>Mode simulé.</b> Aucune boîte mail n’est raccordée : ces courriels sont des exemples. Une fois une adresse dédiée connectée (IMAP ou Gmail, avec votre accord), l’agent lira les vrais messages, reconnaîtra la référence et la plaque, et proposera la même action à confirmer. Rien n’est appliqué sans votre clic.</div></div>
          <div class="g g2">${mails.map(m => `<div class="card ${m.handledAt ? '' : ''}" style="${m.handledAt ? 'opacity:.6' : ''}"><div class="card-b"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${esc(m.from)}</b><span class="xs-t muted">${esc(BO.dt(m.at))}</span><span class="sp"></span>${BO.chip({ accord: 'Accord', refus: 'Refus', paiement: 'Paiement', pieces: 'Pièces demandées' }[m.intent] || m.intent, { accord: 'green', refus: 'red', paiement: 'dark', pieces: 'amber' }[m.intent] || '', true)}</div><div class="sm-t mt1" style="font-weight:700">${esc(m.subject)}</div><div class="xs-t muted mt1" style="white-space:pre-line">${esc(m.body)}</div>
            <div class="form-note mt1" style="padding:8px 10px">${BO.icon('cube', 14)}<div class="xs-t"><b>Lecture de l’agent :</b> ${esc(m.summary)}</div></div>
            <div class="row mt1" style="gap:8px">${m.handledAt ? `<span class="chip green">Appliqué le ${esc(BO.dt(m.handledAt))}</span>` : `<button class="btn sm pri" data-apply="${m.id}">${BO.icon('check', 13)}Appliquer</button><button class="btn sm" data-ignore="${m.id}">Ignorer</button>`}</div></div></div>`).join('')}</div>`
        : `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Compagnie</th><th class="num">Mandats</th><th class="num">En attente d’accord</th><th class="num">À facturer</th><th class="num">Impayés (HT)</th><th class="num">Délai de paiement</th><th>Contact</th><th></th></tr></thead><tbody>${Object.entries(byIns).sort((a, b) => b[1].open - a[1].open).map(([n, v]) => { const i = insurer(n), d = payDelay(n); return `<tr><td><b>${esc(n)}</b></td><td class="num">${v.n}</td><td class="num">${v.wait || '—'}</td><td class="num">${v.toBill || '—'}</td><td class="num">${v.unpaid ? '<b>' + chf(v.unpaid) + '</b>' : '—'}</td><td class="num">${d != null ? d + ' j constatés' : i && i.payDays ? i.payDays + ' j convenus' : '—'}</td><td class="xs-t">${i && (i.email || i.phone) ? esc(i.email || '') + (i.phone ? ' · ' + esc(i.phone) : '') : '<span class="muted">à renseigner</span>'}</td><td><button class="btn xs" data-ins="${esc(n)}">${BO.icon('edit', 12)}Contact</button></td></tr>`; }).join('')}</tbody></table></div><p class="xs-t muted" style="padding:10px 16px">${esc(CX.S.company.name)} est agréé toutes compagnies. Les contacts servent aux demandes de prise en charge et aux relances préparées par l’agent.</p></div>`}</div></div>`;
    if (st.tab === 'mandats') BO.table(el.querySelector('[data-t]'), { rows, state: (st.tbl = st.tbl || { sort: 'date', dir: 'asc' }),
      cols: [{ k: 'veh', label: 'Véhicule', get: x => x.vehicle.plate, render: x => `<div class="row" style="gap:8px">${UI.carPic(x.vehicle.hex, 40, 30)}<div>${BO.plate(x.vehicle.plate)}<div class="xs-t muted">${esc(x.vehicle.make)} ${esc(x.vehicle.model)}</div></div></div>` }, { k: 'no', label: 'Dossier', render: x => `<span class="tag">${esc(x.no)}</span><div class="xs-t muted">${esc(x.ref || '')}</div>` }, { k: 'mandant', label: 'Compagnie', render: x => esc(x.mandant) }, { k: 'label', label: 'Objet', render: x => `<span class="sm-t">${esc(x.label)}</span>` }, { k: 'date', label: 'Date', render: x => esc(U.fmtD(x.date)) }, { k: 'amount', label: 'Montant HT', num: true, render: x => chf(x.amount) }, { k: 'status', label: 'Statut', get: x => STATUSES.indexOf(x.ins.status), render: x => BO.chip(x.ins.status, TONE[x.ins.status], true) }, { k: 'act', label: '', nosort: true, render: x => `<button class="btn xs ${x.ins.status === 'À déclarer' ? 'pri' : ''}" data-open-x="${x.id}">${x.ins.status === 'À déclarer' ? 'Déclarer' : 'Ouvrir'}</button>` }],
      after: h => h.querySelectorAll('[data-open-x]').forEach(b => b.addEventListener('click', () => { const x = byId(b.dataset.openX); if (x.ins.status === 'À déclarer') askCoverage(x); else detail(x); })) });
    BO.bindTabs(el, t => { st.tab = t; APP.refresh(); });
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    const tg = el.querySelector('[data-tab-go]'); if (tg) tg.addEventListener('click', () => { st.tab = 'mail'; APP.refresh(); });
    el.querySelectorAll('[data-ins]').forEach(b => b.addEventListener('click', () => insurerForm(b.dataset.ins)));
    el.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => applyMail(mails.find(m => m.id === b.dataset.apply))));
    el.querySelectorAll('[data-ignore]').forEach(b => b.addEventListener('click', () => { const m = mails.find(x => x.id === b.dataset.ignore); m.handledAt = CX.now(); m.ignored = true; CX.touch('insMail'); BO.now(); }));
  }
  DEP.payDelay = payDelay;
  APP.register({ id: 'mandats', label: 'Assureurs & mandats', icon: 'shield', group: 'Dépannage', order: 4, activity: 'assurances', render, badge: () => { try { return mandats().filter(x => x.ins.status === 'À déclarer').length + inbox().filter(m => !m.handledAt).length; } catch (e) { return 0; } } });
})();
