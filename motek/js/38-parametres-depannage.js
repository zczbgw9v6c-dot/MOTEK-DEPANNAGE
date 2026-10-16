/* ==========================================================================
   BO · Paramètres du dépanneur : grille tarifaire par motif, frais de garde,
   coordonnées de l'entreprise, données de démonstration. Remplace les
   paramètres atelier (taux horaires, peinture) quand l'activité atelier est
   désactivée.
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf } = U;
  const tarifs = () => (CX.S.tarifs = CX.S.tarifs || Object.assign({}, CX.DEP_TARIFS || {}));
  window.DEP = window.DEP || {};
  /** Tarif HT prévu pour un motif de mission. */
  DEP.priceOf = kind => { const t = tarifs(); return t[kind] != null ? +t[kind] : (t['Autre'] != null ? +t['Autre'] : 150); };

  function render(el) {
    const S = CX.S, co = S.company, T = tarifs(), P = S.parc;
    const KINDS = (DEP.KINDS || Object.keys(T)).filter(k => k !== 'nuit' && k !== 'weekend');
    el.innerHTML = `<div class="bo-page">${BO.head('Paramètres', 'Tarifs du dépannage, frais de garde, entreprise et données de démonstration')}
      <div class="card pad">
        <div class="set-sec"><div><h3>Tarifs des missions</h3><p>Montant HT proposé à la création d’une mission, selon le motif. Modifiable mission par mission. Les majorations servent de repère pour les interventions de nuit (22 h – 6 h) et de week-end.</p></div>
          <div><div class="fgrid c3">${KINDS.map(k => `<div class="field"><label>${esc(k)}</label><div class="row"><input class="inp" type="number" min="0" max="2000" step="5" data-tarif="${esc(k)}" value="${T[k] != null ? T[k] : ''}"><span class="muted sm-t">€ HT</span></div></div>`).join('')}</div>
          <div class="fgrid c3 mt"><div class="field"><label>Majoration nuit</label><div class="row"><input class="inp" type="number" min="0" max="500" step="5" data-tarif="nuit" value="${T.nuit || 0}"><span class="muted sm-t">€ HT</span></div></div><div class="field"><label>Majoration week-end / férié</label><div class="row"><input class="inp" type="number" min="0" max="500" step="5" data-tarif="weekend" value="${T.weekend || 0}"><span class="muted sm-t">€ HT</span></div></div></div></div></div>
        <div class="set-sec"><div><h3>Parc de gardiennage</h3><p>Frais appliqués à chaque véhicule gardé : par jour calendaire entamé, plus des frais de dossier à l’entrée. Les gardes déjà saisies gardent leur tarif journalier.</p></div>
          <div class="fgrid c3"><div class="field"><label>Frais de garde par jour</label><div class="row"><input class="inp" type="number" min="0" max="200" step="1" data-parc="dailyFee" value="${P.dailyFee}"><span class="muted sm-t">€ HT</span></div></div><div class="field"><label>Frais de dossier</label><div class="row"><input class="inp" type="number" min="0" max="500" step="5" data-parc="adminFee" value="${P.adminFee}"><span class="muted sm-t">€ HT</span></div></div><div class="field"><label>Places</label><div class="inp" style="display:flex;align-items:center;background:#f6f7f9">${P.levels.map(l => esc(l.name) + ' : ' + l.slots).join(' · ')}</div></div></div>
          <div class="form-note mt">${BO.icon('calc', 16)}<div>Exemple : une garde de 30 jours = 30 × ${chf(P.dailyFee)} + ${chf(P.adminFee)} = <b>${chf(30 * P.dailyFee + P.adminFee)}</b> HT. Relance automatique proposée à 30 jours, abandon présumé à 60 jours.</div></div></div>
        <div class="set-sec"><div><h3>TVA & conditions</h3><p>Taux de TVA appliqué aux factures et délai de paiement accordé aux mandants.</p></div>
          <div class="fgrid c3"><div class="field"><label>TVA (%)</label><input class="inp" type="number" min="0" max="20" step=".1" data-co="tvaRate" value="${(co.tvaRate * 100).toFixed(1)}"></div><div class="field"><label>Délai de paiement (jours)</label><input class="inp" type="number" min="0" max="120" step="1" data-co="terms" value="${co.terms}"></div></div></div>
        <div class="set-sec"><div><h3>Entreprise</h3><p>Repris sur les factures, les reçus de sortie, les demandes de prise en charge et les messages aux clients.</p></div>
          <div class="fgrid">${[['name', 'Raison sociale'], ['address', 'Adresse'], ['phone', 'Téléphone'], ['email', 'E-mail'], ['siret', 'SIRET'], ['tvaIntra', 'TVA intracommunautaire'], ['iban', 'IBAN'], ['bic', 'BIC'], ['hours', 'Horaires'], ['bank', 'Banque']].map(([k, l]) => `<div class="field"><label>${l}</label><input class="inp" data-txt="${k}" value="${esc(co[k] || '')}"></div>`).join('')}</div></div>
        <div class="set-sec"><div><h3>Modules</h3><p>Ce qui est affiché dans MOTEK. Le profil « Dépanneur-remorqueur » cache les modules d’atelier ; un dépanneur qui répare aussi peut les réactiver.</p></div>
          <div class="fgrid c3">${CX.ACTIVITIES.filter(a => ['depannage', 'parc', 'assurances', 'agent', 'atelier'].includes(a.k)).map(a => `<label class="field" style="flex-direction:row;align-items:center;gap:10px;cursor:pointer"><input type="checkbox" data-act="${a.k}" ${co.activities[a.k] !== false ? 'checked' : ''} ${a.k === 'depannage' ? 'disabled' : ''}><span><b>${esc(a.l)}</b><br><span class="muted xs-t">${esc(a.d)}</span></span></label>`).join('')}</div></div>
        <div class="set-sec"><div><h3>Données</h3><p>${S.pristine ? 'Jeu de démonstration (équipe réelle, dossiers fictifs), régénéré chaque jour pour garder des dates réalistes tant que rien n’a été modifié.' : 'Données réelles du dépanneur, enregistrées sur le serveur.'}</p></div>
          <div class="row wrap"><button class="btn pri" data-save>${BO.icon('check', 15)}Enregistrer les paramètres</button><button class="btn" data-export>${BO.icon('download', 15)}Exporter (JSON)</button><label class="btn">${BO.icon('upload', 15)}Importer (JSON)<input type="file" accept="application/json" data-import style="display:none"></label><span class="sp"></span><button class="btn danger" data-reset>${BO.icon('refresh', 15)}Réinitialiser la démo</button></div>
          <div class="xs-t muted mt1">${S.missions.length} missions · ${S.gardes.length} gardes · ${(S.dinvoices || []).length} factures · ${S.trucks.length} camions · ${S.drivers.length} dépanneurs</div></div>
      </div></div>`;
    el.querySelector('[data-save]').addEventListener('click', () => {
      const bad = [...el.querySelectorAll('[data-tarif],[data-parc],[data-co]')].find(i => i.value === '' || isNaN(+i.value) || +i.value < +i.min || +i.value > +i.max);
      if (bad) { bad.focus(); bad.style.borderColor = 'var(--red)'; UI.toast('Valeur invalide', 'Entre ' + bad.min + ' et ' + bad.max + '.', 'warn'); return; }
      el.querySelectorAll('[data-tarif]').forEach(i => { T[i.dataset.tarif] = +i.value; });
      el.querySelectorAll('[data-parc]').forEach(i => { P[i.dataset.parc] = +i.value; });
      el.querySelectorAll('[data-co]').forEach(i => { const k = i.dataset.co; co[k] = k === 'tvaRate' ? +i.value / 100 : +i.value; });
      el.querySelectorAll('[data-txt]').forEach(i => { co[i.dataset.txt] = i.value.trim(); });
      el.querySelectorAll('[data-act]').forEach(i => { if (!i.disabled) co.activities[i.dataset.act] = i.checked; });
      co.profile = CX.ACTIVITIES.every(a => CX.ACTIVITY_PROFILES.depannage.on.includes(a.k) === (co.activities[a.k] !== false)) ? 'depannage' : 'perso';
      CX.touch('settings'); APP.renderNav(); UI.toast('Paramètres enregistrés', 'Garde ' + chf(P.dailyFee) + ' / jour · TVA ' + BO.tvaLbl(), 'ok', 'settings'); BO.now();
    });
    el.querySelector('[data-export]').addEventListener('click', () => BO.download('motek-depann-' + U.today() + '.json', JSON.stringify(S, null, 2), 'application/json'));
    el.querySelector('[data-import]').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = async () => { try { const d = JSON.parse(rd.result); if (!d || d.v !== 1 || !Array.isArray(d.missions) || !Array.isArray(d.gardes)) throw new Error('format'); d.pristine = false; const cur = await fetch('/api/v3/state').then(r => r.json()); const r = await fetch('/api/v3/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: d, revision: cur.revision || 0 }) }); if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.error || 'Le serveur a refusé le fichier (' + r.status + ')'); } localStorage.setItem(CX.KEY, JSON.stringify(d)); localStorage.setItem(CX.KEY + ':rev', String((await r.json()).revision)); UI.toast('Import enregistré sur le serveur', 'Rechargement…', 'ok'); setTimeout(() => location.reload(), 600); } catch (err) { UI.toast('Import impossible', err.message === 'format' ? 'Fichier non reconnu.' : err.message, 'err'); } }; rd.readAsText(f); });
    el.querySelector('[data-reset]').addEventListener('click', () => BO.confirm('Réinitialiser la démonstration ?', 'Toutes les modifications (missions, gardes, factures…) seront remplacées par les données de départ.', 'Réinitialiser', () => { CX.reset(); }, true));
  }
  APP.register({ id: 'settings', label: 'Paramètres', icon: 'settings', group: 'Système', order: 1, activity: 'depannage', render });
})();
