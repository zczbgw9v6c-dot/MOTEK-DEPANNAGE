# Reprise — 16 octobre 2026

> Mise à jour du 17 octobre : lire [REVUE_17_OCTOBRE.md](REVUE_17_OCTOBRE.md). Module commercial local ajouté ; validation finale : 102 tests et 22 parcours navigateur réussis. Le contenu initial ci-dessous est historique.

## Dépôt et branche

- Dépôt : `zczbgw9v6c-dot/MOTEK-DEPANNAGE` exclusivement.
- Branche : `codex/revue-1`, PR ouverte nº 1 vers `main`.
- Ne pas modifier MOTEK ni pousser directement sur main.
- Lire `docs/BRIEF_CODEX_MOTEK_DEPANN.md` et `docs/REVUE_1_DEPANNAGE.md`.
- Le fichier AGENTS.md racine est hérité d'AutoHub et mentionne un autre chemin : le périmètre demandé par l'utilisateur est bien ce dépôt dépannage.

## Dernier lot transmis, à auditer

- Catalogue de 14 pages prestations et de leurs trois montants « dès … TTC » : `docs/depanneuse-catalogue.json`, repris dans `commercialCatalog()`.
- Source commerciale : https://depanneuse.net ; les divergences entre tableaux et texte sont conservées dans le champ `issue`. Ces prix ne sont pas des devis fermes ni des tarifs validés par Joseph. Ne pas inventer de barème kilométrique ou de majoration.
- Identité imposée par l'utilisateur : **Dan Dépanne uniquement**. Ne pas importer ZED SERVICES, les identités légales ou les autres personnes du site.
- Chauffeurs : Dylan, Laurent, Trump. Administration : Moïse et Florence. Joseph est le patron. Aucun téléphone ou courriel personnel inventé pour cette équipe.
- Migration du catalogue, des zones (60, 75, 77, 78, 91 à 95), de l'équipe et des champs commerciaux ; anciennes équipes conservées dans les collections legacy.
- Création de mission avec choix de prestation, département, montant HT proposé et déclaration manuelle d'acceptation du prix. Facturation bloquée pour les missions liées au catalogue dont le prix n'est pas confirmé.
- Démonstration : prestations de dépannage à la place des motifs bris de glace/vandalisme ; confirmations de prix explicitement simulées.
- Aucun tarif de gardiennage trouvé sur les pages consultées : valeurs existantes toujours de démonstration, à faire confirmer. Le champ `rateStatus` prépare cette distinction, mais sa visibilité dans tous les écrans reste à vérifier.

## Validation de ce lot

- `npm test` : **97 tests réussis, 0 échec**, le 16 octobre 2026.
- `npm run build` : **réussi**, avertissement existant de taille de certains bundles.
- `git diff --check` : réussi.
- **Vérification navigateur non relancée sur ce dernier lot.** Les captures et les 20 étapes réussies du rapport de revue précédent correspondent au lot précédent ; ne pas les présenter comme une validation des derniers changements.

## Priorités de reprise

1. Actualiser puis exécuter `scripts/verify-depannage.mjs` avec une base isolée et un serveur lancé depuis cette branche. Le script contient encore d'anciens noms et effectifs. Sa création de mission doit déclarer l'acceptation du prix avant facturation.
2. Ajouter les tests ciblés du catalogue, des migrations, de la confirmation du prix et des effectifs ; vérifier les cohérences entre montants des courriels simulés et missions après le changement des tarifs du seed.
3. Auditer la migration d'une base existante : préservation des affectations et des modifications utilisateur, historique de l'équipe, absence de réécriture répétée des coordonnées et horaires de la société.
4. Vérifier visuellement les formulaires, le bureau 3D et la prise en main, sur desktop et iPad portrait/paysage ; compléter les captures.
5. Développer le module commercial : catalogue lisible, validation manuelle des tarifs, préparation de campagnes Google/Meta, budget total prévu de 50 €, ciblage local, export des annonces et suivi des prospects.

## Publicité : demande précise et état réel

L'utilisateur n'a actuellement **pas accès au compte Google de Dan Dépanne** et demande de tout préparer sans ce compte. Windsor.ai a été proposé et l'utilisateur a créé un accès, mais aucun compte publicitaire Dan Dépanne n'a été confirmé connecté.

**Le module publicitaire n'est pas encore développé.** Seules des collections vides `marketing.campaigns`, `marketing.leads`, `marketing.history` et des indicateurs de connexion à false sont initialisés. Ne pas annoncer de campagne créée ou diffusée.

Préparer des brouillons sans dépense, avec validation humaine et connexion ultérieure. Ne pas inventer de clics, de dépenses ou de prospects ; un clic n'identifie pas une personne. Aucun service payant, clé d'API ou transmission externe de données personnelles. Aucun e-mail, SMS ou WhatsApp envoyé automatiquement. Tout ce qui est simulé doit être annoncé dans l'interface.

## Livrable attendu à terme

Compléter la PR nº 1 avec bugs corrigés, ajouts/retraits, résultats des tests et du navigateur, captures desktop/iPad et recommandations. Le lot actuel est une transmission de travail en cours pour l'audit, pas une validation finale du produit.

## Mise à jour du 17 octobre 2026

L'état des travaux ci-dessus est historique : lire désormais `docs/REVUE_17_OCTOBRE.md` pour la correction du reset, le retrait du nom Damien, les validations actualisées et le module commercial local ajouté après la vérification initiale. Aucune branche Claude fusionnée. « Mes dépanneurs », assistant et recherche globale restent réservés au portage de Claude après fusion de la PR nº 1.
