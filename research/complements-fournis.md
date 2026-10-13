# AUTOHUB 3D — PROMPT MAÎTRE UNIFIÉ POUR CODEX

## MISSION ET CONTEXTE
Tu es Codex, ingénieur logiciel principal chargé de poursuivre le développement d’AutoHub 3D, un CRM SaaS intelligent pour garages automobiles, carrosseries et ateliers multimarques. Le projet existe déjà et un premier prompt maître a été donné : **ne repars pas de zéro, ne détruis pas le code, ne réécris pas les fonctionnalités existantes sans nécessité**. Commence par auditer le dépôt, l'architecture, les tests, les dépendances, les schémas de données et le statut des modules. Produis ensuite un plan d’intégration incrémental et implémente réellement les fonctions avec tests et démonstration. Ne te limite pas à un document de spécifications.

Objectif : garage 3D librement navigable, CRM complet et utile, interface atelier ultra-rapide, bibliothèque automobile 3D gratuite, identification fiable des véhicules par plusieurs sources, lecture automatique des cartes grises et mémoire des diagnostics. La 3D doit être utile, pas décorative. Les flux simples doivent aussi être disponibles en 2D.

**Budget prototype : 0 € pour les modèles 3D et les services d'identification/OCR.** Aucun achat, abonnement, service payant ou activation de facturation sans validation expresse. Préparer une architecture compatible avec des fournisseurs professionnels sous licence ultérieurement.

## PIÈCES JOINTES À EXPLOITER
Dans l'archive jointe `autohub_catalogue_3d_gratuit.zip`, ouvrir `catalogue.csv` et `README.md`. Cette archive contient **5 références de véhicules et 5 références de composants mécaniques, uniquement des liens et métadonnées**. Elle ne contient **aucun modèle 3D téléchargé**. Ne pas annoncer le contraire. Traiter les licences `licence_annoncee` comme **non vérifiées** jusqu’à consultation de la fiche officielle actuelle de chaque actif ; conserver notamment toute restriction « NoAI ». Si le ZIP n'est pas accessible dans l'environnement Codex, demander son dépôt dans le projet sans bloquer les autres modules.

## 1. BIBLIOTHÈQUE GRATUITE DE 100 VÉHICULES 3D
Créer une bibliothèque de 100 entrées 3D exploitables, avec objectif secondaire de 100 **véhicules distincts** de marques connues. Ne pas confondre variantes de couleur, doublons et modèles distincts. Commencer par 10 véhicules réalistes, puis 20, 50, 100. Cibler Renault (Clio, Mégane, Captur), Peugeot (208, 308, 3008), Citroën (C3), Volkswagen (Polo, Golf, Tiguan), BMW (Série 1, 3, 5, X3, X5), Mercedes (Classe A, C, E, GLC), Audi (A3, A4, Q3, Q5), Toyota (Yaris, Corolla, RAV4), Ford (Fiesta, Focus, Transit), Fiat, Opel, Nissan, Hyundai, Kia, Land Rover/Range Rover, Porsche et Tesla selon disponibilité réelle.

Sources à étudier :
- https://kenney.nl/assets/car-kit — CC0, plutôt stylisé, utile comme fallback.
- https://quaternius.com/packs/cars.html — CC0, plutôt stylisé.
- https://sketchfab.com/ — rechercher les modèles téléchargeables et vérifier la licence individuelle.
- https://blendswap.com/3d/car — modèles Blender, licences individuelles.
- https://free3d.com/3d-models/car-vehicles — licences individuelles.
- https://polyhaven.com/ — matériaux et accessoires CC0, pas une bibliothèque de voitures réelles.

Pour chaque actif : URL, créateur, licence complète, preuve/date de vérification, conditions d’attribution, autorisation commerciale, autorisation d’intégration à un SaaS multi-clients, contraintes de redistribution, interdictions NoAI éventuelles, nom du modèle, génération, années couvertes, format, polygones, textures, empreinte SHA-256, statut de téléchargement et de conversion. Ne pas télécharger par contournement de CAPTCHA, login, restrictions, paywall, API ou limitations. Ne pas aspirer des jeux vidéo ou fichiers de provenance douteuse. Si le droit SaaS est incertain, classer `license_review_required` et ne pas exposer le fichier aux utilisateurs finaux.

