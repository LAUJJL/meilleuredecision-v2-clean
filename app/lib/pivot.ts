// pivot.ts — Langage Pivot (V1)
// Mise à jour: 2026-02-02
//
// Objectif: définir une structure minimale "Pivot" utilisée à partir de R1,
// puis enrichie par des raffinements validés. Le Pivot est l'unique source
// structurée utilisée pour (a) calculer (si possible), (b) servir de contexte
// court à une IA, (c) afficher l'état du modèle.
//
// IMPORTANT (V1):
// - Problème et Visions restent en texte libre (hors Pivot).
// - Le Pivot démarre à R1.
// - Les refus/essais ne sont pas conservés après validation (compactage).
// - Aucune obligation d'ajouter quoi que ce soit en R2+ : chaque raffinement
//   est un "delta" optionnel, validé seulement si le visiteur le décide.

export type TimeUnit = "jour" | "semaine" | "mois" | "annee";

export interface StockDef {
  name: string;          // ex: "capital"
  unit: string;          // ex: "€"
  // Valeur optionnelle (R1: mode test) — constante sur tout l'horizon
  initial?: number | null;
}

export interface FlowDef {
  name: string;          // ex: "salaire"
  // Valeur optionnelle (R1: mode test) — constante sur tout l'horizon
  value?: number | null;
}

export interface TimeDef {
  horizon: number;       // ex: 10
  unit: TimeUnit;        // ex: "annee"
}

export interface PivotModelV1 {
  version: "v1";
  // Contexte (ID) — facultatif, utile pour relier à une Vision côté UI
  visionId?: string;

  stock: StockDef;
  time: TimeDef;

  inflows: FlowDef[];
  outflows: FlowDef[];

  // Équations optionnelles (utile plus tard)
  // En V1 minimal, on peut ne rien mettre ici.
  equations: string[];

  // Raffinements validés (compactés): on conserve seulement le delta validé + texte
  validatedRefinements: RefinementRecord[];
}

export interface RefinementDelta {
  // Deltas possibles (minimaux). L'UI/IA peut en envoyer un sous-ensemble.
  setStockInitial?: number | null;

  // Ajout de flux (facultatif)
  addInflows?: Array<{ name: string; value?: number | null }>;
  addOutflows?: Array<{ name: string; value?: number | null }>;

  // Mise à jour de valeurs de flux constants (mode test ou décision utilisateur)
  setFlowValues?: Array<{ side: "in" | "out"; name: string; value: number | null }>;

  // Horizon / unité de temps — en principe fixé en R1, mais V1 n'interdit pas de changer
  // si le visiteur le souhaite dans un raffinement ultérieur.
  setHorizon?: number;
  setTimeUnit?: TimeUnit;

  // Ajout d'équations (optionnel)
  addEquations?: string[];
}

export interface RefinementRecord {
  id: string;            // identifiant (uuid/horodatage, au choix)
  text: string;          // texte libre du raffinement validé
  delta: RefinementDelta;
  createdAtMs: number;
}

export interface R1Input {
  visionId?: string;
  stockName: string;
  stockUnit: string;

  inflowNames: string[];
  outflowNames: string[];

  horizon: number;
  timeUnit: TimeUnit;

  // Valeurs optionnelles (mode test)
  stockInitial?: number | null;
  inflowValues?: Record<string, number | null>;
  outflowValues?: Record<string, number | null>;
}

/** Crée un Pivot V1 à partir de R1 (structure imposée + valeurs optionnelles). */
export function createPivotFromR1(input: R1Input): PivotModelV1 {
  const inflows: FlowDef[] = (input.inflowNames || [])
    .map((name) => ({
      name: name.trim(),
      value: input.inflowValues?.[name.trim()] ?? null,
    }))
    .filter((f) => f.name.length > 0);

  const outflows: FlowDef[] = (input.outflowNames || [])
    .map((name) => ({
      name: name.trim(),
      value: input.outflowValues?.[name.trim()] ?? null,
    }))
    .filter((f) => f.name.length > 0);

  return {
    version: "v1",
    visionId: input.visionId,
    stock: {
      name: input.stockName.trim(),
      unit: input.stockUnit.trim(),
      initial: input.stockInitial ?? null,
    },
    time: {
      horizon: sanitizeHorizon(input.horizon),
      unit: input.timeUnit,
    },
    inflows,
    outflows,
    equations: [],
    validatedRefinements: [],
  };
}

