/* ==========================================================================
   BO · Agent IA du dépanneur (mode simulé, aucun service externe) :
   - suggestions du jour (relances de gardes, missions en attente, factures
     échues, commandes à envoyer) — chaque action est relue par l'humain
   - courriels assureurs : lecture, classement (payé / accordé / pièces /
     refus / relance à faire), application d'un clic
   - WhatsApp clients : messages prêts (venir récupérer le véhicule, véhicule
     déposé au garage, frais en cours) ouverts dans WhatsApp sur l'appareil,
     envoi tracé par l'humain
   - journal des actions
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2, today } = U;
  const st = { tab: 'sugg', mseg: 'todo' };
  const log = (text, done) => { CX.S.agent.log.unshift({ at: CX.now(), kind: 'agent', text, done: done || [] }); CX.touch('agent'); };
  const waLog = () => (CX.S.waMsgs = CX.S.waMsgs || []);
  const intl = p => String(p || '').replace(/[^\d+]/g, '').replace(/^0/, '+33').replace(/^\+/, '');

  /* ---------- WhatsApp : modèles et envoi tracé ---------- */
  const WA = {
    recuperer: ({ name, plate, fees }) => `Bonjour${name ? ' ' + name.split(' ')[0] : ''}, votre véhicule ${plate} est disponible au parc Dan Dépann, 25 avenue Claude Vellefaux, 75010 Paris (du lundi au samedi, 8 h – 19 h). Merci de venir le récupérer avec une pièce d’identité et la carte grise.${fees ? ' Frais de garde à ce jour : ' + fees + '.' : ''} Dan Dépann · ${CX.S.company.phone}`,
    depose: ({ name, plate, dest }) => `Bonjour${name ? ' ' + name.split(' ')[0] : ''}, votre véhicule ${plate} a été déposé ${dest ? 'à ' + dest : 'au garage agréé par votre assurance'}. Le garage vous contactera sous 48 h pour la suite. Dan Dépann · ${CX.S.company.phone}`,
    frais: ({ name, plate, days, fees }) => `Bonjour${name ? ' ' + name.split(' ')[0] : ''}, votre véhicule ${plate} est en garde dans notre parc depuis ${days} jours. Les frais de gardiennage s’élèvent à ${fees} et continuent de courir. Merci de nous indiquer rapidement la suite à donner (récupération, expertise, enlèvement). Dan Dépann · ${CX.S.company.phone}`,
    arrivee: ({ name, plate, eta }) => `Bonjour${name ? ' ' + name.split(' ')[0] : ''}, notre dépanneuse est en route pour votre ${plate}${eta ? ', arrivée prévue vers ' + eta : ''}. Restez en sécurité à côté du véhicule. Dan Dépann · ${CX.S.company.phone}`,
  };
  const KINDS = { recuperer: 'Venir récupérer le véhicule', depose: 'Véhicule déposé au garage', frais: 'Rappel des frais de garde', arrivee: 'Dépanneuse en route' };
  function whatsapp(o) {
    const g = o.gardeId ? DEP.garde(o.gardeId) : null;
    const ctx = Object.assign({}, o, g ? { days: DEP.gardeDays(g), fees: chf(DEP.gardeFees(g)) } : {});
    let kind = o.kind || 'recuperer';
    const draw = (el) => { el.querySelector('[data-txt]').value = WA[kind](ctx); el.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('on', b.dataset.k === kind)); };
    UI.modal({ title: 'WhatsApp — ' + esc(o.plate || ''),
      body: `<div class="form-note mb">${BO.icon('msg', 16)}<div><b>Ouverture de WhatsApp sur cet appareil</b> avec le message prérempli, au ${esc(o.phone || '—')}. Rien ne part sans votre clic « Envoyer » dans WhatsApp ; MOTEK trace ensuite le message dans le dossier.</div></div>
        <div class="seg mb" data-kinds>${Object.keys(KINDS).map(k => `<button data-k="${k}" class="${k === kind ? 'on' : ''}">${KINDS[k]}</button>`).join('')}</div>
        <div class="field"><label>Message</label><textarea class="inp" rows="6" data-txt></textarea></div>`,
      foot: `<button class="btn" data-close>Annuler</button><span class="sp"></span><button class="btn" data-copy>${BO.icon('copy', 14)}Copier</button><button class="btn pri" data-open-wa>${BO.icon('send', 14)}Ouvrir WhatsApp</button><button class="btn" data-sent>${BO.icon('check', 14)}J’ai envoyé</button>`,
      onMount: (el, close) => {
        draw(el);
        el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { kind = b.dataset.k; draw(el); }));
        const trace = (status) => { const text = el.querySelector('[data-txt]').value; waLog().unshift({ id: U.uid('wa'), at: CX.now(), to: o.phone || '', plate: o.plate || '', dir: 'out', text, status, kind, gardeId: o.gardeId || null, missionId: o.missionId || null }); if (g) g.history.unshift({ at: CX.now(), text: 'WhatsApp · ' + KINDS[kind] + (status === 'envoyé' ? '' : ' (' + status + ')'), by: CX.S.meId }); CX.touch('wa'); log('WhatsApp · ' + KINDS[kind] + ' · ' + (o.plate || ''), [text.slice(0, 60) + '…']); };
        el.querySelector('[data-copy]').addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(el.querySelector('[data-txt]').value); UI.toast('Message copié', '', 'ok', 'copy'); });
        el.querySelector('[data-open-wa]').addEventListener('click', () => { const url = 'https://wa.me/' + intl(o.phone) + '?text=' + encodeURIComponent(el.querySelector('[data-txt]').value); window.open(url, '_blank', 'noopener'); trace('ouvert dans WhatsApp'); });
        el.querySelector('[data-sent]').addEventListener('click', () => { trace('envoyé'); close(); UI.toast('Message tracé', KINDS[kind] + ' · ' + (o.plate || ''), 'ok', 'check'); BO.now(); });
      } });
  }
  window.DEP = window.DEP || {}; DEP.whatsapp = whatsapp; DEP.WA_KINDS = KINDS;

  /* ---------- courriels assureurs : classement ---------- */
  const mails = () => CX.S.insMail || [];
  const MCLASS = { paiement: ['Payé', 'green'], accord: ['Accordé', 'green'], pieces: ['Pièces demandées', 'amber'], refus: ['Refus', 'red'], relance: ['Relance reçue', 'amber'] };
  function toRemind() {
    const out = [];
    (DEP.mandats ? DEP.mandats() : []).forEach(x => { const last = x.ins.history[0]; const d = last ? U.diffDays(U.dOf(last.at), today()) : 99; if (x.ins.status === 'Prise en charge demandée' && d >= 5) out.push({ x, why: 'prise en charge demandée il y a ' + d + ' j, sans réponse' }); if (x.ins.status === 'Facturée' && d >= 30) out.push({ x, why: 'facturée il y a ' + d + ' j, non payée' }); });
    (DEP.invoices ? DEP.invoices() : []).filter(i => i.status !== 'Payée' && i.due < today() && (!i.reminded || U.diffDays(i.reminded, today()) >= 7)).forEach(i => out.push({ inv: i, why: 'facture échue depuis ' + U.diffDays(i.due, today()) + ' j' }));
    return out;
  }
  function remindMandat(x) {
    const ins = CX.S.insurers.find(i => i.short === x.mandant || i.name === x.mandant);
    BO.compose({ title: 'Relance — ' + x.no, to: ins ? ins.email || '' : '', channel: 'E-mail', subject: `Relance — ${x.ref || x.no} — ${x.vehicle.plate}`,
      body: `Madame, Monsieur,\n\nNous restons sans réponse concernant le dossier ${x.ref || x.no} (véhicule ${x.vehicle.make} ${x.vehicle.model} ${x.vehicle.plate}, ${x.label}).\n\nStatut chez nous : ${x.ins.status.toLowerCase()}${x.kind === 'garde' ? ' · frais de gardiennage à ce jour ' + chf(x.amount) + ' HT, qui continuent de courir' : ' · montant ' + chf(x.amount) + ' HT'}.\n\nMerci de nous indiquer la suite à donner.\n\n${CX.S.company.name} · ${CX.S.company.phone}`,
      okLabel: 'J’ai envoyé la relance', onSend: m => { x.ins.history.unshift({ at: CX.now(), text: 'Relance envoyée (' + m.channel + ') à ' + m.to, by: CX.S.meId }); CX.touch(x.kind === 'mission' ? 'mission' : 'garde'); log('Relance assureur · ' + x.no + ' · ' + x.mandant); UI.toast('Relance tracée', x.no, 'ok', 'send'); BO.now(); } });
  }

  /* ---------- suggestions du jour ---------- */
  function suggestions() {
    const S = CX.S, out = [];
    const base = window.AGENT && AGENT.suggest ? AGENT.suggest() : [];
    base.forEach(s => out.push({ prio: s.prio, ic: s.kind === 'invoice' ? 'invoice' : 'send', t: s.title, s: s.text, act: 'Ouvrir', run: s.run }));
    DEP.inPark().filter(g => g.step === 'Non traité').forEach(g => out.push({ prio: 3, ic: 'alert', t: 'Véhicule arrivé non traité · ' + g.vehicle.plate, s: g.vehicle.make + ' ' + g.vehicle.model + ' · ' + g.mandant + ' · ' + g.reason, act: 'Traiter', run: () => APP.open('parc', { id: g.id }) }));
    (S.supplyOrders || []).filter(o => o.status === 'À commander').slice(0, 3).forEach(o => out.push({ prio: 2, ic: 'box', t: 'Commande à envoyer · ' + o.item, s: (o.plate ? o.plate + ' · ' : '') + 'bon de commande prêt pour le fournisseur', act: 'Commander', run: () => DEP.sendOrder(o.supplierId, [o.id]) }));
    toRemind().forEach(r => out.push(r.inv ? { prio: 2, ic: 'coins', t: 'Relancer le paiement · ' + r.inv.no + ' (' + r.inv.payer + ')', s: r.why + ' · ' + chf2(r.inv.ttc - (r.inv.paid || 0)) + ' TTC', act: 'Relancer', run: () => APP.open('invoices', { id: r.inv.id }) } : { prio: 2, ic: 'shield', t: 'Relancer ' + r.x.mandant + ' · ' + r.x.no, s: r.why, act: 'Relancer', run: () => remindMandat(r.x) }));
    DEP.inPark().filter(g => g.step === 'Prêt à sortir' && g.owner.phone && !waLog().some(w => w.gardeId === g.id && w.kind === 'recuperer')).forEach(g => out.push({ prio: 2, ic: 'msg', t: 'Prévenir par WhatsApp · ' + g.vehicle.plate, s: 'véhicule prêt à sortir · ' + (g.owner.name || ''), act: 'WhatsApp', run: () => whatsapp({ phone: g.owner.phone, name: g.owner.name, plate: g.vehicle.plate, kind: 'recuperer', gardeId: g.id }) }));
    return out.sort((a, b) => b.prio - a.prio);
  }

  function render(el, params) {
    if (params.tab) { st.tab = params.tab === 'inbox' ? 'mail' : params.tab; APP.setParams({ tab: null }); }
    const S = CX.S, sugg = suggestions(), pend = mails().filter(m => !m.handledAt), rem = toRemind();
    el.innerHTML = `<div class="bo-page">${BO.head('Agent IA', `${sugg.length} suggestions · ${pend.length} courriel${pend.length > 1 ? 's' : ''} assureur à traiter · ${rem.length} relance${rem.length > 1 ? 's' : ''} à faire`, `<button class="btn" data-open="mandats">${BO.icon('shield', 15)}Mandats</button>`)}
      <div class="form-note mb">${BO.icon('eye', 16)}<div><b>Mode simulé, sans service externe.</b> L’agent lit les données de MOTEK et des courriels d’exemple ; il prépare les messages, vous les envoyez. Le raccordement d’une vraie boîte mail (IMAP / Gmail) et de WhatsApp Business se fait avec votre accord, plus tard.</div></div>
      ${BO.tabs([['sugg', 'Suggestions du jour', sugg.length], ['mail', 'Courriels assureurs', pend.length, pend.length ? 'red' : ''], ['wa', 'WhatsApp clients', waLog().length], ['log', 'Journal', S.agent.log.length]], st.tab)}
      <div class="mt" data-body></div></div>`;
    const body = el.querySelector('[data-body]');
    if (st.tab === 'sugg') {
      body.innerHTML = `<div class="card"><div>${sugg.length ? sugg.map((a, i) => `<div class="todo"><span class="tic ${a.prio >= 3 ? 'high' : 'mid'}">${BO.icon(a.ic, 16)}</span><div class="tx"><b>${esc(a.t)}</b><span>${esc(a.s)}</span></div><div class="ta"><button class="btn sm ${a.prio >= 3 ? 'pri' : ''}" data-s="${i}">${esc(a.act)}</button></div></div>`).join('') : BO.empty('check', 'Rien à proposer', 'Tout est à jour.', '', true)}</div></div>`;
      body.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => sugg[+b.dataset.s].run()));
    }
    if (st.tab === 'mail') {
      const all = mails(), rows = st.mseg === 'todo' ? pend : st.mseg === 'done' ? all.filter(m => m.handledAt) : all.filter(m => m.intent === st.mseg);
      body.innerHTML = `<div class="row wrap mb" style="gap:10px">${BO.seg('mseg', [['todo', 'À traiter', pend.length], ['paiement', 'Payés', all.filter(m => m.intent === 'paiement').length], ['accord', 'Accordés', all.filter(m => m.intent === 'accord').length], ['pieces', 'Pièces demandées', all.filter(m => m.intent === 'pieces').length], ['refus', 'Refus', all.filter(m => m.intent === 'refus').length], ['done', 'Traités', all.filter(m => m.handledAt).length]], st.mseg)}</div>
        ${rem.length ? `<div class="card mb"><div class="card-h"><h3>${BO.icon('send', 16)}Relances à faire <small>· ${rem.length}</small></h3></div><div>${rem.map((r, i) => `<div class="todo"><span class="tic mid">${BO.icon(r.inv ? 'coins' : 'shield', 16)}</span><div class="tx"><b>${r.inv ? esc(r.inv.no + ' · ' + r.inv.payer + ' · ' + chf2(r.inv.ttc - (r.inv.paid || 0)) + ' TTC') : esc(r.x.no + ' · ' + r.x.mandant + ' · ' + r.x.vehicle.plate)}</b><span>${esc(r.why)}</span></div><div class="ta"><button class="btn sm pri" data-rem="${i}">Préparer la relance</button></div></div>`).join('')}</div></div>` : ''}
        <div class="g g-2">${rows.length ? rows.map(m => { const c = MCLASS[m.intent] || [m.intent, '']; return `<div class="card pad mail ${m.handledAt ? 'done' : ''}"><div class="row" style="gap:8px"><b>${esc(m.from)}</b><span class="xs-t muted">${esc(BO.dt(m.at))}</span><span class="sp"></span>${BO.chip(c[0], c[1], true)}</div><div class="mt1"><b>${esc(m.subject)}</b></div><div class="xs-t muted mt1" style="white-space:pre-line">${esc(m.body)}</div><div class="form-note mt1">${BO.icon('cube', 15)}<div><b>Lecture de l’agent :</b> ${esc(m.summary || '')}</div></div><div class="row mt1" style="gap:6px">${m.handledAt ? `<span class="chip green">Appliqué ${esc(BO.dt(m.handledAt))}</span>` : `<button class="btn sm pri" data-apply="${m.id}">${BO.icon('check', 14)}Appliquer</button><button class="btn sm" data-ignore="${m.id}">Ignorer</button>`}</div></div>`; }).join('') : BO.empty('mail', 'Aucun courriel', '', '', true)}</div>`;
      BO.bindSeg(body, (n, v) => { st.mseg = v; APP.refresh(); });
      body.querySelectorAll('[data-apply]').forEach(b => b.addEventListener('click', () => { DEP.applyMail(b.dataset.apply); APP.refresh(); }));
      body.querySelectorAll('[data-ignore]').forEach(b => b.addEventListener('click', () => { const m = all.find(x => x.id === b.dataset.ignore); m.handledAt = CX.now(); m.ignored = true; CX.touch('insMail'); log('Courriel ignoré · ' + m.subject); APP.refresh(); }));
      body.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => { const r = rem[+b.dataset.rem]; if (r.inv) APP.open('invoices', { id: r.inv.id }); else remindMandat(r.x); }));
    }
    if (st.tab === 'wa') {
      const cand = DEP.inPark().filter(g => g.owner.phone).slice(0, 8);
      body.innerHTML = `<div class="g g-main"><div class="card"><div class="card-h"><h3>${BO.icon('msg', 16)}Conversations <small>· ${waLog().length}</small></h3></div><div>${waLog().length ? waLog().map(w => `<div class="todo"><span class="tic ${w.dir === 'in' ? 'mid' : 'low'}">${BO.icon(w.dir === 'in' ? 'user' : 'send', 16)}</span><div class="tx"><b>${esc(w.plate || w.to)} · ${esc(KINDS[w.kind] || (w.dir === 'in' ? 'Réponse du client' : 'Message'))}</b><span>${esc(w.text)}</span><span class="xs-t muted">${esc(BO.dt(w.at))} · ${esc(w.to)} · ${esc(w.status)}</span></div></div>`).join('') : BO.empty('msg', 'Aucun message', '', '', true)}</div></div>
        <div class="card"><div class="card-h"><h3>${BO.icon('users', 16)}Prévenir un propriétaire</h3></div><div>${cand.map(g => `<div class="todo"><span class="tic low">${BO.icon('car', 16)}</span><div class="tx"><b>${esc(g.vehicle.plate)} · ${esc(g.owner.name || '')}</b><span>${esc(g.step || '')} · ${DEP.gardeDays(g)} j · ${chf(DEP.gardeFees(g))}</span></div><div class="ta"><button class="btn sm" data-wa="${g.id}">WhatsApp</button></div></div>`).join('')}</div></div></div>`;
      body.querySelectorAll('[data-wa]').forEach(b => b.addEventListener('click', () => { const g = DEP.garde(b.dataset.wa); whatsapp({ phone: g.owner.phone, name: g.owner.name, plate: g.vehicle.plate, kind: g.step === 'Prêt à sortir' ? 'recuperer' : 'frais', gardeId: g.id }); }));
    }
    if (st.tab === 'log') body.innerHTML = `<div class="card"><div>${S.agent.log.length ? S.agent.log.slice(0, 60).map(l => `<div class="todo"><span class="tic low">${BO.icon('cube', 16)}</span><div class="tx"><b>${esc(l.text)}</b><span>${esc(BO.dt(l.at))}${(l.done || []).length ? ' · ' + esc(l.done.join(' · ')) : ''}</span></div></div>`).join('') : BO.empty('cube', 'Journal vide', '', '', true)}</div></div>`;
    el.querySelectorAll('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => { st.tab = b.dataset.tab; APP.refresh(); }));
  }
  APP.register({ id: 'agent', label: 'Agent IA', icon: 'cube', group: 'Pilotage', order: 3, activity: 'agent', render, badge: () => { try { return mails().filter(m => !m.handledAt).length + suggestions().filter(s => s.prio >= 3).length; } catch (e) { return 0; } } });
})();
