# AutoHub 3D — V2 fonctionnelle · version 0.3

AutoHub est indépendant d’ORIA / Jarvis : dépôt, dépendances, serveur, base et modèles propres à ce dossier. Ouvrir `AutoHub 3D.code-workspace` pour une fenêtre de travail dédiée. Aucun dépôt distant ni service payant n’est configuré.

## Démarrer

Node.js 24 recommandé, npm et un navigateur avec WebGL. Pour la voix : Python 3.13 et FFmpeg ; l’installation est propre à AutoHub.

```sh
npm install
npm run dev
```

Ouvrir http://127.0.0.1:5173. Vite indique un autre port si celui-ci est occupé. Le serveur SQLite et l’API démarrent avec Vite ; `npm run preview` fournit aussi l’API de cette démonstration, pas seulement des fichiers statiques.

```sh
npm run speech:setup
```

Cette commande installe Faster Whisper et un modèle français multilingue libre dans `.speech-venv` et `.data/speech-model`. Après installation, la transcription ne contacte aucun fournisseur externe. Le navigateur demande l’autorisation du microphone à la première utilisation. Le texte est toujours disponible comme alternative. Aucun coût de service vocal.

```sh
npm test
npm run verify:api
npm run verify:scan
npm run build
npm run preview
```

## Démonstration cohérente

Le jeu V2 contient **60 dossiers**, **14 véhicules physiquement présents**, **8 profils de techniciens**, **5 devis validés**, **4 véhicules prêts à livrer**, **50 références fictives** et **15 diagnostics détaillés**. Les quatre prêts font partie des quatorze ; les rendez-vous futurs et dossiers livrés ne sont pas dessinés dans le garage. Aucun véhicule de showroom fantôme ne s’ajoute aux compteurs.

Les véhicules présents occupent six des huit ponts, quatre emplacements de livraison et quatre places de parking. Tous les emplacements sont distincts. Le parking de réception dispose de huit places, la livraison de quatre, avec débordement contrôlé vers le parking. Une base fraîche démarre trois sessions fictives en cours ; une base déjà modifiée est préservée. Les chiffres évoluent ensuite selon les actions, sans constantes dans le tableau de bord.

Toutes les identités, interventions, codes, mesures, devis, factures, références, fournisseurs, prix, motorisations et données qualité de démonstration sont explicitement fictifs. Aucun tarif ou référence OEM n’est présenté comme authentique.

## Ce qui est implémenté

### État partagé et chronomètre

L’état est conservé dans `.data/autohub.sqlite`, séparément d’ORIA. SQLite stocke les dossiers, horaires, sessions, pauses, demandes, alertes et audit. Une transaction vérifie la révision avant toute écriture ; un écran obsolète doit actualiser, et une requête répétée n’est pas exécutée deux fois. Les vingt derniers états sont conservés dans l’historique technique.

Les actions de temps sont exécutées par le serveur : début, pause et reprise enregistrés avec leurs heures. La durée active et la durée de pause sont séparées. Le navigateur affiche un temps dérivé des timestamps et de l’horloge serveur, sans être la source du compteur. Rechargement, fermeture et réouverture conservent le chronomètre. Un technicien ne peut pas démarrer deux sessions actives simultanément.

Les écrans reçoivent les changements via Server-Sent Events. Une déconnexion est affichée et une modification échouée n’est pas déclarée synchronisée. Plusieurs navigateurs atteignant ce même serveur partagent les mêmes données. L’accès depuis un autre appareil exige un serveur joignable et une mise en service sécurisée : **le téléphone ne peut pas utiliser son propre localhost**.

La sauvegarde 0.2 du navigateur reste conservée sous sa clé d’origine, avec un bouton d’export dans les paramètres. L’état V2 côté serveur est indépendant. Import / export JSON restent disponibles.

### Atelier et voix

Six grandes actions : Démarrer / Pause, Signaler un problème, Demander une pièce, Dicter un compte rendu, Ajouter une photo, Terminer. Travail demandé, estimation, temps actif / pause, responsable, statut, emplacement des clés et checklist sont visibles. L’atelier reste fonctionnel sans 3D.

