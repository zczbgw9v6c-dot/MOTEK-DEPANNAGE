/* ==========================================================================
   BO · Réception & rendez-vous : agenda jour / semaine (réceptions, expertises,
   livraisons), check-in (km, carburant, schéma de dégâts, photos, signature),
   prêt d'un véhicule de remplacement.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const st = { tab: 'agenda', view: 'day', day: today(), ci: null };
  const KINDS = ['Réception', 'Expertise', 'Livraison', 'Pièces', 'Devis'];
  const H0 = 7, H1 = 18, PX = 40;
  let ck = null;   // brouillon de check-in

  /* ---------------- agenda ---------------- */
  const evH = a => Math.max(34, a.dur / 60 * PX - 2);
  /** répartit les rendez-vous qui se chevauchent visuellement sur plusieurs couloirs */
  function lanes(list) {
    const ev = list.slice().sort((a, b) => a.time - b.time), ends = [], out = new Map();
    ev.forEach(a => { const top = (a.time / 60 - H0) * PX; let l = ends.findIndex(e => e <= top + 1); if (l < 0) { l = ends.length; ends.push(0); } ends[l] = top + evH(a); out.set(a.id, l); });
    return { lane: id => out.get(id), n: Math.max(1, ends.length) };
  }
  function evHtml(a, top, L) {
    const v = a.vehicleId ? CX.veh(a.vehicleId) : null;
    const h = evH(a), w = 100 / L.n, li = L.lane(a.id);
    return `<div class="ev k-${esc(a.kind)} ${a.status === 'Fait' ? 'done' : ''}" style="top:${top}px;height:${h}px;left:calc(${li * w}% + 4px);right:auto;width:calc(${w}% - 8px)" data-ap="${a.id}" title="${esc(a.title)}"><b>${U.hm(a.time)} · ${esc(a.title)}</b>${h >= 34 ? `<small>${v ? esc(v.plate) + ' · ' : ''}${esc(a.kind === 'Expertise' ? (a.expert || 'Expert') : CX.custName(a.customerId))}${a.status === 'Fait' ? ' · fait' : a.status === 'À confirmer' ? ' · à confirmer' : ''}</small>` : ''}</div>`;
  }
  function agenda(host) {
    const S = CX.S, days = st.view === 'day' ? [st.day] : Array.from({ length: 5 }, (_, i) => U.addDays(U.weekStart(st.day), i));
    const cols = st.view === 'day' ? [['Réceptions', a => a.kind === 'Réception' || a.kind === 'Devis'], ['Expertises', a => a.kind === 'Expertise'], ['Livraisons & pièces', a => a.kind === 'Livraison' || a.kind === 'Pièces']] : days.map(d => [d, a => a.date === d]);
    const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i), nowTop = (U.nowMin() / 60 - H0) * PX;
    const list = S.appts.filter(a => days.includes(a.date));
    host.innerHTML = `<div class="ag" style="--cols:${cols.length}">
      <div class="agh" style="border-left:0"></div>${cols.map(([l]) => st.view === 'day' ? `<div class="agh">${esc(l)}<small>${list.filter(cols.find(c => c[0] === l)[1]).length} rendez-vous</small></div>` : `<div class="agh ${l === today() ? 'today' : ''}">${esc(BO.dayName(l))} ${esc(U.fmtDate(l))}<small>${list.filter(a => a.date === l).length} rendez-vous</small></div>`).join('')}
      <div class="tcol" style="height:${(H1 - H0) * PX}px">${hours.map(h => `<span style="top:${(h - H0) * PX}px">${String(h).padStart(2, '0')}:00</span>`).join('')}</div>
      ${cols.map(([l, f]) => `<div class="dcol ${(st.view === 'day' ? st.day : l) === today() ? 'today' : ''}" style="height:${(H1 - H0) * PX}px" data-col="${esc(l)}">${(cl => { const L = lanes(cl); return cl.map(a => evHtml(a, (a.time / 60 - H0) * PX, L)).join(''); })(list.filter(f))}${(st.view === 'day' ? st.day : l) === today() && nowTop > 0 && nowTop < (H1 - H0) * PX ? `<div class="now" style="top:${nowTop}px"></div>` : ''}</div>`).join('')}</div>`;
    host.querySelectorAll('[data-ap]').forEach(e => e.addEventListener('click', () => apptDrawer(e.dataset.ap)));
    host.querySelectorAll('.dcol').forEach(c => c.addEventListener('dblclick', ev => { if (ev.target.closest('.ev')) return; const r = c.getBoundingClientRect(), m = Math.round(((ev.clientY - r.top) / PX + H0) * 4) / 4 * 60; apptForm(null, { date: st.view === 'day' ? st.day : c.dataset.col, time: U.hm(Math.min(17 * 60, Math.max(7 * 60, m))) }); }));
  }
  function apptDrawer(id) {
    BO.drawer({
      title: () => { const a = CX.S.appts.find(x => x.id === id); return a ? esc(a.title) : null; },
      sub: () => { const a = CX.S.appts.find(x => x.id === id); return `${BO.chip(a.kind, a.kind === 'Expertise' ? 'amber' : a.kind === 'Livraison' ? 'green' : '')} ${BO.chip(a.status, a.status === 'Fait' ? 'green' : a.status === 'À confirmer' ? 'amber' : '')} <span>${esc(BO.date(a.date))} · ${U.hm(a.time)} → ${U.hm(a.time + a.dur)}</span>`; },
      render: () => {
        const a = CX.S.appts.find(x => x.id === id), r = a.roId ? CX.ro(a.roId) : null, v = a.vehicleId ? CX.veh(a.vehicleId) : null, c = a.customerId ? CX.cust(a.customerId) : null, k = r && r.claimId ? CX.claim(r.claimId) : null;
        return `<div class="dsec"><h4>Dossier</h4>${r ? `<div class="card pad flat row" style="cursor:pointer" data-open="ros:${r.id}">${UI.carPic(v.hex, 58, 44)}<div style="flex:1"><div>${BO.plate(v.plate)} <b>${esc(CX.vlabel(v))}</b></div><div class="xs-t muted mt1">${esc(r.no)} · ${esc(r.damage)}</div></div>${BO.status(r)}</div>` : BO.empty('file', 'Aucun OR lié', '', '', true)}</div>
          <div class="dsec"><h4>Client</h4>${c ? `<dl class="kv"><dt>Nom</dt><dd>${esc(c.name)}</dd><dt>Téléphone</dt><dd>${esc(c.phone)}</dd><dt>Contact préféré</dt><dd>${esc(c.pref)}</dd></dl>` : '—'}</div>
          ${a.kind === 'Expertise' ? `<div class="dsec"><h4>Expertise</h4><dl class="kv"><dt>Expert</dt><dd>${esc(a.expert || '—')}</dd><dt>Assureur</dt><dd>${k ? BO.ins(k.insurerId) + ' · ' + esc(k.no) : '—'}</dd><dt>Statut sinistre</dt><dd>${k ? esc(k.approval) : '—'}</dd></dl></div>` : ''}
          ${a.notes ? `<div class="dsec"><h4>Notes</h4><div class="note-box">${esc(a.notes)}</div></div>` : ''}`;
      },
      foot: () => { const a = CX.S.appts.find(x => x.id === id), r = a.roId ? CX.ro(a.roId) : null; return `<button class="btn" data-edit>${BO.icon('edit', 14)}Modifier</button>${a.kind === 'Réception' && r && !r.checkin ? `<button class="btn pri" data-ci>${BO.icon('key', 14)}Faire le check-in</button>` : ''}${a.kind === 'Livraison' && r && r.stage === CX.ST.pret ? `<button class="btn pri" data-deliver>${BO.icon('car', 14)}Restituer & facturer</button>` : ''}<span class="sp"></span>${a.status !== 'Fait' ? `<button class="btn" data-done>${BO.icon('check', 14)}Marquer fait</button>` : ''}`; },
      onMount: (d, close) => {
        const a = CX.S.appts.find(x => x.id === id); if (!a) return;
        d.querySelector('[data-edit]').addEventListener('click', () => apptForm(a));
        const ci = d.querySelector('[data-ci]'); if (ci) ci.addEventListener('click', () => { close(); st.tab = 'checkin'; st.ci = a.roId; ck = null; APP.open('reception', { id: a.roId, tab: 'checkin' }); });
        const dn = d.querySelector('[data-done]'); if (dn) dn.addEventListener('click', () => { a.status = 'Fait'; CX.touch('appt'); BO.now(); });
        const dl = d.querySelector('[data-deliver]'); if (dl) dl.addEventListener('click', () => { close(); BO.moveStage(a.roId, CX.ST.facture, () => { a.status = 'Fait'; CX.touch('appt'); }); });
      },
    });
  }
  function apptForm(a, pre = {}) {
    const fields = [
      { k: 'kind', label: 'Type', type: 'select', opts: KINDS, req: true },
      { k: 'roId', label: 'Ordre de réparation', type: 'select', opts: BO.optROs(), empty: '— Aucun —' },
      { k: 'date', label: 'Date', type: 'date', req: true, validate: v => U.isWeekend(v) ? 'Atelier fermé le week-end' : '' },
      { k: 'time', label: 'Heure', type: 'time', req: true, validate: v => U.toMin(v) < 7 * 60 || U.toMin(v) > 17.5 * 60 ? 'Entre 07:00 et 17:30' : '' },
      { k: 'dur', label: 'Durée (min)', type: 'number', min: 10, max: 240, step: 5, req: true },
      { k: 'expert', label: 'Expert (si expertise)' },
      { k: 'title', label: 'Intitulé', req: true, full: true },
      { k: 'notes', label: 'Notes', type: 'textarea', full: true },
    ];
    const vals = a ? Object.assign({}, a, { time: U.hm(a.time) }) : Object.assign({ kind: 'Réception', date: st.day, time: '08:00', dur: 30, title: '' }, pre);
    BO.formModal({ title: a ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous', fields, values: vals, submit: a ? 'Enregistrer' : 'Planifier',
      danger: a ? { label: 'Supprimer', title: 'Supprimer le rendez-vous ?', text: esc(a.title), run: () => { CX.remove('appts', a.id, 'appt'); BO.closeDrawer(); UI.toast('Rendez-vous supprimé', a.title, 'ok'); } } : null,
      onMount: el => { const rs = el.querySelector('[name="roId"]'), tt = el.querySelector('[name="title"]'), kd = el.querySelector('[name="kind"]'); const fill = () => { if (!tt.value || tt.dataset.auto) { const r = CX.ro(rs.value); if (r) { tt.value = kd.value + ' — ' + CX.vlabel(CX.veh(r.vehicleId)) + ' (' + CX.custName(r.customerId) + ')'; tt.dataset.auto = 1; } } }; rs.addEventListener('change', fill); kd.addEventListener('change', fill); },
      onSubmit: x => { const r = x.roId ? CX.ro(x.roId) : null; const obj = Object.assign({}, a || { id: U.uid('ap'), who: 'E8', status: 'Prévu' }, x, { time: U.toMin(x.time), roId: x.roId || null, customerId: r ? r.customerId : (a ? a.customerId : null), vehicleId: r ? r.vehicleId : (a ? a.vehicleId : null) }); CX.upsert('appts', obj, 'appt'); if (r && x.kind === 'Réception' && !r.checkin) { r.apptAt = x.date + ' ' + x.time; CX.touch('ro', { roId: r.id }); } UI.toast(a ? 'Rendez-vous modifié' : 'Rendez-vous planifié', x.title + ' · ' + BO.date(x.date) + ' ' + x.time, 'ok', 'cal'); BO.now(); } });
  }

  /* ---------------- check-in ---------------- */
  function checkin(host, roId) {
    const cand = CX.S.ros.filter(r => !r.checkin && r.stage <= CX.ST.accord).sort((a, b) => String(a.apptAt).localeCompare(String(b.apptAt)));
    const r = CX.ro(roId) || cand[0];
    if (!r) { host.innerHTML = `<div class="card">${BO.empty('key', 'Aucun véhicule attendu', 'Tous les rendez-vous de réception ont été traités.', `<button class="btn sm pri" data-nd>${BO.icon('plus', 13)}Nouveau dossier</button>`)}</div>`; host.querySelector('[data-nd]').addEventListener('click', () => BO.newDossier({ onDone: x => { st.ci = x.id; ck = null; APP.refresh(); } })); return; }
    const v = CX.veh(r.vehicleId), c = CX.cust(r.customerId), k = r.claimId ? CX.claim(r.claimId) : null;
    if (!ck || ck.roId !== r.id) ck = { roId: r.id, km: r.checkin ? r.checkin.km : '', fuel: r.checkin ? r.checkin.fuel : .5, damages: r.checkin ? Object.assign({}, r.checkin.damages) : {}, type: 'B', photos: r.checkin ? r.checkin.photos : 0, objects: '', notes: '', loanCar: '', signed: false };
    const freeCars = CX.S.courtesy.filter(x => x.status === 'Disponible');
    host.innerHTML = `<div class="g" style="grid-template-columns:320px minmax(0,1fr) 300px;align-items:start">
      <div class="g" style="align-content:start">
        <div class="card pad"><div class="field mb"><label>Véhicule à réceptionner</label><select class="inp" data-pick>${BO.opts(cand.concat(cand.includes(r) ? [] : [r]).map(x => [x.id, (CX.veh(x.vehicleId) || {}).plate + ' · ' + CX.vlabel(CX.veh(x.vehicleId)) + (x.apptAt ? ' · ' + BO.dt(x.apptAt) : '')]), r.id)}</select></div>
          <div class="row" style="align-items:center">${UI.carPic(v.hex, 70, 54)}<div><div>${BO.plate(v.plate)}</div><b style="display:block;margin-top:5px">${esc(v.make)} ${esc(v.model)}</b><div class="xs-t muted">${esc(v.colorName)} · ${esc(v.colorCode)} · VIN ${esc(v.vin || '—')}</div></div></div>
          <div class="sepl"></div><dl class="kv" style="grid-template-columns:100px 1fr"><dt>Client</dt><dd>${esc(c.name)}</dd><dt>Téléphone</dt><dd>${esc(c.phone)}</dd><dt>OR</dt><dd><a class="lnk" data-open="ros:${r.id}">${esc(r.no)}</a></dd><dt>Assurance</dt><dd>${k ? BO.ins(k.insurerId) + ' · ' + esc(k.no) : 'Privé'}</dd><dt>Dommage</dt><dd>${esc(r.damage)}</dd></dl></div>
        <div class="card pad"><div class="fgrid" style="grid-template-columns:1fr">
          <div class="field" data-f="km"><label>Kilométrage<span class="req">*</span></label><input class="inp" type="number" name="km" min="0" value="${esc(ck.km)}" placeholder="dernier relevé ${BO.num(v.km)} km"><div class="em"></div></div>
          <div class="field"><label>Carburant / charge</label><div class="fuel" data-fuel>${Array.from({ length: 8 }, (_, i) => `<button data-fv="${(i + 1) / 8}" class="${ck.fuel >= (i + 1) / 8 - .01 ? 'on' : ''}" style="height:${12 + i * 3}px" title="${i + 1}/8"></button>`).join('')}</div><div class="fuel-t"><span>R</span><span>1/2</span><span>F</span></div></div>
          <div class="field"><label>Objets laissés dans le véhicule</label><input class="inp" name="objects" value="${esc(ck.objects)}" placeholder="ex. siège enfant, câble de recharge"></div>
          <div class="field"><label>Remarques</label><textarea class="inp" name="notes" rows="2" placeholder="Pneus, jantes, voyants allumés…">${esc(ck.notes)}</textarea></div>
          <div class="field"><label>Véhicule de remplacement</label><select class="inp" name="loanCar">${BO.opts(freeCars.map(x => [x.id, x.plate + ' · ' + x.model]), ck.loanCar, freeCars.length ? 'Aucun' : 'Aucun disponible')}</select></div>
        </div></div>
      </div>
      <div class="card"><div class="card-h"><h3>${BO.icon('car', 16)}État des lieux <small>· cliquez les zones endommagées</small></h3><button class="btn sm ghost" data-clear>${BO.icon('refresh', 13)}Effacer</button></div>
        <div class="card-b"><div class="g" style="grid-template-columns:240px 1fr;align-items:start"><div><div data-diag>${BO.carDiagram(ck.damages, { editable: true })}</div>
          <div class="dmg-legend">${Object.entries(CX.DMG_TYPES).map(([t, l]) => `<button data-dt="${t}" class="${ck.type === t ? 'on' : ''}"><i style="background:${{ R: '#f2a0a3', B: '#1768ee', F: '#a3161c', E: '#f6c27b', G: '#1157c4' }[t]}"></i>${esc(l)}</button>`).join('')}</div></div>
          <div><h2 class="sec" style="font-size:13px">Dégâts relevés</h2><div class="row wrap" data-dl>${BO.dmgList(ck.damages)}</div>
            <div class="sepl"></div><h2 class="sec" style="font-size:13px">${BO.icon('camera', 15)}Photos de réception <small>${ck.photos} / 8 recommandées</small></h2>
            <div class="ph-grid" data-ph style="grid-template-columns:repeat(2,minmax(0,1fr))">${Array.from({ length: Math.max(4, ck.photos) }, (_, i) => i < ck.photos ? `<div class="ph">${UI.carPic(['#dfe2e7', '#e8eaee', '#d6dade'][i % 3], 60, 46)}<span class="kd">Avant</span><span class="lb">${esc(['Avant', '3/4 AV G', '3/4 AV D', 'Arrière', 'Compteur', 'Dégâts', 'Intérieur', 'Détail'][i % 8])}</span></div>` : `<div class="ph add" data-addph>${BO.icon('camera', 18)}Photo ${i + 1}</div>`).join('')}</div>
            ${r.claimId ? `<div class="form-note mt">${BO.icon('shield', 16)}<div>Les photos et l’état des lieux sont joints automatiquement au dossier de sinistre ${esc(k.no)} pour l’expert ${esc(k.expert || (CX.ins(k.insurerId) || {}).short)}.</div></div>` : ''}</div></div></div></div>
      <div class="card pad sum"><h2 class="sec">${BO.icon('pen', 16)}Signature du client</h2><canvas class="sig" data-sig width="560" height="260"></canvas><div class="row mt1"><span class="xs-t muted">Le client signe sur la tablette pour valider l’état des lieux contradictoire.</span><span class="sp"></span><button class="btn xs ghost" data-sigclear>Effacer</button></div>
        <div class="sepl"></div><dl class="kv" style="grid-template-columns:1fr auto"><dt>Dégâts relevés</dt><dd data-nd2>${Object.keys(ck.damages).length}</dd><dt>Photos</dt><dd data-np>${ck.photos}</dd><dt>Signature</dt><dd data-ns>${ck.signed ? '<span class="ok-t">✓</span>' : '<span class="warn-t">requise</span>'}</dd></dl>
        <button class="btn pri mt" style="width:100%;height:42px" data-validate>${BO.icon('check', 16)}Valider la réception</button>
        <button class="btn mt1" style="width:100%" data-print>${BO.icon('print', 15)}Imprimer l’état des lieux</button>
        <div class="xs-t muted mt1" style="text-align:center">Le véhicule rejoint ensuite la zone de réception dans l’atelier live.</div></div>
    </div>`;
    const refreshSide = () => { host.querySelector('[data-nd2]').textContent = Object.keys(ck.damages).length; host.querySelector('[data-np]').textContent = ck.photos; host.querySelector('[data-ns]').innerHTML = ck.signed ? '<span class="ok-t">✓</span>' : '<span class="warn-t">requise</span>'; host.querySelector('[data-dl]').innerHTML = BO.dmgList(ck.damages); };
    const bindDiag = () => host.querySelectorAll('[data-diag] .z').forEach(p => p.addEventListener('click', () => { const z = p.dataset.z; if (ck.damages[z] === ck.type) delete ck.damages[z]; else ck.damages[z] = ck.type; host.querySelector('[data-diag]').innerHTML = BO.carDiagram(ck.damages, { editable: true }); bindDiag(); refreshSide(); }));
    bindDiag();
    host.querySelectorAll('[data-dt]').forEach(b => b.addEventListener('click', () => { ck.type = b.dataset.dt; host.querySelectorAll('[data-dt]').forEach(x => x.classList.toggle('on', x === b)); }));
    host.querySelector('[data-clear]').addEventListener('click', () => { ck.damages = {}; host.querySelector('[data-diag]').innerHTML = BO.carDiagram({}, { editable: true }); bindDiag(); refreshSide(); });
    host.querySelectorAll('[data-fv]').forEach(b => b.addEventListener('click', () => { ck.fuel = +b.dataset.fv; host.querySelectorAll('[data-fv]').forEach(x => x.classList.toggle('on', +x.dataset.fv <= ck.fuel + .01)); }));
    host.querySelectorAll('[data-addph]').forEach(b => b.addEventListener('click', () => { ck.photos++; checkin(host, r.id); }));
    ['km', 'objects', 'notes', 'loanCar'].forEach(n => { const i = host.querySelector(`[name="${n}"]`); i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => { ck[n] = i.value; }); });
    host.querySelector('[data-pick]').addEventListener('change', e => { st.ci = e.target.value; ck = null; checkin(host, st.ci); });
    // signature
    const cv = host.querySelector('[data-sig]'), cx = cv.getContext('2d'); let drawing = false, last = null;
    cx.lineWidth = 3.2; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = '#16181c';
    if (ck.signed) { cx.font = 'italic 46px Georgia'; cx.fillStyle = '#16181c'; cx.fillText(c.name.split(' ').map((w, i) => i ? w : w[0] + '.').join(' '), 40, 150); }
    const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * cv.width / b.width, (e.clientY - b.top) * cv.height / b.height]; };
    cv.addEventListener('pointerdown', e => { drawing = true; last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); cx.beginPath(); cx.moveTo(last[0], last[1]); cx.lineTo(p[0], p[1]); cx.stroke(); last = p; if (!ck.signed) { ck.signed = true; refreshSide(); } });
    cv.addEventListener('pointerup', () => { drawing = false; });
    host.querySelector('[data-sigclear]').addEventListener('click', () => { cx.clearRect(0, 0, cv.width, cv.height); ck.signed = false; refreshSide(); });
    host.querySelector('[data-print]').addEventListener('click', () => printCheckin(r, ck));
    host.querySelector('[data-validate]').addEventListener('click', () => {
      const kmF = host.querySelector('[data-f="km"]'), km = +ck.km;
      if (!ck.km || isNaN(km) || km < 0) { kmF.classList.add('err'); kmF.querySelector('.em').textContent = 'Kilométrage requis'; kmF.querySelector('input').focus(); return; }
      if (km + 50 < v.km) { kmF.classList.add('err'); kmF.querySelector('.em').textContent = 'Inférieur au dernier relevé (' + BO.num(v.km) + ' km)'; return; }
      if (!ck.signed) { UI.toast('Signature manquante', 'Le client doit signer l’état des lieux.', 'warn', 'pen'); return; }
      if (!Object.keys(ck.damages).length) { BO.confirm('Aucun dégât relevé ?', 'Vous validez une réception sans aucune zone endommagée sur le schéma.', 'Valider quand même', go); return; }
      go();
      function go() {
        const sigImg = cv.toDataURL('image/png').length;
        CX.checkin(r.id, { km, fuel: ck.fuel, damages: ck.damages, notes: ck.notes, objects: ck.objects, signed: true, photos: ck.photos, sig: sigImg > 2000 });
        if (ck.loanCar) { CX.lendCar({ carId: ck.loanCar, customerId: r.customerId, roId: r.id, from: today(), to: U.dOf(r.dueAt) || U.wd(3), status: 'En cours' }); }
        UI.toast('Véhicule réceptionné', `${r.no} · ${v.plate} → ${CX.slotLabel(CX.ro(r.id).slot)} (atelier live)`, 'ok', 'key');
        ck = null; st.ci = null; APP.open('ros', { id: r.id });
      }
    });
  }
  function printCheckin(r, d) {
    const v = CX.veh(r.vehicleId), c = CX.cust(r.customerId);
    const inner = `${BO.printHeader()}<h1>État des lieux de réception</h1><div class="meta">${esc(r.no)} · ${esc(v.plate)} · ${esc(v.make)} ${esc(v.model)} · ${esc(v.colorName)} (${esc(v.colorCode)}) · VIN ${esc(v.vin || '—')}</div>
      <table><tr><th>Client</th><th>Kilométrage</th><th>Carburant</th><th>Date</th></tr><tr><td>${esc(c.name)}<br>${esc(c.phone)}</td><td>${BO.num(+d.km || v.km)} km</td><td>${Math.round(d.fuel * 8)}/8</td><td>${esc(U.fmtD(today()))} ${esc(U.hm(U.nowMin()))}</td></tr></table>
      <div style="display:flex;gap:24px;margin-top:16px;align-items:flex-start"><div style="width:200px">${BO.carDiagram(d.damages).replace('<svg class="cardiag', '<svg style="width:200px" class="cardiag')}</div>
      <div style="flex:1"><table><thead><tr><th>Zone</th><th>Dégât</th></tr></thead><tbody>${Object.entries(d.damages).map(([z, t]) => `<tr><td>${esc(CX.ZONE[z])}</td><td>${esc(CX.DMG_TYPES[t])}</td></tr>`).join('') || '<tr><td colspan="2">Aucun dégât relevé</td></tr>'}</tbody></table><p style="font-size:9pt">Objets laissés : ${esc(d.objects || '—')}<br>Remarques : ${esc(d.notes || '—')}</p></div></div>
      <div class="sig"><div>Pour la carrosserie</div><div>Le client (lu et approuvé)</div></div>`;
    BO.preview('État des lieux — ' + r.no, BO.printHtml('État des lieux ' + r.no, inner).replace('</style>', '.cardiag .z{fill:#f1f2f4;stroke:#9aa0a8;stroke-width:1.3}.cardiag .z.on{fill:#1768ee;stroke:#a3161c}.cardiag .z.on.t-R{fill:#f2a0a3}.cardiag .z.on.t-E{fill:#f6c27b}.cardiag .wh{fill:#2b2e33}.cardiag text{font-size:9px;fill:#868c96;font-weight:700}</style>'), 'Etat-des-lieux-' + r.no + '.html');
  }

  /* ---------------- rendu ---------------- */
  BO.apptForm = apptForm;
  function render(el, params) {
    if (params.tab === 'checkin') { st.tab = 'checkin'; if (params.id) { if (st.ci !== params.id) ck = null; st.ci = params.id; } APP.setParams({ tab: null, id: null }); }
    const S = CX.S, t = today(), todayA = S.appts.filter(a => a.date === t);
    const expected = S.ros.filter(r => !r.checkin && r.stage <= CX.ST.accord && U.dOf(r.apptAt) === t);
    el.innerHTML = `<div class="bo-page">${BO.head('Réception & rendez-vous', `${todayA.length} rendez-vous aujourd’hui · ${expected.length} véhicule${expected.length > 1 ? 's' : ''} attendu${expected.length > 1 ? 's' : ''} · ${todayA.filter(a => a.kind === 'Livraison' && a.status !== 'Fait').length} restitution${todayA.filter(a => a.kind === 'Livraison' && a.status !== 'Fait').length > 1 ? 's' : ''} à faire`,
      `<button class="btn" data-newdos>${BO.icon('user', 15)}Nouveau dossier</button><button class="btn pri" data-newap>${BO.icon('plus', 15)}Rendez-vous</button>`)}
      ${BO.tabs([['agenda', 'Agenda', todayA.length], ['checkin', 'Check-in véhicule', expected.length, 'red'], ['jour', 'Arrivées & départs du jour']], st.tab)}
      ${st.tab === 'agenda' ? `<div class="toolbar"><button class="btn sm" data-d="-1">${BO.icon('chevL', 14)}</button><button class="btn sm" data-d="0">Aujourd’hui</button><button class="btn sm" data-d="1">${BO.icon('chevR', 14)}</button><b style="margin-left:6px;font-size:14px">${st.view === 'day' ? esc(U.fmtDate(st.day, { weekday: 'long', day: 'numeric', month: 'long' })) : 'Semaine du ' + esc(U.fmtDate(U.weekStart(st.day), { day: 'numeric', month: 'long' }))}</b><span class="sp"></span><span class="legend">${KINDS.map(k => `<span><i style="background:${{ 'Réception': '#4b5563', 'Expertise': '#e08a00', 'Livraison': '#22a35a', 'Pièces': '#7d8db0', 'Devis': '#1768ee' }[k]}"></i>${k}</span>`).join('')}</span>${BO.seg('view', [['day', 'Jour'], ['week', 'Semaine']], st.view)}</div><div data-ag></div><div class="xs-t muted mt1">Double-cliquez dans une colonne pour créer un rendez-vous à l’heure choisie.</div>` : '<div data-ci></div>'}
    </div>`;
    if (st.tab === 'agenda') agenda(el.querySelector('[data-ag]'));
    else if (st.tab === 'checkin') checkin(el.querySelector('[data-ci]'), st.ci);
    else {
      const arr = S.ros.filter(r => U.dOf(r.apptAt) === t || U.dOf(r.inAt) === t), dep = S.ros.filter(r => r.stage === CX.ST.pret || (r.stage === CX.ST.facture && U.dOf(r.outAt) === t));
      el.querySelector('[data-ci]').innerHTML = `<div class="g g2"><div class="card"><div class="card-h"><h3>${BO.icon('key', 16)}Arrivées <small>${arr.length}</small></h3></div><div class="card-b"><div class="mini-list">${arr.map(r => { const v = CX.veh(r.vehicleId); return `<div class="cl" data-open="ros:${r.id}">${BO.plate(v.plate)}<div style="flex:1"><b class="sm-t">${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(CX.custName(r.customerId))} · RDV ${esc(BO.dt(r.apptAt))}</div></div>${r.checkin ? `<span class="chip green">${BO.icon('check', 11)}Réceptionné ${esc(U.tOf(r.checkin.at))}</span>` : `<button class="btn xs pri" data-cir="${r.id}">Check-in</button>`}</div>`; }).join('') || BO.empty('key', 'Aucune arrivée', '', '', true)}</div></div></div>
        <div class="card"><div class="card-h"><h3>${BO.icon('car', 16)}Restitutions <small>${dep.length}</small></h3></div><div class="card-b"><div class="mini-list">${dep.map(r => { const v = CX.veh(r.vehicleId), tt = CX.roTotals(r); return `<div class="cl" data-open="ros:${r.id}">${BO.plate(v.plate)}<div style="flex:1"><b class="sm-t">${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(CX.custName(r.customerId))} · à encaisser ${U.chf(tt.client)}</div></div>${r.stage === CX.ST.facture ? `<span class="chip dark">Restitué ${esc(U.tOf(r.outAt))}</span>` : `${r.notified ? '<span class="chip green">prévenu</span>' : `<button class="btn xs" data-ntf="${r.id}">${BO.icon('msg', 11)}Prévenir</button>`}<button class="btn xs pri" data-dlv="${r.id}">Restituer</button>`}</div>`; }).join('') || BO.empty('car', 'Aucune restitution', '', '', true)}</div></div></div></div>`;
      el.querySelectorAll('[data-cir]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); st.tab = 'checkin'; st.ci = b.dataset.cir; ck = null; APP.refresh(); }));
      el.querySelectorAll('[data-ntf]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); BO.notifyReady(b.dataset.ntf, BO.now); }));
      el.querySelectorAll('[data-dlv]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); BO.moveStage(b.dataset.dlv, CX.ST.facture); }));
    }
    BO.bindTabs(el, tb => { st.tab = tb; APP.refresh(); });
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const d = +b.dataset.d; if (!d) st.day = today(); else { let x = st.day; const step = st.view === 'day' ? 1 : 7; x = U.addDays(x, d * step); while (st.view === 'day' && U.isWeekend(x)) x = U.addDays(x, d); st.day = x; } APP.refresh(); }));
    el.querySelector('[data-newap]').addEventListener('click', () => apptForm(null));
    el.querySelector('[data-newdos]').addEventListener('click', () => BO.newDossier({ onDone: r => { st.tab = 'checkin'; st.ci = r.id; ck = null; APP.refresh(); } }));
  }

  APP.register({ id: 'reception', label: 'Réception & RDV', icon: 'key', group: 'Atelier', order: 1, activity: 'atelier', render, badge: () => CX.S.ros.filter(r => !r.checkin && r.stage <= CX.ST.accord && U.dOf(r.apptAt) === today()).length });
})();
