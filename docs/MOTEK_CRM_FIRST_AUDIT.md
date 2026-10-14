# MOTEK — audit CRM First et tranche 1

14 octobre 2026. Références : prompt maître CRM First lu intégralement ; contenu du ZIP inventorié, prompt identique au fichier séparé. Anciennes spécifications et catalogue conservés comme contexte, pas comme preuve d'intégrations.

## État réel avant cette tranche

| Domaine | État constaté | Preuve / limite |
|---|---|---|
| Persistance | Opérationnel localement | SQLite, révisions, transactions et reçus idempotents dans server/store.ts ; SSE pour les écrans |
| Réception | Partiel | Dossier véhicule, identification locale/OCR et présence ; « Prendre en charge » changeait seulement un état de présence |
| Client | Partiel | Coordonnées sur le dossier véhicule, pas d'entité client indépendante multi-véhicules |
| OR et travaux | Manquant | Pas de liste des travaux demandés/réalisés avec progression traçable |
| Atelier | Opérationnel localement | Chrono serveur, pauses, demandes de pièces, incidents, photos, contrôles ; parcours dispersé |
| Devis | Partiel | Lignes, TVA, total, brouillon, soumis et accord saisi ; pas de signature externe, preuve de lecture ou facturation réglementaire |
| Stock | Partiel | Quantités, réservations, demandes et validation manuelle de référence ; pas de catalogue de compatibilité VIN fournisseur |
| Planning | Partiel | Compétences/conflits et ressources ; pas de gestion complète des absences et jours fériés |
| Livraison | Partiel | Contrôle qualité avant statut prêt ; absence de garde-fous paiement/contact/remise des clés |
| Paiement | Manquant | Factures du jeu de test seulement, aucun encaissement intégré |
| Communication | Brouillons | Aucun SMS/WhatsApp réellement envoyé ; aucun connecteur fournisseur |
| Voice | Partiel atelier / absent téléphonie | Commandes vocales locales à confirmation, transcription locale ; pas de réceptionniste téléphonique raccordé ni de numéro testé |
| Vision | Absent caméra | OCR documentaire et identification locale ne constituent pas un pipeline caméra d'entrée |
| Live 3D | Partiel | Scène et sélection reliées aux véhicules ; modèles génériques, personnages illustratifs ; anciennes présences implicitement déduites des IDs de test |
| Auth / multi-sites | Absent | Pas d'authentification ni isolation multi-tenant ; service limité à la boucle locale |
| Concession | Partiel / vitrine | Inventaire de test, pas de mandat, leads, vente ni processus réglementaire |

## Tranche 1 implémentée

- Accueil 2D et espace atelier opérationnel ; plan 3D séparé et conservé.
- Recherche plaque, client, téléphone/VIN ; cartes véhicule contrastées ; accès au dossier, devis et commandes atelier.
- Création d'OR depuis la réception/prise en charge ; identifiant stable et tâches explicites.
- Affectation à un technicien existant et un pont disponible ; visibilité via la file atelier et l'audit (pas de notification push externe).
- Travaux cochés avec date serveur et technicien ; progression = travaux réalisés / travaux listés. Un chrono seul ne fabrique pas un pourcentage.
- Recherche de pièces et disponibilité physique moins réservations ; demande interne via le module existant, pas de promesse de compatibilité ni de commande externe.
- Devis accepté exigé avant le démarrage des nouveaux OR.
- Décompte interne figé depuis le devis accepté ; règlements déclarés manuellement, partiels ou complets, référence et moyen, aucun débit bancaire.
- Contact de restitution consigné au téléphone/sur place ; aucun état SMS/WhatsApp envoyé inventé.
- Horaires explicites Europe/Lisbon, jours d'ouverture ; refus du créneau hors horaires avec explication. Jours fériés non gérés.
- Contrôle final, solde, contact, créneau et confirmation des clés avant clôture d'un nouvel OR.
- Les présences de salle d'attente nécessitent désormais un enregistrement. Les anciens IDs de test seuls ne créent plus de personnages.
- L'espace de test est identifié dans l'en-tête ; aucune conversion des anciennes données fictives en données réelles.

## Données et migration

Extension compatible du document SQLite par `workOrders` et `openingHours` facultatifs. Aucune table ni ancienne donnée supprimée. Aucun OR ni paiement ajouté silencieusement aux dossiers historiques. Les anciennes fonctionnalités restent utilisables ; les nouveaux garde-fous s'appliquent aux dossiers ayant un OR Core. Attention : cela ne constitue pas encore une migration exhaustive des anciens dossiers.

Une sauvegarde cohérente SQLite a été créée dans `.data/backups/before-crm-first-*.sqlite` avant les changements. Elle est locale et exclue de Git. Retour arrière : arrêter le serveur, conserver une copie de la base courante, restaurer la sauvegarde puis relancer la version de code correspondante. Ne pas restaurer par-dessus un service actif.

