/* ==========================================================================
   BO · Poste technicien : écran tablette pour l'atelier. Un technicien choisit
   son nom, voit ses dossiers, coche les travaux, demande une pièce au magasin,
   prend une photo, dicte une note, termine vers le contrôle qualité.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const KEY = "motek-tech";
  const st = { tech: null };
  try { st.tech = localStorage.getItem(KEY) || null; } catch (e) {}
  const techs = () => CX.S.staff.filter(e => (CX.ROLES[e.role] || {}).prod);
  const mine = t => CX.S.ros.filter(r => r.stage > CX.ST.accord && r.stage < CX.ST.pret && (r.lead === t || (r.team || []).includes(t))).sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)));
  const unassigned = () => CX.S.ros.filter(r => r.stage >= CX.ST.pieces && r.stage < CX.ST.pret && !r.lead && CX.ONSITE(r.slot));

  function partForm(r) {
    UI.modal({ title: 'Pièce manquante — ' + esc(r.no), body: `<div class="form-note mb">${BO.icon('box', 16)}<div>La demande part au <b>comptoir magasin</b> : le magasinier la sert ou la commande, et ce dossier se met à jour.</div></div>
      <div class="fgrid"><div class="field full"><label>Pièce (dictée ou saisie)</label><div class="row" style="gap:8px;align-items:stretch"><input class="inp" data-pl placeholder="ex. disques et plaquettes AV, filtre à huile">${BO.micBtn('data-pmic', 'Dicter')}</div></div><div class="field"><label>Quantité</label><input class="inp" type="number" data-pq min="1" step="1" value="1"></div><div class="field"><label>Précision</label><input class="inp" data-pn placeholder="côté, référence, urgence…"></div></div>`,
      foot: `<button class="btn" data-close>Annuler</button><button class="btn pri" data-ok>${BO.icon('send', 15)}Envoyer au magasin</button>`,
      onMount: (el, close) => {
        el.querySelector('[data-pmic]').addEventListener('click', () => BO.dictate(el.querySelector('[data-pl]'), el.querySelector('[data-pmic]')));
        el.querySelector('[data-ok]').addEventListener('click', () => { const l = el.querySelector('[data-pl]').value.trim(); if (!l) { UI.toast('Pièce manquante', 'Indiquez la pièce.', 'warn'); return; } CX.requestPart(r.id, l, +el.querySelector('[data-pq]').value || 1, el.querySelector('[data-pn]').value.trim(), st.tech); close(); UI.toast('Demande envoyée au magasin', l, 'ok', 'box'); BO.now(); });
      } });
  }
  function noteForm(r) {
    UI.modal({ title: 'Note sur ' + esc(r.no), body: `<div class="row" style="gap:8px;align-items:stretch"><textarea class="inp" data-nt rows="4" placeholder="ex. bruit de roulement AV G constaté à l’essai"></textarea>${BO.micBtn('data-nmic', 'Dicter la note')}</div>`,
      foot: `<button class="btn" data-close>Annuler</button><button class="btn pri" data-ok>${BO.icon('check', 15)}Enregistrer</button>`,
      onMount: (el, close) => { el.querySelector('[data-nmic]').addEventListener('click', () => BO.dictate(el.querySelector('[data-nt]'), el.querySelector('[data-nmic]'))); el.querySelector('[data-ok]').addEventListener('click', () => { const t = el.querySelector('[data-nt]').value.trim(); if (!t) return; CX.log(r, 'Note atelier : ' + t, st.tech); CX.touch('ro', { roId: r.id }); close(); UI.toast('Note enregistrée', r.no, 'ok'); BO.now(); }); } });
  }

  function render(el) {
    const S = CX.S, list = techs(), me = list.find(e => e.id === st.tech) || null;
    const reqs = (S.partRequests || []).filter(q => q.status !== 'Servi');
    el.innerHTML = `<div class="bo-page tech">${BO.head('Poste technicien', me ? `${esc(me.name)} · ${mine(me.id).length} dossier${mine(me.id).length > 1 ? 's' : ''} en cours · ${U.hm(U.nowMin())}` : 'Choisissez votre nom pour voir vos dossiers', `<button class="btn dark" data-map>${BO.icon('cube', 15)}Atelier live</button>`)}
      <div class="techs">${list.map(e => `<button class="techbtn ${me && me.id === e.id ? 'on' : ''}" data-tech="${e.id}">${UI.av(e, 40)}<span><b>${esc(e.first)}</b><small>${esc(e.title || '')}</small></span><em>${mine(e.id).length}</em></button>`).join('')}</div>
      ${me ? `<div class="g g2 mt">${mine(me.id).map(r => { const v = CX.veh(r.vehicleId), done = r.tasks.filter(t => t.p >= 1).length, late = CX.isLate(r), waiting = reqs.filter(q => q.roId === r.id); return `<div class="card rocard ${late ? 'late' : ''}"><div class="card-b">
          <div class="row" style="gap:12px;align-items:center">${UI.carPic(v.hex, 70, 52)}<div style="flex:1;min-width:0"><div class="row" style="gap:8px">${BO.plate(v.plate, true)}${BO.status(r)}</div><b style="display:block;margin-top:4px;font-size:16px">${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(r.no)} · ${esc(CX.slotLabel(r.slot))} · restitution ${esc(BO.dt(r.dueAt))}${late ? ' <span class="chip red">retard</span>' : ''}</div></div></div>
          <div class="xs-t muted mt" style="font-weight:800;letter-spacing:.08em;text-transform:uppercase">Travaux · ${done}/${r.tasks.length}</div>
          <div class="tasks">${r.tasks.map((t, i) => `<label class="task ${t.p >= 1 ? 'done' : ''}"><input type="checkbox" data-task="${r.id}:${i}" ${t.p >= 1 ? 'checked' : ''}><span>${esc(t.l)}</span></label>`).join('') || '<div class="muted sm-t">Aucune tâche : ajoutez-les par dictée.</div>'}</div>
          ${waiting.length ? `<div class="form-note warn mt1">${BO.icon('box', 15)}<div>${waiting.map(q => `${q.qty} × ${esc(q.label)} · <b>${esc(q.status)}</b>`).join('<br>')}</div></div>` : ''}
          <div class="row mt" style="gap:8px;flex-wrap:wrap"><button class="btn" data-addt="${r.id}">${BO.icon('phone', 15)}Dicter des travaux</button><button class="btn" data-part="${r.id}">${BO.icon('box', 15)}Pièce manquante</button><button class="btn" data-photo="${r.id}">${BO.icon('camera', 15)}Photo</button><button class="btn" data-note="${r.id}">${BO.icon('edit', 15)}Note</button><span class="sp"></span>${r.stage < CX.ST.cq ? `<button class="btn pri" data-finish="${r.id}" ${done < r.tasks.length ? 'title="Des tâches ne sont pas cochées"' : ''}>${BO.icon('check', 15)}Travaux terminés</button>` : `<span class="chip green">Au contrôle qualité</span>`}</div>
        </div></div>`; }).join('') || `<div class="card"><div class="card-b">${BO.empty('check', 'Aucun dossier en cours', 'Prenez un dossier ci-dessous ou demandez au chef d’atelier.', '', true)}</div></div>`}</div>
        ${unassigned().length ? `<div class="card mt"><div class="card-h"><h3>${BO.icon('lift', 16)}Dossiers sans technicien</h3></div><div class="card-b"><div class="mini-list">${unassigned().map(r => { const v = CX.veh(r.vehicleId); return `<div class="cl"><span class="tag">${esc(r.no)}</span><div style="flex:1"><b class="sm-t">${esc(CX.vlabel(v))}</b><div class="xs-t muted">${esc(r.damage)} · ${esc(CX.slotLabel(r.slot))}</div></div><button class="btn sm pri" data-take="${r.id}">Je le prends</button></div>`; }).join('')}</div></div></div>` : ''}` : ''}
    </div>`;
    el.querySelector('[data-map]').addEventListener('click', () => APP.setMode('map'));
    el.querySelectorAll('[data-tech]').forEach(b => b.addEventListener('click', () => { st.tech = b.dataset.tech; try { localStorage.setItem(KEY, st.tech); } catch (e) {} APP.refresh(); }));
    el.querySelectorAll('[data-task]').forEach(c => c.addEventListener('change', () => { const [id, i] = c.dataset.task.split(':'); CX.setTask(id, +i, c.checked ? 1 : 0); BO.now(); }));
    el.querySelectorAll('[data-addt]').forEach(b => b.addEventListener('click', () => BO.taskDictation(CX.ro(b.dataset.addt))));
    el.querySelectorAll('[data-part]').forEach(b => b.addEventListener('click', () => partForm(CX.ro(b.dataset.part))));
    el.querySelectorAll('[data-note]').forEach(b => b.addEventListener('click', () => noteForm(CX.ro(b.dataset.note))));
    el.querySelectorAll('[data-photo]').forEach(b => b.addEventListener('click', () => APP.open('ros', { id: b.dataset.photo, tab: 'photos' })));
    el.querySelectorAll('[data-take]').forEach(b => b.addEventListener('click', () => { CX.assignTech(b.dataset.take, st.tech); UI.toast('Dossier pris', CX.ro(b.dataset.take).no, 'ok', 'wrench'); BO.now(); }));
    el.querySelectorAll('[data-finish]').forEach(b => b.addEventListener('click', () => { const r = CX.ro(b.dataset.finish), open = r.tasks.filter(t => t.p < 1).length; const go = () => { CX.setStage(r.id, CX.ST.cq, { by: st.tech }); UI.toast('Envoyé au contrôle qualité', r.no, 'ok', 'check'); BO.now(); }; if (open) BO.confirm('Des tâches ne sont pas cochées', open + ' tâche' + (open > 1 ? 's restent ouvertes' : ' reste ouverte') + '. Envoyer quand même au contrôle qualité ?', 'Envoyer quand même', go); else go(); }));
  }
  APP.register({ id: 'tech', label: 'Poste technicien', icon: 'wrench', group: 'Atelier', order: 0, activity: 'atelier', render, badge: () => (CX.S.partRequests || []).filter(q => q.status === 'À servir').length });
})();
