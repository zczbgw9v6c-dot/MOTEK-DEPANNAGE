/* ==========================================================================
   MOTEK — Back-office : socle commun des modules (window.BO)
   - synchronisation live (CX.on('change') → APP.refresh débouncé)
   - composants : tableaux triables, formulaires validés, tiroirs, confirmations,
     messages pré-rédigés, schéma de carrosserie, frise workflow, plaque française,
     répartition assurance / client, QR-facture, aperçus imprimables
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2, fmtD, today, addDays, diffDays, dOf, tOf } = U;
  const BO = window.BO = {};
  BO.$ = (s, r = document) => r.querySelector(s);
  BO.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  BO.icon = (n, s = 16) => UI.icon(n, s);

  /* ---------- formats ---------- */
  BO.pct = (x, d = 0) => (Math.round((x || 0) * 100 * 10 ** d) / 10 ** d).toLocaleString('fr-FR') + ' %';
  BO.num = (x, d = 0) => (Math.round((x || 0) * 10 ** d) / 10 ** d).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  BO.h = x => (Math.round((x || 0) * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' h';
  BO.date = s => s ? U.fmtDate(dOf(s), { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  BO.dateS = s => s ? U.fmtDate(dOf(s)) : '—';
  BO.dayName = s => U.fmtDate(dOf(s), { weekday: 'short' }).replace('.', '');
  BO.dt = s => { if (!s) return '—'; const d = dOf(s), t = tOf(s); const dd = diffDays(today(), d); return (dd === 0 ? 'Auj.' : dd === 1 ? 'Demain' : dd === -1 ? 'Hier' : U.fmtDate(d)) + (t ? ' ' + t : ''); };
  BO.inDays = s => { if (!s) return '—'; const d = diffDays(today(), dOf(s)); if (d === 0) return 'aujourd’hui'; if (d === 1) return 'demain'; if (d === -1) return 'hier'; return d > 0 ? 'dans ' + d + ' j' : 'il y a ' + (-d) + ' j'; };
  BO.ago = s => { if (!s) return '—'; const d = diffDays(dOf(s), today()); if (d === 0) { const m = Math.round(U.nowMin() - U.toMin(tOf(s) || '00:00')); return m < 1 ? 'à l’instant' : m < 60 ? 'il y a ' + m + ' min' : 'il y a ' + Math.round(m / 60) + ' h'; } return d === 1 ? 'hier' : 'il y a ' + d + ' j'; };
  BO.tvaLbl = () => BO.num((CX.S.company.tvaRate != null ? CX.S.company.tvaRate : CX.TVA) * 100, 1) + ' %';
  BO.stars = r => { const n = Math.round(r || 0); return n ? `<span class="stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>` : '<span class="muted">—</span>'; };
  BO.km = n => BO.num(n) + ' km';

  /* ---------- briques d'interface ---------- */
  BO.plate = (p, lg) => UI.plate(p, lg);
  BO.ins = (id, pill = true) => UI.insChip(id, pill);
  BO.av = (id, s = 28) => UI.av(CX.emp(id), s);
  BO.avs = (ids, s = 26) => `<div class="bavs">${ids.map(id => UI.av(CX.emp(id), s)).join('')}</div>`;
  BO.empty = (icon, title, text = '', action = '', sm = false) => `<div class="empty ${sm ? 'sm' : ''}"><div class="ei">${BO.icon(icon, 24)}</div><b>${esc(title)}</b>${text ? `<div class="sm-t">${esc(text)}</div>` : ''}${action ? `<div class="mt1">${action}</div>` : ''}</div>`;
  BO.mapBtn = (type, id, label = 'Voir dans l’atelier', cls = 'sm') => `<button class="btn ${cls}" data-map="${type}:${id}">${BO.icon('cube', 14)}${label ? esc(label) : ''}</button>`;
  BO.head = (title, sub, actions = '', crumb = '') => `<div class="pg-h"><div class="tt">${crumb}<h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="act">${actions}</div></div>`;
  BO.crumb = parts => `<div class="crumb">${parts.map(([l, go]) => go ? `<a data-open="${go}">${esc(l)}</a>` : `<span>${esc(l)}</span>`).join(BO.icon('chevR', 12))}</div>`;
  BO.kpi = ({ lb, v, s = '', icon = 'trend', cls = '', go = '' }) => `<div class="kpi ${cls} ${go ? 'click' : ''}" ${go ? `data-open="${go}"` : ''}><div class="lb">${esc(lb)}</div><div class="ki">${BO.icon(icon, 15)}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  BO.seg = (name, items, cur) => `<div class="seg" data-seg="${name}">${items.map(([v, l, n]) => `<button data-v="${esc(v)}" class="${String(v) === String(cur) ? 'on' : ''}">${l}${n != null ? `<em>${n}</em>` : ''}</button>`).join('')}</div>`;
  BO.tabs = (items, cur) => `<div class="tabs">${items.map(([v, l, n, cls]) => `<button data-tab="${v}" class="${v === cur ? 'on' : ''}">${l}${n ? `<em class="${cls || ''}">${n}</em>` : ''}</button>`).join('')}</div>`;
  BO.opts = (arr, cur, empty) => (empty != null ? `<option value="">${esc(empty)}</option>` : '') + arr.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(cur ?? '') ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
  BO.pbar = (p, cls = '', w) => `<div class="pbar ${cls}" ${w ? `style="width:${w}px"` : ''}><i style="width:${Math.max(0, Math.min(100, p * 100))}%"></i></div>`;
  BO.prog = (p, cls = '') => `<div class="prog">${BO.pbar(p, cls)}<span>${Math.round(p * 100)}%</span></div>`;
  BO.chip = (txt, tone = '', dot = false) => `<span class="chip ${tone}">${dot ? '<span class="dot"></span>' : ''}${esc(txt)}</span>`;
  const TONE2 = { red: 'red', amber: 'amber', green: 'green', slate: '', dark: 'dark' };
  BO.status = r => { const s = CX.statusOf(r); return BO.chip(s, TONE2[CX.toneOf(s)] || '', true); };
  BO.stage = r => { const st = CX.STAGES[r.stage]; return `<span class="chip line"><i style="width:7px;height:7px;border-radius:2px;background:${st.c};display:inline-block"></i>${esc(st.s)}</span>`; };
  BO.vehCell = (v, sub) => v ? `<div class="who"><div><div class="t1">${BO.plate(v.plate)} <span style="margin-left:4px">${esc(CX.vlabel(v))}</span></div><div class="t2">${esc(sub != null ? sub : v.colorName + ' · ' + v.year)}</div></div></div>` : '—';
  BO.custCell = (c, sub) => c ? `<div class="who" data-open="crm:${c.id}" style="cursor:pointer">${UI.cav(c, 30)}<div><div class="t1">${esc(c.name)}</div><div class="t2">${esc(sub != null ? sub : c.city)}</div></div></div>` : '—';
  BO.empCell = (e, sub) => e ? `<div class="who">${UI.av(e, 30)}<div><div class="t1">${esc(e.name)}</div><div class="t2">${esc(sub != null ? sub : e.title)}</div></div></div>` : '<span class="muted">—</span>';
  BO.roLink = r => r ? `<a class="lnk" data-open="ros:${r.id}">${esc(r.no)}</a>` : '—';

  /* ---------- options de sélection ---------- */
  BO.optCustomers = () => CX.S.customers.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => [c.id, c.name + (c.type === 'entreprise' ? ' (entreprise)' : '')]);
  BO.optVehicles = cid => CX.S.vehicles.filter(v => !cid || v.customerId === cid).map(v => [v.id, v.plate + ' · ' + CX.vlabel(v) + (cid ? '' : ' — ' + CX.custName(v.customerId))]);
  BO.optInsurers = () => CX.S.insurers.map(i => [i.id, i.short]);
  BO.optStaff = (f = () => true) => CX.S.staff.filter(f).map(e => [e.id, e.name + ' – ' + e.title]);
  BO.optTechs = () => BO.optStaff(e => CX.ROLES[e.role].prod || e.role === 'chef');
  BO.optROs = (f = r => r.stage < CX.ST.facture) => CX.S.ros.filter(f).sort((a, b) => b.no.localeCompare(a.no)).map(r => [r.id, r.no + ' · ' + (CX.veh(r.vehicleId) || {}).plate + ' · ' + CX.vlabel(CX.veh(r.vehicleId))]);
  BO.optSuppliers = () => CX.S.suppliers.map(s => [s.id, s.name]);

  /* ---------- téléchargement / CSV ---------- */
  BO.download = (name, content, mime = 'text/plain;charset=utf-8') => { const blob = content instanceof Blob ? content : new Blob([content], { type: mime }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  BO.csv = rows => '﻿' + rows.map(r => r.map(v => { const s = v == null ? '' : String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
  BO.copy = text => { try { navigator.clipboard.writeText(text); UI.toast('Copié', 'Le texte est dans le presse-papiers.', 'ok', 'check'); } catch (e) { UI.toast('Copie impossible', 'Sélectionnez le texte manuellement.', 'warn'); } };

  /* ==========================================================================
     SYNCHRONISATION LIVE
     ========================================================================== */
  let pend = false, timer = null, last = 0, drawerCur = null;
  BO.dragging = false;
  BO.busy = () => {
    if (document.querySelector('.mdl-bg') || BO.dragging) return true;
    const a = document.activeElement;
    return !!(a && a.closest && a.closest('#bo-content, .drw') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox');
  };
  function tick() {
    if (!pend) return;
    if (APP.mode !== 'bo') { pend = false; return; }
    if (BO.busy()) { timer = setTimeout(tick, 700); return; }
    const gap = Date.now() - last; if (gap < 700) { timer = setTimeout(tick, 700 - gap); return; }
    pend = false; last = Date.now();
    const host = document.getElementById('bo-content'); if (host) host.classList.add('live');
    BO.refreshing = true;
    try { APP.refresh(); if (drawerCur) drawerCur.rerender(); } finally { BO.refreshing = false; }
  }
  BO.schedule = (ms = 200) => { pend = true; clearTimeout(timer); timer = setTimeout(tick, ms); };
  CX.on('change', d => { if (d && (d.evt === 'feed' || d.evt === 'progress')) return; BO.schedule(); });
  BO.now = () => { pend = true; last = 0; clearTimeout(timer); tick(); };
  APP.onMode(m => { if (m !== 'bo') BO.closeDrawer(); });

  /* ---------- navigation déléguée ---------- */
  document.addEventListener('click', e => {
    const host = document.getElementById('bo-content');
    if (host && e.target.closest('.bo-nav a, [data-open]')) host.classList.remove('live');
    const m = e.target.closest('[data-map]');
    if (m && m.closest('.bo')) { e.preventDefault(); e.stopPropagation(); const [t, id] = m.dataset.map.split(':'); BO.closeDrawer(); document.querySelectorAll('.mdl-bg').forEach(x => x.remove()); APP.showInMap(t, id); return; }
    const o = e.target.closest('[data-open]');
    if (o && o.closest('.bo')) { e.preventDefault(); e.stopPropagation(); const [mod, id, tab] = o.dataset.open.split(':'); BO.closeDrawer(); document.querySelectorAll('.mdl-bg').forEach(x => x.remove()); APP.open(mod, id ? { id, tab } : (tab ? { tab } : {})); return; }
  }, true);
  BO.bindSearch = (el, cb) => { const q = el.querySelector('[data-q]'); if (!q) return; let tm; q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { cb(q.value); APP.refresh(); const n = BO.$('#bo-content [data-q]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 240); }); };
  BO.bindSeg = (el, cb) => el.querySelectorAll('[data-seg]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) cb(g.dataset.seg, b.dataset.v); }));
  BO.bindTabs = (el, cb) => el.querySelectorAll('.tabs').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) cb(b.dataset.tab); }));

  /* ==========================================================================
     TABLEAU TRIABLE
     ========================================================================== */
  BO.table = (host, cfg) => {
    const st = cfg.state || (cfg.state = {});
    const draw = () => {
      let rows = cfg.rows.slice();
      const col = cfg.cols.find(c => c.k === st.sort);
      if (col) { const g = col.get || (r => r[col.k]); rows.sort((a, b) => { const x = g(a), y = g(b); const r = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'fr', { numeric: true }); return st.dir === 'desc' ? -r : r; }); }
      host.innerHTML = `<div class="tbl-wrap" ${cfg.maxH ? `style="max-height:${cfg.maxH}px"` : ''}><table class="tbl ${cfg.cls || ''}"><thead><tr>${cfg.cols.map(c => `<th class="${c.nosort ? '' : 's'} ${c.num ? 'num' : ''} ${st.sort === c.k ? 'sorted' : ''}" data-k="${c.k}" ${c.w ? `style="width:${c.w}"` : ''}>${c.label}${c.nosort ? '' : `<span class="ar">${st.sort === c.k && st.dir === 'desc' ? '▼' : '▲'}</span>`}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((r, i) => `<tr data-ri="${i}" class="${cfg.onRow ? 'cl' : ''} ${cfg.rowCls ? cfg.rowCls(r) : ''}">${cfg.cols.map(c => `<td class="${c.num ? 'num' : ''} ${c.cls || ''}">${c.render ? c.render(r) : esc(r[c.k])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cfg.cols.length}">${cfg.empty || BO.empty('search', 'Aucun résultat', 'Modifiez les filtres pour élargir la recherche.', '', true)}</td></tr>`}</tbody>${cfg.foot && rows.length ? `<tfoot><tr>${cfg.foot(rows)}</tr></tfoot>` : ''}</table></div>`;
      host.querySelector('thead').addEventListener('click', e => { const th = e.target.closest('th.s'); if (!th) return; const k = th.dataset.k; if (st.sort === k) st.dir = st.dir === 'desc' ? 'asc' : 'desc'; else { st.sort = k; st.dir = cfg.cols.find(c => c.k === k).num ? 'desc' : 'asc'; } draw(); });
      if (cfg.onRow) host.querySelector('tbody').addEventListener('click', e => { if (e.target.closest('button,a,input,select,label,[data-open],[data-map]')) return; const tr = e.target.closest('tr[data-ri]'); if (tr) cfg.onRow(rows[+tr.dataset.ri]); });
      if (cfg.after) cfg.after(host, rows);
    };
    draw(); return { draw };
  };

  /* ==========================================================================
     FORMULAIRES
     ========================================================================== */
  BO.formHtml = (fields, vals = {}, cls = '') => `<div class="fgrid ${cls}">${fields.map(f => {
    if (f.type === 'html') return `<div class="${f.full ? 'full' : ''}">${f.html}</div>`;
    const v = vals[f.k] != null ? vals[f.k] : (f.v != null ? f.v : '');
    const id = 'f_' + f.k;
    let ctl;
    if (f.type === 'select') ctl = `<select class="inp" id="${id}" name="${f.k}">${BO.opts(f.opts || [], v, f.empty)}</select>`;
    else if (f.type === 'textarea') ctl = `<textarea class="inp" id="${id}" name="${f.k}" placeholder="${esc(f.ph || '')}" rows="${f.rows || 3}">${esc(v)}</textarea>`;
    else if (f.type === 'checkbox') return `<label class="chk ${f.full ? 'full' : ''}"><input type="checkbox" name="${f.k}" ${v ? 'checked' : ''}> ${esc(f.label)}</label>`;
    else ctl = `<input class="inp" id="${id}" name="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" placeholder="${esc(f.ph || '')}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} ${f.step != null ? `step="${f.step}"` : ''}>`;
    return `<div class="field ${f.full ? 'full' : ''}" data-f="${f.k}"><label for="${id}">${esc(f.label)}${f.req ? '<span class="req">*</span>' : ''}</label>${ctl}${f.help ? `<div class="help">${esc(f.help)}</div>` : ''}<div class="em"></div></div>`;
  }).join('')}</div>`;
  BO.formRead = (root, fields) => {
    const vals = {}, errs = {};
    fields.forEach(f => {
      if (f.type === 'html') return;
      const el = root.querySelector(`[name="${f.k}"]`); if (!el) return;
      let v = f.type === 'checkbox' ? el.checked : el.value.trim();
      if (f.type === 'number') v = v === '' ? null : Number(v);
      vals[f.k] = v;
      if (f.req && (v === '' || v == null)) errs[f.k] = 'Champ obligatoire';
      else if (f.type === 'number' && v != null && (isNaN(v) || (f.min != null && v < f.min) || (f.max != null && v > f.max))) errs[f.k] = f.min != null && f.max != null ? `Entre ${f.min} et ${f.max}` : f.min != null ? `Minimum ${f.min}` : 'Nombre invalide';
      else if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) errs[f.k] = 'Adresse e-mail invalide';
      else if (f.type === 'tel' && v && !/^[+\d][\d\s().-]{6,}$/.test(v)) errs[f.k] = 'Numéro invalide';
      else if (f.validate) { const m = f.validate(v, vals); if (m) errs[f.k] = m; }
    });
    root.querySelectorAll('.field[data-f]').forEach(d => { const m = errs[d.dataset.f]; d.classList.toggle('err', !!m); const em = d.querySelector('.em'); if (em) em.textContent = m || ''; });
    const first = Object.keys(errs)[0]; if (first) { const el = root.querySelector(`[name="${first}"]`); el && el.focus(); }
    return { ok: !first, vals, errs };
  };
  BO.formModal = ({ title, fields, values = {}, submit = 'Enregistrer', wide = false, intro = '', after = '', onSubmit, onMount, danger, cols }) => UI.modal({
    title: esc(title), wide,
    body: (intro ? `<div class="mb">${intro}</div>` : '') + BO.formHtml(fields, values, cols || (wide ? 'c3' : '')) + after,
    foot: `${danger ? `<button class="btn danger" data-del style="margin-right:auto">${BO.icon('trash', 15)}${esc(danger.label || 'Supprimer')}</button>` : ''}<button class="btn" data-close>Annuler</button><button class="btn pri" data-ok>${BO.icon('check', 15)}${esc(submit)}</button>`,
    onMount: (el, close) => {
      const go = () => { const r = BO.formRead(el, fields); if (!r.ok) return; const res = onSubmit(r.vals, close, el); if (res !== false) close(); };
      el.querySelector('[data-ok]').addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); go(); } });
      if (danger) el.querySelector('[data-del]').addEventListener('click', () => { close(); BO.confirm(danger.title || 'Supprimer ?', danger.text || 'Cette action est définitive.', 'Supprimer', danger.run, true); });
      if (onMount) onMount(el, close);
      setTimeout(() => { const f = el.querySelector('.inp'); f && f.focus(); }, 60);
    },
  });
  BO.confirm = (title, text, ok = 'Confirmer', run, danger = false) => UI.modal({
    title: esc(title), body: `<p style="line-height:1.55;color:var(--ink2)">${text}</p>`,
    foot: `<button class="btn" data-close>Annuler</button><button class="btn ${danger ? 'dark' : 'pri'}" data-ok>${esc(ok)}</button>`,
    onMount: (el, close) => el.querySelector('[data-ok]').addEventListener('click', () => { close(); run(); }),
  });
  /** Message pré-rédigé (SMS / e-mail) — l'utilisateur relit puis valide. */
  BO.compose = ({ title = 'Message', to = '', subject = '', body = '', channel = 'SMS', note = '', okLabel = 'Marquer comme envoyé', onSend }) => UI.modal({
    title: esc(title),
    body: `${note ? `<div class="form-note mb">${BO.icon('msg', 16)}<div>${note}</div></div>` : ''}
      <div class="fgrid"><div class="field"><label>Destinataire</label><input class="inp" name="to" value="${esc(to)}"></div><div class="field"><label>Canal</label><select class="inp" name="ch">${BO.opts(['SMS', 'E-mail', 'WhatsApp', 'Téléphone (script)'], channel)}</select></div>
      <div class="field full"><label>Objet</label><input class="inp" name="subj" value="${esc(subject)}"></div>
      <div class="field full"><label>Message</label><textarea class="inp" name="body" rows="8">${esc(body)}</textarea><div class="help" data-cnt></div></div></div>`,
    foot: `<button class="btn" data-copy style="margin-right:auto">${BO.icon('copy', 15)}Copier</button><button class="btn" data-mail>${BO.icon('mail', 15)}Ouvrir dans la messagerie</button><button class="btn pri" data-ok>${BO.icon('send', 15)}${esc(okLabel)}</button>`,
    onMount: (el, close) => {
      const val = n => el.querySelector(`[name="${n}"]`).value;
      const cnt = () => { const n = val('body').length; el.querySelector('[data-cnt]').textContent = val('ch') === 'SMS' ? n + ' caractères · ' + Math.max(1, Math.ceil(n / 160)) + ' SMS' : n + ' caractères'; };
      el.querySelector('[name="body"]').addEventListener('input', cnt); el.querySelector('[name="ch"]').addEventListener('change', cnt); cnt();
      el.querySelector('[data-copy]').addEventListener('click', () => BO.copy((val('subj') ? val('subj') + '\n\n' : '') + val('body')));
      el.querySelector('[data-mail]').addEventListener('click', () => { const to = val('to'); window.location.href = 'mailto:' + (/@/.test(to) ? encodeURIComponent(to) : '') + '?subject=' + encodeURIComponent(val('subj')) + '&body=' + encodeURIComponent(val('body')); });
      el.querySelector('[data-ok]').addEventListener('click', () => { if (!val('body').trim()) { UI.toast('Message vide', 'Rédigez un message avant l’envoi.', 'warn'); return; } close(); onSend && onSend({ to: val('to'), channel: val('ch'), subject: val('subj'), body: val('body') }); });
    },
  });

  /* ==========================================================================
     TIROIR LATÉRAL
     ========================================================================== */
  BO.drawer = ({ title, sub = '', head = '', render, foot, wide = false, onMount }) => {
    BO.closeDrawer();
    const bg = document.createElement('div'); bg.className = 'drw-bg';
    const d = document.createElement('aside'); d.className = 'drw bo' + (wide ? ' wide' : '');
    document.body.append(bg, d);
    const close = () => { bg.remove(); d.remove(); document.removeEventListener('keydown', onKey); if (drawerCur && drawerCur.el === d) drawerCur = null; };
    const onKey = e => { if (e.key === 'Escape' && !document.querySelector('.mdl-bg')) close(); };
    const rerender = () => {
      const t = typeof title === 'function' ? title() : title; if (t == null) { close(); return; }
      const sc = d.querySelector('.db') ? d.querySelector('.db').scrollTop : 0;
      const h = typeof head === 'function' ? head() : head, sb = typeof sub === 'function' ? sub() : sub, f = typeof foot === 'function' ? foot() : foot;
      d.innerHTML = `<div class="dh">${h}<div class="tt"><h3>${t}</h3><div class="sub">${sb}</div></div><button class="btn ghost sm" data-x>${BO.icon('x', 17)}</button></div><div class="db">${render()}</div>${f ? `<div class="df">${f}</div>` : ''}`;
      d.querySelector('[data-x]').addEventListener('click', close);
      d.querySelector('.db').scrollTop = sc;
      onMount && onMount(d, close, rerender);
    };
    bg.addEventListener('click', close); document.addEventListener('keydown', onKey);
    drawerCur = { el: d, rerender, close }; rerender(); return drawerCur;
  };
  BO.closeDrawer = () => { if (drawerCur) drawerCur.close(); };

  /* ==========================================================================
     COMPOSANTS MÉTIER CARROSSERIE
     ========================================================================== */
  /** Frise du workflow (14 étapes) d'un OR, cliquable si opts.click */
  BO.wfLine = (r, opts = {}) => {
    const log = {}; (r.stageLog || []).forEach(s => { log[s.stage] = s.at; });
    return `<div class="wfl">${CX.STAGES.map((s, i) => { const cls = i < r.stage ? 'done' : i === r.stage ? 'cur' : 'fut'; return `<div class="${cls}"><span class="c" ${opts.click ? `data-stage="${i}" title="Passer à « ${esc(s.l)} »"` : ''}>${i < r.stage ? BO.icon('check', 12) : BO.icon(s.ic, 12)}</span><div class="n">${esc(s.s)}</div><div class="t">${log[i] ? esc(BO.dt(log[i])) : i === r.stage ? 'en cours' : ''}</div></div>`; }).join('')}</div>`;
  };
  /** Schéma de carrosserie vue de dessus. dmg = {zone: type}. opts.editable */
  BO.carDiagram = (dmg = {}, opts = {}) => {
    const Z = (id, d, lbl, tx, ty) => `<path class="z ${dmg[id] ? 'on t-' + dmg[id] : ''}" data-z="${id}" d="${d}"><title>${esc(CX.ZONE[id])}${dmg[id] ? ' — ' + esc(CX.DMG_TYPES[dmg[id]]) : ''}</title></path>${lbl ? `<text x="${tx}" y="${ty}" text-anchor="middle">${lbl}</text>` : ''}`;
    const R = (x, y, w, h, r = 6) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;
    return `<svg class="cardiag ${opts.editable ? '' : 'ro'}" viewBox="0 0 240 450" ${opts.id ? `id="${opts.id}"` : ''}>
      <defs><pattern id="hail" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f6c9cb"/><circle cx="4" cy="4" r="1.6" fill="#1157c4"/></pattern></defs>
      <rect x="2" y="70" width="14" height="46" rx="4" class="wh"/><rect x="224" y="70" width="14" height="46" rx="4" class="wh"/><rect x="2" y="318" width="14" height="46" rx="4" class="wh"/><rect x="224" y="318" width="14" height="46" rx="4" class="wh"/>
      ${Z('pcav', 'M52 14h136a16 16 0 0 1 16 16v8H36v-8a16 16 0 0 1 16-16z', 'PC AV', 120, 30)}
      ${Z('phavg', R(42, 40, 34, 13, 5), '', 0, 0)}${Z('phavd', R(164, 40, 34, 13, 5), '', 0, 0)}
      ${Z('capot', 'M64 56h112l4 78H60z', 'CAPOT', 120, 100)}
      ${Z('ailavg', 'M20 56h36l2 82H20z', 'AILE', 39, 100)}${Z('ailavd', 'M184 56h36v82h-38z', 'AILE', 201, 100)}
      ${Z('pb', 'M62 138h116l-10 40H72z', 'PARE-BRISE', 120, 162)}
      ${Z('toit', R(74, 182, 92, 96, 8), 'TOIT', 120, 233)}
      ${Z('lun', 'M72 282h96l10 34H62z', 'LUNETTE', 120, 303)}
      ${Z('ptavg', R(20, 142, 38, 80, 4), 'PTE AV', 39, 186)}${Z('ptavd', R(182, 142, 38, 80, 4), 'PTE AV', 201, 186)}
      ${Z('ptarg', R(20, 224, 38, 80, 4), 'PTE AR', 39, 268)}${Z('ptard', R(182, 224, 38, 80, 4), 'PTE AR', 201, 268)}
      ${Z('bcg', R(8, 142, 10, 162, 3), '', 0, 0)}${Z('bcd', R(222, 142, 10, 162, 3), '', 0, 0)}
      ${Z('retg', R(0, 128, 20, 12, 4), '', 0, 0)}${Z('retd', R(220, 128, 20, 12, 4), '', 0, 0)}
      ${Z('ailarg', 'M20 306h38l2 82H20z', 'AILE', 39, 350)}${Z('ailard', 'M182 306h38v82h-40z', 'AILE', 201, 350)}
      ${Z('hayon', 'M60 320h120l-4 66H64z', 'HAYON', 120, 356)}
      ${Z('feuarg', R(42, 390, 34, 12, 5), '', 0, 0)}${Z('feuard', R(164, 390, 34, 12, 5), '', 0, 0)}
      ${Z('pcar', 'M36 406h168v8a16 16 0 0 1-16 16H52a16 16 0 0 1-16-16z', 'PC AR', 120, 422)}
      ${Z('struct', R(104, 444 - 8, 32, 8, 3), '', 0, 0)}
      <text x="120" y="8" text-anchor="middle" style="font-size:8px">▲ AVANT</text>
    </svg>`;
  };
  BO.dmgList = dmg => { const k = Object.keys(dmg || {}); return k.length ? k.map(z => `<span class="chip ${dmg[z] === 'R' ? 'amber' : 'red'}">${esc(CX.ZONE[z] || z)} · ${esc(CX.DMG_TYPES[dmg[z]] || '')}</span>`).join(' ') : '<span class="muted sm-t">Aucun dégât relevé</span>'; };
  /** Répartition d'un montant : assurance / client (franchise) / acomptes */
  BO.split = (t, dep = 0) => {
    const tot = Math.max(1, t.ttc), ins = t.insurer, cli = Math.max(0, t.client - dep);
    return `<div class="split"><i class="ins-p" style="width:${ins / tot * 100}%"></i><i class="dep-p" style="width:${dep / tot * 100}%"></i><i class="cli-p" style="width:${cli / tot * 100}%"></i></div>
      <div class="split-l"><span><i style="background:#16181c"></i>Assurance ${chf(ins)}</span>${dep ? `<span><i style="background:#22a35a"></i>Acompte ${chf(dep)}</span>` : ''}<span><i style="background:var(--red)"></i>Client ${chf(cli)}${t.franchise ? ` <span class="muted">(dont franchise ${chf(t.franchise)})</span>` : ''}</span></div>`;
  };
  /** Photos (placeholders simulés) */
  BO.photoGrid = (photos, add) => `<div class="ph-grid">${(photos || []).map((p, i) => `<div class="ph" title="${esc(p.l)}">${UI.carPic(['#dfe2e7', '#e8eaee', '#d6dade'][i % 3], 70, 52)}${p.k === 'avant' && /dégât/i.test(p.l) ? '<span class="dmg" style="left:58%;top:32%"></span>' : ''}<span class="kd ${p.k === 'apres' ? 'ap' : ''}">${p.k === 'apres' ? 'Après' : 'Avant'}</span><span class="lb">${esc(p.l)}</span></div>`).join('')}${add ? `<div class="ph add" data-addph>${BO.icon('camera', 18)}Ajouter</div>` : ''}</div>`;

  /** Message « votre véhicule est prêt » pré-rédigé */
  BO.notifyReady = (roId, after) => {
    const r = CX.ro(roId), c = CX.cust(r.customerId), v = CX.veh(r.vehicleId), t = CX.roTotals(r), co = CX.S.company;
    const ch = c.pref === 'E-mail' ? 'E-mail' : 'SMS';
    const first = c.type === 'entreprise' ? 'Madame, Monsieur' : 'Bonjour ' + c.name.split(' ')[0];
    const amt = t.client > 0 ? (t.insurer > 0 ? `Il reste à votre charge la franchise de ${chf(t.client)} (le solde est réglé directement par votre assurance).` : `Montant à régler à la restitution : ${chf(t.client)}.`) : 'Aucun montant n’est à votre charge.';
    const body = ch === 'SMS'
      ? `${first}, votre ${CX.vlabel(v)} (${v.plate}) est prêt ! Vous pouvez venir le chercher chez MOTEK Garage, 12 rue des Ateliers, du lundi au vendredi 7h30–17h30. ${amt} Merci de votre confiance.`
      : `${first},\n\nNous avons le plaisir de vous informer que les travaux sur votre ${v.make} ${v.model} (${v.plate}) — ordre ${r.no} — sont terminés et que le véhicule a passé notre contrôle qualité.\n\nVous pouvez le récupérer à notre atelier, 12 rue des Ateliers à Lyon, du lundi au vendredi de 7h30 à 17h30.\n${amt}\n\nAu plaisir de vous revoir,\nMOTEK Garage\n${co.phone}`;
    BO.compose({ title: 'Prévenir le client — véhicule prêt', to: ch === 'SMS' ? c.phone : c.email, channel: ch, subject: ch === 'SMS' ? '' : 'Votre véhicule est prêt — ' + v.plate, body, note: `Contact préféré : <b>${esc(c.pref)}</b>. Le message est pré-rédigé : relisez puis validez l’envoi.`, okLabel: 'Envoyer', onSend: m => { CX.notifyCustomer(r.id, m.channel, 'Véhicule prêt — ' + v.plate); UI.toast('Client prévenu', c.name + ' · ' + m.channel, 'ok', 'msg'); after && after(); } });
  };
  /** Demande d'avis Google pré-rédigée */
  BO.askReview = roId => {
    const r = CX.ro(roId), c = CX.cust(r.customerId), v = CX.veh(r.vehicleId);
    BO.compose({ title: 'Demande d’avis Google', to: c.phone, channel: 'SMS', body: `Bonjour ${c.name.split(' ')[0]}, merci d’avoir confié votre ${CX.vlabel(v)} à la MOTEK. Votre avis compte beaucoup pour nous : ${CX.S.company.review} — 30 secondes suffisent. Belle journée !`, note: 'Envoyé 1 à 3 jours après la restitution, ce message génère en moyenne 1 avis pour 3 demandes.', okLabel: 'Envoyer la demande', onSend: () => { CX.requestReview(roId); UI.toast('Demande envoyée', c.name, 'ok', 'star'); } });
  };
  /** Choisir un technicien */
  BO.pickTech = ({ title = 'Affecter un technicien', roId, onPick }) => {
    const r = roId ? CX.ro(roId) : null;
    const load = id => CX.S.ros.filter(x => x.lead === id && x.stage < CX.ST.pret && x.stage > CX.ST.rdv).length;
    const list = CX.S.staff.filter(e => CX.ROLES[e.role].prod || e.role === 'chef');
    UI.modal({ title: esc(title) + (r ? ` <small class="muted" style="font-weight:600;font-size:13px">· ${esc(r.no)}</small>` : ''),
      body: `<div class="mini-list">${list.map(e => { const abs = e.status !== 'present', n = load(e.id), cur = r && r.lead === e.id; return `<div class="${abs || cur ? '' : 'cl'}" ${abs || cur ? 'style="opacity:.5"' : `data-pick="${e.id}"`}>${UI.av(e, 34)}<div style="flex:1;min-width:0"><b>${esc(e.name)}</b> ${cur ? '<span class="chip">Responsable actuel</span>' : abs ? '<span class="chip">À l’école</span>' : n === 0 ? '<span class="chip green">Disponible</span>' : ''}<div class="xs-t muted">${esc(e.title)} · ${n} OR en cours · ${esc(e.skills.slice(0, 2).join(', '))}</div></div>${abs || cur ? '' : `<span class="btn sm">${BO.icon('plus', 13)}Choisir</span>`}</div>`; }).join('')}</div>`,
      onMount: (el, close) => el.addEventListener('click', e => { const p = e.target.closest('[data-pick]'); if (p) { close(); onPick(p.dataset.pick); } }) });
  };

  /* ==========================================================================
     NOUVEAU DOSSIER (client + véhicule + OR / RDV)
     ========================================================================== */
  BO.newDossier = ({ title = 'Nouveau dossier', withAppt = true, onDone } = {}) => {
    const fields = [
      { type: 'html', full: true, html: `<div class="form-note">${BO.icon('user', 16)}<div>Choisissez un client existant ou laissez vide pour en créer un nouveau.</div></div>` },
      { k: 'customerId', label: 'Client existant', type: 'select', opts: BO.optCustomers(), empty: '— Nouveau client —', full: true },
      { k: 'name', label: 'Nom du nouveau client', ph: 'Prénom Nom ou raison sociale' }, { k: 'phone', label: 'Téléphone', type: 'tel', ph: '+33 6 …' },
      { k: 'email', label: 'E-mail', type: 'email' }, { k: 'city', label: 'Code postal / ville', ph: '69007 Lyon' },
      { k: 'vehicleId', label: 'Véhicule du client', type: 'select', opts: [], empty: '— Nouveau véhicule —', full: true },
      { k: 'plate', label: 'Plaque', ph: 'AB-123-CD', validate: (v, a) => !a.vehicleId && !/^([A-Z]{2}-\d{3}-[A-Z]{2}|\d{1,4} ?[A-Z]{1,3} ?\d{2,3})$/i.test(v.replace(/\s+/g, ' ').trim()) ? 'Format : AB-123-CD' : '' },
      { k: 'make', label: 'Marque', ph: 'VW' }, { k: 'model', label: 'Modèle', ph: 'Golf 1.5 TSI' }, { k: 'year', label: 'Année', type: 'number', min: 1960, max: 2027 },
      { k: 'insurerId', label: 'Assurance', type: 'select', opts: BO.optInsurers(), empty: 'Privé (sans assurance)' },
      { k: 'claimNo', label: 'N° de sinistre', ph: 'facultatif' },
      { k: 'damage', label: 'Dommage déclaré', req: true, full: true, ph: 'ex. Choc arrière gauche — pare-chocs + feu' },
      ...(withAppt ? [{ k: 'date', label: 'Date du rendez-vous', type: 'date', req: true, v: U.wd(1) }, { k: 'time', label: 'Heure', type: 'time', req: true, v: '08:00' }] : []),
    ];
    BO.formModal({ title, fields, wide: true, submit: 'Créer le dossier', cols: 'c3',
      onMount: el => {
        const cs = el.querySelector('[name="customerId"]'), vs = el.querySelector('[name="vehicleId"]');
        const sync = () => { vs.innerHTML = BO.opts(BO.optVehicles(cs.value), '', '— Nouveau véhicule —'); ['name', 'phone', 'email', 'city'].forEach(k => el.querySelector(`[data-f="${k}"]`).style.opacity = cs.value ? .4 : 1); const c = CX.cust(cs.value); if (c && c.insurerId) el.querySelector('[name="insurerId"]').value = c.insurerId; syncV(); };
        const syncV = () => ['plate', 'make', 'model', 'year'].forEach(k => el.querySelector(`[data-f="${k}"]`).style.opacity = vs.value ? .4 : 1);
        cs.addEventListener('change', sync); vs.addEventListener('change', syncV); sync();
      },
      onSubmit: (v, close, el) => {
        if (!v.customerId && !v.name) { const f = el.querySelector('[data-f="name"]'); f.classList.add('err'); f.querySelector('.em').textContent = 'Nom requis pour un nouveau client'; return false; }
        if (!v.vehicleId && (!v.make || !v.model)) { const f = el.querySelector('[data-f="make"]'); f.classList.add('err'); f.querySelector('.em').textContent = 'Marque et modèle requis'; return false; }
        let cid = v.customerId;
        if (!cid) { const c = CX.upsert('customers', { id: U.uid('C'), type: 'prive', name: v.name, ini: v.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), city: v.city || '', addr: '', phone: v.phone || '', email: v.email || '', since: new Date().getFullYear(), insurerId: v.insurerId || null, pref: 'SMS', rating: 0, note: '', hist: [], comms: [], fleet: null, contact: '', legacy: { spent: 0, visits: 0 } }, 'customer'); cid = c.id; }
        let vid = v.vehicleId;
        if (!vid) { const nv = CX.upsert('vehicles', { id: U.uid('V'), customerId: cid, make: v.make, model: v.model, plate: v.plate.toUpperCase().replace(/\s+/g, ' ').trim(), year: v.year || new Date().getFullYear(), km: 0, colorName: 'À relever', colorCode: '—', hex: '#c9cdd3', vin: '', fuel: 'Essence', build: {}, hist: [], nextCT: null }, 'vehicle'); vid = nv.id; }
        let claimId = null;
        if (v.insurerId) { const k = CX.upsert('claims', { id: U.uid('K'), no: v.claimNo || 'À recevoir', insurerId: v.insurerId, vehicleId: vid, customerId: cid, kind: 'Collision', cover: 'Tous risques', franchise: 500, date: today(), declaredAt: today(), expert: null, expertiseAt: null, expertiseMode: 'Sur place', report: null, approval: 'Déclaré', approvedAmount: null, cession: false, cessionAt: null, reminders: [], notes: '', log: [] }, 'claim'); claimId = k.id; }
        const r = CX.createRO({ vehicleId: vid, customerId: cid, claimId, damage: v.damage, apptAt: withAppt ? v.date + ' ' + v.time : null, dueAt: U.addDays(withAppt ? v.date : today(), 4) + ' 17:00' });
        if (claimId) { CX.claim(claimId).roId = r.id; }
        if (withAppt) CX.upsert('appts', { id: U.uid('ap'), date: v.date, time: U.toMin(v.time), dur: 30, kind: 'Réception', roId: r.id, customerId: cid, vehicleId: vid, title: 'Dépôt ' + CX.vlabel(CX.veh(vid)), who: 'E8', status: 'Prévu', notes: '' }, 'appt');
        CX.touch('ro', { roId: r.id });
        UI.toast('Dossier créé', r.no + ' · ' + CX.custName(cid), 'ok', 'check');
        onDone && onDone(r);
      } });
  };

  /* ==========================================================================
     IMPRESSION / FACTURE
     ========================================================================== */
  BO.printHtml = (title, inner) => `<!doctype html><html lang="fr-FR"><head><meta charset="utf-8"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>
    @page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#121418;font-size:10pt;margin:0;padding:24px}
    .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1768ee;padding-bottom:14px;margin-bottom:22px}
    .brand{display:flex;gap:10px;align-items:center}.brand b{font-size:15pt;font-weight:800;letter-spacing:-.01em}.brand small{display:block;font-size:7.5pt;letter-spacing:.14em;font-weight:700;color:#868c96;text-transform:uppercase}
    .co{font-size:8.5pt;text-align:right;color:#454b55;line-height:1.45}.addr{margin:6px 0 22px auto;width:45%;line-height:1.45}
    h1{font-size:16pt;font-weight:800;margin:0 0 4px;letter-spacing:-.01em}.meta{color:#454b55;font-size:9pt;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:9pt}th{background:#f3f4f6;color:#454b55;text-align:left;padding:7px 8px;font-size:7.5pt;text-transform:uppercase;letter-spacing:.06em}
    td{padding:6px 8px;border-bottom:1px solid #eef0f3}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}tr.grp td{background:#fafbfc;font-weight:700;font-size:8.5pt}
    .tot{margin:14px 0 0 auto;width:55%}.tot td{border:0;padding:4px 8px}.tot .big td{font-size:12.5pt;font-weight:800;border-top:2px solid #121418;padding-top:8px}
    .split{margin-top:14px;border:1px solid #e4e7eb;border-radius:8px;padding:10px 12px;font-size:9pt;line-height:1.6}
    .cond{margin-top:22px;font-size:8.5pt;color:#454b55;line-height:1.5;border-top:1px solid #eef0f3;padding-top:12px}.sig{display:flex;gap:40px;margin-top:34px}.sig div{flex:1;border-top:1px solid #868c96;padding-top:6px;font-size:8.5pt;color:#868c96}
    .stamp{display:inline-block;font-size:8pt;font-weight:800;color:#b96400;background:#fff1dc;padding:3px 8px;border-radius:6px;letter-spacing:.06em;text-transform:uppercase}
    .qrbill{display:grid;grid-template-columns:62mm 1fr;border-top:1.5px dashed #555;font-family:Helvetica,Arial,sans-serif;font-size:9pt}.qrbill .rcpt{border-right:1.5px dashed #555;padding:5mm}.qrbill .pay{display:grid;grid-template-columns:51mm 1fr;padding:5mm;gap:5mm}.qrbill h5{font-size:11pt;margin:0 0 4mm}.qrbill .l{font-size:6pt;font-weight:700;margin-top:3mm}.qrbill .pay .l{font-size:8pt}.qrbill .v{font-size:8pt;line-height:1.25}.qrbill .pay .v{font-size:10pt}.qrbill .amt{display:flex;gap:6mm;margin-top:4mm}.qrbill .qr{width:46mm;height:46mm;margin:2mm 0 4mm}.qrbill .acc{font-size:6pt;font-weight:700;text-align:right;margin-top:8mm}
    @media print{body{padding:0}}</style></head><body>${inner}</body></html>`;
  BO.printHeader = () => { const co = CX.S.company; return `<div class="hd"><div class="brand">${UI.logo(42)}<div><b>MOTEK Garage</b><small>Carrosserie · Mécanique · Peinture</small></div></div><div class="co">${esc(co.address)}<br>${esc(co.phone)} · ${esc(co.email)}<br>SIRET ${esc(co.siret)} · TVA ${esc(co.tvaIntra)}</div></div>`; };
  BO.preview = (title, html, file) => UI.modal({
    title: esc(title), wide: true, body: `<iframe class="print-frame" data-pf title="Aperçu"></iframe>`,
    foot: `<span class="muted sm-t" style="margin-right:auto">Aperçu A4 — « Imprimer » puis « Enregistrer en PDF ».</span><button class="btn" data-dl>${BO.icon('download', 15)}Télécharger (.html)</button><button class="btn pri" data-pr>${BO.icon('print', 15)}Imprimer / PDF</button>`,
    onMount: el => { const f = el.querySelector('[data-pf]'); f.srcdoc = html; el.querySelector('[data-pr]').addEventListener('click', () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { UI.toast('Impression', 'Impossible d’ouvrir la boîte d’impression.', 'warn'); } }); el.querySelector('[data-dl]').addEventListener('click', () => BO.download(file || 'document.html', html, 'text/html;charset=utf-8')); },
  });
  const mod10 = s => { const t = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5]; let c = 0; for (const ch of s) c = t[(c + +ch) % 10]; return (10 - c) % 10; };
  BO.qrRef = i => { const base = ('80412' + (i.no || '').replace(/\D/g, '')).padStart(26, '0').slice(-26); const r = base + mod10(base); return r.replace(/^(\d{2})(\d{5})(\d{5})(\d{5})(\d{5})(\d{5})$/, '$1 $2 $3 $4 $5 $6'); };
  const qrSvg = seed => {
    const n = 33, r = U.rng(U.hash(seed)); let m = '';
    const finder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (finder(x, y)) continue; if (Math.abs(x - 16) < 4 && Math.abs(y - 16) < 4) continue; if (r() < .48) m += `M${x} ${y}h1v1h-1z`; }
    const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#000"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#000"/>`;
    return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" class="qr" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${m}" fill="#000"/>${f(0, 0)}${f(n - 7, 0)}${f(0, n - 7)}<rect x="13.2" y="13.2" width="6.6" height="6.6" fill="#fff"/><rect x="13.7" y="13.7" width="5.6" height="5.6" fill="#000"/><path d="M15.9 14.6h1.2v1.8h1.8v1.2h-1.8v1.8h-1.2v-1.8h-1.8v-1.2h1.8z" fill="#fff"/></svg>`;
  };
  BO.payer = i => { if (i.payerType === 'insurer') { const k = CX.ins(i.payerId) || {}; return { name: k.name || '—', l2: 'Service sinistres automobile', l3: k.email || '' }; } const c = CX.cust(i.payerId) || {}; return { name: c.name || '—', l2: c.addr || c.contact || '', l3: c.city || '' }; };
  /** Bloc de règlement français (remplace la QR-facture suisse) : IBAN/BIC, référence et mentions légales. */
  BO.qrBill = i => {
    const co = CX.S.company, p = BO.payer(i), ref = BO.qrRef(i), amt = chf2(i.amount - (i.paid || 0));
    return `<div class="paybox" style="margin-top:14px;border:1px solid #e4e7eb;border-radius:8px;padding:10px 12px;font-size:9pt;line-height:1.6">
      <b>Règlement</b> — virement sur IBAN <b>${esc(co.iban)}</b> · BIC ${esc(co.bic || '')} (${esc(co.bank)}) · référence à indiquer : <b>${esc(ref)}</b> · montant : <b>${amt}</b><br>
      Payable par : ${esc(p.name)}${p.l2 ? ' · ' + esc(p.l2) : ''}${p.l3 ? ' · ' + esc(p.l3) : ''}<br>
      <span style="color:#454b55">Carte bancaire et espèces acceptées à l’accueil. En cas de retard de paiement : pénalités au taux légal en vigueur et indemnité forfaitaire de recouvrement de 40 € (art. L441-10 du Code de commerce). Pas d’escompte pour paiement anticipé. TVA intracommunautaire ${esc(co.tvaIntra || '')}.</span></div>`;
  };

  /** Petits graphiques SVG */
  BO.bars = (data, { h = 150, color = '#1768ee', last = '#16181c', fmt = v => v } = {}) => {
    const max = Math.max(1, ...data.map(d => d[1])), w = 560, bw = w / data.length;
    return `<svg viewBox="0 0 ${w} ${h + 34}">${data.map(([l, v], i) => { const bh = v / max * h; return `<rect x="${i * bw + bw * .2}" y="${h - bh + 10}" width="${bw * .6}" height="${bh}" rx="6" fill="${i === data.length - 1 ? last : color}" opacity="${i === data.length - 1 ? 1 : .82}"/><text x="${i * bw + bw / 2}" y="${h - bh + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#454b55">${esc(fmt(v))}</text><text x="${i * bw + bw / 2}" y="${h + 28}" text-anchor="middle" font-size="11" font-weight="600" fill="#868c96">${esc(l)}</text>`; }).join('')}</svg>`;
  };
  BO.donut = (parts, size = 120, th = 18) => {
    const tot = parts.reduce((a, p) => a + p[1], 0) || 1, r = (size - th) / 2, C2 = 2 * Math.PI * r; let off = 0;
    return `<svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;flex:none"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eef0f3" stroke-width="${th}"/>${parts.map(([, v, c]) => { const l = v / tot * C2; const s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${c}" stroke-width="${th}" stroke-dasharray="${l} ${C2 - l}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; off += l; return s; }).join('')}</svg>`;
  };
  BO.gauge = (p, color = '#1768ee') => { const a = Math.PI * Math.min(1, Math.max(0, p)), r = 50, x = 60 - r * Math.cos(a), y = 60 - r * Math.sin(a); return `<svg viewBox="0 0 120 70" style="width:130px;height:76px"><path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke="#eef0f3" stroke-width="12" stroke-linecap="round"/><path d="M10 60A50 50 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"/></svg>`; };
})();