/** Applique un delta validé au Pivot (retour d'un nouveau modèle). */
export function applyDelta(model: PivotModelV1, delta: RefinementDelta): PivotModelV1 {
  const next: PivotModelV1 = deepClone(model);

  if (delta.setStockInitial !== undefined) {
    next.stock.initial = delta.setStockInitial;
  }

  if (delta.setHorizon !== undefined) {
    next.time.horizon = sanitizeHorizon(delta.setHorizon);
  }
  if (delta.setTimeUnit !== undefined) {
    next.time.unit = delta.setTimeUnit;
  }

  if (delta.addInflows?.length) {
    for (const f of delta.addInflows) {
      const name = (f.name ?? "").trim();
      if (!name) continue;
      if (!next.inflows.some((x) => x.name === name)) {
        next.inflows.push({ name, value: f.value ?? null });
      }
    }
  }
  if (delta.addOutflows?.length) {
    for (const f of delta.addOutflows) {
      const name = (f.name ?? "").trim();
      if (!name) continue;
      if (!next.outflows.some((x) => x.name === name)) {
        next.outflows.push({ name, value: f.value ?? null });
      }
    }
  }

  if (delta.setFlowValues?.length) {
    for (const upd of delta.setFlowValues) {
      const name = (upd.name ?? "").trim();
      if (!name) continue;
      const list = upd.side === "in" ? next.inflows : next.outflows;
      const found = list.find((x) => x.name === name);
      if (found) found.value = upd.value;
      // Si non trouvé: on ignore (V1 minimal, pas de magie)
    }
  }

  if (delta.addEquations?.length) {
    for (const eq of delta.addEquations) {
      const s = (eq ?? "").trim();
      if (s) next.equations.push(s);
    }
  }

  return next;
}

/** Ajoute un raffinement validé (compacté) et applique son delta. */
export function validateRefinement(
  model: PivotModelV1,
  record: Omit<RefinementRecord, "createdAtMs">
): PivotModelV1 {
  const full: RefinementRecord = { ...record, createdAtMs: Date.now() };
  const applied = applyDelta(model, full.delta);
  applied.validatedRefinements = [...applied.validatedRefinements, full];
  return applied;
}

/** Teste si un calcul R1 "flux constants" est possible. */
export function canSimulateConstants(model: PivotModelV1): boolean {
  if (model.time.horizon <= 0) return false;
  if (model.stock.initial === null || model.stock.initial === undefined) return false;
  for (const f of model.inflows) if (f.value === null || f.value === undefined) return false;
  for (const f of model.outflows) if (f.value === null || f.value === undefined) return false;
  return true;
}

/** Calcule la trajectoire du stock pour le cas minimal: stock initial + flux constants. */
export function simulateConstants(model: PivotModelV1): { t: number; stock: number }[] {
  if (!canSimulateConstants(model)) return [];
  const horizon = model.time.horizon;

  const inflowSum = sum(model.inflows.map((f) => Number(f.value)));
  const outflowSum = sum(model.outflows.map((f) => Number(f.value)));
  const delta = inflowSum - outflowSum;

  const traj: { t: number; stock: number }[] = [];
  let s = Number(model.stock.initial);

  // t = 0..horizon
  traj.push({ t: 0, stock: s });
  for (let t = 1; t <= horizon; t++) {
    s = s + delta;
    traj.push({ t, stock: s });
  }
  return traj;
}

/** Stock final (si trajectoire possible). */
export function stockFinal(model: PivotModelV1): number | null {
  const traj = simulateConstants(model);
  if (!traj.length) return null;
  return traj[traj.length - 1].stock;
}

// ------------------ helpers ------------------

function sanitizeHorizon(h: number): number {
  const n = Math.floor(Number(h));
  if (!Number.isFinite(n) || n < 1) return 1;
  // V1: pas de max imposé, mais on protège le navigateur contre des horizons absurdes
  if (n > 10_000) return 10_000;
  return n;
}

function sum(xs: number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