Concevoir un pipeline : découverte autorisée -> vérification de licence -> téléchargement autorisé -> antivirus/validation du fichier -> conversion Blender si nécessaire -> normalisation d’échelle/orientation -> optimisation maillage/textures/LOD -> GLB -> miniature -> tests -> publication dans la galerie. Conserver l’original et la provenance. Ajouter une commande CLI idempotente d’import et un rapport des échecs. Prévoir glTF/GLB, compression lorsque supportée, chargement différé et cache ; ne pas faire télécharger 100 modèles au navigateur au démarrage.

Créer une galerie d'administration : recherche, filtres, prévisualisation 360°, marque/modèle/génération, état de licence, nombre de triangles, taille, qualité, téléchargement local, attribution, mapping véhicule, désactivation d’un actif. Ne jamais prétendre que 100 fichiers sont importés tant qu’ils ne le sont pas ; publier les chiffres réels : identifiés, licences vérifiées, téléchargés, convertis, testés, modèles distincts, variantes, échecs.

## 2. BIBLIOTHÈQUE MÉCANIQUE ET VUES ÉCLATÉES
Créer une bibliothèque indépendante pour disque, plaquettes, étrier, flexible, roue, pneu, amortisseur, ressort, triangle, direction, batterie, alternateur, filtre, moteur, transmission, radiateur, éléments de carrosserie, pare-chocs, portière, phare, pare-brise, etc. Commencer par le freinage : roue -> disque -> étrier -> plaquettes. Le mécanicien doit pouvoir cliquer sur un véhicule du garage, sélectionner une zone, afficher une vue détaillée ou éclatée, masquer des composants, faire pivoter, zoomer, consulter les opérations et demander une pièce.

Les modèles mécaniques génériques servent à l’**illustration**. Une apparence identique ne prouve jamais la compatibilité réelle. Le moteur de compatibilité doit utiliser des données vérifiées (VIN, référence OEM, code moteur, dimension de disque, essieu, variante et options). Afficher `illustration générique` et `compatibilité non vérifiée` si nécessaire. Ne pas créer de faux catalogues OEM. Les pièces avec géométrie réelle spécifique sont à intégrer uniquement si les données et licences le permettent.

## 3. MODE ATELIER « MAINS SALES »
Ajouter une interface spécifique technicien, utilisable avec mains sales, gants et sur tablette, distincte de la vue direction. Objectif : actions courantes en 1 à 3 interactions après ouverture du dossier ; 4 à 6 gros boutons maximum par écran, contrastes élevés, police lisible, pas de saisie longue. Accès par QR code associé au véhicule/ordre de réparation ; ne jamais encoder d’informations personnelles en clair dans le QR. Prévoir ouverture par scan, recherche manuelle et raccourci.

Actions principales : Démarrer/Pause, Demander une pièce, Signaler un problème, Ajouter une photo, Dicter un compte rendu, Terminer. Ajout d’une checklist métier, statut des pièces, accès rapide au diagnostic et aux vues 3D, demande d’aide, localisation des clés, qualité/contrôle final. Commandes vocales courtes avec confirmation explicite pour toute action conséquente ; gestion des erreurs, confidentialité, option sans micro, lecture vocale si disponible. Les gants peuvent empêcher l’usage tactile : prévoir commandes vocales, écran compatible et mode manuel.

Mode 2D ultra-rapide toujours disponible ; 3D jamais obligatoire pour clôturer une tâche. Cache hors ligne limité aux données nécessaires et synchronisation différée avec gestion de conflits ; ne pas déclarer une action synchronisée tant qu’elle ne l’est pas. Détection de blocages : véhicule immobilisé, attente de pièce, devis non validé, pont occupé trop longtemps, intervention sans mise à jour ; alertes paramétrables, pas de fausses urgences. Journaliser temps, photos, modifications et signataires. Récompenser la qualité et la sécurité, jamais la vitesse seule.

