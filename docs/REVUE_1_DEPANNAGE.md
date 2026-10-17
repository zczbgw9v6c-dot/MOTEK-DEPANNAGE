# Revue 1 — MOTEK Dépann

> Mise à jour du 17 octobre : lire [REVUE_17_OCTOBRE.md](REVUE_17_OCTOBRE.md). Module commercial local ajouté ; validation finale : 102 tests et 22 parcours navigateur réussis. Le contenu initial ci-dessous est historique.

Branche `codex/revue-1`, destinée uniquement à `zczbgw9v6c-dot/MOTEK-DEPANNAGE`. Le dépôt MOTEK n’a pas été modifié. Version de départ : `00ef942`.

## Résultat pour Joseph et ses chauffeurs

- **Planning camions** : journée sélectionnable, missions triées par heure prévue dans chaque ligne de camion, file des demandes sans camion, réaffectation par glisser-déposer ou bouton tactile. Une seule mission opérationnelle simultanée par camion et chauffeur ; les missions déjà en intervention se terminent avant une nouvelle affectation.
- **Poste chauffeur** : choix d’un chauffeur de démonstration, ses missions, adresse et consignes, appel du client, départ/sur place/remorquage/livraison, première place libre au parc en un geste. Six photos maximum par mission, compression locale et stockage sur le serveur du garage avec les outils existants.
- **Parc** : entrée idempotente depuis une mission, contrôle des places et plaques déjà présentes, frais figés à la sortie, réceptionnaire conservé et reçu imprimable réouvrable. Une place libre cliquée est présélectionnée dans le formulaire. Relance groupée des gardes anciennes par mandant, préparée puis déclarée envoyée par l’humain.
- **Assureurs** : attentes d’accord, accords réellement prêts à facturer, impayés TTC et délai moyen entre émission et règlement intégral daté, regroupés par compagnie/mandant. Le nom ouvre les dossiers correspondants.
- **Agent simulé** : références et plaques normalisées, montant français extrait du texte, contradictions et rapprochements multiples bloqués, compagnie contrôlée lorsqu’elle est identifiable dans l’expéditeur fictif. Analyse et avertissement visibles avant application. Les annonces de virement restent des annonces ; aucun règlement n’est créé.
- **Facturation** : acompte déclaré et imputé une fois sur la facture finale ; avoir motivé sur le solde non réglé ; journal des ventes CSV équilibré (411000 / 706000 / 445710) et export CSV du suivi. Les sommes réglées ne sont pas remboursées artificiellement. Les documents sont explicitement fictifs et l’export est une préparation à valider.

## Bugs corrigés à la source

1. Un camion affecté était encore compté disponible ; les affectations contournables permettaient de réutiliser un camion/chauffeur occupé ou en entretien. Contrôles dans la règle métier, réconciliation des statuts et migration des anciennes affectations incompatibles avec historique.
2. Les missions déposées restaient « en cours » dans plusieurs écrans. Définition commune des missions actives, distincte des missions terminées restant à facturer.
3. « Facturer » pouvait seulement changer le statut. Une vraie facture liée est désormais créée ; la numérotation utilise le maximum existant et les doublons sont refusés.
4. Dépôt répété, place inconnue/occupée et véhicule déjà présent n’étaient pas protégés dans la règle. L’entrée est validée et idempotente.
5. La démo contenait deux missions déposées sans garde liée, des gardes facturées/payées sans facture, et trois factures historiques sans garde source. Les seeds sont reliés ; la migration ne fabrique ni facture ni paiement pour les anciennes mentions injustifiées.
6. Le parcours des assureurs ne représentait que trois mandants dans les gardes à cause d’un pas de trois dans une liste de neuf. Répartition sur tous les mandants et courriel de démonstration ajusté au bon assureur.
7. L’abandon présumé dépendait aussi de la parité du véhicule dans le seed. Les seuils de durée sont cohérents avec la règle du parc.
8. Un courriel était rapproché du premier dossier partageant une référence **ou** une plaque, et pouvait annoncer à tort un règlement enregistré. Les preuves doivent se recouper ; l’application est unique et tracée.
9. Les paiements négatifs/non finis/supérieurs au solde et les poses avant réception étaient acceptés. Contrôles métier et validation serveur complémentaire sur les collections, montants et photos du dépannage.
10. Les frais nuls étaient remplacés par le tarif par défaut. Le zéro est conservé, le tarif administratif est migré et les frais de sortie restent figés.
11. L’édition d’une mission facturée ou d’une garde clôturée pouvait modifier les données servant de justificatif. Ces formulaires sont désactivés après clôture.
12. La scène était reconstruite intégralement à chaque note ou message, et la coque pouvait recharger la page à la réception d’un état distant. Objets 3D conservés par identifiant et signature visuelle ; seules les représentations modifiées sont recréées, avec libération des ressources retirées.
13. Les voitures 3D étaient positionnées selon leur rang d’arrivée plutôt que leur place enregistrée. Les emplacements correspondent maintenant au plan du parc. La limite de recul empêchait le cadrage portrait.
14. Des compteurs ouvraient une liste sans filtre, et plusieurs indicateurs n’ouvraient rien. Les indicateurs métiers ouvrent leurs cohortes et sont utilisables au clavier.
15. Les anciens dialogues pouvaient rester superposés à la visite guidée. Fermeture centralisée avec retrait des gestionnaires de clavier ; les 14 étapes ouvrent le bon écran et décrivent les limites réelles.
16. Après un refus assureur, la facturation pouvait encore désigner cet assureur. Elle exige désormais une clarification du payeur ; aucun changement automatique vers le propriétaire.

