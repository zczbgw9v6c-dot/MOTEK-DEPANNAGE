# Brief Codex — MOTEK Dépann (dépôt MOTEK-DEPANNAGE)

Tu reprends **MOTEK Dépann**, la plateforme de gestion d'un dépanneur-remorqueur parisien (Dan Dépann, 25 avenue Claude Vellefaux, 75010 Paris, 24h/24, agréé toutes assurances, 12 camions dont 5 paniers Toyota Hilux 2025, parc de gardiennage souterrain sur 3 niveaux). Le produit est dérivé de MOTEK (CRM de garage) mais c'est un dépôt séparé : **ne touche pas au dépôt MOTEK**.

Lis d'abord `README.md`, **`docs/AUDIT_CLAUDE_MOTEK_DEPANN.md`** (audit et refonte du 16 octobre : équipe réelle, bugs corrigés, ce qu'il reste à faire), `docs/MOTEK_V3_FUSION.md` (architecture héritée) et ce brief. Travaille sur une branche `codex/revue-1`, pousse, puis ouvre une PR vers `main`. Je lis la PR avant de merger.

## Démarrage

```bash
npm install
npm test                                   # 97 tests unitaires (node:test), dont tests/depannage.test.ts
npm run build                              # Vite
AUTOHUB_DB=.data/verify-dep.sqlite npm run dev   # http://127.0.0.1:5173/motek/
node scripts/verify-depannage.mjs          # 14 étapes Playwright (chromium requis), captures desktop / iPad / téléphone
```

Le serveur de démo Render est gratuit : pas de disque, les données repartent du jeu de démonstration à chaque redéploiement. `MOTEK_DEMO_PASSWORD` protège l'accès (HTTP Basic, utilisateur `motek`).

## Carte du code (`motek/`)

- `js/01-socle-de-donnes-partag.js` : état `S`, seeds (`seedDepannage` : camions, chauffeurs, parc, missions, gardes, courriels assureurs simulés, bureau, fournisseurs, commandes, WhatsApp, factures), règles, synchro serveur (révision, conflits), `migrate()`.
- `js/02` composants UI (`UI.icon`, `UI.truckIcon`, `UI.plate`, `UI.modal`…), `js/03-coque.js` (coque : modes carte / back-office, navigation, recherche, notifications, `APP.register/open/modules`), `js/04-back-office.js` (helpers `BO.*` : formulaires, tableaux, compose e-mail tracé, impression).
- Modules dépannage : `30-missions`, `31-flotte` (camions, chauffeurs, bureau & accès), `32-parc` (gardiennage, étapes du dossier), `33-tableau-de-bord-depannage`, `34-mandats-assurances`, `35-facturation-depannage`, `36-commandes-fournisseurs`, `37-agent-depannage` (courriels assureurs, relances, WhatsApp), `40-parc-live-3d` (scène Three.js : parc 3 niveaux, dépôt, bureau, panneaux), `25-prise-en-main` (visite page par page).
- Les modules atelier (05–18, 20–24, 26) sont présents mais masqués par `activity: 'atelier'` ; ne les supprime pas sans me le dire, ne les affiche pas.
- Serveur : `server/` (Fastify + SQLite, routes `/api/v3/*`), tests `tests/`, vérification `scripts/verify-depannage.mjs`.

## Ce que j'attends de toi

1. **Audit et tests.** Fais tourner tout ce qui existe. Ajoute des tests unitaires sur les règles métier du dépannage (statuts de mission et de camion, frais de garde, étapes du dossier, facture de mission / de garde, commandes, application d'un courriel assureur). Étends `verify-depannage.mjs` à ce que tu ajoutes. Tout doit rester vert.
2. **Bugs et cohérence des données.** Cherche les incohérences dans la démo (camion en entretien affecté à une mission, mission facturée sans facture, mandat sans référence, compteurs qui ne se recoupent pas entre tableau de bord, parc 3D et modules). Corrige à la source (seed ou règle), pas dans l'affichage.
3. **Épurer et synthétiser.** Supprime ce qui est décoratif ou non fonctionnel. Chaque chiffre affiché doit être cliquable vers sa liste. Réduis les écrans trop longs ; regroupe ce qui va ensemble. Garde le vocabulaire du métier (mission, remorquage, panier, plateau, gardiennage, mandant, expertise, prise en charge).
4. **Visuel.** Soigne la hiérarchie, les espacements, les états vides, le responsive (iPad paysage et portrait en priorité : c'est l'outil du bureau et des chauffeurs). Sur la carte 3D : lisibilité des plaques, cadrage des vues, panneaux bas qui restent lisibles quand on réduit la fenêtre, performance (pas de rebuild complet de la scène à chaque changement si seul un véhicule bouge).
5. **Fonctionnalités à renforcer** (dans cet ordre) :
   - planning du jour des missions par camion (vue chronologique, glisser une mission sur un autre camion) ;
   - écran chauffeur sur téléphone : ses missions, boutons Sur place / Remorquage / Déposée, appel du client, photos ;
   - parc : entrée au parc depuis une mission en un geste, sortie avec reçu imprimable, relance groupée des gardes d'un même assureur ;
   - assureurs : tableau par compagnie (en attente d'accord, à facturer, impayés, délai moyen de paiement) ;
   - agent : règles de classement des courriels plus robustes (référence sinistre, plaque, montant), journal lisible, tout reste en mode simulé et appliqué sur clic humain ;
   - facturation : avoir, acompte, export comptable propre.
6. **Prise en main.** Vérifie que chaque étape ouvre bien le bon écran et que le texte correspond à ce qu'on voit.

## Règles à respecter

- Aucun service payant, aucune clé d'API, aucune donnée personnelle envoyée à un service externe. Les e-mails, SMS et WhatsApp restent « préparés par MOTEK, envoyés par l'humain, tracés ensuite ». Ce qui est simulé doit le dire à l'écran.
- Pas de dépendance nouvelle sans justification dans la PR. Pas de framework : HTML, CSS, JS modules, Three.js, Fastify, SQLite.
- Compatibilité des états existants : tout nouveau champ passe par `migrate()`.
- Préserve les fonctions existantes ; si tu en retires une, dis pourquoi dans la PR.
- Ne pousse jamais sur `main` directement ; ne crée pas de PR vers le dépôt MOTEK.

## Livrable

Une PR vers `main` avec : la liste des bugs trouvés et corrigés, les fonctionnalités ajoutées ou retirées, les captures avant / après des écrans modifiés (desktop et iPad), le résultat de `npm test`, `npm run build` et `node scripts/verify-depannage.mjs`, et une liste courte de ce que tu recommandes pour la suite.
