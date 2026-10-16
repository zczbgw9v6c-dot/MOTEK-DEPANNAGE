# Audit et refonte MOTEK Dépann — passation à Codex

Branche : `claude/compassionate-faraday-iabz5f` (à relire puis fusionner dans `main`). Base : `00ef942`.

## Le client, en une minute

Joseph dirige **Dan Dépann**, dépanneur-remorqueur parisien (25 avenue Claude Vellefaux, 24h/24, agréé toutes compagnies, 12 camions dont 5 paniers Toyota Hilux 2025, parc souterrain sur 3 niveaux). Il n'est pas un utilisateur d'outils : l'écran doit répondre à trois questions — *qui est où, qu'est-ce qui attend, combien on me doit* — et rien d'autre.

L'équipe réelle, désormais dans les données :

| Qui | Rôle | Dans MOTEK |
|---|---|---|
| Joseph | gérant | tous les accès, tableau de bord, iPad |
| **Damien, Dylan, Laurent, Trump** | dépanneurs | un camion habituel chacun, écran **Ma tournée** sur téléphone |
| **Moïse** | administratif, dossiers, assureurs | accès missions / parc / assureurs / agent |
| **Florence** | relances, facturation, encaissements | accès facturation / assureurs / agent / commandes |

Le travail de Moïse et Florence (relances de gardes, demandes de prise en charge, lecture des courriels assureurs, factures, messages WhatsApp aux propriétaires) est ce que l'agent prépare. Rien ne part sans un clic humain ; c'est écrit à l'écran.

## Ce qui a été fait

### 1. Données réalistes et cohérentes (`01-socle`, `seedDepannage`)
- 4 dépanneurs nommés, 2 personnes au bureau, Joseph. Les 12 anciens chauffeurs fictifs disparaissent.
- Journée crédible : le matin est fait (facturé, terminé, déposé), chaque dépanneur est **en ce moment** sur une mission (remorquage, sur place, en route, affectée), deux demandes attendent qu'un dépanneur se libère. Les camions sans dépanneur attitré sont « de réserve », disponibles au dépôt ; Camion 10 en entretien.
- Toute mission « Déposée au parc » a sa garde (non traitée, liée par `gardeId`) ; toute mission « Facturée » a sa facture ; les mandats assureurs ont une référence sinistre.
- Téléphone de la société parisien (`+33 1 …`, plus de 04 lyonnais) ; « Dan Dépanne » corrigé partout en `company.name` ; message d'accueil de l'agent réécrit pour un dépanneur.
- Grille tarifaire par motif (`S.tarifs`, défaut `CX.DEP_TARIFS`), proposée à la création d'une mission.
- `migrate()` : une démo **intacte** seedée avec l'ancienne équipe est régénérée (`depSeed`), une base **modifiée** est conservée ; `tarifs` ajouté aux anciens états.

### 2. Bugs corrigés
| # | Bug | Correction |
|---|---|---|
| 1 | « Facturer » depuis la mission ne changeait que le statut : mission facturée **sans facture** | `DEP.invoiceMission` → `DEP.billMission` (facture réelle, lignes métier, TTC) |
| 2 | Facture et mandat assureur vivaient chacun leur vie | `billMission`/`billGarde` passent le mandat en « Facturée », l'encaissement complet le passe en « Payée » ; un avis de virement appliqué depuis la boîte mail solde la facture liée |
| 3 | Numéros de facture `FD-` et de commande `CB-` calculés sur `length` → collisions après quelques créations | numéros = max existant + 1 (missions et gardes aussi) |
| 4 | Un camion « Affectée » restait « Disponible » et pouvait être réaffecté | `DEP.refreshTruckStatus()` : affecté, en route, sur place, remorquage = en mission ; un dépanneur déjà en mission est refusé (`DEP.assign` rend `null`) |
| 5 | Dépôt au parc possible sur une place déjà occupée | refus avec message |
| 6 | Recherche globale ignorait missions, gardes, factures et équipe (elle cherchait OR, devis, clients de garage) | missions, parc, factures, dépanneurs, bureau indexés ; placeholder adapté au profil |
| 7 | Nav : « Clients & véhicules » (CRM garage, clients lyonnais) et « Paramètres » atelier (taux horaires, peinture, devis D-24817) affichés à un dépanneur | masqués (`activity: 'atelier'`) ; nouveau `38-parametres-depannage.js` (tarifs, frais de garde, TVA, entreprise, modules, données) ; `APP.open` préfère le module actif quand deux modules partagent un id |
| 8 | Cartes 3D de l'en-tête codées en dur (« Délais respectés 94,8 % », « CA du jour 18 450 € ») | vidées dans le HTML, remplies par `kpis()` |
| 9 | Visite guidée, scène 3D et textes citaient Nadia, Karim, Sabrina | équipe réelle ; les 3 bureaux de la scène = Joseph, Moïse, Florence ; les camions portent le prénom du dépanneur |
| 10 | Lien symbolique `node_modules` versionné (vers une autre machine) | supprimé du dépôt (déjà dans `.gitignore`) |

