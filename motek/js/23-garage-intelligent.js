/* ==========================================================================
   BO · Garage intelligent (activité « intelligence ») :
   - mémoire de diagnostic : cas similaires (symptômes, codes DTC, même modèle)
   - scan de carte grise / lecture de plaque → identification locale → fiche
   - assistant vocal : commandes en langage naturel, toujours confirmées
   Tout s'exécute dans le navigateur (OCR local tesseract, aucun service externe).
   ========================================================================== */
(function () {
  const U = CX.util, { esc, today } = U;
  const st = { tab: 'cas', q: '', vid: '', scan: null, voice: { text: '', proposal: null, listening: false } };
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = s => norm(s).match(/[a-z0-9]{3,}/g) || [];
  const plateNorm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const extractDTC = t => [...new Set(String(t).toUpperCase().match(/\b[PCBU][0-3][0-9A-F]{3}\b/g) || [])];
  const validVIN = v => /^[A-HJ-NPR-Z0-9]{17}$/.test(String(v || '').toUpperCase().trim());

  /* ============================ CAS SIMILAIRES ============================ */
  function searchCases(q, vid) {
    const S = CX.S, v = vid ? CX.veh(vid) : null, terms = new Set(words(q));
    return (S.cases || []).map(c => {
      const cw = new Set(words(c.symptoms + ' ' + c.codes.join(' ') + ' ' + c.cause));
      const matches = [...terms].filter(w => cw.has(w));
      const sameMake = v && norm(v.make) === norm(c.make), sameModel = sameMake && norm(v.model).split(' ')[0] === norm(c.model).split(' ')[0];
      const score = matches.length * 2 + (sameModel ? 3 : sameMake ? 1 : 0);
      const sim = [...matches.map(w => 'Terme partagé : ' + w), ...(sameModel ? ['Même marque et modèle'] : sameMake ? ['Même marque'] : [])];
      const diff = v ? [...(!sameModel ? ['Modèle différent : ' + c.make + ' ' + c.model] : []), ...(!c.resolved ? ['Cause non confirmée sur ce cas'] : [])] : ['Aucun véhicule sélectionné : comparaison de modèle impossible'];
      return { c, score, sim, diff };
    }).filter(r => (!q.trim() && !vid) || r.score > 0).sort((a, b) => b.score - a.score || (a.c.at < b.c.at ? 1 : -1));
  }
  function caseForm(pre = {}) {
    BO.formModal({ title: 'Nouveau cas de diagnostic', wide: true, cols: 'c3',
      fields: [{ k: 'roId', label: 'Ordre de réparation lié', type: 'select', opts: BO.optROs(), empty: '— Aucun —' }, { k: 'make', label: 'Marque', req: true }, { k: 'model', label: 'Modèle', req: true },
        { k: 'symptoms', label: 'Symptômes constatés', req: true, full: true, ph: 'ex. voyant moteur, à-coups à l’accélération' }, { k: 'codes', label: 'Codes défaut (DTC)', ph: 'P0300 P0302' }, { k: 'cause', label: 'Cause retenue', req: true }, { k: 'resolved', label: 'Cause confirmée par un test', type: 'checkbox' },
        { k: 'proof', label: 'Preuve / mesure', full: true, ph: 'ex. tension mesurée 11,9 V' }, { k: 'repair', label: 'Réparation effectuée', full: true }],
      values: Object.assign({ resolved: true }, pre), submit: 'Enregistrer le cas',
      onMount: el => { const rs = el.querySelector('[name="roId"]'); rs.addEventListener('change', () => { const r = CX.ro(rs.value); if (r) { const v = CX.veh(r.vehicleId); el.querySelector('[name="make"]').value = v.make; el.querySelector('[name="model"]').value = v.model; } }); },
      onSubmit: x => { const r = x.roId ? CX.ro(x.roId) : null; CX.S.cases.unshift({ id: U.uid('CAS-'), at: today(), make: x.make, model: x.model, vehicleId: r ? r.vehicleId : null, roId: r ? r.id : null, symptoms: x.symptoms, codes: extractDTC(x.codes), cause: x.cause, proof: x.proof || '', repair: x.repair || '', resolved: !!x.resolved, recurred: false, by: CX.S.meId, demo: false }); if (r) CX.log(r, 'Cas de diagnostic enregistré : ' + x.cause); CX.touch('cases'); UI.toast('Cas enregistré', x.cause, 'ok', 'check'); BO.now(); } });
  }
  async function readReport(file) {
    if (file.size > 10 * 1024 * 1024) throw new Error('Limite de 10 Mo.');
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return pdfText(file, 5);
    if (/^image\/(jpeg|png|webp)$/.test(file.type)) return ocrImage(file);
    if (/\.(txt|csv)$/i.test(file.name)) return file.text();
    throw new Error('Formats : PDF texte, TXT, CSV, JPG ou PNG.');
  }
  function casesTab() {
    const S = CX.S, res = searchCases(st.q, st.vid), total = (S.cases || []).length;
    return `<div class="g g2" style="grid-template-columns:minmax(0,1fr) 300px;align-items:start">
      <div><div class="card"><div class="card-b"><div class="row wrap" style="gap:10px"><div class="box" style="flex:1;min-width:240px"><input class="inp" data-q placeholder="Symptômes ou codes défaut : voyant ABS, P0300, calage à chaud…" value="${esc(st.q)}"></div>
        <select class="inp" data-vid style="width:280px">${BO.opts(BO.optVehicles(), st.vid, '— Véhicule à comparer —')}</select><label class="btn">${BO.icon('upload', 15)}Rapport de diagnostic<input type="file" data-report accept=".pdf,.txt,.csv,image/*" style="display:none"></label></div>
        <div class="xs-t muted mt1">${total} cas en mémoire · ${res.length} affiché${res.length > 1 ? 's' : ''} · seuls les termes et modèles réellement partagés comptent, aucune cause n’est supposée.</div></div></div>
        ${res.length ? res.map(({ c, score, sim, diff }) => `<div class="card mt"><div class="card-b"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${esc(c.make)} ${esc(c.model)}</b>${c.codes.map(k => `<span class="chip dark">${esc(k)}</span>`).join('')}${BO.chip(c.resolved ? 'Cause confirmée' : 'À vérifier', c.resolved ? 'green' : 'amber', true)}<span class="sp"></span><span class="xs-t muted">${esc(BO.dateS(c.at))}${score ? ' · pertinence ' + score : ''}</span></div>
          <div class="mt1"><b class="sm-t">Symptômes</b> · ${esc(c.symptoms)}</div><div class="mt1 sm-t"><b>Cause</b> · ${esc(c.cause)}<br><b>Preuve</b> · ${esc(c.proof || '—')}<br><b>Réparation</b> · ${esc(c.repair || '—')}</div>
          ${sim.length || diff.length ? `<div class="row mt1" style="gap:6px;flex-wrap:wrap">${sim.map(x => `<span class="chip green">${esc(x)}</span>`).join('')}${diff.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
          ${c.roId && CX.ro(c.roId) ? `<div class="mt1 xs-t">Dossier ${BO.roLink(CX.ro(c.roId))}</div>` : ''}</div></div>`).join('') : BO.empty('search', 'Aucun cas comparable', 'Reformulez les symptômes ou saisissez un code défaut.')}</div>
      <div class="card"><div class="card-h"><h3>${BO.icon('file', 16)}Enregistrer un cas</h3></div><div class="card-b"><p class="sm-t muted">Après chaque diagnostic résolu, notez la cause et la preuve : la mémoire du garage s’enrichit et évite de refaire les mêmes tests.</p><button class="btn pri mt1" data-newcase>${BO.icon('plus', 15)}Nouveau cas</button>
        <div class="dsec mt"><h4>Derniers dossiers atelier</h4><div class="mini-list">${S.ros.filter(r => r.stage >= CX.ST.demont && r.stage < CX.ST.facture).slice(0, 5).map(r => `<div class="cl" data-case-ro="${r.id}"><span class="tag">${esc(r.no)}</span><div style="flex:1"><b class="sm-t">${esc(CX.vlabel(CX.veh(r.vehicleId)))}</b><div class="xs-t muted">${esc(r.damage)}</div></div>${BO.icon('chevR', 14)}</div>`).join('')}</div></div></div></div></div>`;
  }

  /* ============================ SCAN / IDENTIFICATION ============================ */
  const SPECS = [['A', 'Immatriculation'], ['B', 'Première immatriculation'], ['C.1', 'Titulaire'], ['C.3', 'Adresse'], ['D.1', 'Marque'], ['D.2', 'Type / variante / version'], ['D.3', 'Modèle commercial'], ['E', 'VIN'], ['J.1', 'Genre'], ['P.1', 'Cylindrée'], ['P.3', 'Énergie'], ['P.6', 'Puissance administrative']];
  function extractRegistration(text) {
    // Tous les codes du certificat d'immatriculation servent de bornes, même ceux non affichés.
    const ALL = ['A', 'B', 'C.1', 'C.3', 'C.4', 'C.4.1', 'D.1', 'D.2', 'D.2.1', 'D.3', 'E', 'F.1', 'F.2', 'F.3', 'G', 'G.1', 'I', 'I.1', 'J', 'J.1', 'J.2', 'J.3', 'K', 'P.1', 'P.2', 'P.3', 'P.6', 'Q', 'S.1', 'S.2', 'U.1', 'U.2', 'V.7', 'V.9', 'X.1', 'Y.1', 'Y.2', 'Y.3', 'Y.4', 'Y.5', 'Y.6', 'Z.1', 'Z.2', 'Z.3', 'Z.4'];
    const codes = ALL.map(c => c.replace(/\./g, '\\.')).sort((a, b) => b.length - a.length).join('|');
    // Libellés en début de ligne ou séparés par des espaces (PDF texte aplati) ; valeur jusqu'au libellé suivant.
    const re = new RegExp('(?:^|\\s)(' + codes + ')\\s*[:=]\\s*(.+?)(?=\\s+(?:' + codes + ')\\s*[:=]|[\\n\\r]|$)', 'gm');
    const found = new Map(); for (const m of text.matchAll(re)) if (!found.has(m[1])) found.set(m[1], m[2].trim());
    return SPECS.map(([code, label]) => { let raw = found.get(code) || '', value = raw; if (code === 'E') { value = value.toUpperCase().replace(/\s/g, ''); if (value && !validVIN(value)) value = ''; } if (code === 'A') value = value.toUpperCase().replace(/\s+/g, '-').replace(/-+/g, '-'); return { code, label, raw, value, ok: false }; });
  }
  let ocrWorker = null;
  async function ocrImage(file, onProgress) {
    const { createWorker } = await import('tesseract.js');
    if (!ocrWorker) ocrWorker = await createWorker('fra', 1, { workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', workerBlobURL: false, cacheMethod: 'none', logger: m => onProgress && onProgress(m.status === 'recognizing text' ? `Lecture locale · ${Math.round(m.progress * 100)} %` : 'Chargement du moteur OCR local…') });
    const r = await ocrWorker.recognize(file); return r.data.text;
  }
  async function pdfText(file, maxPages = 3) {
    const pdfjs = await import('pdfjs-dist'); const { default: url } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url'); pdfjs.GlobalWorkerOptions.workerSrc = url;
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    try { const pdf = await task.promise; if (pdf.numPages > maxPages) throw new Error(maxPages + ' pages maximum.'); let text = ''; for (let n = 1; n <= pdf.numPages; n++) { const page = await pdf.getPage(n); const d = await page.getTextContent(); text += d.items.filter(i => 'str' in i).map(i => i.str).join(' ') + '\n'; } if (!text.trim()) throw new Error('PDF image : photographiez le document (JPG/PNG) pour une lecture OCR locale.'); return text; } finally { await task.destroy(); }
  }
  function identify({ plate, vin }) {
    const S = CX.S, P = plateNorm(plate), V = String(vin || '').toUpperCase().trim();
    if (V && !validVIN(V)) return { state: 'needs_confirmation', matches: [], message: 'VIN attendu : 17 caractères sans I, O ni Q. Vérifiez le document ; rien n’a été déduit.' };
    const byVin = V ? S.vehicles.filter(v => v.vin && v.vin.toUpperCase() === V) : [], byPlate = P ? S.vehicles.filter(v => plateNorm(v.plate) === P) : [];
    if (V && P && byVin.length && byPlate.length && !byVin.some(v => byPlate.some(p => p.id === v.id))) return { state: 'conflict', matches: [...byVin, ...byPlate], message: 'La plaque et le VIN correspondent à des véhicules différents : vérifiez les sources avant tout rattachement.' };
    const matches = byVin.length ? byVin : byPlate;
    return matches.length ? { state: 'identified', matches, message: 'Correspondance avec un véhicule du garage (dossiers internes uniquement).' } : { state: 'not_found', matches: [], message: 'Aucune correspondance locale : créez la fiche à partir des champs confirmés. Aucun service de recherche par plaque n’est connecté.' };
  }
  function matchSighting(plate, confidence) {
    const S = CX.S, P = plateNorm(plate), open = S.ros.filter(r => r.stage < CX.ST.facture), dist = (a, b) => a.length !== b.length ? Math.abs(a.length - b.length) + 1 : [...a].filter((c, i) => c !== b[i]).length;
    const vehOf = r => CX.veh(r.vehicleId) || {};
    const exact = open.filter(r => plateNorm(vehOf(r).plate) === P), near = open.filter(r => { const p = plateNorm(vehOf(r).plate); return p !== P && dist(p, P) <= 1; });
    const recent = (st.sightings || []).find(m => plateNorm(m.plate) === P && Date.now() - m.ts < 10 * 60000);
    if (recent) return { status: 'doublon', ro: recent.ro, candidates: recent.candidates, reason: 'Même plaque vue il y a moins de dix minutes : aucune nouvelle arrivée créée.' };
    const sure = (confidence || 0) >= 0.85;
    if (exact.length === 1 && sure) { const r = exact[0], a = S.appts.find(x => x.roId === r.id && x.status === 'Prévu' && x.date === today()); return { status: 'confirmé', ro: r.id, candidates: [], appt: a ? a.id : null, reason: a ? 'Plaque sûre et rendez-vous du jour retrouvé.' : 'Plaque sûre et dossier ouvert retrouvé.' }; }
    if (exact.length || near.length) return { status: 'à valider', candidates: [...exact, ...near].map(r => r.id), reason: !sure ? 'Lecture incertaine : confirmez le véhicule à l’accueil.' : exact.length > 1 ? 'Plusieurs dossiers ouverts portent cette plaque.' : 'Plaque proche d’un dossier existant : validation humaine nécessaire.' };
    const known = S.vehicles.find(v => plateNorm(v.plate) === P);
    return { status: 'inconnu', candidates: [], vehicle: known ? known.id : null, reason: known ? 'Véhicule connu sans dossier ouvert : créer un nouveau dossier.' : 'Aucun dossier ne correspond : à accueillir comme nouveau client.' };
  }
  function createFromScan(fields) {
    const g = c => (fields.find(f => f.code === c) || {}).value || '';
    const titul = g('C.1'), existing = CX.S.customers.find(c => norm(c.name) === norm(titul));
    BO.formModal({ title: 'Créer la fiche à partir de la carte grise', wide: true, cols: 'c3',
      intro: `<div class="form-note">${BO.icon('shield', 16)}<div>Le titulaire (C.1) n’est qu’une proposition : le client du dossier peut être une autre personne (conducteur, société, assurance). Rien n’est enregistré avant validation.</div></div>`,
      fields: [{ k: 'customerId', label: 'Client existant', type: 'select', opts: BO.optCustomers(), empty: '— Nouveau client —', full: true }, { k: 'name', label: 'Nom du nouveau client' }, { k: 'phone', label: 'Téléphone', type: 'tel', ph: '+33 6 …' }, { k: 'city', label: 'Code postal / ville', ph: '69007 Lyon' },
        { k: 'plate', label: 'Immatriculation (A)', req: true }, { k: 'make', label: 'Marque (D.1)', req: true }, { k: 'model', label: 'Modèle (D.3)', req: true }, { k: 'vin', label: 'VIN (E)', validate: v => v && !validVIN(v) ? '17 caractères sans I, O, Q' : '' }, { k: 'year', label: 'Année (B)', type: 'number', min: 1960, max: 2030 }, { k: 'fuel', label: 'Énergie (P.3)', type: 'select', opts: ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'] },
        { k: 'dossier', label: 'Ouvrir aussi un dossier de réception', type: 'checkbox', full: true }],
      values: { customerId: existing ? existing.id : '', name: existing ? '' : titul, city: (g('C.3').match(/\d{5}\s+\S.*/) || [''])[0], plate: g('A'), make: g('D.1'), model: g('D.3') || g('D.2'), vin: g('E'), year: +(g('B').match(/(19|20)\d{2}/) || [''])[0] || new Date().getFullYear(), fuel: /GO|DIESEL/i.test(g('P.3')) ? 'Diesel' : /EL/i.test(g('P.3')) ? 'Électrique' : /EH|HYB/i.test(g('P.3')) ? 'Hybride' : 'Essence', dossier: true },
      submit: 'Créer la fiche', onSubmit: (x, close, el) => {
        if (!x.customerId && !x.name) { const f = el.querySelector('[data-f="name"]'); f.classList.add('err'); f.querySelector('.em').textContent = 'Nom requis pour un nouveau client'; return false; }
        let cid = x.customerId;
        if (!cid) { const c = CX.upsert('customers', { id: U.uid('C'), type: 'prive', name: x.name, ini: x.name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join(''), city: x.city || '', addr: '', phone: x.phone || '', email: '', since: new Date().getFullYear(), insurerId: null, pref: 'SMS', rating: 0, note: 'Fiche créée depuis un scan de carte grise (' + today() + ')', hist: [], comms: [], fleet: null, contact: '', legacy: { spent: 0, visits: 0 } }, 'customer'); cid = c.id; }
        const v = CX.upsert('vehicles', { id: U.uid('V'), customerId: cid, make: x.make, model: x.model, plate: x.plate.toUpperCase().trim(), year: +x.year || new Date().getFullYear(), km: 0, colorName: 'À relever', colorCode: '—', hex: '#c9cdd3', vin: (x.vin || '').toUpperCase(), fuel: x.fuel, build: {}, hist: [], nextCT: null }, 'vehicle');
        UI.toast('Fiche créée', CX.custName(cid) + ' · ' + v.plate, 'ok', 'check');
        if (x.dossier) BO.newDossier({ title: 'Dossier de réception — ' + v.plate, onDone: r => APP.open('ros', { id: r.id }) }); else APP.open('crm', { id: cid });
      } });
  }
  function scanTab() {
    const sc = st.scan, S = CX.S;
    const fieldsHtml = sc && sc.fields ? `<table class="tbl mt"><thead><tr><th style="width:70px">Champ</th><th>Libellé</th><th>Valeur lue</th><th style="width:90px">Confirmé</th></tr></thead><tbody>${sc.fields.map((f, i) => `<tr><td><span class="tag">${esc(f.code)}</span></td><td>${esc(f.label)}</td><td><input class="inp sm" data-fv="${i}" value="${esc(f.value)}" placeholder="${esc(f.raw ? 'brut : ' + f.raw : 'non lu — à saisir')}"></td><td style="text-align:center"><input type="checkbox" data-fok="${i}" ${f.ok ? 'checked' : ''}></td></tr>`).join('')}</tbody></table>` : '';
    const ident = sc && sc.ident ? `<div class="form-note mt ${sc.ident.state === 'identified' ? 'ok' : sc.ident.state === 'not_found' ? '' : 'warn'}">${BO.icon(sc.ident.state === 'identified' ? 'check' : 'alert', 16)}<div><b>${esc({ identified: 'Véhicule identifié', conflict: 'Conflit plaque / VIN', not_found: 'Véhicule inconnu', needs_confirmation: 'Donnée à vérifier' }[sc.ident.state])}</b> · ${esc(sc.ident.message)}${sc.ident.matches.map(v => ` <a class="lnk" data-open="crm:${v.customerId}">${esc(v.plate)} · ${esc(CX.vlabel(v))} (${esc(CX.custName(v.customerId))})</a>`).join('')}</div></div>` : '';
    const sight = st.sight ? `<div class="form-note mt ${st.sight.status === 'confirmé' ? 'ok' : st.sight.status === 'inconnu' ? '' : 'warn'}">${BO.icon('camera', 16)}<div><b>${esc(st.sight.plate)} · ${esc(st.sight.status)}</b> · ${esc(st.sight.reason)}<div class="row mt1" style="gap:6px;flex-wrap:wrap">${st.sight.ro ? `<button class="btn xs pri" data-open="ros:${st.sight.ro}">Ouvrir ${esc(CX.ro(st.sight.ro).no)}</button><button class="btn xs" data-sight-checkin="${st.sight.ro}">Déclarer l’arrivée</button>` : ''}${(st.sight.candidates || []).map(id => `<button class="btn xs" data-open="ros:${id}">${esc(CX.ro(id).no)} · ${esc(CX.veh(CX.ro(id).vehicleId).plate)}</button>`).join('')}${st.sight.status === 'inconnu' ? `<button class="btn xs pri" data-sight-new>Nouveau dossier</button>` : ''}</div></div></div>` : '';
    return `<div class="g g2" style="align-items:start">
      <div class="card"><div class="card-h"><h3>${BO.icon('file', 16)}Carte grise → fiche client</h3></div><div class="card-b">
        <div class="form-note">${BO.icon('shield', 16)}<div>Le document est lu <b>dans ce navigateur</b> (OCR local). Aucune copie n’est enregistrée et aucune valeur n’est reprise sans votre confirmation.</div></div>
        <div class="row wrap mt" style="gap:8px"><label class="btn pri">${BO.icon('upload', 15)}Photo ou PDF de la carte grise<input type="file" data-cg accept="image/*,.pdf" capture="environment" style="display:none"></label><button class="btn" data-demo="texte">Essai : PDF texte fictif</button><button class="btn" data-demo="photo">Essai : photo fictive (OCR)</button></div>
        <div class="xs-t muted mt1" data-prog>${esc(sc && sc.progress || 'Formats : JPG, PNG, WEBP (OCR local) ou PDF texte · 10 Mo max.')}</div>
        ${sc && sc.error ? `<div class="form-note warn mt">${BO.icon('alert', 16)}<div>${esc(sc.error)}</div></div>` : ''}
        ${fieldsHtml}${ident}
        ${sc && sc.fields ? `<div class="row mt" style="gap:8px"><button class="btn" data-ident>${BO.icon('search', 15)}Rechercher dans le garage</button><span class="sp"></span><button class="btn pri" data-create>${BO.icon('plus', 15)}Créer la fiche client / véhicule</button></div><details class="mt1"><summary class="xs-t muted" style="cursor:pointer">Texte brut extrait</summary><pre class="xs-t" style="white-space:pre-wrap;max-height:160px;overflow:auto">${esc(sc.text || '')}</pre></details>` : ''}
      </div></div>
      <div class="card"><div class="card-h"><h3>${BO.icon('camera', 16)}Lecture de plaque à l’entrée</h3></div><div class="card-b">
        <div class="form-note">${BO.icon('alert', 16)}<div><b>Aucune caméra raccordée.</b> Ce panneau simule une lecture de plaque telle qu’un lecteur ANPR la fournirait (plaque + score de confiance) et montre comment MOTEK la rapproche des dossiers : confirmée, à valider par un humain, inconnue ou doublon.</div></div>
        <div class="fgrid c2 mt"><div class="field"><label>Plaque lue</label><input class="inp" data-sp placeholder="AB-123-CD" value="${esc(st.spPlate || '')}"></div><div class="field"><label>Confiance du lecteur</label><select class="inp" data-sc>${BO.opts([['0.97', 'Sûre (97 %)'], ['0.7', 'Moyenne (70 %)'], ['0.4', 'Faible (40 %)']], st.spConf || '0.97')}</select></div></div>
        <div class="row wrap mt1" style="gap:6px">${S.ros.filter(r => r.stage <= CX.ST.recep && r.apptAt && U.dOf(r.apptAt) === today()).slice(0, 4).map(r => `<button class="btn xs" data-sp-try="${esc(CX.veh(r.vehicleId).plate)}">${esc(CX.veh(r.vehicleId).plate)} · attendu ${esc(U.tOf(r.apptAt))}</button>`).join('')}<button class="btn xs" data-sp-try="ZZ-999-ZZ">Plaque inconnue</button></div>
        <button class="btn pri mt" data-sight>${BO.icon('camera', 15)}Simuler la lecture</button>
        ${sight}
        <div class="dsec mt"><h4>Pour raccorder une vraie caméra</h4><p class="sm-t muted">Il faut : le flux de la caméra (RTSP/ONVIF) ou un service de lecture de plaque, un ordinateur sur place pour la lecture locale, et l’emplacement de la caméra. Détails et options dans <code>docs/INTEGRATIONS_TELEPHONIE_CAMERA.md</code>. Aucun abonnement n’est engagé sans votre accord.</p></div>
      </div></div></div>`;
  }

  /* ============================ ASSISTANT VOCAL ============================ */
  function findRO(t) {
    const S = CX.S, open = S.ros.filter(r => r.stage < CX.ST.facture);
    const byPlate = open.find(r => { const p = plateNorm((CX.veh(r.vehicleId) || {}).plate); return p && t.replace(/[^a-z0-9]/g, '').toUpperCase().includes(p); });
    if (byPlate) return byPlate;
    const byNo = t.match(/or[\s-]?(\d{4,6})/); if (byNo) { const r = open.find(x => x.no.replace(/\D/g, '') === byNo[1]); if (r) return r; }
    const hits = open.filter(r => { const v = CX.veh(r.vehicleId) || {}, c = CX.cust(r.customerId) || {}; return [v.model, v.make, c.name].some(w => w && norm(w).split(/[\s-]+/).map(p => p.replace(/[^a-z0-9]/g, '')).some(p => p.length >= 4 && new RegExp('\\b' + p + '\\b').test(t))); });
    return hits.length === 1 ? hits[0] : hits.length > 1 ? { ambiguous: hits } : null;
  }
  function propose(text) {
    const S = CX.S, t = norm(text), out = { text, actions: [], warnings: [], reply: '' };
    if (!t.trim()) { out.warnings.push('Dictez ou tapez une commande.'); return out; }
    if (/(?:ne|n['’]).{0,16}(?:mets?|mettez|demarr|termin|confirm|repren|previen|envoi).{0,15}pas/.test(t)) { out.warnings.push('Négation détectée : reformulez une commande courte pour éviter une action erronée.'); return out; }
    const k = CX.kpis();
    if (/combien.*(vehicule|voiture).*(site|atelier)|vehicules? sur site/.test(t)) { out.reply = `${k.onsite} véhicules sur site, ${S.ros.filter(r => r.stage === CX.ST.pret).length} prêts à restituer, ${S.ros.filter(CX.isLate).length} en retard.`; return out; }
    if (/combien.*(retard|en retard)/.test(t)) { const l = S.ros.filter(CX.isLate); out.reply = l.length ? l.length + ' dossier' + (l.length > 1 ? 's' : '') + ' en retard : ' + l.map(r => r.no + ' ' + CX.vlabel(CX.veh(r.vehicleId))).join(', ') : 'Aucun dossier en retard.'; return out; }
    if (/combien.*(devis|accord)/.test(t)) { const q = S.quotes.filter(x => x.status === 'Envoyé'); out.reply = q.length + ' devis en attente d’accord' + (q.length ? ' : ' + q.map(x => x.no).join(', ') : '.'); return out; }
    if (/(rendez.?vous|rdv) (du jour|aujourd)/.test(t) || /quels? (sont les )?rendez/.test(t)) { const a = S.appts.filter(x => x.date === today()).sort((x, y) => x.time - y.time); out.reply = a.length ? a.map(x => U.hm(x.time) + ' ' + x.title).join(' · ') : 'Aucun rendez-vous aujourd’hui.'; return out; }
    const r = findRO(t);
    if (r && r.ambiguous) { out.warnings.push('Plusieurs dossiers correspondent : ' + r.ambiguous.map(x => x.no + ' ' + CX.veh(x.vehicleId).plate).join(', ') + '. Précisez la plaque.'); return out; }
    const v = r ? CX.veh(r.vehicleId) : null, lbl = r ? `${r.no} · ${CX.vlabel(v)} (${v.plate})` : '';
    if (/ou (est|se trouve)|localise|montre.*(atelier|carte)|affiche.*(atelier|carte)/.test(t)) { if (!r) { out.warnings.push('Véhicule non reconnu : citez la plaque, le modèle ou le client.'); return out; } out.reply = `${lbl} · ${CX.STAGES[r.stage].l} · emplacement ${CX.slotLabel ? CX.slotLabel(r.slot) : r.slot}.`; out.actions.push({ type: 'map', label: 'Afficher dans l’atelier live', run: () => APP.showInMap('vehicle', v.id) }); return out; }
    if (/^(ouvre|affiche|montre|va sur|ouvrir)\b/.test(t) && !r) { const q = text.replace(/^(ouvre|affiche|montre|va sur|ouvrir)\s*(le |la |les |l')?/i, '').trim(); const res = APP.search(q); if (res.length) { out.actions.push({ type: 'open', label: 'Ouvrir ' + res[0].t, run: res[0].go }); out.reply = res[0].t + ' · ' + res[0].s; } else out.warnings.push('Rien trouvé pour « ' + q + ' ».'); return out; }
    if (/^(ouvre|affiche|montre|ouvrir)\b/.test(t) && r) { out.actions.push({ type: 'open', label: 'Ouvrir le dossier ' + r.no, run: () => APP.open('ros', { id: r.id }) }); out.reply = lbl + ' · ' + CX.STAGES[r.stage].l; return out; }
    if (!r) { out.warnings.push('Commande non comprise ou véhicule non reconnu. Exemples : « où est la Golf », « la AB-123-CD est prête », « pièce manquante étrier pour OR 24817 », « note pour la Clio : bruit AV G », « préviens le client de la Yaris ».'); return out; }
    if (/pret(e|es|s)?\b|termin|fini/.test(t) && !/piece|manqu/.test(t)) {
      if (r.stage >= CX.ST.pret) out.warnings.push(lbl + ' est déjà au stade « ' + CX.STAGES[r.stage].l + ' ».');
      else out.actions.push({ type: 'stage', label: 'Passer ' + r.no + ' en contrôle qualité (travaux terminés)', run: () => { CX.setStage(r.id, CX.ST.cq); CX.log(r, 'Travaux terminés (commande vocale)'); CX.touch('ro', { roId: r.id }); } });
    }
    if (/piece|manqu|il faut|besoin|commande/.test(t)) { const what = text.replace(/.*?(manque|manquante|il faut|besoin d[e']|commande[rz]?)\s*/i, '').replace(/\s*(pour|sur)\s+.*$/i, '').trim(); out.actions.push({ type: 'part', label: `Signaler la pièce manquante « ${what || '?'} » sur ${r.no} et alerter le magasin`, run: () => { CX.addTask(r.id, 'Pièce à commander : ' + (what || text)); CX.log(r, 'Pièce manquante signalée (vocal) : ' + (what || text)); CX.feed({ ic: 'box', tone: 'amber', t: 'Pièce manquante · ' + r.no, s: (what || text) + ' · ' + CX.vlabel(v), target: { type: 'ro', id: r.id } }); CX.touch('ro', { roId: r.id }); } }); out.warnings.push('Aucune référence n’est inventée : le magasinier choisit la pièce dans le stock ou commande.'); }
    if (/note|compte.?rendu|remarque/.test(t)) { const body = text.replace(/.*?(note|compte.?rendu|remarque)\s*(pour|sur)?\s*(la|le|l')?\s*[^:]*:?\s*/i, '').trim() || text; out.actions.push({ type: 'note', label: 'Ajouter la note au dossier ' + r.no + ' : « ' + body + ' »', run: () => { CX.log(r, 'Note vocale : ' + body); CX.touch('ro', { roId: r.id }); } }); }
    if (/previen|prevenir|avertis|appelle le client|envoie.*(sms|message|mail)/.test(t)) { if (r.stage < CX.ST.pret && !/devis/.test(t)) out.warnings.push('Le message « véhicule prêt » sera proposé après le contrôle qualité.'); else out.actions.push({ type: 'notify', label: 'Préparer le message au client de ' + r.no + ' (vous validez l’envoi)', run: () => BO.notifyReady(r.id) }); }
    if (/relance.*devis|devis.*relance/.test(t)) { const q = r.quoteId ? CX.quote(r.quoteId) : null; if (q && q.status === 'Envoyé') out.actions.push({ type: 'quote', label: 'Préparer la relance du devis ' + q.no, run: () => BO.quoteRemind(q.id) }); else out.warnings.push('Aucun devis en attente d’accord sur ce dossier.'); }
    if (/rendez.?vous|rdv/.test(t)) { const d = /demain/.test(t) ? U.wd(1) : /lundi|mardi|mercredi|jeudi|vendredi/.test(t) ? U.wd(1) : today(); const h = (t.match(/(\d{1,2})\s*h\s*(\d{2})?/) || []); const time = h[1] ? U.pad(+h[1]) + ':' + (h[2] || '00') : '08:00'; out.actions.push({ type: 'appt', label: `Ouvrir un rendez-vous ${/restitu|livr/.test(t) ? 'de restitution' : 'de réception'} pour ${r.no} le ${U.fmtD(d)} à ${time}`, run: () => BO.apptForm(null, { kind: /restitu|livr/.test(t) ? 'Livraison' : 'Réception', roId: r.id, date: d, time, dur: 20, title: (/restitu|livr/.test(t) ? 'Restitution ' : 'Réception ') + CX.vlabel(v) + ' (' + CX.custName(r.customerId) + ')' }) }); }
    if (/pause|bloqu|arret/.test(t) && !out.actions.length) out.actions.push({ type: 'block', label: 'Marquer ' + r.no + ' comme bloqué (note + alerte chef d’atelier)', run: () => { CX.log(r, 'Dossier bloqué (vocal) : ' + text); CX.feed({ ic: 'alert', tone: 'red', t: 'Dossier bloqué · ' + r.no, s: text.slice(0, 70), target: { type: 'ro', id: r.id } }); CX.touch('ro', { roId: r.id }); } });
    if (!out.actions.length && !out.warnings.length) out.warnings.push('Commande non comprise pour ' + lbl + '. Aucune action ne sera exécutée.');
    out.reply = out.actions.length ? out.actions.map(a => a.label).join('. ') : out.warnings[0];
    return out;
  }
  function speak(text) { try { if (!CX.S.agent.settings.voiceBrowser || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; speechSynthesis.speak(u); } catch (e) {} }
  let recog = null;
  function listen(el) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!CX.S.agent.settings.voiceBrowser) { UI.toast('Micro désactivé', 'Activez la reconnaissance vocale du navigateur dans Agent IA › Réglages (l’audio peut transiter par le fournisseur du navigateur).', 'warn', 'alert'); return; }
    if (!SR) { UI.toast('Reconnaissance indisponible', 'Ce navigateur ne propose pas de reconnaissance vocale : utilisez la saisie texte.', 'warn'); return; }
    if (recog) { recog.stop(); return; }
    recog = new SR(); recog.lang = 'fr-FR'; recog.interimResults = true; recog.maxAlternatives = 1;
    const ta = el.querySelector('[data-vtext]'), btn = el.querySelector('[data-mic]');
    btn.classList.add('rec'); st.voice.listening = true;
    recog.onresult = e => { ta.value = [...e.results].map(r => r[0].transcript).join(' '); };
    recog.onerror = e => { UI.toast('Micro', 'Erreur de reconnaissance : ' + e.error, 'warn'); };
    recog.onend = () => { recog = null; btn.classList.remove('rec'); st.voice.listening = false; st.voice.text = ta.value; st.voice.proposal = propose(ta.value); APP.refresh(); speak(st.voice.proposal.reply); };
    recog.start();
  }
  function voiceTab() {
    const p = st.voice.proposal, s = CX.S.agent.settings;
    return `<div class="g g2" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start">
      <div class="card"><div class="card-h"><h3>${BO.icon('phone', 16)}Assistant vocal de l’atelier</h3><span class="xs-t muted">${s.voiceBrowser ? 'micro : reconnaissance du navigateur' : 'micro désactivé · saisie texte'}</span></div><div class="card-b">
        <div class="form-note">${BO.icon('shield', 16)}<div>Chaque commande est <b>reformulée puis confirmée</b> : rien n’est modifié ni envoyé automatiquement. Mode mains sales : grands boutons, une phrase suffit.</div></div>
        <div class="row mt" style="gap:8px;align-items:stretch"><textarea class="inp" data-vtext rows="3" placeholder="ex. « la Golf MB-118-CC est prête », « pièce manquante étrier avant pour OR 24821 », « où est la Yaris ? », « note pour la Clio : bruit de roulement AV G »">${esc(st.voice.text)}</textarea><button class="btn ${st.voice.listening ? 'danger' : ''}" data-mic title="Dicter" style="width:64px;flex-direction:column;height:auto">${BO.icon('phone', 20)}<span class="xs-t">${st.voice.listening ? 'Stop' : 'Micro'}</span></button></div>
        <div class="row mt1" style="gap:8px;flex-wrap:wrap"><button class="btn pri" data-analyze>${BO.icon('check', 15)}Analyser</button>${['Combien de véhicules sur site ?', 'Où est la Golf MB-118-CC ?', 'La Golf MB-118-CC est terminée', 'Pièce manquante étrier avant droit pour OR 24821', 'Note pour la Golf MB-118-CC : rayure AR G constatée', 'Rendez-vous de restitution demain 9h pour OR 24817'].map(x => `<button class="btn sm" data-ex="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        ${p ? `<div class="card mt" style="box-shadow:none;border:1px solid var(--line2)"><div class="card-b"><div class="row" style="gap:8px"><b>Compris :</b><span>${esc(p.reply || '—')}</span></div>
          ${p.warnings.map(w => `<div class="form-note warn mt1">${BO.icon('alert', 15)}<div>${esc(w)}</div></div>`).join('')}
          ${p.actions.length ? `<div class="mt1">${p.actions.map((a, i) => `<label class="chk" style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" data-act-i="${i}" checked> ${esc(a.label)}</label>`).join('')}<div class="row mt1" style="gap:8px"><button class="btn pri" data-confirm>${BO.icon('check', 15)}Confirmer les actions cochées</button><button class="btn" data-cancel>Annuler</button></div></div>` : ''}</div></div>` : ''}
      </div></div>
      <div class="card"><div class="card-h"><h3>${BO.icon('list', 16)}Ce que l’assistant sait faire</h3></div><div class="card-b"><ul class="sm-t" style="margin:0;padding-left:18px;line-height:1.7"><li>Chiffres du jour : véhicules sur site, retards, devis en attente, rendez-vous.</li><li>Localiser un véhicule dans l’atelier live.</li><li>Ouvrir un dossier, un client, une pièce.</li><li>Travaux terminés → contrôle qualité.</li><li>Pièce manquante → tâche + alerte magasin.</li><li>Note / compte rendu au dossier.</li><li>Préparer un message client, une relance de devis, un rendez-vous.</li></ul>
        <div class="dsec mt"><h4>Réglages</h4><label class="chk" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-voice-browser ${s.voiceBrowser ? 'checked' : ''}><span class="sm-t">Utiliser la reconnaissance vocale du navigateur<br><span class="xs-t muted">Selon le navigateur (Chrome), l’audio peut être traité par son fournisseur. Désactivé par défaut ; une reconnaissance 100 % locale (serveur du garage) reste possible, voir la documentation.</span></span></label></div></div></div></div>`;
  }

  /* ============================ RENDU ============================ */
  function render(el, params) {
    if (params.tab) { st.tab = params.tab; APP.setParams({ tab: null }); }
    if (params.vid) { st.vid = params.vid; st.tab = 'cas'; APP.setParams({ vid: null }); }
    el.innerHTML = `<div class="bo-page">${BO.head('Garage intelligent', 'Mémoire de diagnostic, identification des véhicules et assistant vocal — tout reste dans le garage.', `<button class="btn" data-newcase>${BO.icon('plus', 15)}Nouveau cas</button>`)}
      ${BO.tabs ? BO.tabs([['cas', 'Cas similaires', (CX.S.cases || []).length], ['scan', 'Scan carte grise & plaque'], ['vocal', 'Assistant vocal']], st.tab) : ''}
      <div class="mt">${st.tab === 'cas' ? casesTab() : st.tab === 'scan' ? scanTab() : voiceTab()}</div></div>`;
    BO.bindTabs(el, t => { st.tab = t; APP.refresh(); });
    el.querySelectorAll('[data-newcase]').forEach(b => b.addEventListener('click', () => caseForm()));
    if (st.tab === 'cas') {
      BO.bindSearch(el, v => { st.q = v; });
      el.querySelector('[data-vid]').addEventListener('change', e => { st.vid = e.target.value; APP.refresh(); });
      el.querySelector('[data-report]').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; try { UI.toast('Lecture du rapport', f.name, 'info', 'file'); const text = await readReport(f); const codes = extractDTC(text); st.q = codes.length ? codes.join(' ') : text.slice(0, 300); if (!codes.length) UI.toast('Aucun code DTC standard', 'Le texte est repris tel quel ; aucun défaut n’est supposé.', 'warn'); APP.refresh(); } catch (err) { UI.toast('Lecture impossible', err.message, 'err'); } });
      el.querySelectorAll('[data-case-ro]').forEach(b => b.addEventListener('click', () => { const r = CX.ro(b.dataset.caseRo), v = CX.veh(r.vehicleId); caseForm({ roId: r.id, make: v.make, model: v.model, symptoms: r.damage }); }));
    }
    if (st.tab === 'scan') {
      const setProg = m => { st.scan = st.scan || {}; st.scan.progress = m; const p = el.querySelector('[data-prog]'); if (p) p.textContent = m; };
      const run = async file => { st.scan = { progress: 'Lecture…', file: file.name }; APP.refresh(); try { const text = /pdf/i.test(file.type) || /\.pdf$/i.test(file.name) ? await pdfText(file, 3) : await ocrImage(file, setProg); st.scan = { text, fields: extractRegistration(text), progress: 'Extraction terminée · vérifiez chaque valeur avant de la confirmer.' }; } catch (err) { st.scan = { error: 'Lecture non aboutie : ' + err.message, progress: '' }; } APP.refresh(); };
      el.querySelector('[data-cg]').addEventListener('change', e => { const f = e.target.files[0]; if (f) run(f); });
      el.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', async () => { const name = b.dataset.demo === 'texte' ? 'carte-grise-fictive-texte.pdf' : 'carte-grise-fictive-photo.png'; try { const r = await fetch('/demo/' + name); if (!r.ok) throw new Error('fichier de démonstration introuvable'); const blob = await r.blob(); run(new File([blob], name, { type: blob.type || (name.endsWith('.pdf') ? 'application/pdf' : 'image/png') })); } catch (err) { UI.toast('Démonstration', err.message, 'warn'); } }));
      el.querySelectorAll('[data-fv]').forEach(i => i.addEventListener('input', () => { st.scan.fields[+i.dataset.fv].value = i.value; }));
      el.querySelectorAll('[data-fok]').forEach(i => i.addEventListener('change', () => { st.scan.fields[+i.dataset.fok].ok = i.checked; }));
      const ib = el.querySelector('[data-ident]'); if (ib) ib.addEventListener('click', () => { const g = c => (st.scan.fields.find(f => f.code === c) || {}).value; st.scan.ident = identify({ plate: g('A'), vin: g('E') }); APP.refresh(); });
      const cb = el.querySelector('[data-create]'); if (cb) cb.addEventListener('click', () => { const need = ['A', 'D.1']; const miss = need.filter(c => { const f = st.scan.fields.find(x => x.code === c); return !f.value || !f.ok; }); if (miss.length) { UI.toast('Confirmez d’abord', 'Cochez au moins l’immatriculation (A) et la marque (D.1) après vérification.', 'warn'); return; } createFromScan(st.scan.fields); });
      el.querySelectorAll('[data-sp-try]').forEach(b => b.addEventListener('click', () => { el.querySelector('[data-sp]').value = b.dataset.spTry; }));
      el.querySelector('[data-sight]').addEventListener('click', () => { const plate = el.querySelector('[data-sp]').value.trim().toUpperCase(), conf = +el.querySelector('[data-sc]').value; if (!plate) return; st.spPlate = plate; st.spConf = String(conf); const m = matchSighting(plate, conf); st.sight = Object.assign({ plate, conf }, m); st.sightings = (st.sightings || []).concat([{ plate, ts: Date.now(), ro: m.ro, candidates: m.candidates }]).slice(-20); if (m.status === 'confirmé') CX.feed({ ic: 'camera', tone: 'green', t: 'Arrivée détectée · ' + plate, s: CX.ro(m.ro).no + ' · ' + m.reason, target: { type: 'ro', id: m.ro } }); APP.refresh(); });
      el.querySelectorAll('[data-sight-checkin]').forEach(b => b.addEventListener('click', () => APP.open('reception', { tab: 'checkin', id: b.dataset.sightCheckin })));
      const sn = el.querySelector('[data-sight-new]'); if (sn) sn.addEventListener('click', () => BO.newDossier({ withAppt: false, onDone: r => APP.open('ros', { id: r.id }) }));
    }
    if (st.tab === 'vocal') {
      const ta = el.querySelector('[data-vtext]');
      const analyze = () => { st.voice.text = ta.value; st.voice.proposal = propose(ta.value); APP.refresh(); speak(st.voice.proposal.reply); };
      el.querySelector('[data-analyze]').addEventListener('click', analyze);
      ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); } });
      el.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { ta.value = b.dataset.ex; analyze(); }));
      el.querySelector('[data-mic]').addEventListener('click', () => listen(el));
      el.querySelector('[data-voice-browser]').addEventListener('change', e => { CX.S.agent.settings.voiceBrowser = e.target.checked; CX.touch('agent'); APP.refresh(); });
      const cf = el.querySelector('[data-confirm]'); if (cf) cf.addEventListener('click', () => { const p = st.voice.proposal, picked = [...el.querySelectorAll('[data-act-i]')].filter(i => i.checked).map(i => p.actions[+i.dataset.actI]); if (!picked.length) return; picked.forEach(a => a.run()); CX.S.agent.log.unshift({ at: CX.now(), kind: 'voice', text: p.text, done: picked.map(a => a.label) }); CX.touch('agent'); UI.toast('Actions confirmées', picked.length + ' action' + (picked.length > 1 ? 's' : ''), 'ok', 'check'); st.voice = { text: '', proposal: null, listening: false }; BO.now(); });
      const cc = el.querySelector('[data-cancel]'); if (cc) cc.addEventListener('click', () => { st.voice.proposal = null; APP.refresh(); });
    }
  }
  window.SMART = { propose, identify, matchSighting, extractRegistration, extractDTC, searchCases };
  APP.register({ id: 'intelligence', label: 'Garage intelligent', icon: 'cube', group: 'Pilotage', order: 2, activity: 'intelligence', render, badge: () => 0 });
})();