## 4. MOTEUR D'IDENTIFICATION AUTOMOBILE MULTI-SOURCES
Créer un module `VehicleIdentification` au cœur de la réception. Entrées : plaque, VIN, carte grise, photo, données saisies, historique du garage. Pays initiaux : France, Portugal, Espagne ; extensibilité européenne. La plaque est un identifiant de recherche, pas une preuve de motorisation. La saisie de la plaque seule ne doit jamais déclencher une fausse identification simulée.

Définir une interface `VehicleIdentificationProvider` : identifiant, pays, type, autorisation/licence, authentification, coûts, limites, champs retournés, provenance, date, confiance, statut. Providers : (1) base interne du garage, (2) décodage VIN NHTSA vPIC pour les véhicules couverts, (3) saisie manuelle, (4) carte grise lue par AutoHub Scan, (5) bases publiques correctement licenciées pour marques/modèles/générations, (6) futurs fournisseurs agréés de lookup plaque/VIN, désactivés sans contrat. Ne pas faire croire que NHTSA couvre exhaustivement les véhicules européens.

Étudier les noms évoqués « Imad Scanner », « Naruto » et « La Centrale » en **vérifiant d'abord l'identité exacte**. Ne présumer ni API ni droit de scraping. Pour chaque service : API officielle, accès partenaire, CGU, droit de collecte, réutilisation et stockage. L’accès SIV français est réglementé ; ne pas traiter la plaque comme une clé d’accès publique aux données administratives. Pas de scraping non autorisé, contournement de CAPTCHA, authentification ou protections techniques ; pas d’extraction d’informations personnelles sur les titulaires depuis des sources externes.

Normaliser : marque, modèle, génération, code génération, restylage, période de production, carrosserie, motorisation, code moteur vérifié, cylindrée, puissance, carburant, transmission, nombre de portes, pays, VIN et immatriculation quand nécessaires. Stocker chaque assertion avec valeur brute, source, horodatage, confiance, vérification humaine. Si deux sources se contredisent, afficher le conflit et demander VIN/carte grise ou validation. États : `identified`, `partial`, `needs_confirmation`, `conflict`, `not_found`. Ne jamais inventer un champ absent.

## 5. LIEN IDENTIFICATION -> 3D -> PIÈCES
Créer `Vehicle3DMapping` avec priorités : (1) génération + carrosserie exactes, (2) génération proche et variante visuelle acceptable, (3) modèle approximatif clairement étiqueté, (4) véhicule générique par catégorie. Le moteur de compatibilité pièces est **séparé** de ce mapping. Un modèle 3D approximatif ne doit jamais entraîner une commande automatique de pièces. Prévoir prévisualisation avant confirmation et changement manuel de modèle 3D.

## 6. AUTOHUB SCAN — LECTURE INTELLIGENTE DES CARTES GRISES
À la création client/véhicule et à la réception, proposer `Scanner une carte grise`. Formats : PDF natif, PDF image, JPG/JPEG, PNG, HEIC si pris en charge, capture smartphone/tablette. Prévoir recadrage, rotation, correction de perspective, orientation, flou/reflets, multi-pages, reprise photo. Pipeline : identifier type de document -> extraire texte natif des PDF si disponible -> OCR des images -> identifier pays et gabarit -> détecter champs -> normaliser -> contrôles de cohérence -> préremplir -> validation humaine -> créer/rattacher véhicule.

Champs français au minimum : A immatriculation ; B première immatriculation ; C.1 titulaire ; D.1 marque ; D.2 type/variante/version ; D.3 dénomination commerciale ; E VIN ; F.2 masse maximale ; G.1 masse à vide ; J.1 genre ; P.1 cylindrée ; P.2 puissance ; P.3 énergie ; P.6 puissance administrative ; S.1 places ; V.7 CO2. Ajouter règles spécifiques aux documents portugais et espagnols, sans supposer que leurs gabarits sont identiques. Ne pas prétendre déduire une finition, un code moteur ou une référence de frein à partir de champs insuffisants.

