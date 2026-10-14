/* ==========================================================================
   BO · Paramètres : taux horaires T1/T2/T3/peinture, ingrédients, petite
   fourniture, TVA, entreprise, données de démonstration (reset / export).
   ========================================================================== */
(function () {
  const U = CX.util, { esc, chf, chf2 } = U;

  function render(el) {
    const S = CX.S, co = S.company, R = co.rates, size = (() => { try { return Math.round((localStorage.getItem(CX.KEY) || '').length / 1024); } catch (e) { return 0; } })();
    const sample = CX.quoteTotals(CX.quote('D1'));
    el.innerHTML = `<div class="bo-page">${BO.head('Paramètres', 'Tarification atelier, entreprise et données de démonstration')}
      <div class="card pad">
        <div class="set-sec"><div><h3>Taux horaires</h3><p>Utilisés par le chiffrage, les OR et la facturation. T1 = mécanique / démontage, T2 = tôlerie, T3 = structure, marbre & aluminium.</p></div>
          <div><div class="rate-card">${[['T1', 'T1 · Mécanique'], ['T2', 'T2 · Tôlerie'], ['T3', 'T3 · Structure'], ['P', 'Peinture']].map(([k, l]) => `<div><b>${l}</b><div class="row"><input class="inp" type="number" min="50" max="300" step="1" data-rate="${k}" value="${R[k]}"><span class="muted sm-t">€/h</span></div></div>`).join('')}</div>
          <div class="fgrid c3 mt"><div class="field"><label>Ingrédients peinture (€ / h peinture)</label><input class="inp" type="number" min="0" max="200" step="1" data-co="paintMat" value="${co.paintMat}"></div><div class="field"><label>Petite fourniture (% MO)</label><input class="inp" type="number" min="0" max="10" step=".5" data-co="smallPct" value="${co.smallPct * 100}"></div><div class="field"><label>Plafond petite fourniture (€)</label><input class="inp" type="number" min="0" max="500" step="5" data-co="smallMax" value="${co.smallMax}"></div></div>
          <div class="form-note mt">${BO.icon('calc', 16)}<div>Exemple — devis D-24817 (Golf, choc AV) avec les taux actuels : <b data-ex>${chf2(sample.ttc)}</b> TTC.</div></div></div></div>
        <div class="set-sec"><div><h3>TVA & conditions</h3><p>Taux normal de TVA en France : 20 %. Délai de paiement client et durée de garantie travaux.</p></div>
          <div class="fgrid c3"><div class="field"><label>TVA (%)</label><input class="inp" type="number" min="0" max="20" step=".1" data-co="tvaRate" value="${(co.tvaRate * 100).toFixed(1)}"></div><div class="field"><label>Délai de paiement (jours)</label><input class="inp" type="number" min="0" max="120" step="1" data-co="terms" value="${co.terms}"></div><div class="field"><label>Garantie travaux (mois)</label><input class="inp" type="number" min="0" max="60" step="1" data-co="warrantyMonths" value="${co.warrantyMonths}"></div><div class="field"><label>Heures productives / jour / technicien</label><input class="inp" type="number" min="4" max="10" step=".1" data-co="hoursDay" value="${co.hoursDay}"></div></div></div>
        <div class="set-sec"><div><h3>Entreprise</h3><p>Repris sur les devis, factures et contrats.</p></div>
          <div class="fgrid">${[['name', 'Raison sociale'], ['address', 'Adresse'], ['phone', 'Téléphone'], ['email', 'E-mail'], ['siret', 'SIRET'], ['tvaIntra', 'TVA intracommunautaire'], ['iban', 'IBAN'], ['bic', 'BIC'], ['bank', 'Banque'], ['review', 'Lien avis Google']].map(([k, l]) => `<div class="field ${k === 'review' ? 'full' : ''}"><label>${l}</label><input class="inp" data-txt="${k}" value="${esc(co[k] || '')}"></div>`).join('')}</div></div>
        <div class="set-sec"><div><h3>Données de démonstration</h3><p>Les données sont stockées localement dans ce navigateur (${size} Ko) et régénérées chaque jour pour garder des dates réalistes.</p></div>
          <div class="row wrap"><button class="btn pri" data-save>${BO.icon('check', 15)}Enregistrer les paramètres</button><button class="btn" data-export>${BO.icon('download', 15)}Exporter (JSON)</button><label class="btn">${BO.icon('upload', 15)}Importer (JSON)<input type="file" accept="application/json" data-import style="display:none"></label><span class="sp"></span><button class="btn danger" data-reset>${BO.icon('refresh', 15)}Réinitialiser la démo</button></div>
          <div class="xs-t muted mt1">${S.ros.length} OR · ${S.quotes.length} devis · ${S.invoices.length} factures · ${S.customers.length} clients · ${S.vehicles.length} véhicules · ${S.parts.length} articles</div></div>
      </div></div>`;
    const preview = () => { const tmp = JSON.parse(JSON.stringify(co)); el.querySelectorAll('[data-rate]').forEach(i => { tmp.rates[i.dataset.rate] = +i.value; }); ['paintMat', 'smallMax'].forEach(k => { tmp[k] = +el.querySelector(`[data-co="${k}"]`).value; }); tmp.smallPct = +el.querySelector('[data-co="smallPct"]').value / 100; tmp.tvaRate = +el.querySelector('[data-co="tvaRate"]').value / 100; const saved = S.company; S.company = tmp; const t = CX.quoteTotals(CX.quote('D1')); S.company = saved; el.querySelector('[data-ex]').textContent = chf2(t.ttc); };
    el.querySelectorAll('[data-rate],[data-co]').forEach(i => i.addEventListener('input', preview));
    el.querySelector('[data-save]').addEventListener('click', () => {
      const bad = [...el.querySelectorAll('[data-rate],[data-co]')].find(i => i.value === '' || isNaN(+i.value) || +i.value < +i.min || +i.value > +i.max);
      if (bad) { bad.focus(); bad.style.borderColor = 'var(--red)'; UI.toast('Valeur invalide', 'Entre ' + bad.min + ' et ' + bad.max + '.', 'warn'); return; }
      el.querySelectorAll('[data-rate]').forEach(i => { co.rates[i.dataset.rate] = +i.value; });
      el.querySelectorAll('[data-co]').forEach(i => { const k = i.dataset.co; co[k] = k === 'smallPct' || k === 'tvaRate' ? +i.value / 100 : +i.value; });
      el.querySelectorAll('[data-txt]').forEach(i => { co[i.dataset.txt] = i.value.trim(); });
      CX.touch('settings'); UI.toast('Paramètres enregistrés', 'Taux T2 ' + co.rates.T2 + ' €/h · TVA ' + BO.tvaLbl(), 'ok', 'settings'); BO.now();
    });
    el.querySelector('[data-export]').addEventListener('click', () => BO.download('motek-' + U.today() + '.json', JSON.stringify(S, null, 2), 'application/json'));
    el.querySelector('[data-import]').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const d = JSON.parse(rd.result); if (!d || d.v !== 1 || !Array.isArray(d.ros)) throw new Error('format'); localStorage.setItem(CX.KEY, JSON.stringify(Object.assign(d, { day: U.today() }))); UI.toast('Import réussi', 'Rechargement…', 'ok'); setTimeout(() => location.reload(), 600); } catch (err) { UI.toast('Import impossible', 'Fichier non reconnu.', 'err'); } }; rd.readAsText(f); });
    el.querySelector('[data-reset]').addEventListener('click', () => BO.confirm('Réinitialiser la démonstration ?', 'Toutes les modifications (OR, devis, factures, pointages…) seront remplacées par les données de départ. L’atelier live redémarre son scénario.', 'Réinitialiser', () => { CX.reset(); }, true));
  }

  APP.register({ id: 'settings', label: 'Paramètres', icon: 'settings', group: 'Système', order: 1, render });
})();
