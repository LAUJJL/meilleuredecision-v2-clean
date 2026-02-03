# 10 — DÉCISIONS STRUCTURANTES DU SITE (V2)

Ce fichier contient uniquement les décisions durables.
Il sert de socle au redémarrage de chaque nouveau chat.

Dernière mise à jour : 2026-02-03


## D-01 — Méthode top-down stricte
Le parcours est strictement :

Problème → Visions → Raffinements

Aucune construction bottom-up.


## D-02 — Immutabilité après validation
Tout élément validé devient en lecture seule.
On ne modifie jamais un problème/vision/raffinement validé.
Toute évolution passe par une nouvelle branche ou un raffinement.
Si on quitte une page sans valider, les saisies de la page sont perdues

## D-03 — V2 uniquement
La V1 est abandonnée.
Le site est construit uniquement selon la logique V2.


## D-04 — Minimalisme
Priorité absolue à une V2 minimale fonctionnelle.
Pas de fonctionnalités secondaires tant que le parcours central n’est pas stable.


## D-05 — Suppression totale de la reformulation visible
Il n’existe plus aucune reformulation affichée au visiteur.

Le schéma est désormais :

Texte libre  → Acceptation obligatoire







## D-09 — Navigation standard (toutes pages)
Chaque page comporte un bandeau fixe :

- Accueil (vert) en haut à gauche
- Aide (placeholder, plus tard) en haut au milier de la page
- ← Page précédente     en haut et en bas de page à droite
- Page suivante →       en haut et en bas de page à droite
Un des boutons à droite peut être supprimé s'il se cumule avec un autre bouton dans la page

Les boutons correspondent à l’ordre naturel du parcours,
pas à l’historique navigateur.

Ne pas utiliser router.back().


## D-10 — Transparence utilisateur
Le site tente toujours de formaliser les raffinements.

En cas d’échec, il dit la vérité :

“Cette version ne sait pas encore formaliser votre texte.
Essayez un texte plus simple.”

Les visiteurs ne sont pas des imbéciles : la transparence inspire confiance.


## D-11 — Mémoire écrite obligatoire
Les décisions durables sont maintenues dans /memoire :

- 10_DECISONS_SITE.md
- 20_LANGAGE_PIVOT.md
- 30_CHECKPOINT_IMPLEMENTATION.md

Fin de journée : mise à jour planifiée.
Redémarrage chat : relecture intégrale obligatoire.


## D-12 — Discipline anti-déconnexion
- Nouveau chat après page validée
- Mise à jour mémoire chaque soir à partir du fichier fourre-tout enregistrant les décisions de la journée
- GitHub push obligatoire avant redémarrage
