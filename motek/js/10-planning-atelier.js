/* ==========================================================================
   BO · Planning atelier : capacité par poste et par technicien (Gantt horaire
   jour / charge semaine), glisser-déposer des créneaux et des OR à planifier,
   alertes de surcharge et de conflit.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const st = { day: today(), rows: 'postes', mode: 'day' };
  const D0 = 7 * 60, D1 = 18 * 60, SPAN = D1 - D0;
  const KIND_C = { pont: '#e3262d', marbre: '#a3161c', prepa: '#6b7280', cabine: '#b96400' };

  const rowsOf = () => st.rows === 'postes'
    ? CX.RESOURCES.map(r => ({ id: r.id, t1: r.l, t2: r.type, cap: r.cap, key: 'res', color: KIND_C[r.kind] }))
    : CX.S.staff.filter(e => CX.ROLES[e.role].prod).map(e => ({ id: e.id, t1: e.name, t2: e.title + (e.status !== 'present' ? ' · absent·e' : ''), cap: e.status === 'present' ? CX.S.company.hoursDay : 0, key: 'tech', emp: e }));
  const bookingsOf = (row, day) => CX.S.bookings.filter(b => b.date === day && b[row.key] === row.id);
  const conflicts = list => { const out = new Set(); const cap = list.length && list[0].res === 'PREP' ? 2 : 1; list.forEach(a => { const n = list.filter(b => b !== a && b.start < a.start + a.dur * 60 && a.start < b.start + b.dur * 60).length; if (n >= cap) out.add(a.id); }); return out; };
  const pct = m => (m - D0) / SPAN * 100;

  function bkForm(b, pre) {
    const isNew = !b; b = b || Object.assign({ id: U.uid('bk'), start: 8 * 60, dur: 2, date: st.day, res: 'P1', tech: null }, pre);
    const r = CX.ro(b.roId);
    BO.formModal({ title: (isNew ? 'Planifier ' : 'Créneau ') + (r ? r.no : ''), intro: r ? `<div class="form-note">${BO.icon('wrench', 16)}<div>${esc(CX.vlabel(CX.veh(r.vehicleId)))} · ${esc(r.damage)} · reste à planifier ${BO.h(remaining(r))}</div></div>` : '',
      fields: [{ k: 'roId', label: 'Ordre de réparation', type: 'select', opts: BO.optROs(x => x.stage < CX.ST.pret), req: true }, { k: 'res', label: 'Poste', type: 'select', opts: CX.RESOURCES.map(x => [x.id, x.l]), req: true }, { k: 'tech', label: 'Technicien', type: 'select', opts: BO.optTechs(), empty: '— Non affecté —' }, { k: 'date', label: 'Date', type: 'date', req: true, validate: v => U.isWeekend(v) ? 'Jour ouvré requis' : '' }, { k: 'start', label: 'Début', type: 'time', req: true, validate: v => U.toMin(v) < D0 || U.toMin(v) > D1 - 15 ? 'Entre 07:00 et 17:45' : '' }, { k: 'dur', label: 'Durée (h)', type: 'number', min: .25, max: 10, step: .25, req: true, validate: (v, a) => U.toMin(a.start || '07:00') + v * 60 > D1 + 30 ? 'Dépasse la fin de journée (18:00)' : '' }],
      values: Object.assign({}, b, { start: U.hm(b.start) }), submit: isNew ? 'Planifier' : 'Enregistrer',
      danger: isNew ? null : { label: 'Supprimer', title: 'Supprimer ce créneau ?', text: 'Le créneau est retiré du planning.', run: () => { CX.remove('bookings', b.id, 'booking'); BO.now(); } },
      onSubmit: x => { CX.upsert('bookings', Object.assign({}, b, x, { start: U.toMin(x.start), tech: x.tech || null }), 'booking'); if (x.tech) { const rr = CX.ro(x.roId); if (rr && !rr.lead) CX.assignTech(rr.id, x.tech); } check(x.date); UI.toast(isNew ? 'Créneau planifié' : 'Créneau modifié', (CX.ro(x.roId) || {}).no + ' · ' + BO.dateS(x.date) + ' ' + x.start, 'ok', 'gantt'); BO.now(); } });
  }
  const remaining = r => Math.max(0, Object.values(r.planned || {}).reduce((a, h) => a + (+h || 0), 0) - CX.S.bookings.filter(b => b.roId === r.id).reduce((a, b) => a + b.dur, 0));
  function check(day) {
    rowsOf().forEach(row => { const l = bookingsOf(row, day), h = l.reduce((a, b) => a + b.dur, 0); if (row.cap && h > row.cap + .01) UI.toast('Surcharge', `${row.t1} : ${BO.h(h)} planifiées pour ${BO.h(row.cap)} de capacité`, 'warn', 'alert'); });
  }

  function dayView(host) {
    const rows = rowsOf(), hours = Array.from({ length: SPAN / 60 }, (_, i) => 7 + i), nowX = pct(U.nowMin());
    host.innerHTML = `<div class="pl fit" data-pl><div class="pr hd"><div class="pl-l">${st.rows === 'postes' ? 'Poste' : 'Technicien'}<span class="cap" style="color:var(--ink3)">Charge</span></div><div class="pl-t"><div class="hours">${hours.map(h => `<div class="${h === 12 ? 'lunch' : ''}">${String(h).padStart(2, '0')}:00</div>`).join('')}</div></div></div>
      ${rows.map(row => { const l = bookingsOf(row, st.day), h = l.reduce((a, b) => a + b.dur, 0), conf = conflicts(l), over = row.cap && h > row.cap + .01; return `<div class="pr ${over ? 'over-row' : ''}" data-row="${row.id}"><div class="pl-l">${row.emp ? UI.av(row.emp, 30) : `<span class="tag" style="background:${row.color};color:#fff">${esc(row.id === 'BOOTH' ? 'CAB' : row.id === 'PREP' ? 'PRÉ' : row.id)}</span>`}<div style="min-width:0"><div class="t1">${esc(row.t1)}</div><div class="t2">${esc(row.t2)}</div></div><span class="cap ${over ? 'over' : ''}">${BO.num(h, 1)} / ${BO.num(row.cap, 1)} h${over ? '<br>' + BO.icon('alert', 12) + ' surcharge' : ''}</span></div>
        <div class="pl-t"><div class="hours">${hours.map(hh => `<div class="${hh === 12 ? 'lunch' : ''}"></div>`).join('')}</div>${l.map(b => { const r = CX.ro(b.roId); if (!r) return ''; const v = CX.veh(r.vehicleId), s = CX.STAGES[r.stage]; const other = st.rows === 'postes' ? (CX.emp(b.tech) || {}).first || '—' : (CX.RESOURCES.find(x => x.id === b.res) || {}).l; return `<div class="bk ${conf.has(b.id) ? 'conf' : ''}" data-bk="${b.id}" style="left:${pct(b.start)}%;width:calc(${b.dur * 60 / SPAN * 100}% - 3px);background:${row.color || s.c}" title="${esc(r.no)} · ${esc(CX.vlabel(v))} · ${U.hm(b.start)}–${U.hm(b.start + b.dur * 60)}${conf.has(b.id) ? ' · CONFLIT' : ''}"><span>${esc(r.no)} · ${esc(v.plate)}</span><small>${esc(other)} · ${BO.num(b.dur, 2)} h</small></div>`; }).join('')}${st.day === today() && nowX > 0 && nowX < 100 ? `<div class="nowl" style="left:${nowX}%"></div>` : ''}<div class="ghost"></div></div></div>`; }).join('')}</div>`;

    const pl = host.querySelector('[data-pl]');
    // glisser un créneau (horizontal = heure, vertical = poste / technicien)
    pl.querySelectorAll('[data-bk]').forEach(el => el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; e.preventDefault();
      const b = CX.S.bookings.find(x => x.id === el.dataset.bk), track = el.parentElement, W = track.getBoundingClientRect().width, x0 = e.clientX, start0 = b.start;
      let moved = false, rowEl = el.closest('.pr'), newStart = b.start;
      BO.dragging = true; el.classList.add('dragging'); try { el.setPointerCapture(e.pointerId); } catch (er) {}
      const mv = ev => { const dx = ev.clientX - x0; if (Math.abs(dx) > 3 || Math.abs(ev.movementY) > 2) moved = true; newStart = Math.max(D0, Math.min(D1 - b.dur * 60, Math.round((start0 + dx / W * SPAN) / 15) * 15)); el.style.left = pct(newStart) + '%'; el.style.pointerEvents = 'none'; const under = document.elementFromPoint(ev.clientX, ev.clientY); const pr = under && under.closest('.pr[data-row]'); pl.querySelectorAll('.pr.drop').forEach(x => x.classList.remove('drop')); if (pr) { pr.classList.add('drop'); rowEl = pr; } el.style.pointerEvents = ''; };
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); BO.dragging = false; el.classList.remove('dragging'); pl.querySelectorAll('.pr.drop').forEach(x => x.classList.remove('drop'));
        if (!moved) { bkForm(b); return; }
        const rowId = rowEl ? rowEl.dataset.row : null; const patch = { start: newStart }; if (rowId) patch[st.rows === 'postes' ? 'res' : 'tech'] = rowId;
        Object.assign(b, patch); CX.touch('booking', { id: b.id }); const r = CX.ro(b.roId);
        if (st.rows === 'tech' && rowId && r && !r.lead) CX.assignTech(r.id, rowId);
        UI.toast('Créneau déplacé', `${r.no} · ${U.hm(newStart)} · ${st.rows === 'postes' ? CX.RESOURCES.find(x => x.id === b.res).l : CX.emp(b.tech).name}`, 'ok', 'gantt'); check(st.day); BO.now(); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
    }));
    // déposer un OR à planifier
    pl.querySelectorAll('.pr[data-row] .pl-t').forEach(t => {
      const ghost = t.querySelector('.ghost');
      t.addEventListener('dragover', e => { e.preventDefault(); const W = t.getBoundingClientRect(); const m = Math.max(D0, Math.min(D1 - 60, Math.round((D0 + (e.clientX - W.left) / W.width * SPAN) / 15) * 15)); ghost.style.display = 'block'; ghost.style.left = pct(m) + '%'; ghost.style.width = (2 * 60 / SPAN * 100) + '%'; t.parentElement.classList.add('drop'); });
      t.addEventListener('dragleave', () => { ghost.style.display = 'none'; t.parentElement.classList.remove('drop'); });
      t.addEventListener('drop', e => { e.preventDefault(); ghost.style.display = 'none'; t.parentElement.classList.remove('drop'); BO.dragging = false; const roId = e.dataTransfer.getData('text/plain'), r = CX.ro(roId); if (!r) return; const W = t.getBoundingClientRect(); const m = Math.max(D0, Math.min(D1 - 60, Math.round((D0 + (e.clientX - W.left) / W.width * SPAN) / 15) * 15)); const rowId = t.parentElement.dataset.row; const dur = Math.min(4, Math.max(1, remaining(r) || 2)); const pre = { roId, date: st.day, start: m, dur, res: st.rows === 'postes' ? rowId : (r.posteId && CX.RESOURCES.some(x => x.id === r.posteId) ? r.posteId : 'P1'), tech: st.rows === 'tech' ? rowId : r.lead }; bkForm(null, pre); });
    });
  }

  function weekView(host) {
    const rows = rowsOf(), days = Array.from({ length: 5 }, (_, i) => U.addDays(U.weekStart(st.day), i));
    host.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:230px">${st.rows === 'postes' ? 'Poste' : 'Technicien'}</th>${days.map(d => `<th class="${d === today() ? 'sorted' : ''}">${esc(BO.dayName(d))} ${esc(U.fmtDate(d))}</th>`).join('')}<th class="num">Semaine</th></tr></thead><tbody>${rows.map(row => { let tot = 0; return `<tr><td>${row.emp ? BO.empCell(row.emp) : `<div class="t1">${esc(row.t1)}</div><div class="t2">${esc(row.t2)}</div>`}</td>${days.map(d => { const l = bookingsOf(row, d), h = l.reduce((a, b) => a + b.dur, 0); tot += h; const ro = [...new Set(l.map(b => b.roId))]; const p = row.cap ? h / row.cap : 0; return `<td style="vertical-align:top;cursor:pointer" data-day="${d}"><div class="row" style="justify-content:space-between;margin-bottom:5px"><b class="sm-t ${p > 1 ? 'bad-t' : ''}">${BO.num(h, 1)} h</b><span class="xs-t muted">${row.cap ? Math.round(p * 100) + ' %' : ''}</span></div>${BO.pbar(Math.min(1, p), p > 1 ? '' : p > .85 ? 'a' : 'g')}<div class="mt1" style="display:flex;flex-wrap:wrap;gap:3px">${ro.map(id => { const r = CX.ro(id); return r ? `<span class="tag" title="${esc(CX.vlabel(CX.veh(r.vehicleId)))}">${esc(r.no.replace('OR-', ''))}</span>` : ''; }).join('')}</div></td>`; }).join('')}<td class="num b">${BO.num(tot, 1)} h</td></tr>`; }).join('')}</tbody></table></div><div class="xs-t muted mt1">Cliquez sur un jour pour ouvrir le planning horaire.</div>`;
    host.querySelectorAll('[data-day]').forEach(td => td.addEventListener('click', () => { st.day = td.dataset.day; st.mode = 'day'; APP.refresh(); }));
  }

  function render(el, params) {
    if (params.view === 'tech') { st.rows = 'tech'; APP.setParams({ view: null }); }
    const S = CX.S, rows = rowsOf(), dayB = S.bookings.filter(b => b.date === st.day);
    const capTot = CX.RESOURCES.filter(r => r.kind !== 'prepa').reduce((a, r) => a + r.cap, 0), load = dayB.filter(b => b.res !== 'PREP').reduce((a, b) => a + b.dur, 0);
    const techOver = S.staff.filter(e => CX.ROLES[e.role].prod && S.bookings.filter(b => b.date === st.day && b.tech === e.id).reduce((a, b) => a + b.dur, 0) > S.company.hoursDay + .01);
    let nConf = 0; CX.RESOURCES.forEach(r => { nConf += conflicts(S.bookings.filter(b => b.date === st.day && b.res === r.id)).size; });
    const unpl = S.ros.filter(r => r.stage >= CX.ST.accord && r.stage < CX.ST.pret && remaining(r) > .2).sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)));
    el.innerHTML = `<div class="bo-page">${BO.head('Planning atelier', `Capacité par poste et par technicien — glissez un créneau pour le déplacer, déposez un OR « à planifier » sur une ligne.`, `${BO.seg('rows', [['postes', BO.icon('lift', 14) + 'Postes'], ['tech', BO.icon('users', 14) + 'Techniciens']], st.rows)}${BO.seg('mode', [['day', 'Jour'], ['week', 'Semaine']], st.mode)}`)}
      <div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">${BO.kpi({ lb: 'Charge planifiée (postes)', v: BO.num(load, 1) + '<small>/ ' + capTot + ' h</small>', s: BO.pbar(load / capTot, load > capTot ? '' : 'g', 160), icon: 'gauge' })}${BO.kpi({ lb: 'Techniciens en surcharge', v: techOver.length, s: techOver.length ? techOver.map(e => esc(e.first)).join(', ') : 'aucune surcharge', icon: 'users', cls: techOver.length ? 'hero' : '' })}${BO.kpi({ lb: 'Conflits de poste', v: nConf, s: nConf ? 'créneaux qui se chevauchent' : 'aucun chevauchement', icon: 'alert' })}${BO.kpi({ lb: 'Heures à planifier', v: BO.num(unpl.reduce((a, r) => a + remaining(r), 0), 1) + '<small>h</small>', s: unpl.length + ' OR en attente de créneau', icon: 'clock' })}</div>
      <div class="toolbar"><button class="btn sm" data-d="-1">${BO.icon('chevL', 14)}</button><button class="btn sm" data-d="0">Aujourd’hui</button><button class="btn sm" data-d="1">${BO.icon('chevR', 14)}</button><b style="margin-left:6px;font-size:14px">${st.mode === 'day' ? esc(U.fmtDate(st.day, { weekday: 'long', day: 'numeric', month: 'long' })) : 'Semaine du ' + esc(U.fmtDate(U.weekStart(st.day), { day: 'numeric', month: 'long' }))}</b><span class="sp"></span><span class="legend"><span><i style="background:#e3262d"></i>Pont</span><span><i style="background:#a3161c"></i>Marbre</span><span><i style="background:#6b7280"></i>Préparation</span><span><i style="background:#b96400"></i>Cabine</span><span><i style="border:2px solid #ffb347;background:#fff"></i>Conflit</span></span><button class="btn sm pri" data-new>${BO.icon('plus', 13)}Créneau</button></div>
      <div class="g" style="grid-template-columns:minmax(0,1fr) 270px;align-items:start"><div data-view></div>
        <div class="card"><div class="card-h"><h3>${BO.icon('clock', 16)}À planifier <small>${unpl.length}</small></h3></div><div class="card-b"><div class="unpl">${unpl.map(r => { const v = CX.veh(r.vehicleId); return `<div draggable="true" data-ro="${r.id}">${BO.icon('gantt', 15)}<div style="flex:1;min-width:0"><div>${BO.plate(v.plate)}</div><b class="sm-t" style="display:block;margin-top:4px">${esc(r.no)} · ${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(CX.STAGES[r.stage].s)} · reste ${BO.h(remaining(r))} · ${CX.isLate(r) ? '<span class="bad-t b">en retard</span>' : 'pour ' + esc(BO.dt(r.dueAt))}</div></div></div>`; }).join('') || BO.empty('check', 'Tout est planifié', '', '', true)}</div><div class="xs-t muted mt1">${st.mode === 'day' ? 'Glissez une carte sur une ligne du planning.' : 'Passez en vue Jour pour déposer un OR.'}</div></div></div></div></div>`;
    if (st.mode === 'day') dayView(el.querySelector('[data-view]')); else weekView(el.querySelector('[data-view]'));
    el.querySelectorAll('.unpl [data-ro]').forEach(c => { c.addEventListener('dragstart', e => { BO.dragging = true; e.dataTransfer.setData('text/plain', c.dataset.ro); e.dataTransfer.effectAllowed = 'copy'; }); c.addEventListener('dragend', () => { BO.dragging = false; }); c.addEventListener('dblclick', () => bkForm(null, { roId: c.dataset.ro, date: st.day })); });
    BO.bindSeg(el, (n, v) => { st[n] = v; APP.refresh(); });
    el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const d = +b.dataset.d; if (!d) st.day = today(); else { let x = U.addDays(st.day, d * (st.mode === 'day' ? 1 : 7)); while (U.isWeekend(x)) x = U.addDays(x, d); st.day = x; } APP.refresh(); }));
    el.querySelector('[data-new]').addEventListener('click', () => bkForm(null, { date: st.day }));
  }

  APP.register({ id: 'planning', label: 'Planning atelier', icon: 'gantt', group: 'Atelier', order: 3, render, badge: () => { let n = 0; CX.RESOURCES.forEach(r => { n += conflicts(CX.S.bookings.filter(b => b.date === today() && b.res === r.id)).size; }); return n; } });
})();
