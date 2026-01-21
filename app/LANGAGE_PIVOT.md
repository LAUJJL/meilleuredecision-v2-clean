# Langage Pivot — V1 → V2

## 0) Objet du langage pivot

Le langage pivot est une représentation formelle intermédiaire utilisée par le système.
Il permet :
- de traduire des formulations humaines en structures cohérentes,
- de vérifier la cohérence entre problème, visions et raffinements,
- d’évaluer quantitativement si un objectif minimal est atteint,
- de vérifier le respect de contraintes de viabilité sur l’évolution du système.

Le langage pivot n’est pas exposé tel quel au visiteur.
Il sert de support interne à la vérification et au calcul.

---

## 1) Principes généraux

### 1.1 Approche top-down

La méthode suit une approche strictement top-down :

1. Définition du problème
2. Définition d’une vision
3. Raffinements successifs

Chaque étape dépend des précédentes.
Une fois validée, une étape devient immuable dans le cadre du problème en cours.

---

### 1.2 Immutabilité

- La définition du problème est immuable dès qu’une vision est engagée.
- La définition d’une vision est immuable dès qu’un raffinement est validé.
- Les raffinements validés ne sont jamais modifiés.

Toute modification structurelle implique de recommencer une nouvelle analyse.

---

## 2) Entités fondamentales — cadre général (V2)

### 2.1 Grandeurs d’état (stocks)

Un stock représente l’état du système à un instant donné.
Il évolue dans le temps sous l’effet de flux.

Attributs :
- `nom_stock`
- `unite_stock`
- `valeur_initiale`
- `valeur(t)`

Plusieurs stocks peuvent exister en V2.

---

### 2.2 Flux

Un flux représente une quantité ajoutée ou retirée d’un stock par unité de temps.

Attributs :
- `nom_flux`
- `unite_flux`
- `valeur_flux`
- `statut_flux` : donné ou calculé

Un flux est toujours associé à un stock cible.

---

### 2.3 Horizon

L’horizon définit la durée d’analyse sur laquelle les stocks sont observés.

Attributs :
- `horizon_valeur`
- `horizon_unite`

---

### 2.4 Objectif (grandeur cible)

L’objectif exprime ce que le décideur souhaite obtenir.

Attributs :
- `objectif_variable`
- `objectif_valeur`
- `objectif_unite`
- `objectif_echeance`

Règles :
- l’objectif est défini au niveau du problème,
- il est immuable,
- il peut porter sur une grandeur différente des stocks du système.

L’objectif est évalué à une échéance donnée,
et non nécessairement sur l’ensemble de l’horizon.

---

### 2.5 Contraintes de viabilité

Une contrainte exprime une condition qui doit être respectée
par une grandeur d’état (stock) sur tout ou partie de l’horizon.

Attributs :
- `variable_contrainte`
- `condition` (ex : ≥, ≤)
- `valeur_seuil`
- `periode_applicable`

Exemples :
- trésorerie ≥ 0 sur [0, horizon]
- stock ≥ seuil de sécurité

Les contraintes conditionnent la validité d’une vision,
mais ne constituent pas l’objectif en tant que tel.

---

## 3) Cas particulier — cadre V1

Dans certains problèmes simples (V1),
l’objectif porte directement sur le niveau final du stock principal.

Dans ce cas :
- la grandeur objectif et le stock partagent la même unité,
- l’objectif consiste à atteindre un niveau minimal du stock à l’horizon.

Ce cas constitue une **spécialisation** du cadre général V2,
et non une règle universelle.

---

## 4) Évaluation

### 4.1 Atteinte de l’objectif

Un objectif est atteint si, à son échéance :
- la grandeur cible respecte la condition définie,
- toutes les contraintes de viabilité sont respectées.

---

Toute grandeur quantitative manipulée dans le langage pivot
(stock, flux, paramètre, objectif)
est associée à une unité explicite.

Les flux portent l’unité de la grandeur cumulée par unité de temps.

Les grandeurs sans dimension doivent être explicitement déclarées comme telles.

### 4.2 Rejet d’une vision

Une vision est rejetée si :
- l’objectif n’est pas atteint à l’échéance,
- ou une contrainte de viabilité est violée sur l’horizon observé.
