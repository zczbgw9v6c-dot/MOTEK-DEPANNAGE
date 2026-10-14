# MOTEK — reprise par Claude, audit pratique et corrections (14 octobre 2026)

Branche : `claude/affectionate-heisenberg-qgv5d0`, à partir de `main` (commit `ee44e0c`).
Ce document complète `docs/MOTEK_CRM_FIRST_AUDIT.md` ; il sert de passation à Codex ou à toute reprise.

## 1. État de départ vérifié

- `npm ci`, `npm run build` (tsc + Vite) et `npm test` : **57 tests réussis**, compilation réussie, comme annoncé.
- Application lancée et utilisée dans Chromium (Playwright, WebGL logiciel) : accueil, salle d’attente, clients, atelier, planning, devis, pièces, garage intelligent, rapports, réglages, équipe, plan 3D (zones, véhicule, dossier complet, mode mains sales), tablette 1024×768.

## 2. Problèmes constatés dans l’application (classés par impact)

| # | Impact | Constat | État |
|---|---|---|---|
| 1 | **Bloquant** | Checklist de fin de travaux (atelier) : la case se décochait seule et « Terminer » répondait « Complétez les trois points ». Même défaut sur technicien/poste/statut/qualité du dossier 3D et sur technicien/ressource du planning : l’audit notait l’action mais la valeur n’était pas enregistrée. Cause : `e.target.value/checked` lu dans le `commit` différé, après que React a restauré le champ contrôlé. | Corrigé + vérifié dans le navigateur |
| 2 | Fort | Affectation d’un technicien déjà en intervention active acceptée ; l’erreur n’apparaissait qu’au démarrage du chrono. | Refus à l’affectation + disponibilité affichée dans la liste |
| 3 | Fort | Dossiers du jeu d’essai « En intervention » sans liste de travaux : en-tête « Véhicule à prendre en charge » et bouton « Prendre en charge » qui déclarait en plus le client présent à l’accueil. | « Ouvrir le suivi des travaux » (action `open`, sans présence) |
| 4 | Fort | Le dossier (accueil/atelier) n’affichait ni blocage, ni motif de pause, ni pièce attendue. | Affiché dans la fiche et la liste |
| 5 | Moyen | Aucun état « devis refusé » : impossible de consigner un refus. | État `Refusé`, devis figé, véhicule sorti de « Devis à valider » |
| 6 | Moyen | Créneau de récupération un dimanche accepté sans avertissement quand les horaires ne sont pas renseignés. | Avertissement explicite ; refus dès que les horaires sont confirmés (déjà existant) |
| 7 | Moyen | « Vérifier le devis » ouvrait la page Devis vide ; il fallait deviner « Nouveau devis ». | Bouton « Créer le devis · véhicule » dans l’état vide |
| 8 | Visuel | Plaque illisible (blanc sur blanc) dans les en-têtes dossier et atelier ; compteurs sans filtre actif visible ; « Gestion » débordant en mode mains sales. | Corrigé |
| 9 | Moyen | Carrosserie : aucune étape de suivi. | Étapes préparation/réparation/peinture/contrôle ajoutées à l’ouverture d’un dossier Carrosserie/Peinture |
| 10 | Faible | « SMS de récupération · aucun envoi confirmé » affiché même sans message. | N’apparaît que s’il existe des messages préparés |

Fonctionnent de bout en bout (vérifié dans le navigateur, base isolée) : réception → prise en charge → affectation → devis soumis/accepté → démarrage → travaux cochés → checklist → fin → contrôle final → décompte → paiement partiel puis solde → contact → horaires → créneau hors ouverture refusé → créneau valide → remise des clés → dossier clôturé après rechargement. Également : pièce manquante → blocage → commande préparée → réception manuelle → validation responsable → reprise.

## 3. Fichiers modifiés

- `src/Workshop.tsx`, `src/main.tsx`, `src/Planning.tsx` : valeurs capturées avant `commit`.
- `src/core-domain.ts` : refus d’affectation d’un technicien occupé ; étapes carrosserie à l’ouverture d’un OR.
- `src/workflow-guidance.ts`, `src/CoreDesk.tsx` : guidage `open` vs `receive`, blocages et pièces dans la fiche, disponibilité des techniciens, avertissement horaires, filtres actifs.
- `src/quote-domain.ts`, `src/Quotes.tsx`, `src/domain.ts` : état « Refusé ».
- `src/GuidedContext.tsx` : messages préparés dans la synthèse 3D.
- `src/motek.css` : plaque, filtres, avertissements, mode mains sales.
- `vite.config.ts` : `AUTOHUB_DB` pour une base isolée.
- `scripts/verify-ui.mjs`, `package.json` (`verify:ui`).
- Tests : `tests/crm-reprise.test.ts` (4 tests), `tests/crm-polish.test.ts` (ajustement).

## 4. Vérifications effectuées

- `npm run build` : OK (avertissement de taille des bundles inchangé).
- `npm test` : **61 tests réussis**.
- `AUTOHUB_DB=.data/verify-ui.sqlite npm run dev` puis `npm run verify:ui` : 7 étapes réussies dans Chromium. Playwright n’est pas une dépendance du projet : `npm i -D playwright && npx playwright install chromium` une fois, ou pointer `executablePath` vers un Chrome existant.
- Aucun envoi externe, aucun service payant, aucune donnée réelle : tout a été fait sur le jeu d’essai ou une base isolée.

## 5. Restant à faire (par priorité)

1. **3D** : en vue Livraison, une cloison masque partiellement les véhicules prêts ; en vue Stocks le magasin est petit dans le cadre. Les personnages peuvent passer devant la voiture cadrée. Les étiquettes de plaque sont fines à distance.
2. **Entité client** indépendante (plusieurs véhicules, historique de fidélité) : toujours rattachée au dossier véhicule.
3. **Complément de devis** : une nouvelle version est possible, mais le décompte reste lié à un seul devis accepté ; prévoir plusieurs devis facturables ou un avenant.
4. **Communication** : messages préparés uniquement ; statut fournisseur (programmé/envoyé/échec/livré) à brancher lorsque le canal sera raccordé.
5. **Voix** : commandes locales à confirmation ; aucune reconnaissance installée ici (saisie écrite testée).
6. **Réceptionniste IA** et **caméra d’entrée** : non commencés ; besoin d’un arbitrage sur les services (téléphonie, STT/TTS, caméra) avant toute activation.
7. Jours fériés, absences, authentification et multi-sites : hors prototype.

## 6. Répartition proposée avec Codex

- Claude : parcours CRM (`core-domain`, `CoreDesk`, `Quotes`, `workflow-guidance`, tests métier, `verify-ui`).
- Codex : scène 3D (`scene.ts`, `camera-*.ts`, `marker-layout.ts`, `ZoneMarkers`, `CustomerMarkers`) et bibliothèque de modèles.
- Fichiers partagés à annoncer avant modification : `main.tsx`, `motek.css`, `domain.ts`, `server/store.ts`.
