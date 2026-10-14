# Réceptionniste téléphonique et caméra d’entrée — architecture préparée, rien de raccordé

Aucun fournisseur, aucun matériel, aucun abonnement n’est choisi ni activé. Le dépôt contient les contrats et la logique métier indépendante du fournisseur, testés sur données fictives.

## Ce qui existe dans le code

- `src/integrations/telephony-adapter.ts`
  - `TelephonyAdapter` : contrat (`start`, `say`, `transferToHuman`, `stop`) ; `noTelephony` est l’adaptateur par défaut, inerte et explicite.
  - `answerFrequentQuestion` : répond aux horaires **uniquement s’ils sont renseignés**, refuse de confirmer qu’un véhicule est prêt ou un prix sans vérification humaine.
  - `intentToRequest` : transforme une intention d’appel en demande CRM (dossier retrouvé par plaque, puis par téléphone s’il est unique) ; impose une confirmation humaine si l’identité est ambiguë, la confiance basse ou la demande sensible.
- `src/integrations/camera-adapter.ts`
  - `CameraAdapter` : contrat (`start`, `stop`) ; `noCamera` par défaut.
  - `matchSighting` : rapproche une lecture de plaque d’un dossier ouvert ou d’un rendez-vous. Statuts : `confirmé` (lecture sûre ≥ 0,85 et plaque unique), `à valider` (lecture incertaine, plaque proche à un caractère près ou plusieurs dossiers), `inconnu`, `doublon` (même plaque vue il y a moins de dix minutes). Une plaque ne garantit jamais le modèle exact.
- `tests/integrations.test.ts` couvre ces règles.

Reste à construire côté application : un écran « Arrivées détectées » (validation humaine des lectures), le branchement du flux d’appels vers une demande de rendez-vous selon les disponibilités réelles du planning, et l’adaptateur concret une fois le fournisseur choisi.

## Informations nécessaires pour choisir (à me transmettre, sans identifiants)

### Téléphonie
1. Le numéro du garage est-il chez un opérateur classique (ligne fixe, standard) ou déjà en VoIP ? Souhaitez-vous garder ce numéro (portabilité) ou en ajouter un dédié ?
2. Volume d’appels approximatif par jour et horaires de couverture souhaités (uniquement hors ouverture ? toute la journée en premier niveau ?).
3. Langues attendues (français, portugais, anglais).
4. Faut-il transférer à un humain pendant l’appel (vers quel poste/mobile) ou seulement rappeler ?

Options typiques, coût indicatif à vérifier avant tout engagement :
- Twilio (numéro ≈ 1–2 €/mois + minutes ≈ 0,01–0,03 €/min + transcription/voix) : très documenté, programmable, paiement à l’usage.
- Vonage, Telnyx : équivalents.
- Plateformes « agent vocal » (ElevenLabs Agents, Retell, Vapi…) : agent IA clé en main branché sur Twilio/SIP, facturé à la minute (≈ 0,05–0,15 €/min).
- Standard IP (Aircall, Ringover) : téléphonie d’équipe d’abord, IA en option, abonnements par utilisateur.

### Caméra
1. Y a-t-il déjà une caméra à l’entrée ? Modèle, flux RTSP accessible ? Vue sur la plaque avant à l’arrivée ?
2. Le Mac ou un petit ordinateur restera-t-il allumé sur place (lecture locale) ou faut-il un service hébergé ?
3. Contraintes : nuit, pluie, angle, distance ; nombre de voies d’entrée.
4. Information des clients (affichage) et durée de conservation souhaitée des images.

Options : caméra IP avec lecture de plaque intégrée (Hikvision/Dahua ANPR, ≈ 150–500 €), ou caméra simple + lecture locale open source (OpenALPR/Rekor, ≈ gratuit à quelques dizaines d’euros/mois pour la version cloud), ou service cloud (Plate Recognizer ≈ gratuit jusqu’à ~2 500 lectures/mois, puis abonnement).

Rien ne sera activé sans votre accord explicite et une estimation de coût validée.
