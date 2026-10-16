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
  const rest = i => Math.max(0, Math.round((i.ttc - (i.paid || 0) - (i.credited || 0)) * 100) / 100);
  const late = i => rest(i) > 0 && i.due < today();
  const stat = i => late(i) ? 'En retard' : i.status;
  const TONE = { 'Émise': 'amber', 'Payée': 'green', 'En retard': 'red', 'Partiel': 'amber', 'Avoir':'purple', 'Soldée par avoir':'green' };
  const nextNo = () => 'FD-' + (Math.max(2026400, ...list().map(i => Number(i.no.replace('FD-', '')) || 0)) + 1);
  const LABELS = {
    'Remorquage moto': m=>'Remorquage moto / deux-roues — '+m.address+' → '+(m.destination || 'garage'),
    'Démarrage batterie': ()=>'Démarrage au booster — diagnostic sur place',
    'Ouverture de porte': ()=>'Ouverture de porte du véhicule',
    'Dépannage auto': m=>'Dépannage automobile — '+m.address,
    'Remorquage simple': m => 'Remorquage — ' + m.address + ' → ' + (m.destination || 'garage'),
    'Panne batterie': () => 'Dépannage sur place — diagnostic, démarrage ou remplacement de batterie',
    'Crevaison': () => 'Dépannage sur place — roue de secours / réparation crevaison',
    'Panne carburant': () => 'Dépannage sur place — livraison de carburant',
    'Erreur carburant': m => 'Remorquage après erreur de carburant — ' + m.address,
    'Bris de glace': m => 'Remorquage bris de glace — ' + m.address + ' → ' + (m.destination || 'garage agréé'),
    'Vandalisme': m => 'Remorquage véhicule vandalisé — ' + m.address + ' → parc',
    'Accident': m => 'Remorquage véhicule accidenté — ' + m.address + ' → ' + (m.destination || 'parc'),
  };
  const mk = (o) => { const ht = o.lines.reduce((a, l) => a + l.qty * l.price, 0); return Object.assign({ id: U.uid('DI'), no: nextNo(), at: today(), due: U.addDays(today(), CX.S.company.terms || 30), paid: 0, credited: 0, payments: [], status: 'Émise', history: [{ at: CX.now(), text: 'Facture émise', by: CX.S.meId }] }, o, { ht, tva: Math.round(ht * TVA() * 100) / 100, ttc: Math.round(ht * (1 + TVA()) * 100) / 100 }); };

  /** Facture une mission terminée / déposée : une ligne de dépannage + options. */
  function billMission(m) {
    if (!m || !['Terminée', 'Déposée au parc'].includes(m.status)) return null;
    if(m.serviceId && !m.priceConfirmed){UI.toast('Prix à confirmer','Le montant web est un prix de départ : faites valider le montant dans la mission.','warn');return null;}
    if(m.insurance?.status==='Refusée' && m.mandant!=='Particulier'){UI.toast('Prise en charge refusée','Confirmez le payeur avec le propriétaire et modifiez le mandant avant de facturer.','warn');return null;}
    if (list().some(i => i.kind === 'mission' && i.srcId === m.id)) { UI.toast('Déjà facturée', m.no, 'warn'); return null; }
    const lines = [{ label: (LABELS[m.kind] || (x => x.kind + ' — ' + x.address))(m), qty: 1, price: m.price }];
    if (/batterie/i.test(m.kind)) { const so = (CX.S.supplyOrders || []).find(o => o.missionId === m.id && o.status === 'Posée'); if (so) lines.push({ label: 'Fourniture — ' + so.item, qty: so.qty, price: Math.round(so.price * 1.25) }); }
    const i = mk({ payer: m.mandant, ref: m.ref || '', kind: 'mission', srcId: m.id, plate: m.vehicle.plate, label: m.kind + ' · ' + m.address, lines });
    const deposits=(CX.S.depDeposits || []).filter(d=>d.missionId===m.id && !d.invoiceId);
    i.paid=Math.min(i.ttc,deposits.reduce((sum,d)=>sum+d.amount,0));
    i.payments=deposits.map(d=>({amount:d.amount,date:d.date,ref:d.ref}));
    deposits.forEach(d=>{d.invoiceId=i.id;});
    if(i.paid>=i.ttc){i.status='Payée';i.paidAt=deposits.at(-1)?.date || today();} else if(i.paid>0)i.status='Partiel';
    list().unshift(i); if (m.status !== 'Facturée') DEP.setMissionStatus(m.id, 'Facturée'); CX.touch('dinvoice');
    UI.toast('Facture ' + i.no, chf2(i.ttc) + ' TTC à ' + i.payer, 'ok', 'invoice'); return i;
  }
  /** Facture une garde restituée : jours × tarif + frais de dossier. */
  function billGarde(g) {
    if (!g || !g.outAt) return null;
    if(g.insurance?.status==='Refusée' && g.mandant!=='Particulier'){UI.toast('Prise en charge refusée','Confirmez le payeur avant de facturer.','warn');return null;}
    if (list().some(i => i.kind === 'garde' && i.srcId === g.id)) { UI.toast('Déjà facturée', g.no, 'warn'); return null; }
    const d = DEP.gardeDays(g), lines = [{ label: 'Gardiennage ' + d + ' jour' + (d > 1 ? 's' : '') + ' · ' + g.vehicle.plate + ' (' + g.level + ')', qty: d, price: g.dailyFee ?? CX.S.parc.dailyFee }, { label: 'Frais de dossier', qty: 1, price: g.adminFee ?? CX.S.parc.adminFee ?? 0 }];
    const i = mk({ payer: g.mandant, ref: g.ref || '', kind: 'garde', srcId: g.id, plate: g.vehicle.plate, label: 'Gardiennage ' + d + ' j · ' + g.vehicle.plate, lines, paid: g.paid || 0 });
    if(i.paid>0)i.payments=[{amount:i.paid,date:U.dOf(g.outAt),ref:'Règlement déclaré à la sortie'}];
    if (i.paid >= i.ttc) { i.status = 'Payée'; i.paidAt = U.dOf(g.outAt); } else if (i.paid > 0) i.status = 'Partiel'; list().unshift(i); CX.touch('dinvoice');
    UI.toast('Facture ' + i.no, chf2(i.ttc) + ' TTC à ' + i.payer, 'ok', 'invoice'); return i;
  }
  function pay(i, amount, date, ref) {
    if (!i || !Number.isFinite(amount) || amount <= 0 || amount > rest(i) + 0.005) { UI.toast('Montant invalide', 'Saisissez un montant positif inférieur ou égal au solde.', 'warn'); return null; }
    i.history = i.history || []; i.payments = i.payments || []; i.payments.push({ amount, date:date || today(), ref:ref || '' });
    i.paid = Math.min(i.ttc, (i.paid || 0) + amount); i.status = i.paid + (i.credited || 0) >= i.ttc - 0.005 ? 'Payée' : 'Partiel'; if (i.status === 'Payée') i.paidAt = date || today();
    i.history.unshift({ at: CX.now(), text: 'Encaissement ' + chf2(amount) + (ref ? ' · ' + ref : '') + ' · valeur ' + U.fmtD(date || today()), by: CX.S.meId }); CX.touch('dinvoice'); return i;
  }
  window.DEP = window.DEP || {}; DEP.billMission = billMission; DEP.billGarde = billGarde; DEP.invoices = list; DEP.payInvoice = pay;

  DEP.invoiceBalance = rest;
  DEP.recordDeposit = (missionId, amount, date = today(), ref = '') => {
    const m=DEP.mission(missionId), ds=CX.S.depDeposits || (CX.S.depDeposits=[]), current=ds.filter(d=>d.missionId===missionId).reduce((a,d)=>a+d.amount,0), max=Math.round(m?.price*(1+TVA())*100)/100;
    if(!m || m.status==='Facturée' || !Number.isFinite(amount) || amount<=0 || current+amount>max+.005) {UI.toast('Acompte invalide','Le cumul doit rester inférieur au tarif TTC prévu.','warn');return null;}
    const d={id:U.uid('AC'),missionId,amount,date,ref,invoiceId:null};ds.push(d);m.history.unshift({at:CX.now(),text:'Acompte déclaré '+chf2(amount)+' TTC · '+ref});CX.touch('dinvoice');return d;
  };
  DEP.creditInvoice = (id, amount, reason) => {
    const i=list().find(i=>i.id===id);
    if(!i || i.kind==='avoir' || !Number.isFinite(amount) || amount<=0 || amount>rest(i)+.005 || !String(reason || '').trim()) {UI.toast('Avoir refusé','Motif et montant positif dans la limite du solde non réglé requis.','warn');return null;}
    // Même taux que la facture d’origine ; aucun remboursement bancaire simulé.
    const rate=i.ht ? i.tva/i.ht : TVA(), ht=Math.round(amount/(1+rate)*100)/100;
    const credit=mk({kind:'avoir',srcId:i.id,payer:i.payer,ref:i.ref,plate:i.plate,label:'Avoir sur '+i.no+' · '+reason,lines:[{label:'Avoir sur '+i.no+' — '+reason,qty:1,price:-ht}],status:'Avoir'});
    Object.assign(credit,{ht:-ht,tva:-Math.round((amount-ht)*100)/100,ttc:-amount});
    i.credited=Math.round(((i.credited||0)+amount)*100)/100;i.history.unshift({at:CX.now(),text:'Avoir '+credit.no+' · '+chf2(amount)+' TTC · '+reason});
    if(rest(i)===0)i.status='Soldée par avoir';list().unshift(credit);CX.touch('dinvoice');return credit;
  };
  const csvCell = value => { let text=String(value ?? ''); if (/^[=+@\t\r-]/.test(text)) text="'"+text; return '"'+text.replace(/"/g,'""')+'"'; };
  DEP.accountingCSV = () => {
    const rows=[['Journal','Date','Pièce','Compte','Libellé','Débit','Crédit','Référence']];
    const money=n=>Math.abs(n).toFixed(2).replace('.',',');
    const entry=(journal,date,no,account,label,debit,credit,ref)=>rows.push([journal,date,no,account,label,debit?money(debit):'0,00',credit?money(credit):'0,00',ref]);
    for(const i of list()) {
      const credit=i.kind==='avoir', amount=Math.abs(i.ttc), ht=Math.abs(i.ht), vat=Math.abs(i.tva);
      entry('VE',i.at,i.no,'411000',i.payer+' · '+i.label,credit?0:amount,credit?amount:0,i.ref);
      entry('VE',i.at,i.no,'706000',i.label,credit?ht:0,credit?0:ht,i.ref);
      entry('VE',i.at,i.no,'445710','TVA collectée',credit?vat:0,credit?0:vat,i.ref);
    }
    return '\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');
  };
  function depositForm(m) { BO.formModal({title:'Acompte déclaré — '+m.no,intro:'Démonstration : enregistrez uniquement un règlement reçu et vérifié. Aucun débit bancaire.',fields:[{k:'amount',label:'Montant TTC reçu (€)',type:'number',min:0,req:true},{k:'date',label:'Date',type:'date',v:today(),req:true},{k:'ref',label:'Référence du règlement',req:true}],submit:'Enregistrer l’acompte',onSubmit:x=>{if(!DEP.recordDeposit(m.id,+x.amount,x.date,x.ref))return false;BO.now();}}); }
  DEP.depositForm = depositForm;
  function print(i) {
    const co = CX.S.company;
    const inner = `<div class="hd"><div class="brand">${UI.logo(42)}<div><b>${esc(co.name)}</b><small>Dépannage · Remorquage · Gardiennage · 24h/24</small></div></div><div class="co">${esc(co.address)}<br>${esc(co.phone)} · ${esc(co.email)}</div></div>
      <div class="addr"><b>${esc(i.payer)}</b><br>${/AXA|MAIF|Allianz|Macif|Groupama|Matmut/.test(i.payer) ? 'Service sinistres automobile' : ''}<br>${i.ref ? 'Référence sinistre ' + esc(i.ref) : ''}</div>
      <p>DÉMONSTRATION FICTIVE — document non réglementaire</p><h1>${i.kind === 'avoir' ? 'Avoir' : 'Facture'} ${esc(i.no)}</h1><div class="meta">${esc(i.plate)} · ${esc(U.fmtD(i.at))} · échéance ${esc(U.fmtD(i.due))}</div>
      <table><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">PU HT</th><th class="n">Total HT</th></tr></thead><tbody>${i.lines.map(l => `<tr><td>${esc(l.label)}</td><td class="n">${l.qty}</td><td class="n">${chf2(l.price)}</td><td class="n">${chf2(l.qty * l.price)}</td></tr>`).join('')}</tbody></table>
      <table class="tot"><tr><td>Montant HT</td><td class="n">${chf2(i.ht)}</td></tr><tr><td>TVA ${BO.tvaLbl()}</td><td class="n">${chf2(i.tva)}</td></tr><tr class="big"><td>Montant TTC</td><td class="n">${chf2(i.ttc)}</td></tr>${i.paid ? `<tr><td>Déjà réglé</td><td class="n">− ${chf2(i.paid)}</td></tr><tr class="big"><td>Reste dû</td><td class="n">${chf2(rest(i))}</td></tr>` : ''}</table>
      <div class="cond">Conditions : paiement à ${co.terms || 30} jours · IBAN ${esc(co.iban)} · SIRET ${esc(co.siret)} · TVA ${esc(co.tvaIntra)}. Dépanneur agréé toutes compagnies.</div>`;
    BO.preview('Facture ' + i.no, BO.printHtml('Facture ' + i.no, inner), 'Facture-' + i.no + '.html');
  }
  function detail(i) {
    UI.modal({ title: esc(i.no) + ' · ' + esc(i.payer), wide: true,
      body: `<div class="row" style="gap:8px;flex-wrap:wrap">${BO.plate(i.plate, true)}${BO.chip(stat(i), TONE[stat(i)], true)}<span class="chip line">${i.kind === 'avoir' ? 'Avoir' : i.kind === 'mission' ? 'Mission' : 'Gardiennage'}</span>${i.ref ? `<span class="chip line">${esc(i.ref)}</span>` : ''}</div>
        <div class="tiles mt"><div class="tile"><div class="tl">Émise le</div><div class="tv" style="font-size:14px">${esc(U.fmtD(i.at))}</div></div><div class="tile"><div class="tl">Échéance</div><div class="tv" style="font-size:14px">${esc(U.fmtD(i.due))}</div></div><div class="tile"><div class="tl">TTC</div><div class="tv">${chf2(i.ttc)}</div></div><div class="tile"><div class="tl">Reste dû</div><div class="tv">${chf2(rest(i))}</div></div></div>
        <table class="tbl mt"><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">PU HT</th><th class="n">HT</th></tr></thead><tbody>${i.lines.map(l => `<tr><td>${esc(l.label)}</td><td class="n">${l.qty}</td><td class="n">${chf2(l.price)}</td><td class="n">${chf2(l.qty * l.price)}</td></tr>`).join('')}</tbody></table>
        ${(i.history || []).length ? `<ul class="hist mt">${i.history.slice(0, 6).map(h => `<li><b>${esc(h.text)}</b><small>${esc(BO.dt(h.at))}</small></li>`).join('')}</ul>` : ''}`,
      foot: `<button class="btn" data-print>${BO.icon('print', 14)}Imprimer / PDF</button>${rest(i) > 0 ? `<button class="btn" data-credit>Créer un avoir</button>` : ''}${rest(i) > 0 ? `<button class="btn" data-remind>${BO.icon('send', 14)}Relancer ${esc(i.payer)}</button>` : ''}<span class="sp"></span><button class="btn" data-close>Fermer</button>${rest(i) > 0 ? `<button class="btn pri" data-pay>${BO.icon('coins', 14)}Encaisser</button>` : ''}`,
      onMount: (el, close) => {
        el.querySelector('[data-print]').addEventListener('click', () => print(i));
        const c=el.querySelector('[data-credit]');if(c)c.addEventListener('click',()=>{close();BO.formModal({title:'Avoir sur '+i.no,fields:[{k:'amount',label:'Montant TTC à annuler (€)',type:'number',min:0,v:rest(i),req:true},{k:'reason',label:'Motif',req:true}],submit:'Émettre l’avoir',onSubmit:x=>{if(!DEP.creditInvoice(i.id,+x.amount,x.reason))return false;BO.now();}});});
        const r = el.querySelector('[data-remind]'); if (r) r.addEventListener('click', () => { close(); remind(i); });
        const p = el.querySelector('[data-pay]'); if (p) p.addEventListener('click', () => { close(); BO.formModal({ title: 'Encaissement — ' + i.no, fields: [{ k: 'amount', label: 'Montant reçu (€)', type: 'number', min: 0, req: true, v: rest(i) }, { k: 'date', label: 'Date de valeur', type: 'date', req: true, v: today() }, { k: 'ref', label: 'Référence (virement, chèque)' }], submit: 'Enregistrer', onSubmit: y => { if (!pay(i, +y.amount, y.date, y.ref)) return false; UI.toast('Encaissé', i.no + ' · ' + chf2(+y.amount), 'ok', 'coins'); BO.now(); } }); });
      } });
  }
  function remind(i) {
    const ins = (CX.S.insurers || []).find(x => x.short === i.payer || x.name === i.payer);
    BO.compose({ title: 'Relance de paiement — ' + i.no, to: ins ? ins.email || '' : '', channel: 'E-mail', subject: `Relance — facture ${i.no} (${i.ref || i.plate}) — ${chf2(rest(i))} TTC`,
      body: `Madame, Monsieur,\n\nSauf erreur de notre part, la facture ${i.no} du ${U.fmtD(i.at)} (${i.label}, véhicule ${i.plate}${i.ref ? ', dossier ' + i.ref : ''}) d’un montant de ${chf2(i.ttc)} TTC reste impayée à ce jour (échéance ${U.fmtD(i.due)}).\n\nMerci de nous indiquer la date de règlement ou de nous signaler tout élément manquant au dossier.\n\n${CX.S.company.name} · ${CX.S.company.phone}`,
      okLabel: 'J’ai envoyé la relance', onSend: m => { i.history.unshift({ at: CX.now(), text: 'Relance envoyée (' + m.channel + ') à ' + m.to, by: CX.S.meId }); i.reminded = today(); CX.touch('dinvoice'); UI.toast('Relance tracée', i.no, 'ok', 'send'); BO.now(); } });
  }

  function render(el, params) {
    if (params.seg) { st.seg = params.seg; APP.setParams({ seg: null }); }
    const all = list();
    if (params.id) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => { const i = all.find(x => x.id === id); if (i) detail(i); }, 0); }
    const open = all.filter(i => rest(i) > 0), lateL = all.filter(late), q = st.q.toLowerCase();
    const toBillM = CX.S.missions.filter(m => ['Déposée au parc', 'Terminée'].includes(m.status) && !all.some(i => i.kind === 'mission' && i.srcId === m.id));
    const toBillG = CX.S.gardes.filter(g => g.outAt && !all.some(i => i.kind === 'garde' && i.srcId === g.id));
    let rows = st.seg === 'open' ? open : st.seg === 'late' ? lateL : st.seg === 'paid-month' ? all.filter(i => (i.payments || []).some(p => p.date?.slice(0,7)===today().slice(0,7))) : st.seg === 'paid' ? all.filter(i => i.status === 'Payée') : all;
    if (q) rows = rows.filter(i => (i.no + ' ' + i.payer + ' ' + i.ref + ' ' + i.plate + ' ' + i.label).toLowerCase().includes(q));
    const sum = a => a.reduce((x, i) => x + rest(i), 0);
    el.innerHTML = `<div class="bo-page"><div class="form-note mb">Démonstration fictive · règlements déclarés manuellement · export de préparation comptable, à valider par votre comptable.</div>${BO.head('Facturation', `${open.length} factures en attente · ${chf(sum(open))} TTC à encaisser · ${lateL.length} en retard`, `<button class="btn" data-export>${BO.icon('download', 15)}Journal des ventes CSV</button><button class="btn" data-export-follow>Suivi factures CSV</button>`)}
      <div class="kpis">${BO.kpi({ lb: 'À encaisser', v: chf(sum(open)), icon: 'coins', s: open.length + ' factures', cls: open.length ? '' : 'ok' })}${BO.kpi({ lb: 'En retard', v: chf(sum(lateL)), icon: 'alert', s: lateL.length + ' factures échues', cls: lateL.length ? 'warn' : '' })}${BO.kpi({ lb: 'Missions à facturer', v: toBillM.length, icon: 'truck', s: chf(toBillM.reduce((a, m) => a + m.price, 0)) + ' HT' })}${BO.kpi({ lb: 'Gardes sorties à facturer', v: toBillG.length, icon: 'layers', s: 'véhicules restitués' })}${BO.kpi({ lb: 'Encaissé ce mois', v: chf(all.reduce((sum,i)=>sum+(i.payments || []).filter(p=>p.date?.slice(0,7)===today().slice(0,7)).reduce((a,p)=>a+p.amount,0),0) + (CX.S.depDeposits || []).filter(d=>d.date.slice(0,7)===today().slice(0,7) && !d.invoiceId).reduce((a,d)=>a+d.amount,0)), icon: 'check', s: 'TTC' })}</div>
      ${toBillM.length || toBillG.length ? `<div class="card mb"><div class="card-h"><h3>${BO.icon('invoice', 16)}À facturer maintenant <small>· ${toBillM.length + toBillG.length}</small></h3></div><div>${toBillM.map(m => `<div class="todo"><span class="tic mid">${BO.icon('truck', 16)}</span><div class="tx"><b>${esc(m.no)} · ${esc(m.kind)} · ${esc(m.mandant)}</b><span>${esc(m.vehicle.plate)} · ${esc(m.address)} · ${chf(m.price)} HT</span></div><div class="ta"><button class="btn sm" data-deposit="${m.id}">Acompte</button><button class="btn sm pri" data-bm="${m.id}">Facturer</button></div></div>`).join('')}${toBillG.map(g => `<div class="todo"><span class="tic mid">${BO.icon('layers', 16)}</span><div class="tx"><b>${esc(g.no)} · gardiennage ${DEP.gardeDays(g)} j · ${esc(g.mandant)}</b><span>${esc(g.vehicle.plate)} · sorti ${esc(BO.dt(g.outAt))} · ${chf(g.total || DEP.gardeFees(g))} HT</span></div><div class="ta"><button class="btn sm pri" data-bg="${g.id}">Facturer</button></div></div>`).join('')}</div></div>` : ''}
      <div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['open', 'En attente', open.length], ['late', 'En retard', lateL.length], ['paid', 'Payées', all.filter(i => i.status === 'Payée').length], ['all', 'Toutes', all.length]], st.seg)}<span class="sp"></span><div class="box" style="width:280px"><input class="inp" data-q placeholder="N°, mandant, référence, plaque…" value="${esc(st.q)}"></div></div>
      ${st.seg==='paid-month' ? `<div class="card mb"><div class="card-h"><h3>Acomptes non encore imputés</h3></div><div class="card-b">${(CX.S.depDeposits || []).filter(d=>!d.invoiceId && d.date.slice(0,7)===today().slice(0,7)).map(d=>`<p><a class="lnk" data-open="missions:${d.missionId}">${esc((DEP.mission(d.missionId)||{}).no || d.missionId)}</a> · ${esc(U.fmtD(d.date))} · ${chf2(d.amount)} TTC · ${esc(d.ref)}</p>`).join('') || '<p class="muted">Aucun acompte en attente d’imputation ce mois-ci.</p>'}</div></div>` : ''}
      <div data-t></div></div>`;
    BO.table(el.querySelector('[data-t]'), { rows, state: st.tbl,
      cols: [{ k: 'no', label: 'Facture', render: i => `<b>${esc(i.no)}</b><div class="xs-t muted">${i.kind === 'avoir' ? 'Avoir' : i.kind === 'mission' ? 'Mission' : 'Gardiennage'}</div>` }, { k: 'at', label: 'Date', render: i => esc(U.fmtD(i.at)) }, { k: 'payer', label: 'Mandant', render: i => esc(i.payer) + (i.ref ? ` <span class="xs-t muted">${esc(i.ref)}</span>` : '') }, { k: 'plate', label: 'Véhicule', render: i => BO.plate(i.plate) }, { k: 'label', label: 'Objet', render: i => esc(i.label) }, { k: 'due', label: 'Échéance', render: i => `<span class="${late(i) ? 'red-t' : ''}">${esc(U.fmtD(i.due))}</span>` }, { k: 'ttc', label: 'TTC', num: true, render: i => chf2(i.ttc) }, { k: 'rest', label: 'Reste dû', num: true, get: i => rest(i), render: i => `<b>${chf2(rest(i))}</b>` }, { k: 'st', label: 'Statut', get: i => stat(i), render: i => BO.chip(stat(i), TONE[stat(i)], true) }, { k: 'a', label: '', render: i => `<button class="btn sm" data-open-i="${i.id}">Ouvrir</button>` }],
      after: h => h.querySelectorAll('[data-open-i]').forEach(b => b.addEventListener('click', () => detail(all.find(x => x.id === b.dataset.openI)))) });
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    BO.bindSearch(el, v => { st.q = v; });
    el.querySelectorAll('[data-bm]').forEach(b => b.addEventListener('click', () => { billMission(DEP.mission(b.dataset.bm)); BO.now(); }));
    el.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => { billGarde(DEP.garde(b.dataset.bg)); BO.now(); }));
    el.querySelectorAll('[data-deposit]').forEach(b=>b.addEventListener('click',()=>depositForm(DEP.mission(b.dataset.deposit))));
    el.querySelector('[data-export-follow]').addEventListener('click',()=>{
      const rows=[['Numero','Type','Date','Mandant','Reference','Plaque','Objet','HT','TVA','TTC','Regle TTC','Avoirs TTC','Solde TTC','Statut'],...all.map(i=>[i.no,i.kind,i.at,i.payer,i.ref,i.plate,i.label,i.ht,i.tva,i.ttc,i.paid||0,i.credited||0,rest(i),stat(i)])];
      BO.download('suivi-factures-dan-depann.csv','\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');
    });
    el.querySelector('[data-export]').addEventListener('click', () => { const url=URL.createObjectURL(new Blob([DEP.accountingCSV()], {type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download='preparation-comptable-dan-depann.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); });
  }
  APP.register({ id: 'invoices', label: 'Facturation', icon: 'invoice', group: 'Finances & équipe', order: 1, activity: 'depannage', render, badge: () => { try { return list().filter(late).length; } catch (e) { return 0; } } });
})();
