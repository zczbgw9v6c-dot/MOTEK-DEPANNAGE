/* ==========================================================================
   BO · Facturation du dépanneur : factures aux mandants (assureurs,
   particuliers, leasing, police) pour les missions et le gardiennage,
   encaissements, retards, relances. Libellés propres au dépannage :
   remorquage, dépannage sur place, batterie, gardiennage, frais de dossier.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2, today } = U;
  const st = { seg: 'open', q: '', tbl: { sort: 'at', dir: 'desc' } };
  const TVA = () => (CX.S.company.tvaRate != null ? CX.S.company.tvaRate : 0.2);
  const list = () => (CX.S.dinvoices = CX.S.dinvoices || []);
  const rest = i => Math.max(0, i.ttc - (i.paid || 0));
  const late = i => i.status !== 'Payée' && i.due < today();
  const stat = i => late(i) ? 'En retard' : i.status;
  const TONE = { 'Émise': 'amber', 'Payée': 'green', 'En retard': 'red', 'Partiel': 'amber' };
  const nextNo = () => 'FD-' + (2026000 + 400 + list().length + 1);
  const LABELS = {
    'Remorquage simple': m => 'Remorquage — ' + m.address + ' → ' + (m.destination || 'garage'),
    'Panne batterie': () => 'Dépannage sur place — diagnostic, démarrage ou remplacement de batterie',
    'Crevaison': () => 'Dépannage sur place — roue de secours / réparation crevaison',
    'Panne carburant': () => 'Dépannage sur place — livraison de carburant',
    'Erreur carburant': m => 'Remorquage après erreur de carburant — ' + m.address,
    'Bris de glace': m => 'Remorquage bris de glace — ' + m.address + ' → ' + (m.destination || 'garage agréé'),
    'Vandalisme': m => 'Remorquage véhicule vandalisé — ' + m.address + ' → parc',
    'Accident': m => 'Remorquage véhicule accidenté — ' + m.address + ' → ' + (m.destination || 'parc'),
  };
  const mk = (o) => { const ht = o.lines.reduce((a, l) => a + l.qty * l.price, 0); return Object.assign({ id: U.uid('DI'), no: nextNo(), at: today(), due: U.addDays(today(), CX.S.company.terms || 30), paid: 0, status: 'Émise', history: [{ at: CX.now(), text: 'Facture émise', by: CX.S.meId }] }, o, { ht, tva: Math.round(ht * TVA() * 100) / 100, ttc: Math.round(ht * (1 + TVA()) * 100) / 100 }); };

  /** Facture une mission terminée / déposée : une ligne de dépannage + options. */
  function billMission(m) {
    if (!m) return null;
    if (list().some(i => i.kind === 'mission' && i.srcId === m.id)) { UI.toast('Déjà facturée', m.no, 'warn'); return null; }
    const lines = [{ label: (LABELS[m.kind] || (x => x.kind + ' — ' + x.address))(m), qty: 1, price: m.price }];
    if (/batterie/i.test(m.kind)) { const so = (CX.S.supplyOrders || []).find(o => o.missionId === m.id && o.status === 'Posée'); if (so) lines.push({ label: 'Fourniture — ' + so.item, qty: so.qty, price: Math.round(so.price * 1.25) }); }
    const i = mk({ payer: m.mandant, ref: m.ref || '', kind: 'mission', srcId: m.id, plate: m.vehicle.plate, label: m.kind + ' · ' + m.address, lines });
    list().unshift(i); if (m.status !== 'Facturée') DEP.setMissionStatus(m.id, 'Facturée'); CX.touch('dinvoice');
    UI.toast('Facture ' + i.no, chf2(i.ttc) + ' TTC à ' + i.payer, 'ok', 'invoice'); return i;
  }
  /** Facture une garde restituée : jours × tarif + frais de dossier. */
  function billGarde(g) {
    if (!g) return null;
    if (list().some(i => i.kind === 'garde' && i.srcId === g.id)) { UI.toast('Déjà facturée', g.no, 'warn'); return null; }
    const d = DEP.gardeDays(g), lines = [{ label: 'Gardiennage ' + d + ' jour' + (d > 1 ? 's' : '') + ' · ' + g.vehicle.plate + ' (' + g.level + ')', qty: d, price: g.dailyFee || CX.S.parc.dailyFee }, { label: 'Frais de dossier', qty: 1, price: CX.S.parc.adminFee || 0 }];
    const i = mk({ payer: g.mandant, ref: g.ref || '', kind: 'garde', srcId: g.id, plate: g.vehicle.plate, label: 'Gardiennage ' + d + ' j · ' + g.vehicle.plate, lines, paid: g.paid || 0 });
    if (i.paid >= i.ttc) i.status = 'Payée'; list().unshift(i); CX.touch('dinvoice');
    UI.toast('Facture ' + i.no, chf2(i.ttc) + ' TTC à ' + i.payer, 'ok', 'invoice'); return i;
  }
  function pay(i, amount, date, ref) {
    i.paid = Math.min(i.ttc, (i.paid || 0) + amount); i.status = i.paid >= i.ttc - 0.005 ? 'Payée' : 'Partiel'; if (i.status === 'Payée') i.paidAt = date || today();
    i.history.unshift({ at: CX.now(), text: 'Encaissement ' + chf2(amount) + (ref ? ' · ' + ref : '') + ' · valeur ' + U.fmtD(date || today()), by: CX.S.meId }); CX.touch('dinvoice');
  }
  window.DEP = window.DEP || {}; DEP.billMission = billMission; DEP.billGarde = billGarde; DEP.invoices = list; DEP.payInvoice = pay;

  function print(i) {
    const co = CX.S.company;
    const inner = `<div class="hd"><div class="brand">${UI.logo(42)}<div><b>${esc(co.name)}</b><small>Dépannage · Remorquage · Gardiennage · 24h/24</small></div></div><div class="co">${esc(co.address)}<br>${esc(co.phone)} · ${esc(co.email)}</div></div>
      <div class="addr"><b>${esc(i.payer)}</b><br>${/AXA|MAIF|Allianz|Macif|Groupama|Matmut/.test(i.payer) ? 'Service sinistres automobile' : ''}<br>${i.ref ? 'Référence sinistre ' + esc(i.ref) : ''}</div>
      <h1>Facture ${esc(i.no)}</h1><div class="meta">${esc(i.plate)} · ${esc(U.fmtD(i.at))} · échéance ${esc(U.fmtD(i.due))}</div>
      <table><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">PU HT</th><th class="n">Total HT</th></tr></thead><tbody>${i.lines.map(l => `<tr><td>${esc(l.label)}</td><td class="n">${l.qty}</td><td class="n">${chf2(l.price)}</td><td class="n">${chf2(l.qty * l.price)}</td></tr>`).join('')}</tbody></table>
      <table class="tot"><tr><td>Montant HT</td><td class="n">${chf2(i.ht)}</td></tr><tr><td>TVA ${BO.tvaLbl()}</td><td class="n">${chf2(i.tva)}</td></tr><tr class="big"><td>Montant TTC</td><td class="n">${chf2(i.ttc)}</td></tr>${i.paid ? `<tr><td>Déjà réglé</td><td class="n">− ${chf2(i.paid)}</td></tr><tr class="big"><td>Reste dû</td><td class="n">${chf2(rest(i))}</td></tr>` : ''}</table>
      <div class="cond">Conditions : paiement à ${co.terms || 30} jours · IBAN ${esc(co.iban)} · SIRET ${esc(co.siret)} · TVA ${esc(co.tvaIntra)}. Dépanneur agréé toutes compagnies.</div>`;
    BO.preview('Facture ' + i.no, BO.printHtml('Facture ' + i.no, inner), 'Facture-' + i.no + '.html');
  }
  function detail(i) {
    UI.modal({ title: esc(i.no) + ' · ' + esc(i.payer), wide: true,
      body: `<div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(i.plate, true)}${BO.chip(stat(i), TONE[stat(i)], true)}<span class="chip line">${i.kind === 'mission' ? 'Mission' : 'Gardiennage'}</span>${i.ref ? `<span class="chip line">${esc(i.ref)}</span>` : ''}</div>
        <div class="tiles mt"><div class="tile"><div class="tl">Émise le</div><div class="tv" style="font-size:14px">${esc(U.fmtD(i.at))}</div></div><div class="tile"><div class="tl">Échéance</div><div class="tv" style="font-size:14px">${esc(U.fmtD(i.due))}</div></div><div class="tile"><div class="tl">TTC</div><div class="tv">${chf2(i.ttc)}</div></div><div class="tile"><div class="tl">Reste dû</div><div class="tv">${chf2(rest(i))}</div></div></div>
        <table class="tbl mt"><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">PU HT</th><th class="n">HT</th></tr></thead><tbody>${i.lines.map(l => `<tr><td>${esc(l.label)}</td><td class="n">${l.qty}</td><td class="n">${chf2(l.price)}</td><td class="n">${chf2(l.qty * l.price)}</td></tr>`).join('')}</tbody></table>
        ${(i.history || []).length ? `<ul class="hist mt">${i.history.slice(0, 6).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul>` : ''}`,
      foot: `<button class="btn" data-print>${BO.icon('print', 14)}Imprimer / PDF</button>${rest(i) > 0 ? `<button class="btn" data-remind>${BO.icon('send', 14)}Relancer ${esc(i.payer)}</button>` : ''}<span class="sp"></span><button class="btn" data-close>Fermer</button>${rest(i) > 0 ? `<button class="btn pri" data-pay>${BO.icon('coins', 14)}Encaisser</button>` : ''}`,
      onMount: (el, close) => {
        el.querySelector('[data-print]').addEventListener('click', () => print(i));
        const r = el.querySelector('[data-remind]'); if (r) r.addEventListener('click', () => { close(); remind(i); });
        const p = el.querySelector('[data-pay]'); if (p) p.addEventListener('click', () => { close(); BO.formModal({ title: 'Encaissement — ' + i.no, fields: [{ k: 'amount', label: 'Montant reçu (€)', type: 'number', min: 0, req: true, v: rest(i) }, { k: 'date', label: 'Date de valeur', type: 'date', req: true, v: today() }, { k: 'ref', label: 'Référence (virement, chèque)' }], submit: 'Enregistrer', onSubmit: y => { pay(i, +y.amount, y.date, y.ref); UI.toast('Encaissé', i.no + ' · ' + chf2(+y.amount), 'ok', 'coins'); BO.now(); } }); });
      } });
  }
  function remind(i) {
    const ins = (CX.S.insurers || []).find(x => x.short === i.payer || x.name === i.payer);
    BO.compose({ title: 'Relance de paiement — ' + i.no, to: ins ? ins.email || '' : '', channel: 'E-mail', subject: `Relance — facture ${i.no} (${i.ref || i.plate}) — ${chf2(rest(i))} TTC`,
      body: `Madame, Monsieur,\n\nSauf erreur de notre part, la facture ${i.no} du ${U.fmtD(i.at)} (${i.label}, véhicule ${i.plate}${i.ref ? ', dossier ' + i.ref : ''}) d’un montant de ${chf2(i.ttc)} TTC reste impayée à ce jour (échéance ${U.fmtD(i.due)}).\n\nMerci de nous indiquer la date de règlement ou de nous signaler tout élément manquant au dossier.\n\n${CX.S.company.name} · ${CX.S.company.phone}`,
      okLabel: 'J’ai envoyé la relance', onSend: m => { i.history.unshift({ at: CX.now(), text: 'Relance envoyée (' + m.channel + ') à ' + m.to, by: CX.S.meId }); i.reminded = today(); CX.touch('dinvoice'); UI.toast('Relance tracée', i.no, 'ok', 'send'); BO.now(); } });
  }

  function render(el, params) {
    const all = list();
    if (params.id) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => { const i = all.find(x => x.id === id); if (i) detail(i); }, 0); }
    const open = all.filter(i => i.status !== 'Payée'), lateL = all.filter(late), q = st.q.toLowerCase();
    const toBillM = CX.S.missions.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status) && !all.some(i => i.kind === 'mission' && i.srcId === m.id));
    const toBillG = CX.S.gardes.filter(g => g.outAt && !all.some(i => i.kind === 'garde' && i.srcId === g.id));
    let rows = st.seg === 'open' ? open : st.seg === 'late' ? lateL : st.seg === 'paid' ? all.filter(i => i.status === 'Payée') : all;
    if (q) rows = rows.filter(i => (i.no + ' ' + i.payer + ' ' + i.ref + ' ' + i.plate + ' ' + i.label).toLowerCase().includes(q));
    const sum = a => a.reduce((x, i) => x + rest(i), 0);
    el.innerHTML = `<div class="bo-page">${BO.head('Facturation', `${open.length} factures en attente · ${chf(sum(open))} TTC à encaisser · ${lateL.length} en retard`, `<button class="btn" data-export>${BO.icon('download', 15)}Export CSV</button>`)}
      <div class="kpis">${BO.kpi({ lb: 'À encaisser', v: chf(sum(open)), icon: 'coins', s: open.length + ' factures', cls: open.length ? '' : 'ok' })}${BO.kpi({ lb: 'En retard', v: chf(sum(lateL)), icon: 'alert', s: lateL.length + ' factures échues', cls: lateL.length ? 'warn' : '' })}${BO.kpi({ lb: 'Missions à facturer', v: toBillM.length, icon: 'truck', s: chf(toBillM.reduce((a, m) => a + m.price, 0)) + ' HT' })}${BO.kpi({ lb: 'Gardes sorties à facturer', v: toBillG.length, icon: 'layers', s: 'véhicules restitués' })}${BO.kpi({ lb: 'Encaissé ce mois', v: chf(all.filter(i => i.paidAt && i.paidAt.slice(0, 7) === today().slice(0, 7)).reduce((a, i) => a + i.ttc, 0)), icon: 'check', s: 'TTC' })}</div>
      ${toBillM.length || toBillG.length ? `<div class="card mb"><div class="card-h"><h3>${BO.icon('invoice', 16)}À facturer maintenant <small>· ${toBillM.length + toBillG.length}</small></h3></div><div>${toBillM.map(m => `<div class="todo"><span class="tic mid">${BO.icon('truck', 16)}</span><div class="tx"><b>${esc(m.no)} · ${esc(m.kind)} · ${esc(m.mandant)}</b><span>${esc(m.vehicle.plate)} · ${esc(m.address)} · ${chf(m.price)} HT</span></div><div class="ta"><button class="btn sm pri" data-bm="${m.id}">Facturer</button></div></div>`).join('')}${toBillG.map(g => `<div class="todo"><span class="tic mid">${BO.icon('layers', 16)}</span><div class="tx"><b>${esc(g.no)} · gardiennage ${DEP.gardeDays(g)} j · ${esc(g.mandant)}</b><span>${esc(g.vehicle.plate)} · sorti ${esc(BO.dt(g.outAt))} · ${chf(g.total || DEP.gardeFees(g))} HT</span></div><div class="ta"><button class="btn sm pri" data-bg="${g.id}">Facturer</button></div></div>`).join('')}</div></div>` : ''}
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['open', 'En attente', open.length], ['late', 'En retard', lateL.length], ['paid', 'Payées', all.filter(i => i.status === 'Payée').length], ['all', 'Toutes', all.length]], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="N°, mandant, référence, plaque…" value="${esc(st.q)}"></div></div>
      <div data-t></div></div>`;
    BO.table(el.querySelector('[data-t]'), { rows, state: st.tbl,
      cols: [{ k: 'no', label: 'Facture', render: i => `<b>${esc(i.no)}</b><div class="xs-t muted">${i.kind === 'mission' ? 'Mission' : 'Gardiennage'}</div>` }, { k: 'at', label: 'Date', render: i => esc(U.fmtD(i.at)) }, { k: 'payer', label: 'Mandant', render: i => esc(i.payer) + (i.ref ? ` <span class="xs-t muted">${esc(i.ref)}</span>` : '') }, { k: 'plate', label: 'Véhicule', render: i => BO.plate(i.plate) }, { k: 'label', label: 'Objet', render: i => esc(i.label) }, { k: 'due', label: 'Échéance', render: i => `<span class="${late(i) ? 'red-t' : ''}">${esc(U.fmtD(i.due))}</span>` }, { k: 'ttc', label: 'TTC', num: true, render: i => chf2(i.ttc) }, { k: 'rest', label: 'Reste dû', num: true, get: i => rest(i), render: i => `<b>${chf2(rest(i))}</b>` }, { k: 'st', label: 'Statut', get: i => stat(i), render: i => BO.chip(stat(i), TONE[stat(i)], true) }, { k: 'a', label: '', render: i => `<button class="btn sm" data-open-i="${i.id}">Ouvrir</button>` }],
      after: h => h.querySelectorAll('[data-open-i]').forEach(b => b.addEventListener('click', () => detail(all.find(x => x.id === b.dataset.openI)))) });
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelectorAll('[data-bm]').forEach(b => b.addEventListener('click', () => { billMission(DEP.mission(b.dataset.bm)); BO.now(); }));
    el.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => { billGarde(DEP.garde(b.dataset.bg)); BO.now(); }));
    el.querySelector('[data-export]').addEventListener('click', () => { const csv = ['no;date;mandant;reference;vehicule;objet;echeance;ht;tva;ttc;paye;statut', ...all.map(i => [i.no, i.at, i.payer, i.ref, i.plate, i.label, i.due, i.ht, i.tva, i.ttc, i.paid || 0, stat(i)].map(x => String(x).replace(/;/g, ',')).join(';'))].join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'factures-dan-depann.csv'; a.click(); });
  }
  APP.register({ id: 'invoices', label: 'Facturation', icon: 'invoice', group: 'Finances & équipe', order: 1, activity: 'depannage', render, badge: () => { try { return list().filter(late).length; } catch (e) { return 0; } } });
})();