Le microphone enregistre au plus trente secondes. L’audio est traité par Faster Whisper sur ce Mac et les fichiers temporaires sont supprimés ensuite. Le système propose des actions structurées sur le dossier ouvert ; le technicien lit ou écoute le résumé puis confirme avec le grand bouton. Les formules incertaines sont signalées. La lecture du résumé utilise uniquement une voix française locale disponible ; sinon le résumé reste à lire. Aucune reconnaissance parfaite hors ligne n’est promise.

Exemples reconnus : pause, reprise, manque de filtre, demande de deux disques, incident mécanique, diagnostic complémentaire, note, alerte responsable, fin des travaux et temps restant. Une négation de commande ne déclenche pas l’action opposée ; une description d’incident négative reste enregistrable. Une pièce inconnue ne produit aucune référence inventée. Les variantes linguistiques non prises en charge passent par la saisie manuelle.

Un problème bloque l’intervention, arrête son temps actif et crée une alerte interne. Une demande de pièce est soumise au responsable, avec quantité et stock. Celui-ci vérifie explicitement la référence / compatibilité et consigne sa décision ; la réservation ne peut pas rendre le stock négatif. Les références sont fictives et cette validation n’est pas une preuve OEM réelle. Aucune commande fournisseur payante ni message externe ne part de la voix.

La reprise exige que les incidents et demandes bloquantes soient traités. Terminer exige les trois contrôles ; l’intervention passe au contrôle qualité, la ressource est libérée et l’audit est mis à jour. Prêt à livrer exige la qualité, également vérifiée par le serveur. Le message client reste un brouillon non envoyé.

Photos compressées localement, sans original / EXIF, trois par dossier. QR : URL du serveur et identifiant uniquement, sans plaque, VIN ou client ; il ne donne aucun droit d’accès. La confirmation entièrement vocale reste à améliorer : la confirmation fiable actuelle est le grand bouton tactile.

### Planning

Trois vues : techniciens, ressources et départements. Huit spécialistes : Kader, Yanis, Sofiane, Mehdi, Thomas, Karim, Lucas, Rayan. Huit ponts et les postes pneumatiques, vitrage, diagnostic, carrosserie, peinture et contrôle final.

Cartes avec véhicule / plaque, symptômes, horaire, durée, statut, priorité et liens vers dossier / 3D. Glisser-déposer entre techniciens ou ressources, modification d’heure / durée, date et filtre de retards. Modifications réellement sauvegardées. Les conflits de technicien / ressource et compétences inadéquates sont refusés.

Alertes calculées : chevauchements, compétences, durée inférieure à l’estimation saisie, stock absent, arrivée manquante, devis non accepté, dépassement de fin, horaire et capacité. Un premier créneau libre est calculé depuis les réservations et horaires enregistrés ; aucune recommandation horaire n’est inventée par une IA. Les propositions restent à vérifier pour les pièces et le devis.

Les pauses, reprises, demandes, décisions et fins se reflètent dans les vues. Limites : horaires journaliers simples, pas encore absences / jours de travail ni optimisation globale de plusieurs tâches. Les ressources spécialisées sont des réservations métier ; leur géométrie détaillée reste à enrichir.

### Stock, devis et pilotage

Cinquante références avec catégorie, unité, fournisseur / marque fictifs, achat / vente démo, emplacement, quantité, réservé, seuil et dernier mouvement. Recherche et filtres. Ruptures, stocks faibles, commandes préparées, réservations liées aux dossiers et réceptions explicitement simulées. Les mouvements sont journalisés. Sorties physiques de pièces montées / retours restent à compléter ; une réservation ne signifie pas une pièce consommée.

Devis manuels, calculs HT / TVA / TTC, soumission, validation manuelle, verrouillage et impression démo. Aucun prix fournisseur, temps constructeur ou signature électronique supposé. Les factures de démonstration sont des enregistrements fictifs, sans documents réglementaires ni paiements réels.

Le pilotage calcule les présents, sessions, blocages, devis, prêts, retards, disponibilités, ponts, stocks critiques, factures payées fictives, rendez-vous et entretiens. Les indicateurs ouvrent leurs vues. Les filtres Prêts / Bloqués / Présents ouvrent exactement les dossiers concernés et les mettent en évidence en 3D. Décisions du responsable, alertes, livraisons et audit sont reliés aux mêmes enregistrements.

### Garage intelligent