Conserver pour chaque champ : valeur brute, valeur normalisée, coordonnées de la zone source dans le document, confiance, statut, origine, date, correcteur. Afficher interface deux panneaux : original zoomable avec zone surlignée à gauche ; formulaire prérempli et modifiable à droite. Valeurs incertaines en évidence, illisibles `À compléter`. Vérifier VIN selon normes applicables, sans rejeter abusivement les cas européens particuliers. Détecter doublons VIN/plaque, sans fusion automatique de clients ni confusion titulaire/propriétaire/conducteur/client.

Prototype gratuit : PDF.js pour affichage/extraction texte, Tesseract OCR ou alternative open source locale, prétraitement image open source, traitement serveur sécurisé ou local selon architecture. Ne pas utiliser d’API OCR payante sans validation. Si OCR peu fiable, afficher une saisie manuelle efficace ; aucune hallucination de champs. Traiter la carte grise comme document contenant des données personnelles ; pas d’envoi à un LLM externe sans configuration et base légale adaptées.

## 7. DOSSIER DOCUMENTAIRE INTELLIGENT
Après la carte grise, accepter anciennes factures, devis, rapports OBD, fiches de contrôle, photos et rapports de sinistre. Classifier le type de document et proposer une action : extraction historique d’entretien, références de pièces, DTC, kilométrage indiqué et date, sans confondre une donnée historique avec une donnée actuelle. Afficher source, confiance et confirmation humaine. Ne jamais créer de factures, réparations ou diagnostics fictifs à partir d’un texte incertain.

## 8. MÉMOIRE DES DIAGNOSTICS
Chaque intervention doit enrichir une base de cas : véhicule/génération/moteur, kilométrage daté, symptômes, DTC, contexte, tests réalisés, hypothèses invalidées, cause confirmée, pièces remplacées, résolution, contrôle final et éventuelle récidive. À l’ouverture d’un nouveau dossier, proposer les cas réellement similaires avec raisons et différences ; distinguer cas du garage et corpus inter-garages uniquement anonymisé, contractuellement autorisé et opt-in. Ne pas divulguer plaques, VIN, données clients entre garages. Ne pas présenter une hypothèse IA comme un diagnostic certain. Recommander des tests non destructifs et une validation par technicien qualifié.

## 9. INTÉGRATION CRM ET GARAGE 3D
Flux attendu : création client -> scan carte grise ou plaque/VIN -> extraction -> identification et confiance -> validation -> rattachement du bon véhicule -> choix GLB -> affichage sur parking/pont -> ordre de réparation -> mode mains sales -> diagnostic -> demande de pièces -> devis/approbation -> intervention -> photos/checklist -> contrôle qualité -> livraison -> historique et mémoire. Éviter les doublons ; rôles Direction/Accueil/Atelier ; permission par garage et par site ; traçabilité complète.

Navigation garage : déplacement libre première personne (ZQSD/WASD et souris), caméra libre et vue aérienne, collisions, zones réception/atelier/carrosserie/stock/parking ; clic voiture, technicien, pont, étagère, clés ; panneaux métier utiles. Utiliser React Three Fiber / Three.js si compatible avec la stack existante. Dégradation élégante sur appareil peu puissant. Pas d’animation inutile.

