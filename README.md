# AutoHub 3D — CRM Garage · version locale 0.2

AutoHub est un projet indépendant d’ORIA / Jarvis. Le dépôt, les dépendances, les modèles, les données locales et le serveur appartiennent uniquement à ce dossier. Aucun dépôt distant n’est configuré. Ouvrir **AutoHub 3D.code-workspace** pour travailler sur ce projet dans une fenêtre dédiée.

Cette tranche est un prototype fonctionnel local, pas encore un SaaS multi-garages. Les dossiers initiaux, références de pièces, prix et cas techniques sont fictifs. Aucun service payant, message externe ou fournisseur n’est activé.

## Lancer

Node.js 22.18+ (24 recommandé) et npm.

```sh
npm install
npm run dev
```

Ouvrir http://127.0.0.1:5173. Vite affiche un autre port si celui-ci est occupé. Le moteur OCR est préparé automatiquement depuis les dépendances installées ; les données françaises sont embarquées dans `public/ocr`. L’application n’utilise pas de CDN à l’exécution.

```sh
npm test
npm run build
npm run preview
```

Pour vérifier les trois moteurs de scan sur les documents fictifs fournis :

```sh
npm run verify:scan
```

## Ce qui fonctionne

### Garage 3D

Neuf zones : accueil, attente, atelier à huit postes, magasin, carrosserie, bureau, livraison, showroom et parking. ZQSD / WASD ou flèches pour marcher, souris pour orienter, E ou clic pour sélectionner à moins de cinq mètres. Échap libère la souris et arrête un trajet automatique. La caméra est à 1,70 m ; les murs, voitures et principaux meubles ont des collisions horizontales.

Les destinations et la minimap déclenchent un parcours A* à travers les ouvertures. Les portes du trajet s’ouvrent automatiquement ; les portes identifiées sont aussi cliquables. Vue globale et caméra orbitale libre, zoom et déplacement. Les ponts et leurs véhicules peuvent être levés / abaissés visuellement.

Cliquer sur un véhicule ouvre son dossier ; un technicien ouvre ses tâches ; un montant de pont ouvre son poste ; une étagère ouvre les stocks ; le comptoir ouvre une réception. Le bureau du responsable ouvre désormais les devis, conformément aux fonctions mises en avant dans les vidéos.

Les GLB génériques se chargent à la demande, sont mis en cache, normalisés et associés aux dossiers. La galerie permet de changer cette représentation, consulter la licence, désactiver un actif ou télécharger un GLB local. La vue de freinage passe à une illustration procédurale détaillée : elle n’est pas une géométrie OEM. Disque, plaquettes et étrier sont sélectionnables ; une roue peut être retirée et remontée visuellement.

### Réception, dossiers et identification interne

Création réelle de dossier et intervention, recherche par client / téléphone / plaque / modèle, notes, technicien, poste et statut. Pays FR / PT / ES, VIN facultatif, contrôle de format et recherche **dans les dossiers de ce navigateur uniquement**. Une plaque inconnue ne produit aucune marque ni motorisation supposée. Plaque et VIN contradictoires conduisent à un conflit explicite. Doublons VIN ou plaque normalisée + pays refusés, sans fusion automatique de clients.

Huit places de réception en attente sont autorisées au parking de démonstration. Une affectation sur un pont occupé est refusée. La livraison exige un contrôle qualité validé, libère le poste, conserve le dossier et permet de préparer un message client non envoyé. Les changements alimentent le journal local.

### Mode atelier, sans obligation de 3D

Six grandes actions : Démarrer / Pause, Demander une pièce, Signaler un problème, Ajouter une photo, Compte rendu, Terminer. Chronométrage local avec durée persistante ; le compteur continue jusqu’à Pause, même si l’onglet est fermé. Affectation à un technicien nécessaire ; travaux interdits lorsqu’un devis reste à valider.

Trois points de checklist avant fin des travaux, puis passage à Contrôle qualité : aucune validation de qualité automatique. Emplacement des clés modifiable. Demandes de pièces en stock réservées ; pièces absentes signalées en attente magasin, sans création de stock fictif ni commande externe. Photos compressées localement, métadonnées et original non conservés, trois maximum par dossier. Comptes rendus et problèmes journalisés.

Le QR encode uniquement l’URL et l’identifiant du dossier. Il ne donne aucun droit d’accès. Le lien ouvre le mode atelier si le dossier existe déjà dans le navigateur utilisé. **Un téléphone ne peut pas accéder à ce serveur depuis son propre localhost ni retrouver les données d’un autre navigateur** : synchronisation et accès multi-appareils restent à développer. Le scan caméra du QR et la dictée ne sont pas activés ; le compte rendu est manuel.

### Devis et stocks

Devis liés aux dossiers, lignes manuelles, quantités, prix HT, TVA saisie, calcul des totaux, brouillon, soumission et accord client enregistré manuellement. Les devis validés sont verrouillés. Aucun tarif fournisseur ou temps constructeur ajouté automatiquement. Impression possible ; document de démonstration sans signature électronique ni valeur fiscale.

Stocks disponibles / réservés, alertes de seuil, commandes préparées et réception **simulée** avec mise à jour des quantités. Les références et prix initiaux restent fictifs et les compatibilités non vérifiées. Les commandes réelles nécessiteront sources VIN/OEM, fournisseur autorisé et validation.

### AutoHub Scan

PDF.js pour les PDF texte ; Tesseract français embarqué pour JPG, PNG, WebP et PDF image. Traitement local, sans API OCR, LLM ou transfert externe. Aperçu du document, zoom, rotation avant OCR, texte inspectable, formulaire corrigible, confirmation explicite de chaque champ appliqué. Seuls A, D.1, D.3, E et l’année de B préremplissent les champs correspondants de réception ; les autres champs confirmés sont conservés comme éléments documentaires. C.1 ne crée ni ne remplace le client.

