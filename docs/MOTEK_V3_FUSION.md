# MOTEK v3 — fusion du CRM « Carrosserie Centrale » et de MOTEK

Interface : `motek/` (servie sur `/motek/`, et par défaut à la racine du serveur de production).
L’ancienne interface React reste accessible sur `/index.html` ; ses tests (`npm test`, 66 tests) restent verts.

## Ce qui a été fait

1. **Reprise du gabarit** : le fichier HTML unique (650 Ko) a été découpé en `motek/index.html`, `motek/css/00…05` et `motek/js/01…24` (scripts `type="module"`, ordre conservé). Three.js et la police Inter sont servis localement par Vite ; aucun CDN.
2. **Francisation et renommage** (`scripts/franciser-motek.py`, idempotent) : MOTEK, bleu `#1768ee`, euros (format fr-FR), TVA 20 %, plaques SIV `AA-123-AA`, assureurs français, adresses lyonnaises, téléphones +33, SIRET / TVA intracommunautaire / IBAN-BIC, mentions légales françaises (art. L441-10 du Code de commerce), enseignes 3D « MOTEK · GARAGE », noms de clients francisés. Les logos et textes « Carrosserie Centrale SA » n’apparaissent plus.
3. **Persistance partagée** : état versionné dans SQLite (`server/v3-store.ts`, routes `/api/v3/state`, `/api/v3/events` en SSE, `/api/v3/reset`). Plusieurs postes voient les mêmes données ; un onglet ouvert recharge l’atelier live quand un autre poste modifie les données. Cache local par onglet avec révision mémorisée (plus de rechargement en boucle).
4. **Activités configurables** (Paramètres › Activités du garage) : profils *Carrosserie-peinture*, *Garage toutes activités*, *Concession*, *Centre auto / entretien rapide* et cases par activité (carrosserie, peinture, mécanique, pneus, vitrage, assurances, véhicules de remplacement, showroom, garage intelligent, agent IA). Les modules inutiles disparaissent de la navigation et des indicateurs.
5. **Atelier live épuré** (`21-atelier-epure.js`) : un seul indicateur « Véhicules sur site » ; postes et suivi de réparation n’apparaissent que dans l’atelier (postes + suivi), la cabine (suivi) et la réception (postes). Accueil, bureau, magasin, parking : carte seule. Option « Atelier live détaillé » pour tout réafficher. CA et délais restent dans le back-office.
6. **Showroom / vente** (`22-showroom.js`, activité *showroom*) : fiches véhicules (année, km, nombre de mains, énergie, boîte, prix TTC, statut, âge en stock, demandes), réservation avec acompte, vente avec prix final et reprise, affiche vitrine A4, export CSV, marge brute visible uniquement en back-office.
7. **Garage intelligent** (`23-garage-intelligent.js`, activité *intelligence*) :
   - *Cas similaires* : mémoire de diagnostic (symptômes, codes DTC, cause, preuve, réparation), pertinence par termes partagés et même modèle, import d’un rapport (PDF texte, TXT, photo via OCR local), nouveau cas depuis un OR.
   - *Scan carte grise → fiche client* : OCR tesseract **dans le navigateur** (actifs `public/ocr`, licences Apache-2.0 vérifiées), champs A, B, C.1, C.3, D.1, D.2, D.3, E, J.1, P.1, P.3, P.6 à confirmer un par un, identification locale par plaque/VIN (identifié, conflit, inconnu), création client + véhicule (+ dossier) ; le titulaire C.1 n’est jamais repris automatiquement.
   - *Lecture de plaque à l’entrée* : simulation d’une lecture ANPR (plaque + confiance) rapprochée des dossiers : confirmée, à valider, inconnue, doublon. Aucune caméra raccordée.
   - *Assistant vocal* : commandes en langage naturel (chiffres du jour, localiser, ouvrir, travaux terminés → contrôle qualité, pièce manquante → tâche + alerte magasin, note au dossier, message client, relance devis, rendez-vous, blocage). Chaque commande est reformulée et **confirmée** avant exécution. Le micro du navigateur est désactivé par défaut (l’audio peut transiter par le fournisseur du navigateur) ; la saisie texte fonctionne toujours.
8. **Agent IA** (`24-agent-ia.js`, activité *agent*, **mode simulé**) : suggestions calculées localement — véhicule prêt non prévenu, relances de devis (après N jours), factures échues, rappels d’entretien (« vidange il y a 2 ans », km parcourus), contrôle technique à venir ou dépassé, demande d’avis après restitution, clients inactifs. Chaque suggestion prépare un SMS / e-mail que l’équipe relit et valide ; journal des actions ; réglages des délais ; standard téléphonique simulé (dialogue d’exemple, message d’accueil, prérequis pour un vrai raccordement).

## Ce qui reste à décider ou à faire

- **Licence du gabarit** : le LISEZ-MOI du pack autorise la démonstration à des prospects et l’inspiration ; la réutilisation commerciale du code HTML doit être confirmée par écrit par le vendeur avant toute mise en production ou publication.
- **Services externes** : aucun fournisseur (voix, téléphonie, caméra, e-mail/SMS) n’est raccordé ; les messages sont préparés et marqués « envoyés » après validation humaine. Les contrats d’intégration sont dans `src/integrations/` et `docs/INTEGRATIONS_TELEPHONIE_CAMERA.md`.
- **Carte 3D** : le script `motek/js/20-atelier-live-3d.js` est minifié (fourni ainsi par le gabarit). Les zones, postes et scénarios y sont figés ; les activités ne masquent pas encore les zones 3D correspondantes.
- **Données de démonstration** : fictives, régénérées chaque jour (dates réalistes) ; « Réinitialiser la démo » dans Paramètres.
- Entité client indépendante avec plusieurs véhicules : présente dans v3 (Clients & véhicules).

## Vérifier

```sh
npm run dev                 # http://127.0.0.1:5173/motek/
npm run verify:v3           # scénario Chromium : activités, showroom, garage intelligent, agent IA
npm run build && npm run serve   # serveur de production, / → /motek/
```

`verify:v3` lance Vite sur une base isolée (`.data/verify-v3.sqlite`), rejoue les parcours et écrit des captures dans `.data/verify-v3/`.