### 3. Tableau de bord de Joseph (`33`, iPad d'abord)
Quatre chiffres (missions en cours, dépanneurs libres, véhicules au parc, à encaisser), chacun ouvre sa liste. **Mes dépanneurs** : quatre cartes, statut, depuis quand, quel véhicule, où, bouton d'appel. Puis **À traiter** (groupé : missions sans dépanneur, arrivées au parc, courriels, à facturer, en retard, abandons, relances, commandes, entretien, CT), **Demander à MOTEK** (comprend aussi « qui est libre ? », « où est Damien ? »), parc par niveau, camions en miniature. Responsive : 4 → 2 → 1 colonnes (desktop, iPad portrait, téléphone). Captures : `screenshots/depann/`.

### 4. Ma tournée (`39-poste-depanneur.js`, téléphone)
Le dépanneur choisit son prénom (mémorisé sur l'appareil ; un téléphone identifié rouvre directement cet écran), voit sa mission : motif, plaque, adresse → itinéraire, destination, consignes, frise, **gros boutons** Je pars / Je suis sur place / Je remorque / Réparé sur place / Livré / Déposé au parc, appel du client, photo, appel du bureau. Les demandes en attente peuvent être prises (« Je prends ») quand il est libre. Même état que le bureau, horodaté.

### 5. Autres écrans
- **Missions** : affectation par dépanneur (libres en premier, camion habituel proposé), fiche avec frise, dépanneur et son téléphone, itinéraire, lien vers la facture et la garde. Création d'une mission → proposition d'envoi immédiat si quelqu'un est libre. **Vue « Journée par dépanneur »** : une ligne par dépanneur, blocs horaires de la journée, ligne du présent, demandes en attente à **glisser** sur un dépanneur libre (refus si déjà en mission), capture `screenshots/depann/planning-journee.png`.
- **Camions & équipe** : onglet Dépanneurs refondu (statut, mission, missions du jour, appel) ; textes du bureau.
- **Parc** : relance **groupée** par assureur (un courriel pour tous ses véhicules), **reçu de sortie imprimable** (proposé après la sortie, disponible ensuite dans la fiche).
- **Assureurs & mandats** : onglet Compagnies = en attente d'accord, à facturer, impayés, délai de paiement constaté (ou convenu), contact modifiable sur place (plus de renvoi vers le CRM garage).
- **Agent IA · relances** : renommé, texte d'intro qui dit ce qu'il remplace (le travail manuel de Moïse et Florence).

## Vérification

```
npm test                        # 97 tests (83 existants + 14 règles dépannage), tous verts
npm run build                   # tsc + Vite OK
node scripts/verify-depannage.mjs   # 14/14 étapes Chromium (desktop, iPad paysage/portrait, téléphone)
```

Nouveaux tests : `tests/depannage-harness.ts` charge le socle **et** les modules 30–38 dans une VM Node (coquilles APP/BO/UI) ; `tests/depannage.test.ts` couvre l'équipe, la cohérence de la démo (camions ↔ missions, gardes ↔ dépôts, factures ↔ missions, places uniques, numéros uniques), les statuts, l'affectation refusée, les frais de garde, la facture de mission et de garde, la synchronisation mandat ↔ facture, les courriels, les tarifs, l'assistant, la migration.

## Ce qu'il reste à faire (pour Codex, dans l'ordre)

1. **Planning du jour** : la vue existe (glisser-déposer HTML5, donc souris et iPad avec Safari 15+) ; à ajouter : déplacer l'heure prévue, vue « demain » pour les rendez-vous planifiés (missions non urgentes), repli tactile sur téléphone (bouton « Envoyer à… ») si le drag ne convient pas.
2. **Ma tournée hors ligne** : le texte promet que les actions attendent le réseau ; aujourd'hui une action sans réseau remonte « Non enregistré ». File d'attente locale à écrire dans le socle (`push()`), avec rejeu.
3. **Identification par personne** : `office[].access` est stocké mais pas appliqué ; `S.meId` est toujours Joseph. Un choix d'utilisateur à l'ouverture (mot de passe au déploiement) suffirait pour cacher les modules hors accès.
4. **Avoir, acompte, export comptable** sur `35-facturation` (l'export CSV actuel est brut).
5. **Agent** : classement des vrais courriels (référence, plaque, montant) — aujourd'hui `intent` est fourni par la démo ; écrire un classifieur déterministe testé avant tout raccordement IMAP.
6. **3D** : `build()` reconstruit toute la scène à chaque changement ; mettre à jour seulement l'objet qui bouge. Les étiquettes du parc sont petites en vue « Site » (lisibles en vue niveau).
7. **Nettoyage** : les modules atelier (05–18, 20–24, 26) restent chargés mais masqués ; décision à prendre avec Joseph (un dépanneur qui répare aussi ?) avant de les retirer du HTML.

## Règles conservées
Aucun service payant, aucune clé, aucune donnée envoyée ailleurs. E-mails, SMS et WhatsApp : préparés par MOTEK, envoyés par l'humain, tracés ensuite. Tout ce qui est simulé le dit à l'écran. Tout nouveau champ passe par `migrate()`.
