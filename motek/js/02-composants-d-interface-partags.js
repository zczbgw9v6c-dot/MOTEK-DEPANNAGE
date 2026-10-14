/* ==========================================================================
   MOTEK — composants d'interface partagés (window.UI)
   icônes, toasts, modale, avatars, plaque française, pastille assureur, voiture.
   ========================================================================== */
(function () {
  const { esc } = CX.util;
  const P = {
    car: '<path d="M19 17h2v-4l-2.5-5.5A2 2 0 0 0 16.7 6H7.3a2 2 0 0 0-1.8 1.5L3 13v4h2"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5M3 13h18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    hammer: '<path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9"/><path d="M17.64 15 22 10.64M20.91 11.7l-1.25-1.25a2 2 0 0 1-.59-1.41V7.86a1 1 0 0 0-.29-.7L15.7 4.07a4 4 0 0 0-2.84-1.17H9.5l1.83 1.83a3 3 0 0 1 .88 2.12v1.2l2 2h1.17a2 2 0 0 1 1.42.59L18 11.88"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldok: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    lift: '<path d="M5 21V4M19 21V4M5 9h14M8 14h8"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    flame: '<path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 3 2-1-2-1-5 0-7z"/>',
    clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    coffee: '<path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
    store: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    target: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
    spray: '<path d="M3 3h.01M7 5h.01M11 7h.01M3 7h.01M7 9h.01M3 11h.01"/><rect x="15" y="5" width="4" height="4" rx="1"/><path d="M19 9h-4l-2 3v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-9z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    dashboard: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    kanban: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
    gantt: '<path d="M4 5h9M7 10h11M5 15h7M10 20h10"/>',
    invoice: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
    gauge: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
    send: '<path d="m4 12 16-8-6 16-3-7z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>', arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>',
    cube: '<path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M4 10h11M15 8l3 2v8a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    hail: '<path d="M7 16a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 9 4 4 0 0 1 18 16"/><path d="M8 19v.01M12 21v.01M16 19v.01M10 17v.01M14 17v.01"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
    google: '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.7-1.6 2.7-4 2.7-7z"/><path d="M12 21c2.5 0 4.7-.8 6.2-2.3l-3.1-2.4c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8H3.7v2.4A9 9 0 0 0 12 21z"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  };
  const icon = (n, s = 16, st = '') => `<svg class="i" viewBox="0 0 24 24" style="width:${s}px;height:${s}px;${st}" aria-hidden="true">${P[n] || P.layers}</svg>`;
  const logo = (s = 34) => `<svg viewBox="0 0 40 40" style="width:${s}px;height:${s}px"><rect width="40" height="40" rx="11" fill="#1768ee"/><path d="M11 29V11l9 10 9-10v18" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  /** silhouette de voiture (profil) — couleur de carrosserie */
  const carPic = (col = '#f4f5f6', w = 66, h = 52) => `<svg class="car" viewBox="0 0 66 52" style="width:${w}px;height:${h}px"><ellipse cx="33" cy="44" rx="29" ry="4" fill="#000" opacity=".08"/><path d="M8 34c0-4 2-6 6-7l7-8c1.5-1.6 3-2 5-2h14c2 0 3.6.6 5 2l6 8c5 1 7 3 7 7v4c0 1.2-.8 2-2 2H10c-1.2 0-2-.8-2-2z" fill="${esc(col)}" stroke="#c9cdd3" stroke-width="1.2"/><path d="M23 20.5c1-1.2 2-1.6 3.5-1.6H33V27H17z M35 18.9h5.5c1.5 0 2.5.4 3.5 1.6l5 6.5H35z" fill="#2f3640"/><rect x="52" y="30" width="5" height="3" rx="1" fill="#fff" stroke="#d0d3d8" stroke-width=".8"/><rect x="8.5" y="30" width="4" height="3" rx="1" fill="#1768ee"/><circle cx="19" cy="40" r="5.5" fill="#2b2e33"/><circle cx="19" cy="40" r="2.2" fill="#c9cdd3"/><circle cx="47" cy="40" r="5.5" fill="#2b2e33"/><circle cx="47" cy="40" r="2.2" fill="#c9cdd3"/></svg>`;
  const plate = (p, lg = false) => p ? `<span class="plate ${lg ? 'lg' : ''}">${esc(p)}</span>` : '<span class="muted">—</span>';
  const insChip = (id, pill = true) => { const i = CX.ins(id); return i ? `<span class="ins ${pill ? 'pill' : ''}"><i style="background:${i.color}"></i>${esc(i.short)}</span>` : `<span class="ins ${pill ? 'pill' : ''}"><i style="background:#c9cdd3"></i>Privé</span>`; };
  const av = (e, s = 28) => e ? `<span class="bav" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .38)}px;background:${e.color || '#59606b'}" title="${esc(e.name)}">${esc(e.ini)}</span>` : '';
  const cav = (c, s = 28) => c ? `<span class="bav" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .38)}px;background:${c.type === 'entreprise' ? '#16181c' : 'linear-gradient(135deg,#59606b,#2d3138)'};${c.type === 'entreprise' ? 'border-radius:8px' : ''}" title="${esc(c.name)}">${esc(c.ini || '?')}</span>` : '';

  /* ---------- toasts (bas droite, sombres) ---------- */
  let box;
  function toast(title, text = '', kind = 'info', ic) {
    if (!box) { box = document.createElement('div'); box.className = 'utoasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'utoast ' + kind;
    el.innerHTML = `<div class="ic">${icon(ic || ({ ok: 'check', warn: 'alert', err: 'alert' }[kind] || 'bell'), 16)}</div><div><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 4200);
    while (box.children.length > 4) box.firstChild.remove();
  }

  /* ---------- modale ---------- */
  function modal({ title, body = '', foot = '', wide = false, onMount, onClose }) {
    const bg = document.createElement('div'); bg.className = 'mdl-bg bo';
    bg.innerHTML = `<div class="mdl ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="mdl-h"><h3>${title}</h3><button class="btn ghost sm" data-close aria-label="Fermer">${icon('x', 17)}</button></div><div class="mdl-b">${body}</div>${foot ? `<div class="mdl-f">${foot}</div>` : ''}</div>`;
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey, true); onClose && onClose(); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    bg.addEventListener('mousedown', e => { if (e.target === bg) bg._down = true; });
    bg.addEventListener('click', e => { if ((e.target === bg && bg._down) || e.target.closest('[data-close]')) close(); bg._down = false; });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(bg);
    if (onMount) onMount(bg.querySelector('.mdl'), close);
    return { el: bg.querySelector('.mdl'), close };
  }

  window.UI = { icon, logo, carPic, plate, insChip, av, cav, toast, modal, P };
})();
