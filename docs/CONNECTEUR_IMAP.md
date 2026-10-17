# Courriels entrants → Demandes entrantes

Lot basé sur `main` après fusion de la PR nº 4 (`3d6d8a5`). Il raccorde l'écran `41-reception-demandes.js` existant, son extraction locale et sa détection des doublons. Aucun nouvel écran concurrent, aucune modification de « Mes dépanneurs », de l'assistant ou de la recherche globale.

## Fonctionnement

Le bureau clique **Relever les courriels**, saisit son code opérateur de réception, puis lance un relevé. Le code est distinct du mot de passe de la boîte, saisi en champ masqué et non enregistré dans l'état ou le stockage navigateur. Il est transmis au serveur pour ce relevé uniquement.

Le serveur ouvre le dossier IMAP en **lecture seule** (`EXAMINE`, sources via `BODY.PEEK`). Aucun message marqué comme lu, déplacé, supprimé ou envoyé. Aucun modèle externe, pixel de suivi, téléchargement de lien ou appel à Google/Meta/WhatsApp. Le HTML est réduit en texte et affiché échappé, jamais exécuté.

- Au maximum **20 courriels par relevé**, à partir de la date choisie par le bureau, lus ou non lus. Un autre clic récupère le lot suivant. Pas de tâche périodique cachée.
- Taille complète maximale : **1 Mo par courriel**, pièces jointes comprises. Un message trop gros n'est pas téléchargé ; il est signalé dans le compte rendu du dernier relevé et reste à consulter dans la boîte.
- Le texte retenu est limité à 24 000 caractères ; les pièces jointes ne sont pas conservées dans l'application. Leur nombre est indiqué dans la demande. Lire l'original pour les documents, longues chaînes et informations tronquées.
- Chaque courriel importé devient une demande **À traiter**, jamais une mission automatique. L'extraction, les champs manquants, les alertes de doublon métier et la confirmation du formulaire restent ceux de la revue 2.
- Un courriel déjà importé ne revient pas après classement de sa demande : clé compte/dossier + UIDVALIDITY + UID. Le Message-ID et le contenu aident aussi à reconnaître le même courriel après renouvellement des UID. Sans Message-ID, deux courriels distincts de même contenu restent deux demandes : le bureau voit les alertes métier.
- Curseur et demandes sont enregistrés ensemble, avec contrôle de révision SQLite et notification des autres postes. Le serveur relit l'état après l'accès réseau pour conserver les changements du bureau. Une panne ne fait pas avancer le curseur ; une réinitialisation concurrente annule le lot.
- Les messages illisibles ou trop gros sont signalés, puis le curseur avance pour ne pas bloquer tous les courriels suivants. Ils ne sont pas supprimés de la boîte. Conserver le compte rendu avant le prochain relevé et consulter ces originaux manuellement.

## Configuration privée du serveur

Copier les noms de variables de `.env.example` dans la configuration privée de l'hébergement, ou dans un fichier local ignoré par Git. Les fournir **au processus Node serveur** ; ne pas compter sur une exposition au client Vite.

| Variable | Utilisation |
|---|---|
| `MOTEK_IMAP_ENABLED` | `1` pour autoriser le raccordement ; défaut désactivé |
| `MOTEK_IMAP_HOST` | Serveur du fournisseur de messagerie |
| `MOTEK_IMAP_USER` | Identifiant de la boîte |
| `MOTEK_IMAP_PASSWORD` | Mot de passe dédié/applicatif du fournisseur, si disponible |
| `MOTEK_IMAP_FOLDER` | Dossier à relever ; défaut `INBOX`, dossier de missions dédié recommandé |
| `MOTEK_IMAP_SINCE` | Date réelle inclusive `YYYY-MM-DD`, obligatoire pour éviter l'import involontaire de tout l'historique |
| `MOTEK_IMAP_OPERATOR_TOKEN` | Secret aléatoire d'au moins 24 caractères, distinct de celui de la boîte, remis au bureau |

TLS direct **port 993**, certificat obligatoirement vérifié, TLS 1.2 minimum. Aucun mode non chiffré ni désactivation de vérification des certificats. Le mot de passe IMAP n'est ni envoyé au navigateur ni enregistré dans SQLite ; les journaux du client IMAP sont désactivés et les erreurs de connexion renvoyées à l'écran sont expurgées.

Le code opérateur peut être généré localement avec `openssl rand -hex 32`. Ne jamais coller les secrets dans une conversation, une issue, une capture ou une PR. Une configuration incomplète laisse le bouton désactivé. « Configuré » signifie que les paramètres requis existent ; la connexion réelle n'est confirmée que par un relevé réussi.

En production : HTTPS et accès protégé à l'application indispensables avant des données réelles. Le code opérateur protège le déclenchement IMAP ; il ne remplace pas une authentification par personne, encore à réaliser. Ne pas partager le code avec des utilisateurs qui ne doivent pas lire les demandes. La rotation du code se fait côté serveur.

Pour lancer le serveur construit avec un fichier privé local : `node --env-file=.env.local --experimental-strip-types server/serve.ts` après `npm run build`. Ne pas committer ce fichier. Redémarrer le processus après changement des variables.

## Limites et suite

Aucun compte de Joseph n'a été fourni ou raccordé pendant ce développement. Les tests utilisent une boîte simulée côté test et des courriels fictifs, sans contact avec un serveur de messagerie réel. L'activation réelle et un premier relevé contrôlé avec Joseph restent à effectuer.

Authentification IMAP par mot de passe/applicatif uniquement dans ce lot ; OAuth2 fournisseur et renouvellement de jetons non implémentés. Si le fournisseur impose OAuth2, conserver le collage manuel et prévoir ce raccordement séparément. Pas de polling automatique, de pièces jointes stockées, d'envoi SMTP ou de traitement automatique des courriels d'assureurs. Les messages de boîte non pertinents se classent manuellement. Sur l'hébergement de démonstration sans disque persistant, l'état et les curseurs disparaissent au redéploiement comme le reste de la démo : stockage durable et sauvegardes requis avant usage réel.

## Dépendances justifiées

- **ImapFlow 2.5.2 — MIT** : IMAP, TLS, lecture seule, verrou de dossier et récupération bornée des sources. Évite une implémentation artisanale de ce protocole et des identifiants de messages.
- **PostalMime 4.0.8 — MIT-0** : décodage MIME, encodages des entêtes et corps, multipart et détection des pièces jointes. Traitement entièrement local.

Aucun abonnement ni clé d'API payante ajouté. `package-lock.json` fige les versions installées ; les licences sont reprises par le mécanisme existant de préparation des crédits.

Références : [API ImapFlow](https://imapflow.com/docs/api/imapflow-client/), [lecture des messages et BODY.PEEK](https://imapflow.com/docs/guides/fetching-messages/), [PostalMime](https://github.com/postalsys/postal-mime).
