# Brief pour Codex — état de MOTEK v3 et relecture demandée

Tu reprends le projet MOTEK après une série de sessions menées par Claude. Ce document est le point d'entrée : il décrit ce qui existe, où ça se trouve, comment le vérifier, ce qui reste discutable et ce que l'on attend de toi. Lis-le en entier avant de toucher au code.

## 1. Contexte en trois phrases

MOTEK est un CRM de garage automobile (carrosserie, mécanique, centre auto, concession) avec un « atelier live » en 3D et un back-office complet. Le dépôt contient deux interfaces : l'interface historique React/Three.js (`src/`, servie sur `/index.html`) et l'interface v3 (`motek/`, servie sur `/motek/` et par défaut à la racine en production), issue de la fusion d'un gabarit CRM-ERP acheté (« Carrosserie Centrale », fichier HTML unique) avec les fonctions propres à MOTEK. Le propriétaire a l'accord du vendeur du gabarit pour l'exploiter ; ce sujet est clos, ne le rouvre pas.

## 2. Dépôt, branches, démo

- Dépôt : `zczbgw9v6c-dot/MOTEK`.
- `main` : base historique.
- `claude/affectionate-heisenberg-qgv5d0` : reprise de l'interface historique (PR #1 ouverte vers `main`, détaillée dans `docs/MOTEK_REPRISE_CLAUDE.md`).
- `claude/motek-fusion` : **branche de référence actuelle**, contient tout ce qui suit. Elle inclut la branche précédente.
- Démo en ligne : https://motek-demo.onrender.com (Render, plan gratuit, Docker, branche `claude/motek-fusion`, protégée par HTTP Basic ; identifiant `motek`, mot de passe dans la variable `MOTEK_DEMO_PASSWORD` de Render). L'instance se rendort après inactivité et la base est réinitialisée à chaque redéploiement.
- Toute poussée sur `claude/motek-fusion` redéploie la démo.

## 3. Pile technique

- Node 22 (`node:sqlite`), Vite 7, TypeScript pour le serveur, JavaScript modules pour `motek/js`.
- Three.js 0.180, police Inter auto-hébergée (`@fontsource/inter`), tesseract.js 7 (OCR local, actifs dans `public/ocr`, licences Apache-2.0 vérifiées), pdfjs-dist.
- Aucun CDN, aucun service externe payant, aucune donnée personnelle envoyée hors du garage. Ces règles sont dans `AGENTS.md` et doivent être conservées.
- Scripts : `npm run dev` (Vite + API SQLite + SSE), `npm run build`, `npm start` (serveur de production `server/serve.ts`), `npm test` (66 tests Node sur l'interface historique), `npm run verify:ui` (parcours Chromium de l'interface historique), `npm run verify:v3` (parcours Chromium de la v3).

## 4. Carte des fichiers v3

```
motek/index.html                 coque : en-tête, atelier live (#view-map), back-office (#view-bo), chargeur
motek/css/00-fonts … 05-bloc     styles, palette bleue MOTEK (--red vaut #1768ee : alias historique conservé)
motek/js/01-socle-de-donnes-partag.js   état S (toutes les collections), graine de démo, règles métier,
                                        synchronisation serveur, activités, migrations ; window.CX
motek/js/02-composants-…         icônes, toasts, modale, plaque, avatars ; window.UI
motek/js/03-coque.js             bascule carte/back-office, navigation, recherche, cloche ; window.APP
motek/js/04-back-office.js       helpers de rendu, formulaires, tableaux, tiroir, impression, photos ; window.BO
motek/js/05 … 18                 modules back-office (tableau de bord, réception, OR, devis, sinistres,
                                 planning, clients, pièces, peinture, courtoisie, facturation, pointage,
                                 qualité, paramètres)
motek/js/19-bloc.js              APP.boot()
motek/js/20-atelier-live-3d.js   scène 3D (script minifié hérité du gabarit, retouché par remplacements
                                 ciblés : couleurs, enseignes, ouverture) ; expose window.MAP3D
motek/js/21-atelier-epure.js     mode épuré de la carte, barre de lieux, réglettes LED
motek/js/22-showroom.js          showroom / vente (activité concession)
motek/js/23-garage-intelligent.js cas similaires, scan carte grise, lecture de plaque, assistant vocal
motek/js/24-agent-ia.js          agent IA en mode simulé
server/v3-store.ts               persistance v3 (tables v3state / v3history, révision optimiste)
server/plugin.ts                 API Vite + production : /api/v3/state (GET/POST), /api/v3/events (SSE),
                                 /api/v3/reset, plus l'API historique
server/serve.ts                  serveur de production : fichiers dist/, API, mot de passe de démo,
                                 / → /motek/
scripts/verify-v3.mjs            parcours Chromium v3 (7 étapes)
scripts/franciser-motek.py       francisation idempotente du gabarit (déjà appliquée)
docs/MOTEK_V3_FUSION.md          périmètre détaillé de la fusion
docs/INTEGRATIONS_TELEPHONIE_CAMERA.md, docs/DEPLOIEMENT.md
```

