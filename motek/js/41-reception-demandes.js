/* ==========================================================================
   BO · Demandes entrantes : la boîte d'arrivée du bureau. Les canaux
   (téléphone, formulaire, WhatsApp, plateformes de mission) restent à raccorder.
   Le courriel IMAP se relève sur clic si le serveur est configuré. Le bureau peut aussi coller un message reçu
   pour que MOTEK en extraie les informations utiles, localement et sans rien
   inventer. Champs manquants signalés, doublons détectés, puis création d'une
   mission à confirmer par le bureau — jamais automatique.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const st = { seg: 'todo' };
  const S = () => CX.S;
  const reqs = () => S().intake.requests;
  const displayDate = value => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {const date=new Date(value);if(Number.isFinite(date.getTime()))return date.toLocaleString('fr-FR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}
    return BO.dt(value);
  };
  const req = (id) => reqs().find((r) => r.id === id);
  const plateNorm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const phoneNorm = (s) => String(s || '').replace(/\D/g, '').replace(/^33/, '0');
  const CHANNELS = { phone: 'Téléphone', email: 'Courriel', form: 'Formulaire du site', whatsapp: 'WhatsApp', platform: 'Plateforme de mission' };
  const CH_IC = { phone: 'phone', email: 'mail', form: 'file', whatsapp: 'msg', platform: 'cube' };
  const nextNo = () => 'DE-' + (reqs().reduce((a, r) => Math.max(a, +String(r.no).replace(/\D/g, '') || 0), 800) + 1);
  const log = (r, text) => { r.history = r.history || []; r.history.unshift({ at: CX.now(), text, by: S().meId }); };

  /* ---------- extraction locale et déterministe : un champ non trouvé reste vide ---------- */
  function extract(raw) {
    const text = String(raw || '');
    const f = {};
    const plate = text.match(/\b([A-Z]{2})[\s-]?(\d{3})[\s-]?([A-Z]{2})\b/i);
    if (plate) f.plate = (plate[1] + '-' + plate[2] + '-' + plate[3]).toUpperCase();
    const phone = text.match(/(?:\+33\s?|0)[1-9](?:[\s.\-]?\d{2}){4}|(?:\+33\s?|0)[1-9][\s.\-]?\d{3}[\s.\-]?\d{3}[\s.\-]?\d{2}/);
    if (phone) f.phone = phone[0].trim();
    const ref = text.match(/\bSIN[\s-]?\d{4,6}\b/i);
    if (ref) f.ref = ref[0].toUpperCase().replace(/\s/, '-');
    const cp = text.match(/\b(75|77|78|91|92|93|94|95|60)\d{3}\b/);
    if (cp) f.department = cp[0].slice(0, 2);
    const addr = text.split(/\n/).map((l) => l.trim()).find((l) => /\d{1,4}\s?(bis|ter)?[,\s]+(rue|avenue|av\.|boulevard|bd|quai|place|all[ée]e|chemin|route|impasse)\b/i.test(l) || (cp && l.includes(cp[0])));
    if (addr) f.address = addr.replace(/^(lieu|adresse|ville)\s*:\s*/i, '');
    const nm = text.match(/(?:nom|assur[ée]e?|client|conducteur)\s*:\s*([^\n,—–]{2,60})/i) || text.match(/\b(?:M\.|Mme|Mlle)\s+([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]+)?)/);
    if (nm) f.name = nm[1].trim().replace(/\s*[-—–]\s*$/, '');
    // Marque et modèle : uniquement si une marque connue est écrite dans le message.
    const MAKES = ['Peugeot', 'Renault', 'Citroën', 'Citroen', 'Volkswagen', 'Toyota', 'Dacia', 'BMW', 'Tesla', 'Fiat', 'Audi', 'Mercedes', 'Kia', 'Opel', 'Ford', 'Nissan', 'Hyundai', 'Seat', 'Skoda', 'Mini'];
    for (const mk of MAKES) {
      const mm = text.match(new RegExp('\\b' + mk + '\\b(?:\\s+([A-Za-z0-9À-ÿ-]{1,12}))?', 'i'));
      if (mm) { f.make = mk === 'Citroen' ? 'Citroën' : mk; if (mm[1] && !/^(immatricul|grise?|noire?|blanche?|bleue?|rouge|est|ne|en)$/i.test(mm[1])) f.model = mm[1]; break; }
    }
    const t = text.toLowerCase();
    const KW = [[/batterie|d[ée]marre plus|demarre plus/, 'depannage-batterie'], [/d[ée]marrage/, 'demarrage-voiture'], [/crevaison|pneu/, 'depannage-crevaison'], [/carburant|essence|gazole|gasoil/, 'depannage-panne-dessence'], [/ouverture|cl[ée]s? (à|a) l'int|porti[èe]re claqu|serrure/, 'ouverture-de-porte-voiture'], [/\bmoto\b|scooter/, 'depannage-moto'], [/autoroute|p[ée]riph[ée]rique/, 'depannage-autoroute'], [/remorqu/, 'remorquage-voiture'], [/panne|d[ée]pann/, 'depannage-auto']];
    for (const [re, id] of KW) if (re.test(t)) { if (S().serviceCatalog.some((x) => x.id === id)) { f.serviceId = id; break; } }
    const ins = (S().insurers || []).find((i) => new RegExp('\\b' + i.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text));
    if (ins) f.mandant = ins.short;
    return f;
  }
  const MISSING = [['name', 'nom du client'], ['phone', 'téléphone'], ['address', 'adresse'], ['plate', 'immatriculation'], ['make', 'marque du véhicule'], ['serviceId', 'prestation'], ['mandant', 'mandant']];
  const missing = (f) => MISSING.filter(([k]) => !f[k]).map(([, l]) => l);
  const fieldsOf = (r) => { if (!r.fields) { r.fields = extract(r.raw); } return r.fields; };

  /* ---------- doublons : plaque ou téléphone déjà connus sur un dossier ouvert ---------- */
  function duplicates(r) {
    const f = fieldsOf(r), out = [];
    const p = plateNorm(f.plate), tel = phoneNorm(f.phone);
    if (p) {
      S().missions.filter((m) => DEP.activeMission(m) && plateNorm(m.vehicle.plate) === p).forEach((m) => out.push({ kind: 'mission', id: m.id, label: 'Mission ' + m.no + ' en cours · ' + m.vehicle.plate }));
      S().gardes.filter((g) => !g.outAt && plateNorm(g.vehicle.plate) === p).forEach((g) => out.push({ kind: 'garde', id: g.id, label: 'Véhicule au parc · ' + g.no + ' · ' + g.vehicle.plate }));
    }
    reqs().filter((x) => x.id !== r.id && x.status === 'À traiter').forEach((x) => {
      const g = fieldsOf(x);
      if ((p && plateNorm(g.plate) === p) || (tel && phoneNorm(g.phone) === tel)) out.push({ kind: 'request', id: x.id, label: 'Demande ' + x.no + ' (' + (CHANNELS[x.channel] || x.channel) + ') à traiter' });
    });
    return out;
  }

  /* ---------- règles exposées ---------- */
  window.DEP = window.DEP || {};
  DEP.intakeExtract = extract;
  DEP.intakeMissing = missing;
  DEP.intakeDuplicates = duplicates;
  DEP.intakeAdd = (input) => {
    const raw = String(input.raw || '').trim();
    if (raw.length < 10) { UI.toast('Message trop court', 'Collez le message reçu tel quel.', 'warn'); return null; }
    if (!CHANNELS[input.channel]) { UI.toast('Canal invalide', '', 'warn'); return null; }
    const r = { id: U.uid('RQ'), no: nextNo(), at: CX.now(), channel: input.channel, from: String(input.from || '').trim(), raw, demo: false, status: 'À traiter', missionId: null, fields: null, history: [{ at: CX.now(), text: 'Collée par le bureau (canal non raccordé)', by: S().meId }] };
    reqs().unshift(r); fieldsOf(r); CX.touch('intake');
    return r;
  };
  DEP.intakeDismiss = (id, why) => { const r = req(id); if (!r || r.status !== 'À traiter') return null; r.status = why === 'doublon' ? 'Écartée (doublon)' : 'Écartée'; log(r, 'Écartée par le bureau' + (why ? ' : ' + why : '')); CX.touch('intake'); return r; };
  DEP.intakeLink = (id, mission) => { const r = req(id); if (!r) return null; r.status = 'Mission créée'; r.missionId = mission.id; log(r, 'Mission ' + mission.no + ' créée depuis cette demande'); CX.touch('intake'); return r; };

  /* ---------- écran ---------- */
  function confirmMission(r) {
    const f = fieldsOf(r), miss = missing(f), dups = duplicates(r);
    const preset = { origin: { channel: r.channel, label: CHANNELS[r.channel] || r.channel, no: r.no }, onCreated: (n) => DEP.intakeLink(r.id, n) };
    if (f.address) preset.address = f.address;
    if (f.plate) preset.plate = f.plate;
    if (f.name) preset.cname = f.name;
    if (f.phone) preset.cphone = f.phone;
    if (f.make) preset.make = f.make;
    if (f.model) preset.model = f.model;
    if (f.serviceId) preset.serviceId = f.serviceId;
    if (f.department) preset.department = f.department;
    if (f.mandant) preset.mandant = f.mandant;
    if (f.ref) preset.ref = f.ref;
    const go = () => DEP.missionForm(null, preset);
    if (dups.length) { BO.confirm('Doublon possible — ' + esc(r.no), 'Cette demande ressemble à :<br>' + dups.map((d) => '• ' + esc(d.label)).join('<br>') + '<br><br>Créer quand même une mission ?', 'Créer quand même', go); return; }
    if (miss.length) { BO.confirm('Informations manquantes — ' + esc(r.no), 'À compléter dans le formulaire (rien n’est inventé) : <b>' + esc(miss.join(', ')) + '</b>.', 'Ouvrir le formulaire', go); return; }
    go();
  }
  function detail(r) {
    const f = fieldsOf(r), miss = missing(f), dups = duplicates(r);
    const m = r.missionId ? DEP.mission(r.missionId) : null;
    UI.modal({ title: esc(r.no) + ' · ' + esc(CHANNELS[r.channel] || r.channel), wide: true,
      body: `<div class="row wrap" style="gap:8px">${BO.chip(r.status, r.status === 'À traiter' ? 'amber' : r.status === 'Mission créée' ? 'green' : '', true)}${r.demo ? BO.chip('Exemple fictif', 'line') : ''}<span class="xs-t muted">${esc(displayDate(r.at))}${r.from ? ' · ' + esc(r.from) : ''}</span></div>
        <div class="g g2 mt"><div><h4 class="sm-t" style="margin-bottom:6px">Message reçu (texte brut)</h4><div class="intake-raw">${esc(r.raw)}</div></div>
        <div><h4 class="sm-t" style="margin-bottom:6px">Lecture de MOTEK <span class="muted xs-t">· extraction locale, rien n’est inventé</span></h4><dl class="kv">${MISSING.map(([k, l]) => `<dt>${esc(l[0].toUpperCase() + l.slice(1))}</dt><dd>${f[k] ? (k === 'serviceId' ? esc((S().serviceCatalog.find((x) => x.id === f[k]) || {}).label || f[k]) : esc(f[k])) : '<span class="chip amber">à compléter</span>'}</dd>`).join('')}${f.ref ? `<dt>Référence</dt><dd>${esc(f.ref)}</dd>` : ''}${f.department ? `<dt>Département</dt><dd>${esc(f.department)}</dd>` : ''}</dl>
        ${dups.length ? `<div class="form-note warn mt">${BO.icon('alert', 15)}<div><b>Doublon possible :</b><br>${dups.map((d) => esc(d.label)).join('<br>')}</div></div>` : ''}
        ${r.transport?.provider==='imap' ? '<div class="form-note mt">Reçu par IMAP en lecture seule · '+esc(r.transport.attachmentsIgnored || 0)+' pièce(s) jointe(s) ignorée(s), à consulter dans la boîte originale.</div>' : ''}
        ${m ? `<div class="form-note ok mt">${BO.icon('check', 15)}<div>Mission <a class="lnk" data-open="missions:${m.id}">${esc(m.no)}</a> créée depuis cette demande · ${esc(m.status)}</div></div>` : ''}</div></div>
        ${(r.history || []).length ? `<ul class="hist mt">${r.history.slice(0, 5).map((h) => `<li><b>${esc(h.text)}</b><small>${esc(displayDate(h.at))}</small></li>`).join('')}</ul>` : ''}`,
      foot: `<button class="btn" data-close>Fermer</button><span class="sp"></span>${r.status === 'À traiter' ? `<button class="btn" data-dismiss>Écarter</button><button class="btn pri" data-mission>${BO.icon('truck', 14)}Créer la mission (à confirmer)</button>` : ''}`,
      onMount: (el, close) => {
        const d = el.querySelector('[data-dismiss]'); if (d) d.addEventListener('click', () => { DEP.intakeDismiss(r.id, dups.length ? 'doublon' : ''); close(); BO.now(); });
        const c = el.querySelector('[data-mission]'); if (c) c.addEventListener('click', () => { close(); confirmMission(r); });
      } });
  }
  function receiveEmail() {
    if (CX.sync.dirty || CX.sync.pushing || CX.sync.conflict) {
      UI.toast(
        "Enregistrement en cours",
        "Attendez la synchronisation des modifications avant de relever les courriels.",
        "warn",
      );
      return;
    }
    BO.formModal({
      title: "Relever les courriels entrants",
      intro:
        "Lecture seule de la boîte configurée sur le serveur. Aucun message marqué comme lu, déplacé ou supprimé. Les pièces jointes restent dans la boîte. Les demandes devront être confirmées par le bureau.",
      fields: [
        {
          k: "token",
          label: "Code opérateur de réception",
          type: "password",
          req: true,
        },
      ],
      submit: "Relever les nouveaux courriels",
      onSubmit: (x, close, el) => {
        const token = x.token;
        el.querySelector("[name=token]").value = "";
        close();
        const button = document.querySelector("[data-imap]");
        if (button) button.disabled = true;
        fetch("/api/v3/intake/imap/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: "{}",
        })
          .then(async (response) => {
            const result = await response.json();
            if (!response.ok)
              throw Error(result.error || "Réception indisponible.");
            await CX.pull();
            BO.now();
            UI.toast(
              "Courriels relevés",
              result.imported +
                " demande(s) reçue(s) · " +
                result.duplicates +
                " déjà importée(s) · " +
                result.skipped.length +
                " non importée(s)" +
                (result.more ? " · autre lot disponible" : ""),
              "ok",
            );
          })
          .catch((error) => {
            UI.toast("Réception interrompue", error.message, "warn");
            BO.now();
          });
        return false;
      },
    });
  }
  function emailStatus(el) {
    fetch("/api/v3/intake/imap/status")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((status) => {
        if (!el.isConnected) return;
        const label = el.querySelector("[data-imap-status]"),
          button = el.querySelector("[data-imap]");
        button.disabled = !status.configured || status.busy;
        label.textContent = status.configured
          ? status.busy
            ? "Courriel IMAP : réception en cours."
            : "Courriel IMAP configuré : réception manuelle en lecture seule."
          : "Courriel IMAP non raccordé : configuration serveur requise. Aucun compte fictif connecté.";
        const run = status.lastRun;
        if (run) {
          const report = el.querySelector("[data-imap-report]");
          report.hidden = false;report.style.display="flex";
          report.textContent =
            "Dernier relevé : " +
            displayDate(run.at) +
            " · " +
            run.imported +
            " importée(s), " +
            run.duplicates +
            " déjà reçue(s), " +
            run.skipped.length +
            " non importée(s)." +
            (run.more
              ? " Autres courriels disponibles : relancez un relevé."
              : "") +
            (run.skipped.length ? " " + run.skipped.join(" · ") : "");
        }
      })
      .catch(() => {
        if (el.isConnected)
          el.querySelector("[data-imap-status]").textContent =
            "État de la réception indisponible. Le collage manuel reste disponible.";
      });
  }
  function pasteForm() {
    BO.formModal({ title: 'Coller un message reçu', wide: true,
      intro: `<div class="form-note">${BO.icon('mail', 16)}<div>Collez ici un courriel, un SMS ou un message WhatsApp reçu. Le relevé IMAP est disponible séparément si une boîte a été configurée sur le serveur. MOTEK lit le texte <b>localement</b>, propose une mission et signale ce qui manque. Rien ne part, rien n’est inventé.</div></div>`,
      fields: [{ k: 'channel', label: 'Canal d’origine', type: 'select', opts: Object.entries(CHANNELS).map(([k, l]) => [k, l]), req: true }, { k: 'from', label: 'Expéditeur (tel qu’affiché)', ph: 'adresse, numéro…' }, { k: 'raw', label: 'Message reçu', type: 'textarea', rows: 8, req: true, full: true }],
      values: { channel: 'email' }, submit: 'Analyser la demande',
      onSubmit: (x) => { const r = DEP.intakeAdd(x); if (!r) return false; BO.now(); setTimeout(() => detail(r), 120); } });
  }
  function render(el, params) {
    if (params.id && req(params.id)) { const id = params.id; APP.setParams({ id: null }); setTimeout(() => detail(req(id)), 0); }
    const all = reqs(), todo = all.filter((r) => r.status === 'À traiter');
    const rows = st.seg === 'todo' ? todo : st.seg === 'done' ? all.filter((r) => r.status !== 'À traiter') : all;
    const ch = S().intake.channels;
    el.innerHTML = `<div class="bo-page">${BO.head('Demandes entrantes', `${todo.length} à traiter · ${all.filter((r) => r.status === 'Mission créée').length} transformées en mission`, `<button class="btn" data-imap disabled>Relever les courriels</button><button class="btn pri" data-paste>${BO.icon('plus', 15)}Coller un message reçu</button>`)}
      <div class="form-note warn mb">${BO.icon('alert', 16)}<div><b>Réception des demandes.</b> <span data-imap-status>Courriel IMAP : vérification du raccordement…</span><br> ${Object.entries(CHANNELS).filter(([k])=>k!=='email').map(([,l])=>l+' (à raccorder)').join(' · ')}. L’objectif : que les demandes de ces canaux arrivent ici toutes seules. Le bureau confirme toujours la mission. Les exemples sont explicitement marqués fictifs.</div></div>
      <div class="form-note mb" data-imap-report hidden style="display:none"></div><div class="row wrap mb" style="gap:10px">${BO.seg('seg', [['todo', 'À traiter', todo.length], ['done', 'Traitées', all.length - todo.length], ['all', 'Toutes', all.length]], st.seg)}</div>
      <div class="g">${rows.map((r) => { const f = fieldsOf(r), miss = missing(f), dups = duplicates(r); const svc = f.serviceId ? (S().serviceCatalog.find((x) => x.id === f.serviceId) || {}).label : null; return `<div class="card intake" data-r="${r.id}"><div class="card-b"><div class="row" style="gap:10px;align-items:flex-start"><span class="tic ${r.status === 'À traiter' ? 'mid' : 'low'}" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${BO.icon(CH_IC[r.channel] || 'mail', 16)}</span>
        <div style="flex:1;min-width:0"><div class="row wrap" style="gap:8px"><b>${esc(r.no)}</b><span class="chip line">${esc(CHANNELS[r.channel] || r.channel)}</span>${r.demo ? '<span class="chip line">exemple fictif</span>' : ''}${BO.chip(r.status, r.status === 'À traiter' ? 'amber' : r.status === 'Mission créée' ? 'green' : '', true)}<span class="xs-t muted">${esc(displayDate(r.at))}</span></div>
        <div class="sm-t mt1">${svc ? '<b>' + esc(svc) + '</b> · ' : ''}${f.address ? esc(f.address) : '<span class="muted">adresse à compléter</span>'}${f.plate ? ' · ' + esc(f.plate) : ''}${f.name ? ' · ' + esc(f.name) : ''}</div>
        <div class="xs-t mt1">${miss.length ? `<span class="warn-t">${BO.icon('alert', 12)} À compléter : ${esc(miss.join(', '))}</span>` : '<span class="ok-t">Informations complètes</span>'}${dups.length ? ` · <span class="bad-t">${esc(dups.length + ' doublon' + (dups.length > 1 ? 's' : '') + ' possible' + (dups.length > 1 ? 's' : ''))}</span>` : ''}</div></div>
        <div class="ta" style="flex:none">${r.status === 'À traiter' ? `<button class="btn sm pri" data-go="${r.id}">Créer la mission</button>` : r.missionId ? `<button class="btn sm" data-open="missions:${r.missionId}">Ouvrir ${esc((DEP.mission(r.missionId) || {}).no || 'la mission')}</button>` : ''}</div></div></div></div>`; }).join('') || `<div class="card"><div class="card-b">${BO.empty('check', st.seg === 'todo' ? 'Aucune demande à traiter' : 'Rien ici', st.seg === 'todo' ? 'Collez un message reçu pour préparer une mission.' : '', '', true)}</div></div>`}</div></div>`;
    emailStatus(el);el.querySelector('[data-imap]').addEventListener('click',receiveEmail);
    BO.bindSeg(el, (n, v) => { st.seg = v; APP.refresh(); });
    el.querySelector('[data-paste]').addEventListener('click', pasteForm);
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); confirmMission(req(b.dataset.go)); }));
    el.querySelectorAll('[data-r]').forEach((c) => c.addEventListener('click', (e) => { if (e.target.closest('button,[data-open]')) return; detail(req(c.dataset.r)); }));
  }
  APP.register({ id: 'inbox', label: 'Demandes entrantes', icon: 'bell', group: 'Dépannage', order: 0.5, activity: 'depannage', render, badge: () => { try { return reqs().filter((r) => r.status === 'À traiter').length; } catch (e) { return 0; } } });
})();