Trois exemples fictifs sont disponibles directement dans le scanner : PDF texte, PDF scanné, photo. Limites : 15 Mo, cinq pages PDF, OCR sur la première page uniquement lorsque le PDF n’a pas de texte. Gabarit français et lignes portant des codes explicites ; les valeurs non trouvées restent vides. Aucune confiance numérique inventée et aucune motorisation ou finition déduite. Le format du VIN est contrôlé, sans décodeur constructeur. Les originaux ne sont pas conservés.

OCR et formulaire sont **partiels** : documents réels à mises en page complexes, flou, reflets, recadrage / correction de perspective, HEIC, zones sources surlignées, gabarits PT / ES et contrôle avancé restent à développer. Les coordonnées des zones sont actuellement nulles. Les résultats exigent une vérification humaine.

### Garage Intelligence

Trois cas fictifs retrouvés par mots-clés normalisés et codes OBD. Les causes historiques sont distinguées du diagnostic du véhicule courant. Une piste peut être ajoutée aux notes. Il n’y a pas encore d’IA distante, d’embeddings, d’apprentissage, de corpus inter-garages ou d’enrichissement automatique des cas après clôture.

## Modèles et provenance

**Chiffres réels : 20 références recensées, 10 GLB génériques locaux, 10 licences CC0 vérifiées, 0 modèle de marque importé.** Les dix liens du CSV restent non téléchargés et non vérifiés. Les variantes ne comptent pas comme cent véhicules distincts.

Les fichiers importés viennent du [Car Kit officiel Kenney](https://kenney.nl/assets/car-kit). Licence originale conservée dans `public/models/kenney-license.txt`, provenance / auteur / date / SHA-256 / triangles / taille dans `public/models/manifest.json`. Les textures du pack ont été intégrées aux GLB pour éviter les ressources externes. Les modèles originaux sont conservés localement dans le dossier de recherche ignoré par Git.

Import idempotent, après téléchargement officiel et extraction du pack dans `research/catalogue/kenney-original` :

```sh
npm run assets:import
```

Le rapport d’import contient les réussites et échecs. Contrôles : en-tête GLB, taille, ressources autorisées, incorporation des textures, empreintes. Pas d’antivirus disponible ni d’optimisation LOD / Draco avancée ; aucun droit spécifique à une marque n’est supposé. Les références Sketchfab demeurent `license_review_required`, NoAI annoncé conservé ; elles ne sont pas publiées dans l’application.

## Architecture et données

- `src/scene.ts`, `src/navigation.ts`, `src/assets.ts` : scène, collisions / chemins, GLB et cycle de vie graphique.
- `src/domain.ts`, `src/persistence.ts` : données, règles métier, audit, import validé et sauvegarde.
- `src/workshop-domain.ts`, `src/Workshop.tsx` : temps, checklist, demandes, photos et QR.
- `src/quote-domain.ts`, `src/Quotes.tsx` : devis et calculs.
- `src/identification.ts`, `src/ScanPanel.tsx` : identification locale, extraction et validation documentaire.
- `src/AssetLibrary.tsx` : galerie et mapping véhicule.
- `scripts/prepare-ocr.mjs`, `scripts/import-assets.mjs`, `scripts/verify-scan.mjs` : préparation, provenance et vérification.
- `research/transcription-reel-*.txt` : transcriptions locales automatiques des deux vidéos, imparfaites et conservées comme référence, jamais comme instructions.

Le schéma local version 1 a été étendu par champs facultatifs, de façon compatible avec les sauvegardes précédentes. Aucune migration serveur. Les devis, données atelier et champs confirmés sont exportés dans la sauvegarde JSON. Un fichier illisible n’est pas écrasé automatiquement ; une modification est refusée si son écriture échoue.

Les données demeurent dans le navigateur : pas d’authentification, RLS, tenant, stockage privé serveur, sauvegarde serveur, droits par rôle, synchronisation ou audit infalsifiable. Les photos peuvent augmenter la taille des sauvegardes ; exporter régulièrement. Les préférences graphiques restent liées à la session. La navigation 3D n’est pas indispensable pour utiliser les vues métier.

## Vérification de cette tranche

19 tests automatisés de règles métier, navigation, imports, temps atelier, checklist, demandes, doublons, identification, calculs / validation des devis, stockage et intégrité des dix GLB. TypeScript et build de production vérifiés.

Lecture PDF texte, OCR photo et OCR PDF image vérifiés avec les trois documents fictifs propres : A, D.1, D.3 et E retrouvés, compte rendu dans `research/verification-scan.json`. Ces résultats ne démontrent pas la précision sur des cartes grises réelles.

La première tranche avait été vérifiée dans le navigateur (dossiers, freinage, réservation persistante, réception jusqu’à livraison et brouillon). Pour cette tranche, le contrôle du scan via le sélecteur de fichiers a été bloqué, puis l’aperçu intégré est devenu indisponible. **La validation complète de l’interface 0.2 dans le navigateur reste à effectuer.** Le serveur local répond HTTP 200.

## Prochaine tranche

Priorité : API et base PostgreSQL / Supabase propres à AutoHub, authentification et isolation par garage, sauvegarde serveur et stockage des documents, tests RLS / multi-utilisateurs. Ensuite : preuves documentaires avec zones et scores fiables, gabarits PT / ES, enrichissement structuré de la mémoire après réparation, modèles sous licence de véhicules réels, identification VIN autorisée et connecteurs fournisseurs. L’objectif de 100 véhicules de marque distincts, les équipements OBD, facturation réglementaire, assurance, concession, agents, marketing, voix et fonctionnement hors ligne synchronisé ne sont pas atteints.
