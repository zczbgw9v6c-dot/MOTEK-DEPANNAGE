# Revue 3 — courriel entrant IMAP (18 octobre 2026)

Base : `main` à jour après la PR nº 4, commit `3d6d8a5`. Branche `codex/imap-entrant`. Lecture préalable de `REVUE_2_EXPLOITATION.md` ; l'écran de demandes et ses règles sont réutilisés.

## Résultat pour le bureau

Dans **Demandes entrantes**, le bureau peut relever les courriels de la boîte configurée sur le serveur. Le relevé est manuel et protégé par un code opérateur distinct du mot de passe IMAP. Les courriels alimentent les demandes à traiter, avec provenance, texte et nombre de pièces jointes ignorées. Le formulaire et les alertes de doublon restent ceux de Claude : aucune mission créée sans confirmation.

Sans configuration complète, l'écran indique que le courriel n'est pas raccordé et désactive le relevé. Le collage manuel reste utilisable. Le bouton, le dernier compte rendu et les vues desktop/iPad sont couverts par la vérification navigateur.

## Implémentation et garde-fous

- IMAP TLS direct, certificat vérifié, lecture seule et `BODY.PEEK` ; aucun message envoyé, marqué lu, déplacé ou supprimé.
- 20 messages maximum par relevé, date de début explicite, 1 Mo maximum par message, texte retenu limité avec avertissement si abrégé. Les documents restent à consulter dans la boîte.
- Identité technique par compte/dossier, UIDVALIDITY et UID ; empreinte MIME complète lorsque le Message-ID existe. Les demandes classées ne sont pas réimportées. Pas de fusion silencieuse de deux courriels sans Message-ID sur le seul contenu.
- Reprise par curseur ; demandes et curseur enregistrés dans la même révision SQLite. Relecture après le réseau pour conserver les changements du bureau. Import concurrent refusé ; reset concurrent détecté ; absence d'avancement après panne réseau.
- Erreurs expurgées, identifiants privés exclusivement dans l'environnement du serveur. Code opérateur non conservé dans l'état ou le stockage navigateur. Pas de contenu HTML exécuté, de pixel chargé ou de données envoyées à un agent externe.
- Nouveaux champs via `migrateOps()` / `migrate()` ; validation serveur des origines et curseurs.
- Deux corrections constatées visuellement autour de minuit : les exemples utilisent désormais le bon jour lors d'un recul de quelques minutes ; les horodatages ISO des courriels importés sont affichés dans le fuseau du navigateur au lieu de tronquer la chaîne UTC. Le rapport vide n'affiche plus une barre décorative.

Les sources du tableau de bord « Mes dépanneurs », de l'assistant, de la recherche globale, de la file d'appels et de l'assistant de campagne ne sont pas modifiées. Aucun travail de Claude reconstruit en double.

## Dépendances

ImapFlow (MIT) et PostalMime (MIT-0), spécialisées dans IMAP/TLS et MIME, ajoutées pour éviter de réimplémenter ces protocoles. Versions verrouillées et licences ajoutées aux crédits existants. Aucun abonnement, service payant ou clé d'API.

## Configuration et limites

Voir [CONNECTEUR_IMAP.md](CONNECTEUR_IMAP.md) et `.env.example`. Aucun compte réel fourni ou connecté pendant ce lot. Mot de passe applicatif IMAP pris en charge ; OAuth2, réception périodique et stockage des pièces jointes restent hors périmètre. HTTPS, accès protégés et stockage durable sont nécessaires avant l'activation sur de vraies données.

La réception côté navigateur est vérifiée avec une réponse IMAP **explicitement simulée dans le test**, tandis que les tests serveur exercent le contrôleur, le décodeur MIME, l'authentification et les options de l'adaptateur. Cela ne remplace pas un premier relevé contrôlé sur la boîte de Joseph.

## Vérifications

| Contrôle | Résultat |
|---|---:|
| `npm test` | **121/121** (108 à la base, 13 nouveaux tests) |
| `npm run build` | **réussi**, avertissement de taille hérité |
| `node scripts/verify-depannage.mjs http://127.0.0.1:5181` | **27/27**, aucune erreur de page |
| `git diff --check` | réussi |

Serveur isolé : `AUTOHUB_DB=.data/verify-imap.sqlite npm run dev -- --port 5181`. Aucun compte réel configuré, aucun courriel réellement téléchargé pendant les tests. L'adaptateur protocolaire est testé avec un client simulé ; les routes et l'import SQLite sont exercés dans les tests serveur. Le scénario navigateur de réception est explicitement simulé et ses messages sont marqués fictifs.

[Résultats structurés](lot-3-imap/results.json) · [desktop non raccordé](lot-3-imap/19-imap-inbox-1500.png) · [iPad paysage](lot-3-imap/19-imap-inbox-1180.png) · [iPad portrait](lot-3-imap/19-imap-inbox-820.png) · [réception fictive et doublon signalé](lot-3-imap/20-imap-import-fictif.png).

La base avant raccordement est conservée dans [les captures de la revue 2](lot-2/16-demandes-entrantes.png).
