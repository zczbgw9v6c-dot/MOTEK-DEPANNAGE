# Déploiement MOTEK — démonstration protégée en ligne

Objectif : un lien HTTPS partageable (par exemple avec Samuel) qui fonctionne Mac éteint, avec des **données fictives**, sans jamais exposer la base locale `.data/autohub.sqlite` (exclue de Git et de l’image Docker).

## Ce que contient le dépôt

- `server/serve.ts` : un seul processus Node sert l’interface construite (`dist/`), l’API, le flux SSE et la base SQLite. Variables : `PORT`, `AUTOHUB_DB`, `MOTEK_DEMO_USER`, `MOTEK_DEMO_PASSWORD`.
- Protection : si `MOTEK_DEMO_PASSWORD` est défini, tout l’accès (pages et API) exige identifiant + mot de passe (HTTP Basic, chiffré par le HTTPS de l’hébergeur). Sans mot de passe, le serveur l’indique au démarrage.
- `Dockerfile` : image Node 22 (requis par `node:sqlite`), construction puis exécution en utilisateur non privilégié.
- `render.yaml` : blueprint Render (service web Docker, plan gratuit, région Francfort).
- Première exécution sur un hébergeur : la base n’existe pas → elle est créée avec le jeu d’essai fictif (60 dossiers, 14 présents…). Rien de local n’est copié.

Essai local du mode production :

```sh
npm run build
AUTOHUB_DB=.data/prod-test.sqlite MOTEK_DEMO_PASSWORD=essai PORT=8089 npm start
# puis, dans un autre terminal :
MOTEK_DEMO_PASSWORD=essai npm run verify:ui -- http://127.0.0.1:8089
```

## Options d’hébergement comparées (état vérifié à la date de rédaction, à reconfirmer sur le site de chaque hébergeur)

| Hébergeur | Coût | Mise en veille | Conservation des données | Verdict |
|---|---|---|---|---|
| **Render – Web Service Docker, plan Free** | 0 € (750 h/mois) | Oui : après ~15 min sans visite, réveil de 30 s à 1 min | **Disque éphémère** : la base SQLite repart du jeu d’essai à chaque redéploiement ou redémarrage (et à chaque réveil selon l’instance) | Recommandé pour la démo : gratuit, HTTPS automatique, déploiement depuis le dépôt GitHub privé, blueprint fourni |
| Render – Starter + disque persistant | ≈ 7 $/mois + ≈ 0,25 $/Go/mois (1 Go min.) | Non | Durable (disque monté sur `/app/.data`) | Solution durable la plus simple quand la démo sera validée |
| Railway – Hobby | 5 $/mois (crédit d’essai limité avant) | Non | Durable avec un volume | Alternative durable équivalente |
| Fly.io | Pas de palier gratuit pour les nouveaux comptes ; quelques €/mois pour une petite machine + volume | Possible (scale to zero) | Durable avec volume | Plus technique, pas nécessaire ici |
| Hugging Face Spaces (Docker) | 0 € | Oui : après 48 h sans visite | Éphémère sans stockage payant | Possible mais pensé pour des démos ML, moins lisible pour un garage |
| Oracle Cloud Always Free (VM) | 0 € | Non | Durable | Très bonne durabilité mais installation manuelle (VM, domaine, certificat) et maintenance à votre charge |

À retenir pour le gratuit : **réinitialisation possible des données** et **réveil lent après inactivité**. Les deux sont acceptables pour une démonstration avec données fictives ; ils ne le sont pas pour un usage réel.

## Mise en ligne sur Render (plan gratuit)

1. Créer un compte sur render.com et y connecter GitHub en autorisant l’accès au dépôt privé `zczbgw9v6c-dot/MOTEK` (Render demande l’installation de son application GitHub ; ne jamais transmettre de mot de passe à Claude ou dans le chat).
2. Tableau de bord → **New → Blueprint** → choisir le dépôt et la branche à déployer (après intégration de la PR : `main`).
3. Render lit `render.yaml` et demande la valeur de `MOTEK_DEMO_PASSWORD` : saisir un mot de passe de démonstration (il n’apparaît nulle part dans le dépôt). L’identifiant par défaut est `motek` (modifiable via `MOTEK_DEMO_USER`).
4. Premier déploiement : construction de l’image (≈ 3–5 min). L’URL ressemble à `https://motek-demo.onrender.com`.
5. Partager à Samuel : l’URL, l’identifiant et le mot de passe (par un canal séparé). Premier chargement lent si le service dormait.
6. Vérification depuis le dépôt : `MOTEK_DEMO_PASSWORD=… npm run verify:ui -- https://motek-demo.onrender.com` rejoue le parcours complet sur la version déployée.

Remise à zéro de la démo : bouton **Réglages → Réinitialiser la démonstration** dans l’application, ou « Manual Deploy » sur Render.

## Passer en durable plus tard

Ajouter un disque Render (ou un volume Railway) monté sur `/app/.data` et passer au plan payant : la même image fonctionne sans modification. Avant tout usage réel : authentification par compte (la protection actuelle est un seul mot de passe partagé), sauvegardes régulières de `.data`, HTTPS déjà fourni par l’hébergeur.


## Variables ajoutées (fiabilisation du 15 octobre 2026)

- `MOTEK_ALLOW_RESET=1` : autorise le bouton « Réinitialiser la démo » et la route `POST /api/v3/reset`. Sans cette variable, le serveur de production refuse la réinitialisation (403). Ne pas la définir pour un garage réel.
- Chaque réinitialisation ou écriture conserve la version précédente dans `v3history` (20 dernières). `GET /api/v3/history` liste les versions, `POST /api/v3/restore {revision}` en remet une en place.
- Le serveur refuse tout enregistrement sans révision, tout document qui n'a pas la forme attendue (collections, identifiants uniques, photos non issues du navigateur, règlements incohérents).
