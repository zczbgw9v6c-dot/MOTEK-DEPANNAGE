# Mise à jour MOTEK du dépôt AUTOHUB

Base attendue : commit fca7a7a, visible sur la capture fournie. Cette archive contient uniquement les fichiers ajoutés ou modifiés depuis cette version, avec leurs chemins exacts. Aucune suppression nécessaire. Aucun secret, base locale ou dépendance installée inclus.

## Intégration dans le dépôt existant
1. Décompresser le ZIP.
2. Ouvrir le dossier décompressé. Ses dossiers src, server, tests, docs et son README.md doivent rejoindre ceux à la racine du dépôt existant.
3. Dans Ajouter un fichier / Upload files, déposer le CONTENU du dossier décompressé, sans ajouter un dossier parent MOTEK_MISE_A_JOUR et sans déposer le ZIP seul. Les fichiers existants aux mêmes chemins seront remplacés.
4. Avant de valider, vérifier que les chemins sont notamment src/main.tsx, server/store.ts et docs/MOTEK_CRM_FIRST_AUDIT.md.
5. Enregistrer avec le message : Mettre à jour MOTEK : parcours CRM, devis, accueil et garage 3D.

Attention : la traduction automatique de ton navigateur affiche « source », « serveur » ou « publique ». Les noms réels restent src, server et public : ne pas traduire ou renommer les dossiers.

Le nom du dépôt peut devenir MOTEK (nom affiché dans l'application) sans changer les chemins du code. Conserver sa visibilité privée. Si quelqu'un a modifié le dépôt après fca7a7a, comparer ses changements avant de remplacer les fichiers.

## Passation à Claude
Lire AGENTS.md et docs/MOTEK_CRM_FIRST_AUDIT.md, puis README.md. Travailler exclusivement sur ce CRM et sur une branche dédiée. Ne pas utiliser ORIA. Annoncer les fichiers concernés avant de travailler en parallèle avec Codex. Préserver les données et fonctionnalités existantes. Aucun service payant ou envoi externe activé par défaut.

Priorité : vérifier le parcours réception → devis accepté → affectation → travaux → contrôle → règlement enregistré → contact → remise des clés. Le réceptionniste IA et la caméra restent à construire ; les messages actuels sont des préparations locales, pas des envois effectifs. La 3D représente les données du CRM.

## Lancement et validation
Node.js 24 recommandé. Depuis le dépôt complet : npm ci, puis npm run dev. Ouvrir http://127.0.0.1:5173/.
Vérifications : npm run build et npm test.
Dernière validation locale : 57 tests réussis et compilation réussie. Validation visuelle navigateur encore nécessaire. Cette archive différentielle ne peut pas fonctionner seule : elle complète le dépôt existant.
