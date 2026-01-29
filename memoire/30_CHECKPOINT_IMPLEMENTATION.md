# 30 — CHECKPOINT IMPLEMENTATION (V2)

Dernière mise à jour : 2026-01-29


## État général
Le site est en V2 uniquement.

Parcours :

Problème → Visions → Raffinements


## Pages existantes

- app/page.tsx
  Page d’accueil (bouton V1 à retirer plus tard)

- app/v2/problemes/page.tsx
  Liste des problèmes existants ou création

- app/v2/probleme/page.tsx
  Définition du problème (texte → formulaire)

- app/v2/visions/page.tsx
  Liste des visions (début fonctionnel)

- app/v2/vision/page.tsx
  Définition d’une vision (à aligner sur le schéma formulaire-first)


## Problème : état actuel

Implémenté :

- Texte libre
- Bouton "Construire le mini-formulaire"
- Formulaire proposé avec statuts :
  (vide), GLOBAL_CONST, VISION_PARAM, VISION_KNOB
- Acceptation obligatoire
- Refus avec :
  - raison courte
  - retour texte
  - reproposition formulaire

Stockage localStorage OK.


## Prochaine étape immédiate

Objectif :

- remplacer l’ancien champ objectif “case doubler”
- passer à objectif texte libre
- tentative de formalisation minimale
- en cas d’échec : message transparent + exemples simples


## API

Ancien fichier :

- app/api/v2/problem/route.ts

Doit être refactoré :

- suppression reformulation
- sortie = formulaire proposé ou message “non formalisable”


## Règle avant redémarrage chat

Avant tout nouveau chat :

- mise à jour des fichiers mémoire
- commit + push GitHub obligatoire