## Vérifications et scénarios

Tests dans `tests/core.test.ts`, via le Store SQLite réel en mémoire, sans mutation de la base utilisée par le client :

1. Réception → OR idempotent → devis accepté → affectation → démarrage → travaux → contrôle → décompte → paiement partiel/complet → contact → créneau → clés → livré.
2. Demande de pièce sans réservation automatique et refus d'une falsification financière par sauvegarde de snapshot.
3. Récupération après fermeture / jour fermé refusée ; proposition précédente conservée ; démarrage sans devis accepté refusé.

Validation finale : 51 tests réussis, compilation TypeScript et build Vite réussis (avertissement de taille des bundles).

Les tests existants couvrent aussi conflits planning, devis, stock, pauses, voix locale, concurrence et qualité. Captures et essais utilisateur dans le navigateur encore nécessaires : accès automatisé précédemment bloqué, aucun contournement ni fausse capture.

## Petites tranches suivantes

1. Revue visuelle du Core, réception avec identité client indépendante, OR multiples par véhicule et migration contrôlée des anciens dossiers.
2. Facturation/acceptation structurées, pièces à référence confirmée, règles de livraison configurables, permissions et identité de l'acteur.
3. Voice : adaptateur fournisseur interchangeable, scénarios d'appels locaux, proposition de créneaux, confirmation/idempotence et transfert humain. Aucun appel extérieur avant raccordement autorisé et testé.
4. Vision : événements caméra locaux, score/confiance, rapprochement CRM, confirmation humaine, dédoublonnage/rétention ; aucun achat matériel ni reconnaissance des occupants.
5. Concession, multi-sites et Live alimenté par Core, modèles licenciés ensuite.

## Limites de mise en production

Le produit reste un prototype local sans authentification ni isolation multi-tenant. Un décompte interne n'est pas une facture réglementaire. Un règlement déclaré n'est pas une transaction vérifiée par un prestataire. Le contact saisi n'est pas une preuve de délivrance SMS. Les commandes fournisseurs, téléphonie, caméra, paiements et canaux externes ne sont pas raccordés. Aucun abonnement ni service payant souscrit.

## Navigation simplifiée — reprise du 14 octobre

Sept entrées quotidiennes : Accueil, Atelier, Planning, Devis, Pièces, Garage intelligent, Plan 3D. Salle d'attente et clients dans l'accueil ; équipe dans le planning ; rapports, réglages et modèles 3D dans Gestion. Les zones physiques restent accessibles dans le plan.

Les compteurs globaux répétés ont été retirés. L'atelier s'ouvre sur les travaux à faire/en cours, avec filtres En cours et À restituer. La fiche conserve la progression et replie affectation, pièces, paiement, restitution et historique. Les termes OR/ordre à ouvrir sont remplacés dans l'écran de travail par Prendre en charge. L'action primaire suit la prise en charge, le choix du technicien, le devis et le travail atelier.

## Finitions CRM et garage — 14 octobre

- Compteurs illustrés, libellé À restituer et technicien davantage mis en évidence. Plan 3D placé immédiatement après Accueil, avec aperçu interactif sous l'accueil.
- Action principale guidée jusqu'au contrôle, paiement et remise des clés. Reprise explicite des anciens véhicules déjà prêts sans inventer de règlement.
- Lecture rapide du devis : version, préparation du message et règlement enregistré. Les visites antérieures ajoutées sont uniquement des exemples identifiés du jeu d'essai, sans création d'un historique réel.
- SMS/WhatsApp : préparation locale avec modèles devis, véhicule prêt et fermeture, et heure souhaitée facultative. Aucun envoi automatique ni preuve de livraison ; aucun fournisseur raccordé.
- Dictée du compte rendu séparée des commandes atelier : une phrase dictée ne termine pas les travaux et ne déclenche pas d'envoi. Confirmation avant enregistrement au dossier ; compte rendu consultable depuis le devis.
- Garage : murs clairs, sol sombre, luminaires suspendus, rangement pneus/jantes, cabine de peinture, trois postes de bureau et deux personnages d'accueil décoratifs. Les colonnes des ponts sont exclues du masquage automatique responsable du clignotement. Aucun nouveau modèle automobile exact importé et pas d'animation de clients allant au café.

Vérification de cette tranche : **57 tests réussis**, contrôle TypeScript et build Vite réussis ; avertissement de taille des bundles toujours présent. Tests métier exécutés sur données isolées. Le serveur local écoute sur 127.0.0.1:5173. Le contrôle visuel des interactions dans le navigateur reste à effectuer : l'accès automatisé était bloqué. Les changements sont locaux, non publiés sur GitHub à cette étape.
