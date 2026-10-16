/* ==========================================================================
   BO · Devis / chiffrage (façon Audatex / GT Motive) : opérations par pièce
   (remplacer / réparer / peindre / démonter-remonter), heures T1-T3 & peinture,
   ingrédients, pièces avec remises, forfaits, petite fourniture, TVA, franchise.
   Envoi à l'expert / l'assureur, accord, conversion en OR.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2, today } = U;
  const st = { f: 'open', q: '', tbl: { sort: 'date', dir: 'desc' } };
  let draft = null, draftKey = null;
  const STC = { 'Brouillon': '', 'Envoyé': 'amber', 'Accordé': 'green', 'Refusé': 'red', 'Converti': 'dark' };
  const OPC = ['E', 'I', 'L', 'DM'];
  /** opérations types par zone : [op, cat, h, ph, prix pièce] */
  const TPL = z => {
    if (z === 'pb' || z === 'lun') return [['E', 'T1', 2.5, 0, 980], ['I', 'T1', .8, 0, 0]];
    if (/^(ph|feu)/.test(z)) return [['E', 'T1', .6, 0, 520], ['DM', 'T1', .4, 0, 0]];
    if (/^ret/.test(z)) return [['E', 'T1', .5, .6, 360], ['L', '', 0, .8, 0]];
    if (z === 'struct') return [['I', 'T3', 6, 0, 0], ['DM', 'T3', 3, 0, 0], ['E', 'T3', 4, .8, 420]];
    if (z === 'toit' || z === 'capot') return [['I', 'T2', 3, 2.4, 0], ['E', 'T2', 1.2, 3, 690], ['L', '', 0, 2.8, 0], ['DM', 'T1', .8, 0, 0]];
    if (/^bc/.test(z)) return [['E', 'T3', 4.5, 2.6, 580], ['I', 'T2', 3, 2, 0], ['L', '', 0, 2, 0]];
    return [['I', 'T2', 2.5, 1.8, 0], ['E', 'T2', 1.5, 2.4, 450], ['L', '', 0, 2, 0], ['DM', 'T1', .6, 0, 0]];
  };
  const FORF = [['Calibrage caméra / radar ADAS', 180], ['Géométrie 4 roues', 160], ['Mise sur marbre (forfait)', 380], ['Protection corps creux', 95], ['Nettoyage intérieur & extérieur', 60], ['Élimination des déchets', 25], ['Scanner grêle — cartographie', 220], ['Recharge climatisation', 140]];

  const lineTotal = (l, R, co) => l.op === 'F' ? (+l.price || 0) * (+l.qty || 1) : (R[l.cat] ? (+l.h || 0) * R[l.cat] : 0) + (+l.ph || 0) * (R.P + co.paintMat) + (+l.price || 0) * (+l.qty || 0) * (1 - (+l.disc || 0) / 100);

  /* ---------------- impression ---------------- */
  BO.printQuote = q => {
    const v = CX.veh(q.vehicleId), c = CX.cust(q.customerId), k = q.claimId ? CX.claim(q.claimId) : null, t = CX.quoteTotals(q), R = CX.S.company.rates, co = CX.S.company;
    const groups = {}; q.lines.filter(l => l.op !== 'F').forEach(l => (groups[l.zone || 'div'] = groups[l.zone || 'div'] || []).push(l));
    const body = Object.keys(groups).map(z => `<tr class="grp"><td colspan="6">${esc(CX.ZONE[z] || 'Divers')}</td></tr>` + groups[z].map(l => `<tr><td>${esc(CX.OPS[l.op])}</td><td>${esc(l.piece)}${l.client ? ' <i>(à charge client)</i>' : ''}</td><td>${esc(l.ref || '')}</td><td class="n">${l.h ? BO.num(l.h, 1) + ' ' + esc(l.cat) : ''}</td><td class="n">${l.ph ? BO.num(l.ph, 1) : ''}</td><td class="n">${l.price ? chf2(l.price * l.qty * (1 - (l.disc || 0) / 100)).replace('', '') : ''}</td></tr>`).join('')).join('') + q.lines.filter(l => l.op === 'F').map(l => `<tr><td>Forfait</td><td>${esc(l.piece)}</td><td></td><td></td><td></td><td class="n">${chf2(l.price * (l.qty || 1)).replace('', '')}</td></tr>`).join('');
    const inner = `${BO.printHeader()}<div class="addr"><b>${esc(c.name)}</b><br>${esc(c.addr)}<br>${esc(c.city)}</div>
      <h1>Devis ${esc(q.no)} <span class="stamp">${esc(q.status)}</span></h1><div class="meta">${esc(v.plate)} · ${esc(v.make)} ${esc(v.model)} · VIN ${esc(v.vin)} · teinte ${esc(v.colorCode)} · ${BO.km(v.km)}${k ? ` · Sinistre ${esc(k.no)} — ${esc((CX.ins(k.insurerId) || {}).name)}` : ''} · établi le ${esc(U.fmtD(q.date))}</div>
      <table><thead><tr><th>Opération</th><th>Désignation</th><th>Référence</th><th class="n">MO h</th><th class="n">Peint. h</th><th class="n">Pièces €</th></tr></thead><tbody>${body}</tbody></table>
      <table class="tot"><tr><td>Main-d’œuvre T1 (${BO.num(t.hours.T1, 1)} h × ${R.T1}) · T2 (${BO.num(t.hours.T2, 1)} h × ${R.T2}) · T3 (${BO.num(t.hours.T3, 1)} h × ${R.T3})</td><td class="n">${chf2(t.labAmt)}</td></tr><tr><td>Peinture ${BO.num(t.paintH, 1)} h × ${R.P} + ingrédients ${co.paintMat}/h</td><td class="n">${chf2(t.paintAmt + t.mat)}</td></tr><tr><td>Pièces</td><td class="n">${chf2(t.parts)}</td></tr><tr><td>Forfaits</td><td class="n">${chf2(t.forf)}</td></tr><tr><td>Petite fourniture (${BO.num(co.smallPct * 100, 1)} %, max. ${co.smallMax})</td><td class="n">${chf2(t.small)}</td></tr><tr><td>Total HT</td><td class="n">${chf2(t.ht)}</td></tr><tr><td>TVA ${BO.tvaLbl()}</td><td class="n">${chf2(t.tva)}</td></tr><tr class="big"><td>Total TTC</td><td class="n">${chf2(t.ttc)}</td></tr></table>
      ${k ? `<div class="split">Répartition prévisionnelle : <b>${chf2(t.insurer)}</b> à la charge de ${esc((CX.ins(k.insurerId) || {}).name)} (paiement direct au garage sur cession de créance) · <b>${chf2(t.client)}</b> à la charge du client${t.franchise ? ' (franchise ' + chf(t.franchise) + ')' : ''}.</div>` : ''}
      <div class="cond">Devis valable 30 jours. Les dégâts cachés constatés au démontage feront l’objet d’un devis complémentaire soumis à accord. Garantie ${co.warrantyMonths} mois sur les travaux de carrosserie et de peinture.</div>
      <div class="sig"><div>Pour MOTEK Garage</div><div>Accord du client / de l’assureur (date, signature)</div></div>`;
    BO.preview('Aperçu — devis ' + q.no, BO.printHtml('Devis ' + q.no, inner), 'Devis-' + q.no + '.html');
  };

  /** relance pré-rédigée (assureur ou client) */
  BO.quoteRemind = (qId, after) => {
    const q = CX.quote(qId), k = q.claimId ? CX.claim(q.claimId) : null, c = CX.cust(q.customerId), v = CX.veh(q.vehicleId), t = CX.quoteTotals(q), i = k ? CX.ins(k.insurerId) : null;
    BO.compose({ title: 'Relance accord — ' + q.no, to: i ? i.email : c.email, channel: 'E-mail', subject: (k ? `Sinistre ${k.no} — ` : '') + `Devis ${q.no} en attente d’accord`, body: k
      ? `Madame, Monsieur,\n\nNous vous avons transmis le ${U.fmtD(U.dOf(q.sentAt || q.date))} notre devis ${q.no} (${chf2(t.ttc)} TTC) concernant le véhicule ${v.make} ${v.model} ${v.plate} de votre assuré·e ${c.name} — sinistre ${k.no}.\n\nLe véhicule est immobilisé dans nos locaux. Pourriez-vous nous faire parvenir votre accord de prise en charge (ou les coordonnées de l’expert mandaté) dans les meilleurs délais ?\n\nAvec nos meilleures salutations,\nMarc Dubois — Chef d’atelier\nMOTEK Garage · ${CX.S.company.phone}`
      : `Bonjour ${c.name.split(' ')[0]},\n\nPour rappel, notre devis ${q.no} pour votre ${CX.vlabel(v)} s’élève à ${chf2(t.ttc)} TTC. Nous pouvons planifier les travaux dès réception de votre accord (simple réponse à cet e-mail).\n\nMeilleures salutations,\nMOTEK Garage`,
      okLabel: 'Envoyer la relance', onSend: m => { if (k) { k.reminders = k.reminders || []; k.reminders.push({ at: CX.now(), to: i.short, status: m.status }); CX.updateClaim(k.id, {}, 'Relance assureur (accord devis ' + q.no + ')' + (m.status === 'manuel' ? ' — déclarée envoyée' : '')); } else { c.comms = c.comms || []; c.comms.unshift({ id: U.uid('cm'), at: CX.now(), ch: m.channel, dir: 'out', status: m.status, to: m.to, subject: m.subject, text: m.body, label: 'Relance devis ' + q.no, by: CX.S.meId }); CX.touch('quote', {}); } UI.toast(m.status === 'envoye' ? 'Relance envoyée' : 'Relance déclarée envoyée', q.no, 'ok', 'send'); after && after(m); } });
  };
  function sendQuote(q) {
    const k = q.claimId ? CX.claim(q.claimId) : null, i = k ? CX.ins(k.insurerId) : null, c = CX.cust(q.customerId), v = CX.veh(q.vehicleId), t = CX.quoteTotals(q);
    BO.compose({ title: 'Envoyer le devis ' + q.no + (i ? ' à ' + i.short : ' au client'), to: i ? i.email : c.email, channel: 'E-mail', subject: (k ? `Sinistre ${k.no} — ` : '') + `Devis ${q.no} — ${v.make} ${v.model} ${v.plate}`,
      body: i ? `Madame, Monsieur,\n\nVeuillez trouver ci-joint notre devis ${q.no} relatif au sinistre ${k.no} (${k.kind.toLowerCase()}) de votre assuré·e ${c.name}.\n\nMontant : ${chf2(t.ttc)} TTC — main-d’œuvre ${BO.num(t.hours.T1 + t.hours.T2 + t.hours.T3, 1)} h, peinture ${BO.num(t.paintH, 1)} h, pièces ${chf2(t.parts)}.\nFranchise à la charge de l’assuré : ${chf(t.franchise)}.\n\nPhotos et rapport de réception joints. ${k.expert ? 'Expert : ' + k.expert + '.' : 'Merci de nous indiquer si une expertise sur place est nécessaire.'}\nCession de créance : ${k.cession ? 'signée' : 'en cours de signature'}.\n\nMeilleures salutations,\nMOTEK Garage`
        : `Bonjour ${c.name.split(' ')[0]},\n\nVoici notre devis ${q.no} pour votre ${CX.vlabel(v)} : ${chf2(t.ttc)} TTC.\nDurée d’immobilisation estimée : ${Math.max(1, Math.ceil((t.hours.T1 + t.hours.T2 + t.hours.T3 + t.paintH) / 7))} jour(s).\n\nMerci de nous confirmer votre accord par retour d’e-mail.\n\nMeilleures salutations,\nMOTEK Garage`,
      note: 'PDF du devis, photos de réception et état des lieux joints automatiquement.', okLabel: 'Envoyer', onSend: () => { CX.setQuoteStatus(q.id, 'Envoyé'); UI.toast('Devis envoyé', q.no + (i ? ' · ' + i.short : ''), 'ok', 'send'); BO.now(); } });
  }
  function accordModal(q) {
    const k = q.claimId ? CX.claim(q.claimId) : null, t = CX.quoteTotals(q);
    BO.formModal({ title: 'Enregistrer l’accord — ' + q.no, intro: `<div class="form-note ok">${BO.icon('shieldok', 16)}<div>${k ? `Accord de <b>${esc((CX.ins(k.insurerId) || {}).name)}</b> pour le sinistre ${esc(k.no)}. Part assureur prévue : <b>${chf2(t.insurer)}</b> (franchise ${chf(t.franchise)} à charge du client).` : 'Accord du client sur le devis.'}</div></div>`,
      fields: [{ k: 'amount', label: k ? 'Montant accordé (€ TTC)' : 'Montant accepté (€ TTC)', type: 'number', min: 0, step: .05, req: true, v: k ? t.insurer + t.franchise : t.ttc }, { k: 'partial', label: 'Accord partiel (certaines positions refusées)', type: 'checkbox' }, { k: 'note', label: 'Remarque', type: 'textarea', full: true, ph: 'ex. remplacement jante refusé, réparation demandée' }],
      submit: 'Valider l’accord', onSubmit: x => { if (k) CX.decideClaim(k.id, x.partial ? 'Partiel' : 'Accordé', x.amount, x.note); else CX.setQuoteStatus(q.id, 'Accordé', { amount: x.amount }); UI.toast('Accord enregistré', q.no + ' · ' + chf(x.amount), 'ok', 'shieldok'); BO.now(); } });
  }

  /* ---------------- éditeur ---------------- */
  function editor(el, q0) {
    const key = (q0.id || 'new') + ':' + (q0.roId || '');
    if (!draft || draftKey !== key || (!BO.refreshing && q0.id && draft._saved !== JSON.stringify(q0.lines))) { draft = JSON.parse(JSON.stringify(q0)); draft._saved = JSON.stringify(q0.lines); draftKey = key; }
    const q = draft, R = CX.S.company.rates, co = CX.S.company;
    const v = CX.veh(q.vehicleId), c = CX.cust(q.customerId), k = q.claimId ? CX.claim(q.claimId) : null, r = q.roId ? CX.ro(q.roId) : null;
    const locked = ['Accordé', 'Converti'].includes(q0.status) && q0.id;
    let zoneSel = null;
    el.innerHTML = `<div class="bo-page">
      ${BO.crumb([['Devis / chiffrage', 'quotes'], [q.no]])}
      ${BO.head(`${esc(q.no)} ${q.version > 1 ? '<span class="tag">Supplément v' + q.version + '</span>' : ''} ${BO.chip(q0.id ? q0.status : 'Nouveau', STC[q0.status] || '')}`, v ? `${BO.plate(v.plate)} ${esc(v.make)} ${esc(v.model)} · teinte ${esc(v.colorCode)} ${esc(v.colorName)} · ${esc(c ? c.name : '')}` : 'Sélectionnez le véhicule à chiffrer',
        `${q0.id ? `<button class="btn" data-pdf>${BO.icon('print', 15)}Aperçu PDF</button>` : ''}${q0.id && ['Brouillon', 'Envoyé'].includes(q0.status) ? `<button class="btn" data-send>${BO.icon('send', 15)}${k ? 'Envoyer à l’expert / assureur' : 'Envoyer au client'}</button>` : ''}${q0.id && q0.status === 'Envoyé' ? `<button class="btn ok" data-acc>${BO.icon('shieldok', 15)}Accord reçu</button><button class="btn" data-ref>${BO.icon('x', 15)}Refus</button>` : ''}${q0.id && q0.status !== 'Refusé' ? (r ? `<button class="btn dark" data-open="ros:${r.id}">${BO.icon('wrench', 15)}Ouvrir ${esc(r.no)}</button>` : `<button class="btn dark" data-conv>${BO.icon('wrench', 15)}Convertir en OR</button>`) : ''}${locked ? '' : `<button class="btn pri" data-save>${BO.icon('check', 15)}Enregistrer</button>`}`)}
      ${locked ? `<div class="form-note ok mb">${BO.icon('lock', 16)}<div>Devis ${esc(q0.status.toLowerCase())} — les lignes sont verrouillées. Pour des dégâts cachés, créez un <a class="lnk" data-supp>devis complémentaire</a>.</div></div>` : ''}
      <div class="card pad mb"><div class="fgrid c4">
        <div class="field"><label>Véhicule</label><select class="inp" data-veh ${locked ? 'disabled' : ''}>${BO.opts(BO.optVehicles(), q.vehicleId, '— Choisir —')}</select></div>
        <div class="field"><label>Sinistre / assurance</label><select class="inp" data-claim ${locked ? 'disabled' : ''}>${BO.opts(CX.S.claims.filter(x => x.vehicleId === q.vehicleId).map(x => [x.id, (CX.ins(x.insurerId) || {}).short + ' · ' + x.no + ' · ' + x.kind]), q.claimId, 'Sans assurance (client)')}</select></div>
        <div class="field"><label>Franchise client</label><div class="inp" style="display:flex;align-items:center;background:#f6f7f9">${k ? chf(k.franchise) + ' · ' + esc(k.cover) : '—'}</div></div>
        <div class="field"><label>Ordre de réparation</label><div class="inp" style="display:flex;align-items:center;background:#f6f7f9">${r ? `<a class="lnk" data-open="ros:${r.id}">${esc(r.no)}</a>&nbsp;· ${esc(CX.STAGES[r.stage].s)}` : 'Créé à la conversion'}</div></div>
      </div></div>
      <div class="est">
        <div>
          ${locked ? '' : `<div class="card mb"><div class="card-h"><h3>${BO.icon('car', 16)}Chiffrage par zone <small>· cliquez une zone du véhicule</small></h3></div><div class="card-b"><div class="g" style="grid-template-columns:200px 1fr;align-items:start"><div data-diag>${BO.carDiagram(Object.fromEntries(q.lines.filter(l => l.zone).map(l => [l.zone, l.op === 'L' ? 'R' : 'B'])), { editable: true })}</div><div data-zone>${BO.empty('car', 'Choisissez une zone', 'Les opérations types (temps barèmes) sont proposées pour la pièce sélectionnée.', '', true)}</div></div>
            <div class="sepl"></div><div class="row wrap" style="gap:6px"><span class="xs-t muted b" style="margin-right:4px">FORFAITS</span>${FORF.map(([l, p], i) => `<button class="btn xs" data-forf="${i}">${BO.icon('plus', 11)}${esc(l)}</button>`).join('')}<button class="btn xs" data-line>${BO.icon('plus', 11)}Ligne libre</button></div></div></div>`}
          <div class="card"><div class="card-h"><h3>${BO.icon('list', 16)}Opérations <small data-cnt>${q.lines.length} ligne${q.lines.length > 1 ? 's' : ''}</small></h3><span class="legend"><span><i style="background:var(--red)"></i>E Remplacer</span><span><i style="background:#4b5563"></i>I Réparer</span><span><i style="background:#b96400"></i>L Peindre</span><span><i style="background:#16181c"></i>DM Dépose-repose</span></span></div><div style="padding:0 10px 12px;overflow:auto" data-lines></div></div>
        </div>
        <div class="sum card pad" data-sum></div>
      </div></div>`;

    const drawLines = () => {
      const host = el.querySelector('[data-lines]');
      if (!q.lines.length) { host.innerHTML = BO.empty('calc', 'Aucune opération', 'Ajoutez des opérations depuis le schéma ou un forfait.', '', true); return; }
      const order = [...new Set(q.lines.map(l => l.op === 'F' ? '~F' : (l.zone || '~div')))];
      host.innerHTML = `<table class="tbl compact est-tbl"><thead><tr><th style="min-width:200px">Pièce / opération</th><th>Op.</th><th>Cat.</th><th class="num">MO h</th><th class="num">Peint. h</th><th>Réf. pièce</th><th class="num">Qté</th><th class="num">Prix</th><th class="num">Rem.%</th><th class="num">Total</th><th title="À la charge du client (hors sinistre)">Client</th><th></th></tr></thead><tbody>${order.map(g => `<tr class="grp"><td colspan="12">${g === '~F' ? 'Forfaits' : g === '~div' ? 'Divers' : esc(CX.ZONE[g])}</td></tr>` + q.lines.map((l, i) => [l, i]).filter(([l]) => (l.op === 'F' ? '~F' : (l.zone || '~div')) === g).map(([l, i]) => `<tr data-i="${i}">
        <td><input class="inp" data-k="piece" value="${esc(l.piece)}" ${locked ? 'disabled' : ''}></td>
        <td>${l.op === 'F' ? '<span class="tag">Forfait</span>' : `<div class="opc">${OPC.map(o => `<button class="${l.op === o ? 'on o-' + o : ''}" data-op="${o}" title="${esc(CX.OPS[o])}" ${locked ? 'disabled' : ''}>${o}</button>`).join('')}</div>`}</td>
        <td>${l.op === 'F' ? '' : `<select class="inp" data-k="cat" style="width:62px" ${locked ? 'disabled' : ''}>${BO.opts([['', '—'], 'T1', 'T2', 'T3'], l.cat)}</select>`}</td>
        <td class="num">${l.op === 'F' ? '' : `<input class="inp" data-k="h" type="number" min="0" step=".1" value="${l.h || ''}" style="width:62px" ${locked ? 'disabled' : ''}>`}</td>
        <td class="num">${l.op === 'F' ? '' : `<input class="inp" data-k="ph" type="number" min="0" step=".1" value="${l.ph || ''}" style="width:62px" ${locked ? 'disabled' : ''}>`}</td>
        <td>${l.op === 'F' ? '' : `<input class="inp" data-k="ref" value="${esc(l.ref || '')}" style="width:120px" ${locked ? 'disabled' : ''}>`}</td>
        <td class="num">${l.op === 'F' ? '' : `<input class="inp" data-k="qty" type="number" min="0" step="1" value="${l.qty}" style="width:48px" ${locked ? 'disabled' : ''}>`}</td>
        <td class="num"><input class="inp" data-k="price" type="number" min="0" step=".05" value="${l.price || ''}" style="width:84px" ${locked ? 'disabled' : ''}></td>
        <td class="num">${l.op === 'F' ? '' : `<input class="inp" data-k="disc" type="number" min="0" max="60" step="1" value="${l.disc || ''}" style="width:52px" ${locked ? 'disabled' : ''}>`}</td>
        <td class="num b" data-tot>${chf2(lineTotal(l, R, co))}</td>
        <td style="text-align:center"><input type="checkbox" data-k="client" ${l.client ? 'checked' : ''} ${locked ? 'disabled' : ''} style="accent-color:var(--red)"></td>
        <td>${locked ? '' : `<button class="icon-btn" data-del title="Supprimer">${BO.icon('trash', 14)}</button>`}</td></tr>`).join('')).join('')}</tbody></table>`;
      el.querySelector('[data-cnt]').textContent = q.lines.length + ' ligne' + (q.lines.length > 1 ? 's' : '');
      host.querySelectorAll('tr[data-i]').forEach(tr => {
        const l = q.lines[+tr.dataset.i];
        tr.querySelectorAll('[data-k]').forEach(inp => inp.addEventListener(inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input', () => { const kk = inp.dataset.k; l[kk] = inp.type === 'checkbox' ? inp.checked : inp.type === 'number' ? (inp.value === '' ? 0 : Math.max(0, +inp.value)) : inp.value; tr.querySelector('[data-tot]').textContent = chf2(lineTotal(l, R, co)); drawSum(); }));
        tr.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => { l.op = b.dataset.op; if (l.op === 'L') { l.cat = ''; l.h = 0; if (!l.ph) l.ph = 2; } if (l.op === 'DM' && !l.cat) l.cat = 'T1'; drawLines(); drawSum(); }));
        const d = tr.querySelector('[data-del]'); if (d) d.addEventListener('click', () => { q.lines.splice(+tr.dataset.i, 1); drawLines(); drawSum(); redrawDiag(); });
      });
    };
    const drawSum = () => {
      const t = CX.quoteTotals(q), host = el.querySelector('[data-sum]');
      const appr = k && k.approvedAmount != null ? k.approvedAmount : null;
      host.innerHTML = `<h2 class="sec">${BO.icon('calc', 16)}Récapitulatif</h2>
        <dl>${['T1', 'T2', 'T3'].map(c2 => `<dt>${esc(CX.CATS[c2])} <small>${BO.num(t.hours[c2], 1)} h × ${R[c2]}</small></dt><dd>${chf2(t.lab[c2])}</dd>`).join('')}
          <dt>Peinture MO <small>${BO.num(t.paintH, 1)} h × ${R.P}</small></dt><dd>${chf2(t.paintAmt)}</dd>
          <dt>Ingrédients peinture <small>${co.paintMat}/h</small></dt><dd>${chf2(t.mat)}</dd>
          <dt>Pièces <small>remises déduites</small></dt><dd>${chf2(t.parts)}</dd><dt>Forfaits</dt><dd>${chf2(t.forf)}</dd>
          <dt>Petite fourniture <small>${BO.num(co.smallPct * 100, 1)} % plaf. ${co.smallMax}</small></dt><dd>${chf2(t.small)}</dd></dl>
        <div class="sepl"></div><dl><dt>Total HT</dt><dd>${chf2(t.ht)}</dd><dt>TVA ${BO.tvaLbl()}</dt><dd>${chf2(t.tva)}</dd></dl>
        <div class="row mt1" style="justify-content:space-between;align-items:baseline"><span class="b">Total TTC</span><span class="tot">${chf2(t.ttc)}</span></div>
        <div class="sepl"></div><h2 class="sec" style="font-size:13px">${BO.icon('shield', 15)}Répartition</h2>${k ? BO.split(t) : `<div class="note-box">Devis client — aucune prise en charge assurance. ${c && c.fleet ? `Remise contractuelle flotte ${c.fleet.discount} % à appliquer sur les pièces.` : ''}</div>`}
        ${appr != null ? `<div class="sepl"></div><div class="cmp"><span>Accordé par l’assureur</span><b>${chf(appr)}</b>${BO.pbar(Math.min(1, appr / Math.max(1, t.insurer + t.franchise)), appr + 1 < t.insurer + t.franchise ? 'a' : 'g')}<span class="xs-t ${appr + 1 < t.insurer + t.franchise ? 'warn-t' : 'ok-t'}">${appr + 1 < t.insurer + t.franchise ? 'écart ' + chf(t.insurer + t.franchise - appr) : 'conforme'}</span></div>` : ''}
        <div class="xs-t muted mt">Temps barèmes indicatifs. Taux modifiables dans Paramètres.</div>`;
    };
    const redrawDiag = () => { const d = el.querySelector('[data-diag]'); if (!d) return; d.innerHTML = BO.carDiagram(Object.fromEntries(q.lines.filter(l => l.zone).map(l => [l.zone, l.op === 'L' ? 'R' : 'B'])), { editable: true }); bindDiag(); };
    const showZone = z => {
      zoneSel = z; const host = el.querySelector('[data-zone]');
      host.innerHTML = `<h2 class="sec">${esc(CX.ZONE[z])}<span class="r"><button class="btn xs ghost" data-zx>${BO.icon('x', 12)}</button></span></h2><div class="cat-pk">${TPL(z).map(([op, cat, h, ph, p], i) => `<button data-tpl="${i}"><span class="tag" style="margin-right:6px">${op}</span>${esc(CX.OPS[op])}<small>${cat ? cat + ' ' + BO.num(h, 1) + ' h · ' : ''}${ph ? 'peinture ' + BO.num(ph, 1) + ' h' : ''}${p ? ' · pièce ~' + chf(p) : ''}</small></button>`).join('')}</div><div class="xs-t muted mt1">La ligne est ajoutée avec les temps barèmes ; ajustez référence, prix et heures dans le tableau.</div>`;
      host.querySelectorAll('[data-tpl]').forEach(b => b.addEventListener('click', () => { const [op, cat, h, ph, p] = TPL(z)[+b.dataset.tpl]; q.lines.push({ id: U.uid('l'), zone: z, piece: CX.ZONE[z], op, cat, h, ph, ref: '', price: p, qty: 1, disc: c && c.fleet && p ? c.fleet.discount : 0 }); drawLines(); drawSum(); redrawDiag(); UI.toast('Opération ajoutée', CX.OPS[op] + ' · ' + CX.ZONE[z], 'ok', 'plus'); }));
      host.querySelector('[data-zx]').addEventListener('click', () => { host.innerHTML = BO.empty('car', 'Choisissez une zone', '', '', true); });
    };
    const bindDiag = () => el.querySelectorAll('[data-diag] .z').forEach(p => p.addEventListener('click', () => showZone(p.dataset.z)));
    drawLines(); drawSum(); bindDiag();

    if (!locked) {
      el.querySelectorAll('[data-forf]').forEach(b => b.addEventListener('click', () => { const [l, p] = FORF[+b.dataset.forf]; q.lines.push({ id: U.uid('l'), zone: '', piece: l, op: 'F', cat: '', h: 0, ph: 0, ref: '', price: p, qty: 1, disc: 0 }); drawLines(); drawSum(); }));
      el.querySelector('[data-line]').addEventListener('click', () => { q.lines.push({ id: U.uid('l'), zone: zoneSel || '', piece: 'Nouvelle opération', op: 'I', cat: 'T2', h: 1, ph: 0, ref: '', price: 0, qty: 1, disc: 0 }); drawLines(); drawSum(); });
      el.querySelector('[data-veh]').addEventListener('change', e => { q.vehicleId = e.target.value; const vv = CX.veh(q.vehicleId); q.customerId = vv ? vv.customerId : null; const kk = CX.S.claims.find(x => x.vehicleId === q.vehicleId && (!x.roId || (CX.ro(x.roId) || {}).stage < CX.ST.facture)); q.claimId = kk ? kk.id : null; editor(el, q); });
      el.querySelector('[data-claim]').addEventListener('change', e => { q.claimId = e.target.value || null; drawSum(); });
      el.querySelector('[data-save]').addEventListener('click', () => {
        if (!q.vehicleId) { UI.toast('Véhicule manquant', 'Sélectionnez le véhicule à chiffrer.', 'warn'); return; }
        if (!q.lines.length) { UI.toast('Devis vide', 'Ajoutez au moins une opération.', 'warn'); return; }
        const bad = q.lines.find(l => !String(l.piece).trim()); if (bad) { UI.toast('Désignation manquante', 'Chaque ligne doit avoir une désignation.', 'warn'); return; }
        const isNew = !q0.id; const { _saved, ...clean } = q; const saved = CX.saveQuote(clean); draft = null;
        UI.toast(isNew ? 'Devis créé' : 'Devis enregistré', saved.no + ' · ' + chf(CX.quoteTotals(saved).ttc), 'ok', 'check');
        APP.open('quotes', { id: saved.id });
      });
    } else { const s2 = el.querySelector('[data-supp]'); if (s2) s2.addEventListener('click', () => { draft = null; APP.open('quotes', { tab: 'new', supp: q0.id }); }); }
    const pdf = el.querySelector('[data-pdf]'); if (pdf) pdf.addEventListener('click', () => BO.printQuote(CX.quote(q0.id)));
    const snd = el.querySelector('[data-send]'); if (snd) snd.addEventListener('click', () => { if (JSON.stringify(q.lines) !== JSON.stringify(q0.lines)) CX.saveQuote({ id: q0.id, lines: q.lines, vehicleId: q.vehicleId, customerId: q.customerId, claimId: q.claimId }); sendQuote(CX.quote(q0.id)); });
    const acc = el.querySelector('[data-acc]'); if (acc) acc.addEventListener('click', () => accordModal(CX.quote(q0.id)));
    const ref = el.querySelector('[data-ref]'); if (ref) ref.addEventListener('click', () => BO.confirm('Enregistrer un refus ?', 'Le devis passe au statut « Refusé ». Le client sera informé.', 'Refus', () => { if (k) CX.decideClaim(k.id, 'Refusé', 0); else CX.setQuoteStatus(q0.id, 'Refusé'); BO.now(); }, true));
    const conv = el.querySelector('[data-conv]'); if (conv) conv.addEventListener('click', () => { if (!locked) CX.saveQuote({ id: q0.id, lines: q.lines, vehicleId: q.vehicleId, customerId: q.customerId, claimId: q.claimId }); const r2 = CX.convertQuote(q0.id); draft = null; UI.toast('OR créé', r2.no + ' depuis ' + q0.no, 'ok', 'wrench'); APP.open('ros', { id: r2.id }); });
  }

  function newDraft(params) {
    const r = params.id ? CX.ro(params.id) : null, sup = params.supp ? CX.quote(params.supp) : null;
    const base = sup || (r ? { vehicleId: r.vehicleId, customerId: r.customerId, claimId: r.claimId, roId: r.id } : {});
    return { id: null, no: sup ? sup.no + '-' + (CX.S.quotes.filter(x => x.no.startsWith(sup.no)).length + 1) : CX.nextQuoteNo(), vehicleId: base.vehicleId || null, customerId: base.customerId || null, claimId: base.claimId || null, roId: sup ? sup.roId : (r ? r.id : null), status: 'Brouillon', lines: [], date: today(), sentAt: null, decidedAt: null, notes: sup ? 'Supplément (dégâts cachés)' : '', author: CX.S.meId, version: sup ? (sup.version || 1) + 1 : 1 };
  }

  function render(el, params) {
    if (params.tab === 'new') { const nd = newDraft(params), key = 'new:' + (nd.roId || ''); editor(el, draft && !draft.id && draftKey === key ? draft : nd); return; }
    if (params.id) { const q = CX.quote(params.id); if (q) { editor(el, q); return; } }
    draft = null;
    const S = CX.S, qs = S.quotes.filter(q => {
      if (st.f === 'open' && !['Brouillon', 'Envoyé'].includes(q.status)) return false;
      if (st.f !== 'open' && st.f !== 'all' && q.status !== st.f) return false;
      if (st.q) { const v = CX.veh(q.vehicleId) || {}, s = st.q.toLowerCase(); if (![q.no, v.plate, CX.custName(q.customerId)].some(x => String(x).toLowerCase().includes(s))) return false; }
      return true;
    });
    const by = s => S.quotes.filter(q => q.status === s), sum = a => a.reduce((x, q) => x + CX.quoteTotals(q).ttc, 0);
    const conv = S.quotes.filter(q => ['Accordé', 'Converti'].includes(q.status)).length / Math.max(1, S.quotes.filter(q => q.status !== 'Brouillon').length);
    el.innerHTML = `<div class="bo-page">${BO.head('Devis / chiffrage', `Taux d’acceptation ${Math.round(conv * 100)} % · ${by('Envoyé').length} devis en attente d’accord (${chf(sum(by('Envoyé')))})`, `<button class="btn pri" data-open="quotes::new">${BO.icon('plus', 15)}Nouveau devis</button>`)}
      <div class="kpis" style="grid-template-columns:repeat(5,minmax(0,1fr))">${[['Brouillon', 'edit', ''], ['Envoyé', 'send', 'amber'], ['Accordé', 'shieldok', 'green'], ['Converti', 'wrench', ''], ['Refusé', 'x', 'red']].map(([s, i, tn]) => `<div class="kpi click" data-f="${s}" style="${st.f === s ? 'box-shadow:0 0 0 2px #16181c' : ''}"><div class="lb">${s === 'Envoyé' ? 'En attente d’accord' : s + 's'}</div><div class="ki">${BO.icon(i, 15)}</div><div class="v">${by(s).length}</div><div class="s">${chf(sum(by(s)))}</div></div>`).join('')}</div>
      <div class="toolbar"><div class="srch"><input class="inp" data-q placeholder="N° devis, plaque, client…" value="${esc(st.q)}">${BO.icon('search', 16)}</div>${BO.seg('f', [['open', 'À traiter'], ['all', 'Tous'], ['Accordé', 'Accordés'], ['Converti', 'Convertis'], ['Refusé', 'Refusés']], st.f)}</div>
      <div data-t></div></div>`;
    BO.table(el.querySelector('[data-t]'), { rows: qs, state: st.tbl, onRow: q => APP.open('quotes', { id: q.id }),
      empty: BO.empty('calc', 'Aucun devis', 'Créez un devis depuis un véhicule ou un OR.', `<button class="btn sm pri" data-open="quotes::new">${BO.icon('plus', 13)}Nouveau devis</button>`, true),
      cols: [
        { k: 'no', label: 'Devis', render: q => `<b>${esc(q.no)}</b>${q.version > 1 ? ' <span class="tag">suppl.</span>' : ''}` },
        { k: 'date', label: 'Date', render: q => esc(BO.dateS(q.date)) },
        { k: 'veh', label: 'Véhicule', get: q => (CX.veh(q.vehicleId) || {}).plate, render: q => BO.vehCell(CX.veh(q.vehicleId), CX.custName(q.customerId)) },
        { k: 'ins', label: 'Payeur', get: q => q.claimId ? CX.ins(CX.claim(q.claimId).insurerId).short : 'Client', render: q => q.claimId ? `${BO.ins(CX.claim(q.claimId).insurerId)} <span class="xs-t muted">${esc(CX.claim(q.claimId).no)}</span>` : BO.ins(null) },
        { k: 'lines', label: 'Opérations', get: q => q.lines.length, render: q => `<span class="xs-t">${q.lines.filter(l => l.op !== 'F').slice(0, 3).map(l => `<span class="tag" style="margin:1px">${esc(l.op)} ${esc(l.piece.slice(0, 18))}</span>`).join('')}${q.lines.length > 3 ? ' +' + (q.lines.length - 3) : ''}</span>` },
        { k: 'status', label: 'Statut', render: q => BO.chip(q.status, STC[q.status] || '', true) + (q.status === 'Envoyé' && q.sentAt ? `<div class="xs-t muted">envoyé ${esc(BO.ago(q.sentAt))}</div>` : '') },
        { k: 'ttc', label: 'Total TTC', num: true, get: q => CX.quoteTotals(q).ttc, render: q => `<b>${chf(CX.quoteTotals(q).ttc)}</b>` },
        { k: 'cli', label: 'dont client', num: true, get: q => CX.quoteTotals(q).client, render: q => chf(CX.quoteTotals(q).client) },
        { k: 'act', label: '', nosort: true, render: q => q.status === 'Envoyé' ? `<button class="btn xs" data-rem="${q.id}">${BO.icon('send', 11)}Relancer</button>` : '' },
      ], after: host => host.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => BO.quoteRemind(b.dataset.rem))) });
    BO.bindSearch(el, v => { st.q = v; });
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    el.querySelectorAll('.kpi[data-f]').forEach(k2 => k2.addEventListener('click', () => { st.f = st.f === k2.dataset.f ? 'open' : k2.dataset.f; APP.refresh(); }));
  }

  APP.register({ id: 'quotes', label: 'Devis / chiffrage', icon: 'calc', group: 'Commercial & assurances', order: 1, activity: 'atelier', render, badge: () => CX.S.quotes.filter(q => q.status === 'Envoyé').length });
})();
