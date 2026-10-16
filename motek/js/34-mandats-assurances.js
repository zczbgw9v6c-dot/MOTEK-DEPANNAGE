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
    out.forEach(x=>{ const i=(S.dinvoices || []).find(i=>i.kind===x.kind && i.srcId===x.src.id); if(i){x.ins.status=i.status==='Payée' ? 'Payée' : 'Facturée';x.amount=i.ht;} });
    return out;
  }
  const byId = id => mandats().find(x => x.id === id);
  const setStatus = (x, status, text) => { if (!STATUSES.includes(status)) return null; const invoice=(CX.S.dinvoices || []).find(i=>i.kind===x.kind && i.srcId===x.src.id); if((status==='Facturée' && !invoice) || (status==='Payée' && (!invoice || invoice.status!=='Payée'))){UI.toast('Pièce justificative requise','Créez la facture puis déclarez le règlement dans Facturation.','warn');return null;} x.ins.status = status; x.ins.history.unshift({ at: CX.now(), text: text || status, by: CX.S.meId }); if (status === 'Payée') x.ins.paidAt = today(); CX.touch(x.kind === 'mission' ? 'mission' : 'garde'); };
  window.DEP = window.DEP || {}; DEP.mandats = mandats; DEP.setMandatStatus = (id, status, text) => { const x = typeof id === 'string' ? byId(id) : id; if (x) setStatus(x, status, text); }; DEP.applyMail = m => applyMail(typeof m === 'string' ? inbox().find(x => x.id === m) : m);

  function askCoverage(x) {
    const i = insurer(x.mandant);
    BO.compose({ title: 'Demande de prise en charge — ' + x.no, to: i ? i.email || '' : '', channel: 'E-mail', subject: `Demande de prise en charge — ${x.ref || x.no} — ${x.vehicle.plate}`,
      body: `Madame, Monsieur,\n\nNous sommes intervenus pour votre assuré sur le véhicule ${x.vehicle.make} ${x.vehicle.model} immatriculé ${x.vehicle.plate} (${x.label}).\n\nRéférence sinistre : ${x.ref || 'à nous communiquer'}\nMontant : ${chf(x.amount)} HT\n\nMerci de nous confirmer la prise en charge et de nous indiquer la suite à donner.\n\nDan Dépanne · agréé toutes compagnies · ${CX.S.company.phone}`,
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
  const normalized = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  DEP.classifyMail = mail => {
    const text = (mail.subject || '') + '\n' + (mail.body || ''), t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const refs = [...new Set((text.match(/SIN[- ]?\d+/gi) || []).map(normalized))];
    const plates = [...new Set((text.match(/\b[A-Z]{2}[- ]\d{3}[- ][A-Z]{2}\b/gi) || []).map(normalized))];
    const amountMatch = text.match(/(\d[\d .\u00a0\u202f]*(?:,\d{1,2})?)\s*€/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/[ .\u00a0\u202f]/g,'').replace(',','.')) : Number(mail.amount);
    const intent = /refus|ne (?:pouvons|peut).*prendre en charge|non couvert/.test(t) ? 'refus' : /pieces manquantes|transmettre.*photos|demande de pieces/.test(t) ? 'pieces' : /virement|reglement.*emis|avis de paiement/.test(t) ? 'paiement' : /confirmons.*prise en charge|accord de prise en charge/.test(t) ? 'accord' : 'inconnu';
    if (mail.ref) refs.push(normalized(mail.ref)); if (mail.plate) plates.push(normalized(mail.plate));
    let candidates = mandats().filter(m => refs.length ? refs.every(ref => normalized(m.ref) === ref) : plates.length && plates.every(plate => normalized(m.vehicle.plate) === plate));
    if (plates.length) candidates = candidates.filter(m => plates.every(plate => normalized(m.vehicle.plate) === plate));
    // Même sinistre sur mission et garde : seul un rapprochement unique est applicable.
    const sender=(CX.S.insurers || []).find(i=>normalized(mail.from).includes(normalized(i.short || i.name)));
    const issue = sender && candidates.length===1 && ![sender.short,sender.name].includes(candidates[0].mandant) ? 'Compagnie du courriel différente du mandant : vérifier avant application.' : candidates.length !== 1 ? 'Rapprochement ambigu ou contradictoire : vérifier référence et plaque.' : intent === 'inconnu' ? 'Intention incertaine : lecture humaine nécessaire.' : ['accord','paiement'].includes(intent) && (!Number.isFinite(amount) || amount <= 0) ? 'Montant absent ou invalide : lecture humaine nécessaire.' : mail.amount != null && amountMatch && Math.abs(Number(mail.amount)-amount) > .005 ? 'Montant contradictoire : lecture humaine nécessaire.' : '';
    return { intent, amount, target: candidates.length === 1 ? candidates[0] : null, issue };
  };
  function applyMail(mail) {
    if (!mail || mail.handledAt) return null;
    const read = DEP.classifyMail(mail), x = read.target;
    if (read.issue) { UI.toast('À vérifier', read.issue, 'warn'); return null; }
    if (read.intent === 'accord') setStatus(x, 'Accordée', 'Accord reçu par e-mail simulé de ' + mail.from + ' · ' + chf(read.amount) + ' HT');
    else if (read.intent === 'refus') setStatus(x, 'Refusée', 'Refus reçu par e-mail simulé : ' + (mail.reason || 'à consulter'));
    else if (read.intent === 'paiement') {
      x.ins.history.unshift({ at: CX.now(), text: 'Virement annoncé par courriel simulé : ' + chf(read.amount) + ' — à rapprocher du relevé bancaire, aucun encaissement enregistré.', by: CX.S.meId });
    } else if (read.intent === 'pieces') x.ins.history.unshift({ at: CX.now(), text: 'Pièces demandées par ' + mail.from + ' : ' + (mail.asked || 'consulter le courriel'), by: CX.S.meId });
    mail.handledAt = CX.now(); mail.intent = read.intent; CX.touch('insMail');
    CX.S.agent.log.unshift({ at: CX.now(), kind: 'agent', text: 'Courriel simulé appliqué par validation humaine · ' + x.no + ' · ' + read.intent, done: [mail.subject] });
    UI.toast('Courriel consigné', x.no + (read.intent === 'paiement' ? ' · règlement à vérifier' : ' · ' + x.ins.status), 'ok', 'check'); BO.now(); return x;
  }
  const readyToBill = x => x.ins.status==='Accordée' && (x.kind==='mission' ? ['Terminée','Déposée au parc'].includes(x.src.status) : !!x.src.outAt) && !(CX.S.dinvoices || []).some(i=>i.kind===x.kind && i.srcId===x.src.id);
  DEP.companySummary = () => [...new Set(mandats().map(m => m.mandant))].map(name => {
    const ms=mandats().filter(m=>m.mandant===name), invoices=(CX.S.dinvoices || []).filter(i=>i.payer===name && i.kind!=='avoir'), paid=invoices.filter(i=>i.paidAt && i.status==='Payée');
    return { name, n:ms.length, waiting:ms.filter(m=>['À déclarer','Prise en charge demandée'].includes(m.ins.status)).length, toBill:ms.filter(readyToBill).length, unpaid:invoices.reduce((a,i)=>a+Math.max(0,i.ttc-(i.paid||0)-(i.credited||0)),0), delay:paid.length ? Math.round(paid.reduce((a,i)=>a+U.diffDays(i.at,i.paidAt),0)/paid.length) : null };
  });

  function render(el, params) {
    if (params.seg) { st.seg=params.seg; APP.setParams({seg:null}); }
    if (params.company) { st.q=params.company; st.tab='mandats'; APP.setParams({company:null}); }
    if (params.id) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => { const x = byId('M:' + id) || byId('G:' + id); if (x) detail(x); }, 0); }
    if (params.tab) { st.tab = params.tab; APP.setParams({ tab: null }); }
    const all = mandats(), q = st.q.toLowerCase();
    let rows = st.seg === 'all' ? all.filter(x => x.ins.status !== 'Payée') : st.seg === 'toBill' ? all.filter(readyToBill) : st.seg === 'Payée' ? all.filter(x => x.ins.status === 'Payée') : all.filter(x => x.ins.status === st.seg);
    if (q) rows = rows.filter(x => (x.no + ' ' + x.ref + ' ' + x.mandant + ' ' + x.vehicle.plate + ' ' + x.vehicle.make + ' ' + x.vehicle.model).toLowerCase().includes(q));
    rows.sort((a, b) => STATUSES.indexOf(a.ins.status) - STATUSES.indexOf(b.ins.status) || (a.date < b.date ? -1 : 1));
    const cnt = s => all.filter(x => x.ins.status === s).length, amt = s => all.filter(x => x.ins.status === s).reduce((a, x) => a + x.amount, 0);
    const mails = inbox(), pending = mails.filter(m => !m.handledAt);
    el.innerHTML = `<div class="bo-page">${BO.head('Mandats & assurances', `${all.length} mandats · ${cnt('À déclarer')} à déclarer · ${chf(amt('Facturée'))} facturés en attente de paiement`, `<button class="btn ${pending.length ? 'pri' : ''}" data-tab-go="mail">${BO.icon('mail', 15)}Boîte mail assureurs${pending.length ? ' <em style="font-style:normal;background:#fff;color:var(--red);border-radius:6px;padding:0 6px;margin-left:6px">' + pending.length + '</em>' : ''}</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">${BO.kpi({ lb: 'À déclarer', v: cnt('À déclarer'), icon: 'alert', cls: cnt('À déclarer') ? 'warn' : '', s: chf(amt('À déclarer')) + ' HT' })}${BO.kpi({ lb: 'En attente d’accord', v: cnt('Prise en charge demandée'), icon: 'shield', s: chf(amt('Prise en charge demandée')) + ' HT' })}${BO.kpi({ lb: 'Accordés, à facturer', v: all.filter(readyToBill).length, icon: 'check', s: chf(all.filter(readyToBill).reduce((a,x)=>a+x.amount,0)) + ' HT' })}${BO.kpi({ lb: 'Facturés, à encaisser', v: cnt('Facturée'), icon: 'invoice', s: chf(amt('Facturée')) + ' HT' })}${BO.kpi({ lb: 'E-mails à traiter', v: pending.length, icon: 'mail', cls: pending.length ? 'warn' : '', s: 'boîte mail simulée' })}</div>
      ${BO.tabs([['mandats', 'Mandats', all.filter(x => x.ins.status !== 'Payée').length], ['mail', 'Boîte mail assureurs', pending.length, pending.length ? 'red' : ''], ['compagnies', 'Compagnies']], st.tab)}
      <div class="mt">${st.tab === 'mandats' ? `<div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['all', 'En cours', all.filter(x => x.ins.status !== 'Payée').length], ...STATUSES.map(s => [s, s, cnt(s)]).filter(x => x[2])], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="Référence, plaque, compagnie…" value="${esc(st.q)}"></div></div><div data-t></div>`
        : st.tab === 'mail' ? `<div class="form-note mb">${BO.icon('mail', 16)}<div><b>Mode simulé.</b> Aucune boîte mail n’est raccordée : ces courriels sont des exemples. Une fois une adresse dédiée connectée (IMAP ou Gmail, avec votre accord), l’agent lira les vrais messages, reconnaîtra la référence et la plaque, et proposera la même action à confirmer. Rien n’est appliqué sans votre clic.</div></div>
          <div class="g g2">${mails.map(m => `<div class="card ${m.handledAt ? '' : ''}" style="${m.handledAt ? 'opacity:.6' : ''}"><div class="card-b"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${esc(m.from)}</b><span class="xs-t muted">${esc(BO.dt(m.at))}</span><span class="sp"></span>${BO.chip({ accord: 'Accord', refus: 'Refus', paiement: 'Virement annoncé', pieces: 'Pièces demandées' }[m.intent] || m.intent, { accord: 'green', refus: 'red', paiement: 'dark', pieces: 'amber' }[m.intent] || '', true)}</div><div class="sm-t mt1" style="font-weight:700">${esc(m.subject)}</div><div class="xs-t muted mt1" style="white-space:pre-line">${esc(m.body)}</div>
            <div class="form-note mt1" style="padding:8px 10px">${BO.icon('cube', 14)}<div class="xs-t"><b>Lecture de l’agent :</b> ${esc(m.summary)}</div></div>
            <div class="row mt1" style="gap:8px">${m.handledAt ? `<span class="chip green">Appliqué le ${esc(BO.dt(m.handledAt))}</span>` : `<button class="btn sm pri" data-apply="${m.id}">${BO.icon('check', 13)}Appliquer</button><button class="btn sm" data-ignore="${m.id}">Ignorer</button>`}</div></div></div>`).join('')}</div>`
        : `<div class="card company-table"><table class="tbl"><thead><tr><th>Compagnie / mandant</th><th>Mandats</th><th>Attente d’accord</th><th>Accordés à facturer</th><th>Impayés TTC</th><th>Délai moyen de règlement</th></tr></thead><tbody>${DEP.companySummary().map(v=>`<tr><td><button class="btn sm" data-company="${esc(v.name)}">${esc(v.name)}</button></td><td>${v.n}</td><td>${v.waiting}</td><td>${v.toBill}</td><td>${chf(v.unpaid)}</td><td>${v.delay == null ? 'Aucun règlement daté' : v.delay+' jours'}</td></tr>`).join('')}</tbody></table><p class="xs-t muted card-b">Délai calculé entre émission et règlement intégral daté. Démonstration fictive ; aucun relevé bancaire connecté.</p></div>`}</div></div>`;
    if (st.tab === 'mandats') BO.table(el.querySelector('[data-t]'), { rows, state: (st.tbl = st.tbl || { sort: 'date', dir: 'asc' }),
      cols: [{ k: 'veh', label: 'Véhicule', get: x => x.vehicle.plate, render: x => `<div class="row" style="gap:8px">${UI.carPic(x.vehicle.hex, 40, 30)}<div>${BO.plate(x.vehicle.plate)}<div class="xs-t muted">${esc(x.vehicle.make)} ${esc(x.vehicle.model)}</div></div></div>` }, { k: 'no', label: 'Dossier', render: x => `<span class="tag">${esc(x.no)}</span><div class="xs-t muted">${esc(x.ref || '')}</div>` }, { k: 'mandant', label: 'Compagnie', render: x => esc(x.mandant) }, { k: 'label', label: 'Objet', render: x => `<span class="sm-t">${esc(x.label)}</span>` }, { k: 'date', label: 'Date', render: x => esc(U.fmtD(x.date)) }, { k: 'amount', label: 'Montant HT', num: true, render: x => chf(x.amount) }, { k: 'status', label: 'Statut', get: x => STATUSES.indexOf(x.ins.status), render: x => BO.chip(x.ins.status, TONE[x.ins.status], true) }, { k: 'act', label: '', nosort: true, render: x => `<button class="btn xs ${x.ins.status === 'À déclarer' ? 'pri' : ''}" data-open-x="${x.id}">${x.ins.status === 'À déclarer' ? 'Déclarer' : 'Ouvrir'}</button>` }],
      after: h => h.querySelectorAll('[data-open-x]').forEach(b => b.addEventListener('click', () => { const x = byId(b.dataset.openX); if (x.ins.status === 'À déclarer') askCoverage(x); else detail(x); })) });
    BO.bindTabs(el, t => { st.tab = t; APP.refresh(); });
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelectorAll('[data-company]').forEach(b=>b.addEventListener('click',()=>{st.q=b.dataset.company;st.seg='all';st.tab='mandats';APP.refresh();}));
    const tg = el.querySelector('[data-tab-go]'); if (tg) tg.addEventListener('click', () => { st.tab = 'mail'; APP.refresh(); });
    el.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => applyMail(mails.find(m => m.id === b.dataset.apply))));
    el.querySelectorAll('[data-ignore]').forEach(b => b.addEventListener('click', () => { const m = mails.find(x => x.id === b.dataset.ignore); m.handledAt = CX.now(); m.ignored = true; CX.touch('insMail'); BO.now(); }));
  }
  APP.register({ id: 'mandats', label: 'Mandats & assurances', icon: 'shield', group: 'Dépannage', order: 4, activity: 'assurances', render, badge: () => { try { return mandats().filter(x => x.ins.status === 'À déclarer').length + inbox().filter(m => !m.handledAt).length; } catch (e) { return 0; } } });
})();
