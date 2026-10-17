# Lot Claude après la fusion de la revue 1 (17 octobre 2026)

Base : `main` après la fusion de la PR nº 1 de Codex. Ce lot n'ajoute que ce qui manquait ; tout le reste vient de Codex.

## Équipe confirmée par l'utilisateur
Trois dépanneurs : **Dylan, Laurent, Trump**. Bureau : **Moïse et Florence**. Patron : **Joseph**. Damien n'existe pas : le magasinier « Damien » hérité de l'atelier masqué s'appelle désormais Hugo, et un test vérifie qu'aucun Damien ne reste dans les données.

## Bug corrigé
- **Réinitialiser la démo** remplaçait l'état par le jeu de départ sans passer par `migrate()` : le catalogue des prestations et les champs commerciaux disparaissaient, et le formulaire « Nouvelle mission » plantait (`serviceCatalog` absent). C'est ce qui faisait échouer en cascade 5 étapes sur 20 de `verify-depannage.mjs` sur `main`. `reset()` appelle maintenant `migrate()` ; test de non-régression ajouté.

## Ajouts
- Tableau de bord : bandeau **« Mes dépanneurs »** (statut, depuis quand, motif, plaque, adresse ; clic vers la mission ou le planning). Les six indicateurs de Codex et leur routage par libellé (`DEP.kpiRoute`) sont conservés tels quels.
- « Demander à MOTEK » : « qui est libre ? », « où est Dylan ? » ; un prénom inconnu n'est pas inventé.
- Recherche globale : missions, factures du dépanneur, dépanneurs et bureau ; texte de la barre adapté au dépannage.
- « Clients & véhicules » (CRM garage, clients fictifs lyonnais) masqué pour le profil dépanneur.

## Script de vérification remis à jour
`scripts/verify-depannage.mjs` attendait encore l'ancienne équipe (Nadia, Karim, Sabrina ; 12 chauffeurs ; 3 collaborateurs) et facturait des missions dont le prix du catalogue n'était pas accepté. Il coche désormais l'acceptation du prix, ne facture que des missions facturables et vérifie le bandeau des dépanneurs.

## Résultats
- `npm test` : 100/100.
- `npm run build` : réussi (avertissement de taille de bundle hérité).
- `node scripts/verify-depannage.mjs` : **20/20**, aucune erreur JavaScript de page.

## Non repris de l'ancienne branche Claude (volontairement)
Planning, écran chauffeur, facturation, relance groupée, reçu de sortie, tableau par compagnie : la version de Codex est gardée. Les paramètres atelier (taux horaires) restent visibles faute de remplaçant : un écran de paramètres propre au dépannage est à faire, en lien avec le catalogue de prix du site, sans inventer de tarif.