## 10. MODÈLE DE DONNÉES SUGGÉRÉ
Créer ou adapter de façon cohérente : `Garage`, `User`, `Role`, `Customer`, `Vehicle`, `VehicleRegistration`, `VehicleIdentificationAttempt`, `IdentificationProvider`, `VehicleAttributeEvidence`, `Vehicle3DAsset`, `AssetLicense`, `Vehicle3DMapping`, `Mechanical3DAsset`, `PartReference`, `PartCompatibilityEvidence`, `Document`, `DocumentExtraction`, `DocumentExtractedField`, `WorkOrder`, `WorkOrderTask`, `WorkOrderPhoto`, `TechnicianChecklist`, `KeyLocation`, `LiftOccupancy`, `PartRequest`, `DiagnosticCase`, `DiagnosticEvidence`, `AuditEvent`. Définir clés étrangères, contraintes, index, migrations et tests RLS/multi-tenancy. Stockage privé pour documents ; URL signées à durée limitée pour consultation. Éviter de rendre publics les VIN et cartes grises dans les métadonnées de fichiers.

## 11. CONFORMITÉ, SÉCURITÉ ET LICENCES
RGPD : finalités, base légale, minimisation, information, accès par rôle, durée de conservation, suppression, portabilité selon applicabilité, journalisation, cloisonnement strict des garages. Les données des cartes grises peuvent identifier des personnes. Les licences d’actifs doivent couvrir l’intégration dans un produit SaaS et les droits de redistribution technique nécessaires. Respecter CC BY, CC0 et restrictions additionnelles ; exclure CC BY-NC pour une future exploitation commerciale sauf autorisation distincte. Respecter les clauses NoAI. Éviter tout accès non autorisé aux registres de véhicules et tout scraping prohibé. Garder un manifeste des obligations d’attribution et un écran de crédits si requis.

## 12. PRIORITÉS DE LIVRAISON
P0 : auditer dépôt, vérifier ZIP, créer manifeste licences, importer légalement quelques actifs, démontrer véhicule GLB cliquable et vue freins, créer mode atelier minimal QR/6 boutons, formulaire véhicule et scan PDF/photo avec validation.
P1 : enrichir 20 puis 50 véhicules, moteur d’identification par VIN et base interne, gestion contradictions, mapping 3D, pièces génériques, alertes de blocage, OCR robuste, tests multi-garages.
P2 : 100 entrées réelles et audit des modèles distincts, langues/pays supplémentaires, mémoire des diagnostics enrichie, gestion hors ligne, voix, galerie admin avancée, connecteurs professionnels sous contrat.

## 13. CRITÈRES D’ACCEPTATION ET TESTS
- Le projet existant démarre et les fonctions antérieures continuent de marcher.
- Au moins un modèle GLB est chargé et manipulable dans le garage 3D ; clic roue -> visualisation de frein -> action atelier.
- Une carte grise fictive PDF texte, un scan PDF et une photo donnent des champs vérifiables et corrigeables ; aucune valeur manquante n'est inventée.
- Un VIN invalide, un VIN européen absent de vPIC et une plaque inconnue conduisent à des états honnêtes, pas à une fausse identification.
- Conflit de motorisation entre deux sources -> demande de validation.
- Aucun client d’un garage A ne peut consulter documents ou données du garage B.
- Mode atelier utilisable en 2D sans souris précise, avec QR et six actions principales.
- Une commande de pièce incompatible ou non vérifiée nécessite validation humaine.
- Chaque actif importé possède sa licence et son attribution vérifiées ; un actif litigieux n'est pas publié.
- Les statistiques du catalogue comptent réellement fichiers et modèles distincts.
- Aucune fonctionnalité payante activée, aucun secret/API key codé en dur.

## 14. COMPTE RENDU FINAL OBLIGATOIRE
Après chaque étape, rapporter : fichiers créés/modifiés, migrations, commandes pour exécuter, tests exécutés et résultats, captures/URLs locales si disponibles, actifs réellement importés et licences, limites, dépendances externes, points bloquants, prochaines tâches. Distinguer **implémenté**, **partiellement implémenté**, **prévu** et **impossible sans autorisation/compte/fichier**. Si un téléchargement exige une authentification utilisateur, demander l’action correspondante sans contourner l’accès. Ne pas inventer une réussite.

**Commence maintenant par examiner le dépôt et l'archive, puis livre une première tranche fonctionnelle plutôt que de produire seulement un plan.**
