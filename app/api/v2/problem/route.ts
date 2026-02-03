// app/api/v2/problem/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * V2 API
 * - kind = "FORM_PROPOSED" | "NON_FORMALISABLE"
 * - Aucune "reformulation visible" : on propose un mini-formulaire minimal.
 * - Si non-formalisable : on renvoie ce qu'on a détecté + ce qui manque.
 */

type DetectedField = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  confidence: number; // 0..1
};

type GlobalConst = {
  key: string; // identifiant technique, ex: "capital", "population_initiale"
  label: string; // affichage
  value: string; // texte (ex: "300000")
  unit?: string; // "EUR", "hab", ...
};

type ProblemForm = {
  objectif: {
    text: string; // objectif minimum partagé
  };
  horizon: {
    value: string; // ex: "4"
    unit: "mois" | "ans" | ""; // on reste minimal : mois/ans
  };
  globalConstants: GlobalConst[];
};

type ApiResponse =
  | {
      kind: "FORM_PROPOSED";
      form: ProblemForm;
      detected: DetectedField[];
      missing: string[];
      examples?: string[];
    }
  | {
      kind: "NON_FORMALISABLE";
      message: string;
      detected: DetectedField[];
      missing: string[];
      examples?: string[];
    };

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

// Détection très simple des durées : "dans 5 mois", "en 4 ans", "horizon 7 ans"
function detectHorizon(text: string): { value: string; unit: "mois" | "ans" } | null {
  const t = text.toLowerCase();

  const m1 = t.match(/\b(dans|en)\s+(\d{1,3})\s*(mois|ans|an)\b/);
  if (m1) {
    const value = m1[2];
    const unitRaw = m1[3];
    const unit = unitRaw === "mois" ? "mois" : "ans";
    return { value, unit };
  }

  const m2 = t.match(/\bhorizon\s*[:=]?\s*(\d{1,3})\s*(mois|ans|an)\b/);
  if (m2) {
    const value = m2[1];
    const unitRaw = m2[2];
    const unit = unitRaw === "mois" ? "mois" : "ans";
    return { value, unit };
  }

  return null;
}

// Détection d'une quantité monétaire/numérique avec unités très basiques
function parseNumberLike(s: string): string | null {
  // accepte "300000", "300 000", "300.000", "80 000"
  const cleaned = s.replace(/\s/g, "").replace(/\./g, "");
  if (!/^\d+([,]\d+)?$/.test(cleaned)) return null;
  return cleaned.replace(",", ".");
}

// détecte des constantes typiques mais reste ouvert : capital, population, salaire, etc.
function detectGlobalConstants(text: string): { consts: GlobalConst[]; detected: DetectedField[] } {
  const detected: DetectedField[] = [];
  const consts: GlobalConst[] = [];

  const t = text;

  // Capital / épargne (EUR)
  {
    const m = t.match(/\b(capital|épargne|epargne)\b[^0-9]{0,30}(\d[\d\s\.]*)(\s*(€|euros))?/i);
    if (m) {
      const num = parseNumberLike(m[2]);
      if (num) {
        consts.push({
          key: "capital",
          label: "Capital (invariant)",
          value: num,
          unit: "EUR",
        });
        detected.push({
          key: "capital",
          label: "Capital détecté",
          value: num,
          unit: "EUR",
          confidence: 0.85,
        });
      }
    }
  }

  // Population initiale (hab)
  {
    const m = t.match(/\b(population)\b[^0-9]{0,30}(\d[\d\s\.]*)/i);
    if (m) {
      const num = parseNumberLike(m[2]);
      if (num) {
        consts.push({
          key: "population_initiale",
          label: "Population initiale (invariant)",
          value: num,
          unit: "hab",
        });
        detected.push({
          key: "population_initiale",
          label: "Population détectée",
          value: num,
          unit: "hab",
          confidence: 0.75,
        });
      }
    }
  }

  // Salaire / revenu (EUR/mois ou EUR/an si détectable)
  {
    const m = t.match(/\b(salaire|revenu)\b[^0-9]{0,40}(\d[\d\s\.]*)(\s*(€|euros))?\s*(\/\s*(mois|an|ans)|par\s*(mois|an|ans))?/i);
    if (m) {
      const num = parseNumberLike(m[2]);
      if (num) {
        let unit: string | undefined = "EUR";
        const period = (m[6] || m[7] || "").toLowerCase();
        if (period.includes("mois")) unit = "EUR/mois";
        if (period === "an" || period === "ans") unit = "EUR/an";

        consts.push({
          key: "revenu",
          label: "Revenu (invariant)",
          value: num,
          unit,
        });
        detected.push({
          key: "revenu",
          label: "Revenu détecté",
          value: num,
          unit,
          confidence: 0.7,
        });
      }
    }
  }

  // Dépenses (si présentes)
  {
    const m = t.match(/\b(dépense|depense|dépenses|depenses)\b[^0-9]{0,40}(\d[\d\s\.]*)(\s*(€|euros))?\s*(\/\s*(mois|an|ans)|par\s*(mois|an|ans))?/i);
    if (m) {
      const num = parseNumberLike(m[2]);
      if (num) {
        let unit: string | undefined = "EUR";
        const period = (m[6] || m[7] || "").toLowerCase();
        if (period.includes("mois")) unit = "EUR/mois";
        if (period === "an" || period === "ans") unit = "EUR/an";

        consts.push({
          key: "depenses",
          label: "Dépenses (invariant)",
          value: num,
          unit,
        });
        detected.push({
          key: "depenses",
          label: "Dépenses détectées",
          value: num,
          unit,
          confidence: 0.65,
        });
      }
    }
  }

  return { consts, detected };
}

