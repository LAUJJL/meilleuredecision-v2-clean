# github/meilleuredecision-v2-clean/memoire — Mémoire du projet (V2)

Ce répertoire contient la mémoire écrite officielle du projet.

Objectif :
- assurer la continuité entre les chats
- éviter toute perte en cas de déconnexion
- repartir uniquement des décisions actives

Ces fichiers sont la référence.

---

## Fichiers

### 10_DECISONS_SITE.md
Décisions structurantes durables (architecture, règles, UX).

### 20_LANGAGE_PIVOT.md
Définitions formelles minimales (statuts, concepts pivot).

### 30_CHECKPOINT_IMPLEMENTATION.md
État exact du code : où on s’est arrêté, prochaine étape.

---

## Discipline quotidienne

Chaque jour, en fin de séance :

1. Jean-Jacques envoie le `fourre-tout.md`
2. L’assistant extrait uniquement les décisions durables
3. L’assistant renvoie les 3 fichiers mémoire entiers corrigés
4. Jean-Jacques copie-colle dans `/memoire`

---

## Redémarrage tous les 2 jours

À chaque nouveau chat :

- relire intégralement les 4 fichiers mémoire
- repartir uniquement de ces décisions
- ne jamais réintroduire d’anciennes règles

---

## GitHub (obligatoire)

Avant chaque redémarrage de chat :

- commit + push complet du site sur GitHub
- cela garantit qu’on ne perd jamais plus de 2 jours
  git status
  git add .
  git commit -m "Checkpoint fin de journée"
  git push

  vérification finale 
  git status  doit donner working tree clean

en début de journée faire 
taskkill /IM node.exe /F     pour tuer tous les anciens process qui tournent encore uniquement si port3000 n'est pas libre 
npm run dev

