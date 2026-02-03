# 20 — LANGAGE PIVOT (V1)

Dernière mise à jour : 2026-02-03

Ce document décrit **ce que nous appelons “Langage Pivot”** dans le projet.

Le Pivot n’est **pas** un “langage informatique” pour l’utilisateur.
C’est une **structure minimale et stable** (un petit modèle de données) qui sert de référence commune pour :

- faire des calculs (quand c’est possible),
- afficher l’état du modèle (tableau / graphique),
- fournir à une IA un **contexte court et fiable**,
- garantir la continuité entre raffinements (on garde le “validé”, pas les essais).


## 1) Principe V1 (important)

### 1.1 Problème et Visions
En V1 :
- **Problème** : texte libre uniquement (pas de formalisation).
- **Vision** : texte libre uniquement (pas de formalisation).
- Il n’y a **pas** de contrôle automatique “cohérence problème → visions” en V1.

### 1.2 Le Pivot commence à R1
Le Pivot **démarre à R1** avec une structure imposée (stock + flux + temps).

### 1.3 Refus dans une boucle, puis compactage
Pendant qu’on discute un raffinement (ou une proposition), on peut garder un historique des refus/raisons.
Mais **dès qu’un raffinement est validé**, on **jette l’historique** et on ne conserve que :
- le raffinement validé (texte),
- et son delta (les effets structurés sur le modèle).


## 2) Ce que contient le Pivot (V1)

Le Pivot est un objet (voir `pivot.ts`) appelé `PivotModelV1` :

### 2.1 Le temps
- `time.horizon` : horizon (nombre d’unités, ex: 10)
- `time.unit` : unité de temps (`jour | semaine | mois | annee`)

### 2.2 Le stock
- `stock.name` : nom du stock (ex: “capital”)
- `stock.unit` : unité du stock (ex: “€”)
- `stock.initial` : valeur optionnelle **constante sur tout l’horizon** (mode test R1)

### 2.3 Les flux
- `inflows[]` et `outflows[]`
- Chaque flux a :
  - `name` (ex: “salaire”)
  - `value` optionnelle : valeur constante sur tout l’horizon (mode test R1)

### 2.4 Équations (optionnel en V1)
- `equations[]` : liste de chaînes (non obligatoire en V1).
En V1 minimal, on peut laisser vide.

### 2.5 Raffinements validés (la “trace utile”)
- `validatedRefinements[]` : on conserve seulement les raffinements **validés**.
Chaque entrée contient :
- `text` : le texte libre du raffinement validé
- `delta` : la partie structurée (ce qui change dans le modèle)

C’est la base d’un “contexte court” pour l’IA : uniquement du validé.


## 3) R1 : structure imposée + valeurs optionnelles

R1 sert à **installer le vocabulaire minimum commun** :
- un stock,
- des flux entrants / sortants,
- une unité de temps,
- un horizon.

En V1 :
- Les **noms** sont demandés.
- Les **valeurs** sont **optionnelles** : si l’utilisateur veut, il peut saisir des constantes
  (stock initial + flux constants) pour voir une trajectoire.
- Aucune valeur n’est imposée par le système.

`pivot.ts` fournit `createPivotFromR1(input)` pour créer le Pivot à partir des champs R1.


## 4) Calculs possibles en V1

Le calcul minimal supporté en V1 est :
- stock initial constant
- + somme des inflows constants
- − somme des outflows constants
- répété sur l’horizon

Fonctions disponibles dans `pivot.ts` :
- `canSimulateConstants(model)`
- `simulateConstants(model)` → trajectoire `{t, stock}[]`
- `stockFinal(model)`


## 5) Raffinements R2+ : principe “delta”

Un raffinement ultérieur ne doit pas “réécrire le monde”.
Il propose un **delta** (un petit patch) sur le Pivot, par exemple :
- fixer/modifier `stock.initial`
- ajouter un flux
- fixer/modifier la valeur d’un flux constant
- (optionnel) ajouter une équation

Dans `pivot.ts` :
- `applyDelta(model, delta)` : applique un delta
- `validateRefinement(model, record)` : applique + ajoute au journal des validés


## 6) Invariants / champs gelés (à partir de la validation de R1)

Une fois R1 validé, on considère “gelés” (par défaut, V1 minimal) :
- `stock.name`, `stock.unit`
- la liste des noms des flux (inflows/outflows)
- `time.horizon`, `time.unit`

Les valeurs numériques (stock initial, valeurs de flux constants) peuvent évoluer,
car elles servent aussi au mode test et à des raffinements.

Le fichier `invariants.ts` sert à contrôler ces invariants (si on active ce contrôle dans l’UI).


## 7) Stockage & contexte IA (recommandation simple)

- Le texte libre (problème, vision, raffinement) reste côté UI/pages.
- Le Pivot est la **référence structurée**.
- Pour une IA :
  - on envoie : Pivot actuel + liste des raffinements **validés**
  - on n’envoie pas les refus/essais passés

C’est le cœur du “Pivot” : un contexte **court, stable, vérifiable**.
