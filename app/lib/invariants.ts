// app/v2/lib/invariants.ts

export type InvariantCheckResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Contrôle les invariants "gelés" par R1.
 * Objectif : empêcher qu'un raffinement ultérieur (R2/R3/...) contredise R1.
 *
 * Hypothèse : baseR1 est la version validée de R1 (visionFormal.r1).
 * nextR1 est une version candidate (si un raffinement tente de modifier des champs gelés).
 */
export function checkR1Invariants(baseR1: any, nextR1: any): InvariantCheckResult {
  const errors: string[] = [];

  // Si pas de base, rien à contrôler.
  if (!baseR1 || !nextR1) return { ok: true };

  const baseH = baseR1?.time?.horizon_years;
  const nextH = nextR1?.time?.horizon_years;
  if (baseH != null && nextH != null && Number(baseH) !== Number(nextH)) {
    errors.push(`Horizon modifié : ${baseH} → ${nextH} (interdit après validation R1).`);
  }

  const baseStockName = (baseR1?.stock?.name ?? "").trim();
  const nextStockName = (nextR1?.stock?.name ?? "").trim();
  if (baseStockName && nextStockName && baseStockName !== nextStockName) {
    errors.push(`Nom du stock modifié : "${baseStockName}" → "${nextStockName}" (interdit).`);
  }

  const baseUnit = (baseR1?.stock?.unit ?? "").trim();
  const nextUnit = (nextR1?.stock?.unit ?? "").trim();
  // Si l'unité était définie en R1, on la fige. Si elle était vide/null, on tolère que next la laisse vide.
  if (baseUnit && nextUnit && baseUnit !== nextUnit) {
    errors.push(`Unité du stock modifiée : "${baseUnit}" → "${nextUnit}" (interdit).`);
  }

  const baseInitName = (baseR1?.stock?.initial?.name ?? "").trim();
  const nextInitName = (nextR1?.stock?.initial?.name ?? "").trim();
  if (baseInitName && nextInitName && baseInitName !== nextInitName) {
    errors.push(`Nom du stock de départ modifié : "${baseInitName}" → "${nextInitName}" (interdit).`);
  }

  const baseInName = (baseR1?.flows?.inflow?.name ?? "").trim();
  const nextInName = (nextR1?.flows?.inflow?.name ?? "").trim();
  if (baseInName && nextInName && baseInName !== nextInName) {
    errors.push(`Nom du flux entrant modifié : "${baseInName}" → "${nextInName}" (interdit).`);
  }

  const baseOutName = (baseR1?.flows?.outflow?.name ?? "").trim();
  const nextOutName = (nextR1?.flows?.outflow?.name ?? "").trim();
  if (baseOutName && nextOutName && baseOutName !== nextOutName) {
    errors.push(`Nom du flux sortant modifié : "${baseOutName}" → "${nextOutName}" (interdit).`);
  }

  // Valeur initiale : interdite de changer si R1 a "fixed"
  const baseMode = baseR1?.stock?.initial?.mode ?? "fixed";
  if (baseMode === "fixed") {
    const bVal = baseR1?.stock?.initial?.value;
    const nVal = nextR1?.stock?.initial?.value;
    if (bVal != null && nVal != null && Number(bVal) !== Number(nVal)) {
      errors.push(`Valeur du stock de départ modifiée alors que mode=fixed : ${bVal} → ${nVal} (interdit).`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * Contrôle une contrainte provenant du problème (si elle existe) :
 * stock initial <= capital initial (initialCapital / capital_initial / initial.capital).
 *
 * Si le problème ne définit pas de capital, aucune limite n'est imposée.
 */
export function checkProblemCapitalConstraint(problemFormal: any, r1: any): InvariantCheckResult {
  const errors: string[] = [];
  if (!r1) return { ok: true };

  const capital =
    (typeof problemFormal?.initialCapital === "number" && problemFormal.initialCapital) ||
    (typeof problemFormal?.capital_initial === "number" && problemFormal.capital_initial) ||
    (typeof problemFormal?.initial?.capital === "number" && problemFormal.initial?.capital) ||
    null;

  if (capital == null) return { ok: true };

  const initVal = r1?.stock?.initial?.value;
  if (!Number.isFinite(Number(initVal))) return { ok: true };

  if (Number(initVal) > Number(capital)) {
    errors.push(
      `Le stock initial (${Number(initVal).toLocaleString("fr-FR")}) dépasse le capital déclaré (${Number(capital).toLocaleString("fr-FR")}).`
    );
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * Utilitaire : fusionner plusieurs résultats de checks.
 */
export function mergeChecks(...checks: InvariantCheckResult[]): InvariantCheckResult {
  const errors: string[] = [];
  for (const c of checks) {
    if (!c.ok) errors.push(...c.errors);
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
