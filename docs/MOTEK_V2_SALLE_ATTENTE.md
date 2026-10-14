# MOTEK V2 — salle d’attente, lot du 14 octobre 2026

## Parcours livré

1. Ouvrir Attente dans la navigation : la caméra rejoint la salle du garage existant. Les clients présents ont des cartes sélectionnables. Un formulaire permet d’accueillir un client déjà connu sans créer un autre véhicule.
2. Cliquer le corps ou la carte d’un client : halo de sélection, rapprochement caméra, fiche synthétique, coordonnées, état du véhicule, contrôles réellement cochés, devis et prise en charge.
3. Cliquer sa tête ou l’avatar de la fiche : dossier détaillé avec onglets vue d’ensemble, véhicule, interventions, devis et documents.
4. Ouvrir le véhicule, l’intervention ou les devis : les actions utilisent le même identifiant de dossier. Aucun envoi de message externe.
5. Enregistrer le départ du client : il disparaît de la salle, mais le dossier et son historique restent conservés.

## Décor

Deux canapés avec coussins, table et magazines illustrés localement, café, distributeurs décoratifs, télévision d’accueil, luminaires et clients assis avec vêtements, visages et membres arrondis. Les personnages sont des représentations procédurales, pas des portraits réels ni des modèles photoréalistes. Le reste du garage conserve son implantation.

## Données

Champ optionnel `Vehicle.reception` : date d’arrivée du client, état attente/prise en charge/départ et date de prise en charge. Compatible avec les sauvegardes antérieures. Une arrivée véhicule ne suppose pas automatiquement que son propriétaire reste sur place : case explicite dans la création du dossier. Les anciennes présences de démonstration restent signalées. Pas de calcul d’attente à partir d’une heure inventée. Les modifications passent par la sauvegarde serveur existante et alimentent l’audit.

## Limites explicites

- Les fiches restent rattachées au dossier véhicule existant. La normalisation d’une identité client possédant plusieurs véhicules reste à réaliser ; aucune fusion automatique par nom.
- SMS : brouillon temporaire à copier, aucun fournisseur d’envoi configuré.
- Les photographies enregistrées dans l’intervention sont consultables/téléchargeables. Carte grise, assurance, documents signés et historique de fidélité ne sont pas ajoutés artificiellement.
- Aucun nouveau modèle automobile de marque n’a été importé dans ce lot.
- Aucun paiement, publication externe ou changement de données de production pendant les tests.

## Vérification

Suite précédente : 47 tests réussis. Test complémentaire de sauvegarde de présence via SQLite et rejet d’une date invalide ajouté et exécuté séparément. Compilation TypeScript et build Vite réussis (avertissement habituel de taille des bundles).

La validation visuelle et les trois captures demandées ne sont pas réalisées : l’accès navigateur automatisé avait été refusé par sa politique de sécurité ; aucun contournement utilisé. Elles restent nécessaires pour confirmer le cadrage et l’apparence sur tablette. Aucun ancien visuel n’est présenté comme une capture de cette version.