« Expliquez-moi votre cas » : véhicule existant, recherche interne plaque / VIN, symptômes, note vocale, import TXT / CSV / PDF texte et OCR local d’image de rapport. DTC extraits au format standard ; texte source inspectable. Un PDF image doit encore passer par AutoHub Scan ou une extraction manuelle. Aucune compatibilité universelle OBD.

Quinze cas documentés, chacun lié à un dossier CRM ouvrable : modèle, moteur de démonstration, kilométrage, date, symptômes, DTC, tests et résultats, hypothèses rejetées / à vérifier, cause confirmée si une preuve fictive est consignée, réparation, résolution ou retour. Correspondances et différences explicites. Les trois cas non résolus ont une cause vide et des tests non effectués visibles.

La recherche est déterministe par termes, codes et données déclarées ; ce n’est pas un LLM ni une certitude de diagnostic. Une piste peut être enregistrée avec sa source et son incertitude. Validation technique professionnelle nécessaire. Pas d’entraînement privé, mémoire collective ou enrichissement automatique après chaque réparation.

### Garage 3D et bibliothèque

Navigation guidée : vue d’ensemble et neuf zones tactiles. Libre et Immersion retirés de l’interface ; aucun déplacement manuel. Véhicules, personnes et zones ouvrent un cadrage automatique et un panneau contextuel. Huit techniciens illustratifs avec casquette, tenue, gants et prénom sur le dos ; aucune photo de personne réelle.

Statuts issus du CRM, blocages et mises en évidence de cohortes. Les modèles sont chargés progressivement et mis en cache. À distance, une représentation procédurale simplifiée est utilisée ; proche, le GLB apparaît. Qualité légère et mouvement réduit disponibles. Le freinage reste une illustration générique sélectionnable, jamais une preuve de compatibilité.

**Fichiers réellement importés : 11 GLB**, dix Kenney CC0 et un coupé détaillé original **Spectral GT RS** de JaronKBragg7337, également CC0. Sources, licences, auteur, taille, triangles et empreintes sont conservés dans `public/models/manifest.json`. Le nouveau coupé contient 151 722 triangles / environ 4,7 Mo et est optionnel via la galerie ; sa qualité visuelle reste à vérifier dans le navigateur.

**Zéro modèle de marque attestée importé.** Le but de quinze carrosseries courantes exactes n’est pas atteint. Les véhicules du CRM peuvent être BMW / Renault fictifs, mais leur représentation est explicitement générique. Sketchfab refuse les accès consultés ; aucun contournement ni téléchargement par extraction de viewer. Les dix références fournies restent à vérifier et non publiées. Variantes et modèles génériques ne sont pas comptés comme cent véhicules de marques.

Sources : https://kenney.nl/assets/car-kit et https://github.com/JaronKBragg7337/spectral-gt-rs. Crédits complets : `THIRD_PARTY.md` et `public/licenses`.

## Vérifications et limites

27 tests passent : règles existantes, cohérence des soixante dossiers, positions distinctes des quatorze véhicules, profils / stock / devis, cas reliés, planning, voix, confirmation, stock, qualité serveur, concurrence et parcours complet avec réouverture de SQLite.

`verify:api` contrôle sur une base temporaire dont le fichier est vérifié : HTTP, deuxième client recevant le changement en SSE, requête dupliquée, conflit, proposition vocale et transcription réelle d’un audio français synthétique. Rapport : `research/verification-api-v2.json`.

Les trois tests d’AutoHub Scan antérieurs restent disponibles ; PDF texte / scan / photo fictifs, traitement local et champs à confirmer. Pas encore OCR robuste tous gabarits / coordonnées / scores ni identification automobile externe.

Compilation TypeScript couvre maintenant le frontend **et le serveur**. Le build passe. L’aperçu automatisé intégré n’a pas pu être atteint pendant cette tranche ; la validation visuelle complète et le microphone matériel restent à tester manuellement. Les vérifications API / audio / données ne prétendent pas remplacer ces essais.

Prototype local : pas d’authentification, droits fiables par rôle, isolation multi-tenant, hébergement smartphone sécurisé, facturation légale, fournisseurs réels ni synchronisation hors ligne. Ne pas exposer ce serveur sans authentification et HTTPS. Une base SQLite à état JSON transactionnel convient à la démo ; migration relationnelle SaaS à prévoir.

