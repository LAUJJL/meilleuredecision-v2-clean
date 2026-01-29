# 10 — DÉCISIONS STRUCTURANTES DU SITE (V2)

Ce fichier contient uniquement les décisions durables.
Il sert de socle au redémarrage de chaque nouveau chat.

Dernière mise à jour : 2026-01-29


## D-01 — Méthode top-down stricte
Le parcours est strictement :

Problème → Visions → Raffinements

Aucune construction bottom-up.


## D-02 — Immutabilité après validation
Tout élément validé devient en lecture seule.
On ne modifie jamais un problème/vision/raffinement validé.
Toute évolution passe par une nouvelle branche ou un raffinement.


## D-03 — V2 uniquement
La V1 est abandonnée.
Le site est construit uniquement selon la logique V2.


## D-04 — Minimalisme
Priorité absolue à une V2 minimale fonctionnelle.
Pas de fonctionnalités secondaires tant que le parcours central n’est pas stable.


## D-05 — Suppression totale de la reformulation visible
Il n’existe plus aucune reformulation affichée au visiteur.

Le schéma est désormais :

Texte libre → Formulaire proposé → Acceptation obligatoire

La preuve de compréhension est le formulaire accepté, pas une reformulation IA.


## D-06 — Mini-formulaire obligatoire avant validation
Aucun Problème / Vision / Raffinement ne peut être validé
sans mini-formulaire accepté explicitement par le visiteur.

Sans formulaire accepté : pas de validation, rien n’est sauvegardé.


## D-07 — Texte non formalisable
Si le texte ne permet pas de construire un formulaire :

- le système l’explique simplement
- il liste ce qui manque (objectif, horizon, chiffres, options)
- il demande au visiteur de proposer un nouveau texte

Transparence : pas de faux prétexte, pas de promesse miracle.


## D-08 — Refus du formulaire
Si le visiteur refuse le formulaire :

- il doit fournir une raison courte (texte)
- le système propose deux sorties :
  - revenir au texte pour corriger
  - reproposer un nouveau formulaire


## D-09 — Navigation standard (toutes pages)
Chaque page comporte un bandeau fixe :

- Accueil (vert)
- Aide (placeholder, plus tard)
- ← Page précédente
- Page suivante →

Les boutons correspondent à l’ordre naturel du parcours,
pas à l’historique navigateur.

Ne pas utiliser router.back().


## D-10 — Transparence utilisateur
Le site tente toujours de formaliser.

En cas d’échec, il dit la vérité :

“Cette version ne sait pas encore formaliser cet objectif.
Essayez une formulation plus simple.”

Les visiteurs ne sont pas des imbéciles : la transparence inspire confiance.


## D-11 — Mémoire écrite obligatoire
Les décisions durables sont maintenues dans /memoire :

- 10_DECISONS_SITE.md
- 20_LANGAGE_PIVOT.md
- 30_CHECKPOINT_IMPLEMENTATION.md

Fin de journée : mise à jour planifiée.
Redémarrage chat : relecture intégrale obligatoire.


## D-12 — Discipline anti-déconnexion
- Nouveau chat tous les 2 jours maximum
- Mise à jour mémoire chaque soir
- GitHub push obligatoire avant redémarrage