## 5. Modèle de données et synchronisation

- Un seul objet d'état `S` (version `v: 1`, champ `day`), avec les collections : `customers`, `vehicles`, `ros` (ordres de réparation, étapes `STAGES` de `rdv` à `facture`), `quotes`, `claims`, `invoices`, `payments`, `parts`, `orders`, `suppliers`, `appts`, `courtesy`, `loans`, `staff`, `times`, `quality`, `showroom`, `cases` (mémoire de diagnostic), `agent` (réglages, journal, standard), `company` (taux, TVA 20 %, identité, `activities`, `profile`, `liveFinance`), `feed`, `activity`.
- Les données de démonstration sont fictives et régénérées chaque jour (dates relatives à `today()`).
- Persistance : cache localStorage (`motek-v3`, révision dans `motek-v3:rev`) + serveur SQLite. `CX.touch()`/`save()` poussent l'état complet (débounce 250 ms) avec la révision attendue ; 409 → `pull()`. SSE diffuse la nouvelle révision ; un onglet en mode carte recharge quand un autre poste a modifié l'état.
- `migrate(st)` complète un état ancien (activités, showroom, cas, agent, entretiens) ; à étendre à chaque nouveau champ.

## 6. Fonctionnalités livrées (à constater dans le navigateur)

1. **Francisation complète** : MOTEK, bleu `#1768ee`, euros fr-FR, TVA 20 %, plaques SIV, assureurs français, adresses lyonnaises, +33, SIRET / TVA intracommunautaire / IBAN-BIC, mentions légales françaises, noms de clients francisés, enseignes 3D MOTEK.
2. **Activités configurables** (Paramètres › Activités du garage) : profils carrosserie / garage toutes activités / concession / centre auto, cases par activité ; les modules portant `activity` disparaissent de la navigation et des indicateurs.
3. **Atelier live épuré** : un seul indicateur « Véhicules sur site » ; postes et suivi de réparation visibles seulement dans l'atelier, la cabine et la réception ; option « Atelier live détaillé ». Barre de lieux à gauche (Site, Atelier, Peinture, Réception, Accueil, Bureau, Magasin, Parking + visite guidée). Ouverture sur la vue d'ensemble. Couleurs : accents bleus, ponts noirs, dalle grise, réglettes LED suspendues.
4. **Showroom / vente** : fiches véhicules (année, km, nombre de mains, énergie, boîte, prix TTC, statut), réservation avec acompte, vente, affiche vitrine A4, export CSV, marge brute visible en back-office seulement.
5. **Garage intelligent** : cas similaires (symptômes, codes DTC, cause, preuve, réparation ; import de rapport PDF/TXT/photo), scan carte grise avec OCR local et création client + véhicule + dossier après confirmation champ par champ, lecture de plaque simulée (confirmée / à valider / inconnue / doublon), assistant vocal à confirmation obligatoire (chiffres du jour, localiser, ouvrir, travaux terminés, pièce manquante, note, message client, relance devis, rendez-vous, blocage). Micro du navigateur désactivé par défaut.
6. **Agent IA (mode simulé)** : suggestions calculées localement (véhicule prêt non prévenu, relances de devis, factures échues, rappels d'entretien et de contrôle technique, avis après restitution, clients inactifs), chaque suggestion prépare un message que l'équipe valide ; journal ; réglages des délais ; standard téléphonique simulé avec dialogue d'exemple et prérequis de raccordement.
7. **Photos d'OR réelles** : import multiple et prise de vue depuis tablette/smartphone, réduction côté navigateur (1200 px JPEG), visionneuse (légende, avant/après, suppression), partage entre postes.
8. **Persistance partagée** multi-postes, vérifiée à deux pages.

## 7. Comment vérifier

```sh
npm install
npx playwright install chromium          # une fois
AUTOHUB_DB=.data/verify-v3.sqlite npm run dev
npm run verify:v3                        # 7/7 attendu, captures dans .data/verify-v3/
npm test                                 # 66 tests de l'interface historique
npm run build
```

Dernier état connu : `verify:v3` 7/7, `npm test` 66/66, build OK, branche `claude/motek-fusion` à jour.

## 8. Limites connues et dettes

- `motek/js/20-atelier-live-3d.js` est minifié. Il a été modifié uniquement par remplacements ciblés (palette, enseignes, ouverture, exposition de `window.MAP3D`). Ne pas le reformater à la main ; privilégier des ajouts depuis `21-atelier-epure.js` via `MAP3D` (scène, groupe, THREE, matériaux). À terme, une scène MOTEK écrite de zéro (l'interface historique en possède déjà une dans `src/scene.ts`) serait plus saine.
- Les zones 3D ne suivent pas encore les activités désactivées.
- Aucun fournisseur raccordé : SMS, e-mail, téléphonie, caméra, voix. Les messages sont « marqués envoyés » après validation humaine. Contrats d'intégration dans `src/integrations/`.
- L'état complet est poussé à chaque modification (quelques centaines de Ko, plus les photos). Acceptable pour la démo ; à découper par collection si le volume monte.
- `01-socle` fait 6 000 lignes dont 5 000 de graine de démo : à extraire dans un fichier de données séparé.
- L'alias CSS `--red` désigne le bleu MOTEK (héritage du gabarit) : renommage possible mais touche tous les fichiers CSS.
- Playwright n'est pas installé sur le Mac du propriétaire ; `verify:v3` a été rejoué uniquement dans l'environnement de Claude et le build de production local.

## 9. Ce que l'on attend de toi

1. **Constater** : lance les vérifications du §7, ouvre la démo, parcours chaque module avec le profil « Garage toutes activités » puis « Concession » et « Centre auto ».
2. **Relire** avec un œil critique : logique métier des OR, devis, facturation (TVA, acomptes, cession de créance), cohérence des statuts, cas limites de la synchronisation (deux onglets, conflit 409, rechargement), sécurité du serveur de production (chemins, mot de passe, en-têtes), accessibilité tablette.
3. **Proposer** : ce qui manque pour un garage réel (le père de Samuel, garagiste, va tester), ce qui est inutile ou redondant entre les modules, ce qui doit être simplifié. Fais une liste priorisée avec effort estimé, avant de coder.
4. **Règles** : garder `AGENTS.md` (isolation, pas de service payant sans accord, licences des actifs), ne pas casser `npm test` ni `verify:v3`, ajouter une étape à `scripts/verify-v3.mjs` pour toute fonctionnalité nouvelle, commits en français et descriptifs, travailler sur une branche dédiée et ouvrir une PR vers `claude/motek-fusion` pour relecture croisée avec Claude.
5. **Ne pas faire** : réécrire les modules sans raison, réintroduire des CDN, envoyer des données à un service externe, modifier le script 3D minifié autrement que par remplacements ciblés documentés, demander ou stocker des mots de passe dans le dépôt.

## 10. Questions ouvertes pour le propriétaire (à poser, pas à trancher seul)

- Ordre des prochaines fonctionnalités : détails réalistes de la scène 3D, zones 3D liées aux activités, mode tablette/gants (photos, contrôle qualité), ou connecteurs (SMS/e-mail d'abord ?).
- Faut-il un vrai compte utilisateur par employé (aujourd'hui `S.meId` fixe, un seul mot de passe de démo) ?
- Volume cible : nombre de postes, de dossiers par an, conservation des photos ; cela décide du découpage de l'état et du stockage des images.
