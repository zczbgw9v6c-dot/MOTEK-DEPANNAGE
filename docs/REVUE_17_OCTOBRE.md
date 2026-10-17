# Revue du 17 octobre 2026 — coordination avec Claude Code

La PR nº 1 et la branche `codex/revue-1` restent la base. Aucune fusion ni copie de la branche `claude/compassionate-faraday-iabz5f`. Les sources du tableau de bord « Mes dépanneurs », de l'assistant et de la recherche globale ne sont pas modifiées dans ce lot : Claude les portera après fusion.

## Corrections et équipe

- Trois dépanneurs : Dylan, Laurent, Trump ; Moïse et Florence à l'administration ; Joseph gérant.
- L'employé fictif « Damien Crettenand », hérité de l'atelier, devient le profil fonctionnel « Bureau Dan Dépanne », sans coordonnées inventées. Migration des anciens états et signature de relance fournisseur corrigées. Il ne représente pas un salarié supplémentaire.
- La réinitialisation de la démo appelait `seed()` sans `migrate()` : le catalogue commercial manquait et le formulaire de mission plantait. Les migrations s'appliquent désormais immédiatement après réinitialisation ; test de non-régression ajouté.
- Le script navigateur utilisait les anciens effectifs et oubliait l'acceptation manuelle du prix. Il vérifie maintenant trois dépanneurs et trois personnes au bureau, et confirme le prix dans le parcours de facturation.
- Les modales laissées par une étape pouvaient masquer les captures des suivantes. Chaque étape les ferme avant de commencer.

## Module commercial local

Nouvelle entrée « Publicités & prospects », sans nouvelle dépendance, sans compte publicitaire requis et sans appel à un service publicitaire.

- Catalogue de 14 prestations sourcées, trois montants « dès … TTC » par page, contradictions conservées. Tarifs non validés par défaut ; le bureau peut déclarer un montant de départ et les conditions validées par Joseph. Les missions existantes ne sont pas réévaluées.
- Aucun tarif de gardiennage trouvé sur le site : les valeurs existantes restent de démonstration, mention explicite dans le catalogue.
- Préparation de brouillons Google ou Meta par prestation et département couvert, budget **total** prévu (50 € par défaut), durée (5 jours par défaut), répartition journalière indicative. Aucun plafond réel n'est imposé à une plateforme.
- Titres Google, descriptions, texte Facebook/Instagram et lien UTM. « Prix sur devis » tant que le tarif commercial n'a pas été validé. Génération déterministe locale, pas de modèle externe ni de promesse d'agent connecté.
- Validation humaine pour export, puis téléchargement JSON réel du brouillon. Ce fichier prépare une saisie manuelle dans les outils publicitaires ; ce n'est pas un import natif ni une publication.
- Relevés de dépenses et clics exclusivement manuels et sourcés. Les dépassements du budget prévu sont conservés et signalés ; les performances inconnues restent non renseignées.
- Prospects saisis par le bureau avec contact valide, origine, prestation, département, campagne facultative, notes et suivi Nouveau / À rappeler / Qualifié / Converti / Perdu. « Converti » est une déclaration manuelle, sans création automatique de mission. Un clic n'identifie jamais un prospect.
- Tout reste dans l'état applicatif local/serveur habituel, avec journal des actions ; aucune transmission de contacts à Google, Meta ou Windsor.ai.

## Validation

Les résultats définitifs et captures de cette révision sont publiés avec ce document. La précédente exécution intermédiaire a atteint 20/20 étapes navigateur, 100/100 tests et une compilation réussie avant l'ajout commercial. La vérification finale ajoute les parcours commerciaux et leurs captures desktop/iPad.

## Suite recommandée

Essai réel avec Joseph, validation des prestations et conditions tarifaires contradictoires, puis contrôle des coordonnées légales avant documents réels. L'authentification et les droits individuels restent à développer. Pour la publicité : connecter ultérieurement les comptes de Joseph, définir les conversions consenties côté site et les conditions de publication ; ne pas transformer le budget prévu en engagement de dépense sans validation explicite.

Le contrôle du déplacement de mission déclenche les événements HTML5 `dragstart`, `dragover`, `drop` et `dragend` avec un même `DataTransfer` dans Chromium, puis vérifie l'affectation réelle. Ce pilotage évite qu'un rerendu pendant un déplacement physique automatisé laisse Chromium en session de drag et bloque les clics suivants. La réaffectation tactile est contrôlée séparément par clics réels sur le formulaire. Les échecs de parcours produisent désormais une capture de diagnostic et rétablissent le pointeur et la taille de fenêtre.


## Résultats définitifs

- `npm test` : **102/102**, aucun échec.
- `npm run build` : **réussi** ; avertissement existant de taille de bundles conservé.
- `node scripts/verify-depannage.mjs http://127.0.0.1:5177` avec `AUTOHUB_DB=.data/verify-reprise-17.sqlite` : **22/22**, aucune erreur JavaScript de page. Chromium local, desktop 1500×1000, iPad 1180×820 et 820×1180, téléphone 390×844.
- `git diff --check` : réussi.

[Résultats structurés](revue-1/results.json). Captures finales : [bureau](revue-1/after/desktop-bureau.png), [mission](revue-1/after/desktop-missions.png), [publicité et export](revue-1/after/desktop-publicite.png), [prospects](revue-1/after/desktop-prospects.png), [catalogue desktop](revue-1/after/desktop-catalogue.png), [catalogue iPad paysage](revue-1/after/ipad-landscape-catalogue.png), [catalogue iPad portrait](revue-1/after/ipad-portrait-catalogue.png), [parc iPad paysage](revue-1/after/ipad-landscape-parc.png), [parc iPad portrait](revue-1/after/ipad-portrait-parc.png).

Les images `before/` restent la base historique `00ef942`. Les captures actualisées ci-dessus sont celles de la révision du 17 octobre ; les autres anciennes captures sont conservées comme historique de la première revue.