## Fichiers principaux et prochaine étape

- `server/store.ts`, `server/plugin.ts`, `server/transcribe.py` : SQLite, API, SSE et audio local.
- `src/demo.ts`, `src/team-data.ts`, `src/dashboard-domain.ts` : jeu V2 et indicateurs.
- `src/planning-domain.ts`, `src/Planning.tsx` : réservations, contrôles et créneaux.
- `src/workshop-domain.ts`, `src/Workshop.tsx`, `src/voice-domain.ts`, `src/VoiceAssistant.tsx` : atelier et confirmation.
- `src/Intelligence.tsx`, `src/diagnostic-domain.ts`, `src/Pilotage.tsx`, `src/ManagerRequests.tsx`, `src/Stocks.tsx`, `src/Team.tsx` : vues métier reliées.
- `src/scene.ts`, `src/assets.ts`, `src/AssetLibrary.tsx` : garage et modèles ; `tests/v2.test.ts` et `scripts/verify-api.mjs` : preuves de cohérence.

Prochaine étape : essai manuel tablette / micro / parcours 3D, puis authentification et accès distant sécurisé. Ensuite : modèles de marques sous licences confirmées, tâches relationnelles, sorties de stock, absences, mémoire de réparation enrichie et connecteurs professionnels autorisés. ORIA demeure hors du périmètre.

### Maquette Porto et navigation (13 octobre 2026)

La disposition s’inspire des deux photos JOP et de l’enregistrement de visite fourni : façade vitrée, enseigne Jaguar à gauche / Land Rover à droite, accueil et espaces clients en façade, huit ponts rouges alignés à droite dans l’atelier arrière, huit emplacements du parc à gauche. Les dimensions sont une proposition de maquette, pas un relevé architectural de la concession. Les voitures présentes restent les 14 dossiers du CRM ; aucun véhicule décoratif non suivi n’est ajouté.

Dans Paramètres, les enseignes, la présence de la salle d’attente et trois espacements des postes (5/6/7 mètres) sont enregistrés dans la base et dans les sauvegardes. La profondeur de bâtiment, les positions des véhicules, la carte et les collisions suivent ce réglage. Les autres salles conservent leurs dimensions dans ce prototype.

Cliquer sur un véhicule rapproche progressivement la caméra et ouvre son dossier. Les destinations offrent des cadrages fixes en vue globale/libre ; en immersion elles conservent le déplacement par les portes. La caméra suit le chemin angulaire le plus court. Les poutres sont masquées en vue libre pour conserver la visibilité. Les mouvements réduits s’appliquent au rapprochement et aux cadrages. Les interventions sont rouges, les devis ambre, les véhicules prêts verts. La restitution promise du rendez-vous est affichée avec une alerte à moins de deux heures et après dépassement ; une heure seule sans date n’est pas artificiellement déclarée en retard.

### Agent WhatsApp : boîte de brouillons locale

Un passage à « Prêt à livrer » après contrôle qualité prépare un brouillon de restitution. Un devis enregistré « À valider » avec des lignes prépare une demande d’accord avec montant TTC et opérations. Des boutons permettent aussi la préparation depuis le dossier. Les brouillons identiques ne sont pas dupliqués ; ils sont conservés en base et consultables/copiables dans Activité. Aucun fournisseur WhatsApp, envoi, réception de réponse, ni consentement client automatique n’est connecté. Une réponse du client doit encore être saisie et validée par l’atelier.

### Collection de marques en cours

`public/models/brand-catalogue.json` recense les 25 marques demandées et dix objectifs de collecte (Audi A4/Q5, BMW Série 3/X5, Renault Clio/Mégane, Volkswagen Golf/Tiguan, Land Rover Range Rover/Defender). `research/porto/catalogue-marques.csv` fournit le fichier initial. Ces objectifs restent explicitement non téléchargés et ne sont pas comptés parmi les GLB importés. Année et génération restent vides avant vérification. La bibliothèque propose les recherches Sketchfab correspondantes.