## Épuration et visuel

La première liste du tableau de bord affiche les huit priorités au lieu d’une longue accumulation ; les modules détaillés restent disponibles. Les arbres décoratifs du site ont été retirés. Le cadrage complet et les cadrages par niveau sont accessibles, les panneaux bas restent visibles et défilables sur iPad, la barre du haut ne déborde plus en portrait et le poste chauffeur dispose de grandes commandes.

Les modules atelier masqués sont conservés. Aucune dépendance ajoutée. Retrait du lien symbolique `node_modules` suivi par Git, qui pointait vers `/home/user/MOTEK/node_modules` : l’installation locale doit rester dans le dossier ignoré `node_modules/`.

## Vérifications reproductibles

```sh
npm ci
npm test
npm run build
AUTOHUB_DB=.data/verify-dep.sqlite npm run dev
node scripts/verify-depannage.mjs
```

Chromium doit être installé (`npx playwright install chromium`). Dans cet environnement, ses fichiers sont isolés dans `/private/tmp/motek-browsers` et les commandes navigateur sont préfixées par `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/motek-browsers`.

- Départ : 83 tests unitaires, build réussi, 12/12 parcours navigateur.
- Livraison : **97 tests unitaires**, build réussi, **20/20 parcours navigateur**, aucune erreur JavaScript de page.
- Les 14 nouveaux tests couvrent affectation, transitions, dépôt, frais, sortie, factures, paiements, acompte, avoir, classement, commandes, migration et validation serveur.
- Le script étendu exerce réellement la réaffectation tactile et le glisser-déposer, le téléphone 390×844 avec photo, le reçu, la relance groupée, le téléchargement du CSV, l’équilibre comptable, le filtre du tableau de bord et la conservation des objets 3D.
- iPad : 1180×820 et 820×1180 ; panneau du parc visible, pas de débordement de page. Contrôle Chromium avec viewport, pas essai physique sur Safari/iPad.
- Avertissement de build conservé : certains bundles hérités dépassent 500 ko. Ce n’est pas une erreur de compilation.

Rapports bruts et résultats structurés : [revue-1](revue-1/).

## Captures

Les captures utilisent des données fictives. Les vues avant proviennent d’une copie intacte du commit initial ; les vues après d’une base indépendante des scénarios de vérification.

| Écran | Avant | Après |
|---|---|---|
| Tableau de bord desktop | [Avant](revue-1/before/desktop-dashboard.png) | [Après](revue-1/after/desktop-dashboard.png) |
| Tableau de bord iPad paysage | [Avant](revue-1/before/ipad-landscape-dashboard.png) | [Après](revue-1/after/ipad-landscape-dashboard.png) |
| Tableau de bord iPad portrait | [Avant](revue-1/before/ipad-portrait-dashboard.png) | [Après](revue-1/after/ipad-portrait-dashboard.png) |
| Parc 3D desktop | [Avant](revue-1/before/desktop-parc.png) | [Après](revue-1/after/desktop-parc.png) |
| Parc 3D iPad paysage | [Avant](revue-1/before/ipad-landscape-parc.png) | [Après](revue-1/after/ipad-landscape-parc.png) |
| Parc 3D iPad portrait | [Avant](revue-1/before/ipad-portrait-parc.png) | [Après](revue-1/after/ipad-portrait-parc.png) |
| Niveau -1 iPad portrait | [Avant](revue-1/before/ipad-portrait-niveau-1.png) | [Après](revue-1/after/ipad-portrait-niveau-1.png) |

Nouveaux écrans : [planning desktop](revue-1/after/desktop-planning-dep.png), [planning iPad](revue-1/after/ipad-landscape-planning-dep.png), [chauffeur téléphone](revue-1/after/phone-chauffeur.png), [chauffeur iPad portrait](revue-1/after/ipad-portrait-chauffeur.png), [compagnies](revue-1/after/desktop-mandats.png).

## Suite recommandée

1. Faire parcourir une vraie journée à Joseph et à deux chauffeurs sur leurs iPad et téléphones : taille des commandes, endroits de prise de photo, remise des clés et vocabulaire des mandants.
2. Avant des données réelles : comptes individuels, droits serveur, HTTPS, sauvegarde persistante et restauration testée. Le sélecteur chauffeur et les accès du bureau restent des démonstrations.
3. Renforcer le planning avec créneaux, durées, chevauchements et absences, puis file hors connexion. Cette version garde volontairement une seule mission opérationnelle par équipage et n’optimise pas les tournées.
4. Faire valider les tarifs de garde, la TVA, les modèles de facture/avoir/acompte et le mapping du journal des ventes par le comptable. L’export n’est pas un FEC et n’exporte pas un journal bancaire.
5. Définir ensuite les raccordements mail/WhatsApp et les relances commerciales avec consentements et preuves d’envoi. Aucun raccordement ni publicité payante n’est activé dans cette PR.
6. Poursuivre l’allègement des bundles hérités et valider la 3D sur Safari/iPad réel. L’aperçu complet sert au repérage ; les plaques se consultent dans le cadrage du niveau, le panneau ou le dossier.
