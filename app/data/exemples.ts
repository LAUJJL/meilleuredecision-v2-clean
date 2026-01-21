// app/data/exemples.ts

export type ProblemStatus = "draft" | "frozen" | "example";

export type Problem = {
  id: string;
  status: ProblemStatus;

  definitionCourte: string;
  definitionLongue: string;

  nomStock: string;
  uniteStock: string;
  nomStockInitial: string;
  valeurStockInitiale?: number;
  stockInitialMode: "commun" | "par_vision";

  nomFluxEntree: string;
  statutFluxEntree: "fixe" | "variable";
  valeurFluxEntree?: number;

  nomFluxSortie: string;
  statutFluxSortie: "fixe" | "variable";
  valeurFluxSortie?: number;

  horizonValeur: number;
  horizonUnite: string;
  objectifValeur: number;
};

export const EXEMPLE_PROBLEM_1: Problem = {
  id: "example-problem-1",
  status: "example",

  definitionCourte: "Un salarié souhaite atteindre un certain niveau de trésorerie au bout de 12 mois.",
  definitionLongue:
    "Le salarié dispose d’une trésorerie de départ et perçoit un salaire régulier. Ses dépenses personnelles sont estimées. " +
    "L’objectif minimal est d’atteindre un niveau de trésorerie défini à l’horizon. " +
    "Le but est d’examiner plusieurs décisions possibles (visions) et d’éliminer celles qui n’atteignent pas l’objectif minimal.",

  nomStock: "Trésorerie",
  uniteStock: "€",
  nomStockInitial: "Trésorerie de départ",
  valeurStockInitiale: 3000,
  stockInitialMode: "commun",

  nomFluxEntree: "Encaissements",
  statutFluxEntree: "variable",
  valeurFluxEntree: 3000,

  nomFluxSortie: "Décaissements",
  statutFluxSortie: "variable",
  valeurFluxSortie: 2500,

  horizonValeur: 12,
  horizonUnite: "mois",
  objectifValeur: 10000,
};