Le téléchargement Sketchfab a affiché une connexion obligatoire. L’utilisateur a confirmé sa connexion, mais l’accès au navigateur de l’agent s’est interrompu avant récupération. Aucun modèle de marque n’a donc été ajouté dans cette livraison. Le modèle BMW examiné annonçait une exportation Roblox dans les commentaires : provenance insuffisante pour l’import. Le compteur de modèles de marque demeure exact à zéro. La recherche par plaque reste limitée aux dossiers internes ; aucun service d’identification extérieur n’est configuré.

Vérification : 30 tests métier réussis, compilation de production réussie, cinq contrôles HTTP/SSE/transcription sur base isolée réussis. Le clic BMW et son dossier/échéance ont été vus dans le navigateur ; le réglage de dimensions a aussi été changé dans Chrome de 5 à 6 mètres, puis restauré à 5 mètres. Captures dans `research/porto/`. La page de connexion directe Sketchfab est maintenant accessible dans Chrome, mais le téléchargement demande encore une session authentifiée.

La session Chrome Sketchfab a ensuite été vérifiée authentifiée. L’essai de téléchargement GLB du modèle Renault non identifié a expiré et aucun fichier n’a été retrouvé dans les téléchargements. Ce modèle est écarté de la sélection. La Golf GTI 2024 de Ddiaz Design est également écartée : CC BY-NC-SA 4.0 interdit l’usage commercial. Les commandes de navigation Chrome ont de nouveau expiré avant une importation de marque. Les dix objectifs restent explicitement en attente.

### Correction du cadrage et des interactions 3D

Le cadrage des véhicules du parc gauche se fait désormais depuis l’allée centrale, plutôt que depuis la cloison des bureaux. Les postes et la livraison ont des points de vue adaptés. Le recul dépend de la largeur du cadre et se recalcule lorsque le dossier réduit le viewport ou que la fenêtre est redimensionnée. « Recentrer », « Autre côté » et « Vue atelier » offrent des repères directs ; la translation libre est désactivée, la rotation et le zoom sont ralentis.

Les cloisons et meubles traversant la ligne de vue vers le centre ou les quatre coins de la voiture sont masqués en vue globale/libre, puis restaurés en immersion. Leurs volumes restent actifs pour les collisions de déplacement. Les objets masqués et les roues de la représentation de secours invisible ne capturent plus les clics. En inspection, seules les étiquettes du véhicule visé sont affichées. Une destination occupée par une voiture est remplacée par un point voisin libre.

Huit tests dédiés couvrent les deux rangées avec les trois dimensions d’atelier, les écrans étroits, la projection des huit coins du véhicule, les clics à travers des objets masqués, le virage autour de ±π, une arrivée occupée, le mur gênant et les deux vues de livraison. Le contrôle visuel automatique de cette itération n’a pas pu être réalisé : les outils de navigation Chrome puis le navigateur intégré ont expiré. Aucun nouveau modèle de marque n’a été récupéré durant cette correction.

### Interface 3D guidée et tablette (13 octobre 2026)

Cette évolution remplace les anciens modes Libre et Immersion décrits dans l’historique ci-dessus. Les zones et leurs panneaux sont accessibles sans déplacement manuel. L’atelier et le showroom sont cadrés dans leur ensemble ; un client ouvre son état, son dernier devis réel enregistré, son accord et son rendez-vous. Le bouton devis ouvre le véhicule correspondant. L’accueil possède un comptoir et un agent visible. Les techniciens portent leur prénom sur le dos et ouvrent leurs interventions.

Le mode « Mains sales » agrandit les commandes (64 px minimum, zones 74 px), simplifie l’en-tête et masque les commandes secondaires. Vérification dans Chrome avec viewport tablette 1024×768 ; pas de validation physique avec des gants. Attente : trois présences explicitement simulées dans la démonstration. Showroom : trois véhicules commerciaux simulés, séparés des 14 véhicules physiques du CRM. Les modèles restent illustratifs. Les garages réels ne reçoivent pas ces présences ou stocks fictifs.

Stocks : commandes datées du jour selon Europe/Lisbon et commandes attendues. Les anciennes commandes non datées restent indiquées « Date non renseignée ». Aucun envoi externe. Validation : 42 tests réussis, compilation de production réussie, interactions salle d’attente → client → devis, atelier → technicien, stocks, showroom et mode tactile contrôlées dans Chrome. Captures dans `research/porto/atelier-mains-sales.jpg` et `technicien-guide.jpg`.
