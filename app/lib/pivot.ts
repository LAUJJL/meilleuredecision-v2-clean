// pivot.ts — Langage Pivot V2 (minimal)

export type TimeUnit = "year" | "month";

export interface Horizon {
  value: number;
  unit: TimeUnit;
}

export interface Stock {
  name: string;
  unit: string;
  initialValue: number;
}

export interface Flow {
  name: string;
  unit: string;
  value: number;
  status: "given" | "computed";
  targetStock: string;
}

export interface Objective {
  variable: string;
  value: number;
  unit: string;
  deadline: number;
}

export interface Constraint {
  variable: string;
  operator: ">=" | "<=";
  threshold: number;
  from: number;
  to: number;
}

export interface ProblemDefinition {
  horizon: Horizon;
  stocks: Stock[];
  flows: Flow[];
  objective: Objective;
  constraints: Constraint[];
}

export interface Refinement {
  description: string;
  addedFlows?: Flow[];
  addedConstraints?: Constraint[];
}

export interface Vision {
  name: string;
  refinements: Refinement[];
}

export interface EvaluationResult {
  objectiveReached: boolean;
  violatedConstraints: Constraint[];
}