// Objectif : on prend une phrase "je veux ..." ou "objectif : ..."
function detectObjective(text: string): { objectiveText: string; confidence: number } | null {
  const t = text;

  const m1 = t.match(/\b(je\s+veux|je\s+souhaite|objectif)\b\s*[:\-]?\s*([^.\n]{8,200})/i);
  if (m1) {
    const obj = normalizeSpaces(m1[2]);
    if (obj.length >= 8) return { objectiveText: obj, confidence: 0.8 };
  }

  // fallback : première phrase si suffisamment informative
  const firstSentence = normalizeSpaces(t.split(/[\.\n]/)[0] || "");
  if (firstSentence.length >= 15) return { objectiveText: firstSentence, confidence: 0.45 };

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text: string = typeof body?.text === "string" ? body.text : "";

    const clean = normalizeSpaces(text);
    if (!clean) {
      const resp: ApiResponse = {
        kind: "NON_FORMALISABLE",
        message: "Texte vide : impossible de proposer un mini-formulaire.",
        detected: [],
        missing: ["objectif", "horizon"],
        examples: [
          "Objectif : doubler mon salaire. Horizon : 4 ans. Capital : 300000€.",
          "Objectif : stabiliser la population. Horizon : 10 ans. Population : 120000 hab.",
        ],
      };
      return NextResponse.json(resp);
    }

    const detected: DetectedField[] = [];
    const missing: string[] = [];

    const obj = detectObjective(clean);
    if (obj) {
      detected.push({
        key: "objectif",
        label: "Objectif détecté",
        value: obj.objectiveText,
        confidence: obj.confidence,
      });
    } else {
      missing.push("objectif");
    }

    const horizon = detectHorizon(clean);
    if (horizon) {
      detected.push({
        key: "horizon",
        label: "Horizon détecté",
        value: horizon.value,
        unit: horizon.unit,
        confidence: 0.85,
      });
    } else {
      missing.push("horizon");
    }

    const { consts, detected: detectedConsts } = detectGlobalConstants(clean);
    detected.push(...detectedConsts);

    // Mini-formulaire minimal : objectif + horizon + invariants (optionnels)
    const form: ProblemForm = {
      objectif: { text: obj?.objectiveText || "" },
      horizon: { value: horizon?.value || "", unit: horizon?.unit || "" },
      globalConstants: consts,
    };

    // Si on n'a ni objectif, ni horizon : trop pauvre → NON_FORMALISABLE avec ce qu'on a
    if (!obj && !horizon) {
      const resp: ApiResponse = {
        kind: "NON_FORMALISABLE",
        message:
          "Je n’ai pas pu détecter un objectif ni un horizon. J’affiche ce que j’ai détecté, et je vous demande de préciser l’objectif et l’horizon.",
        detected,
        missing,
        examples: [
          "Objectif : atteindre 21000€ de capital. Horizon : 5 mois. Capital : 20000€.",
          "Objectif : réduire la mortalité. Horizon : 3 ans. Population : 120000 hab.",
        ],
      };
      return NextResponse.json(resp);
    }

    // Sinon on propose quand même un formulaire (même incomplet) : l'utilisateur complétera.
    const resp: ApiResponse = {
      kind: "FORM_PROPOSED",
      form,
      detected,
      missing, // peut contenir "objectif" ou "horizon" si un seul manque
      examples: [
        "Objectif : atteindre 21000€ de capital. Horizon : 5 mois. Capital : 20000€.",
        "Objectif : stabiliser la population. Horizon : 10 ans. Population : 120000 hab.",
      ],
    };

    return NextResponse.json(resp);
  } catch (e) {
    const resp: ApiResponse = {
      kind: "NON_FORMALISABLE",
      message: "Erreur technique lors de la formalisation.",
      detected: [],
      missing: ["objectif", "horizon"],
    };
    return NextResponse.json(resp, { status: 200 });
  }
}
