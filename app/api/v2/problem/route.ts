// app/api/v2/problem/route.ts

import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Kind = "problem" | "vision";

type Body = {
  kind: Kind;
  draftText: string;
  problem?: {
    id?: string;
    validatedText?: string;
    formal?: any;
  };
};

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function tooShortOrWeak(text: string) {
  const t = text.trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (t.length < 80) return true;
  if (words.length < 15) return true;
  return false;
}

/** Ratio d’overlap (approx) pour détecter “synonymes / quasi copie” */
function overlapRatio(a: string, b: string) {
  const A = a
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const B = b
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (A.length === 0 || B.length === 0) return 0;

  const setB = new Set(B);
  let hit = 0;
  for (const w of A) if (setB.has(w)) hit++;
  return hit / A.length;
}

/** Heuristique “reformulation trop faible” */
function isWeakReformulation(original: string, reform: string) {
  const r = reform.trim();
  if (r.length < 180) return true; // trop court => souvent “synonymes”
  const ov = overlapRatio(original, r);
  if (ov > 0.62) return true; // trop proche du texte
  return false;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return jsonError("OPENAI_API_KEY manquante (.env.local)", 500);
    }

    const body = (await req.json()) as Body;
    const kind: Kind = body.kind;
    const draftText = (body.draftText ?? "").trim();

    if (!kind || (kind !== "problem" && kind !== "vision")) {
      return jsonError("kind invalide (attendu: 'problem' ou 'vision')");
    }
    if (!draftText) return jsonError("Texte manquant (draftText).");
    if (draftText.length > 8000) return jsonError("Texte trop long (max ~8000 caractères).");
    if (tooShortOrWeak(draftText)) {
      return jsonError(
        "Texte trop court ou trop vague : précisez davantage votre situation et votre objectif.",
        400,
        { remarks: ["Ajoutez objectif, horizon, chiffres, contraintes, options."] }
      );
    }

    const problemValidatedText = (body.problem?.validatedText ?? "").trim();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // --- PROMPT : clair, contraignant, “preuve de compréhension”
    const system = `
Tu analyses une définition V2 écrite par un visiteur : soit un PROBLÈME, soit une VISION.

Objectif : rassurer le visiteur en prouvant la compréhension.
Tu dois produire :
1) une reformulation robuste (pas des synonymes)
2) des remarques logiques et utiles (si nécessaire)

Règles de base (obligatoires) :
- Fidélité : ne rien inventer, ne rien ajouter.
- Conserver tous les faits explicites : rôle, chiffres, horizon, contraintes, options.
- Conserver les listes d’options : ne rien supprimer.
- Conserver la personne grammaticale : si le texte est en "je", la reformulation doit rester en "je".
- Aucun conseil, aucune solution.

Reformulation (preuve de compréhension) :
- 4 à 6 phrases très courtes.
- Structure imposée :
  (1) objectif + horizon (si présent),
  (2) situation actuelle / contexte,
  (3) chiffres importants,
  (4) options/alternatives listées,
  (5) hésitation / décision à prendre.
- Interdit : simple substitution de synonymes.

Remarks (0 à 5 items) :
- Remarques uniquement si elles sont pertinentes.
- Types de remarques acceptées :
  A) Ambiguïté : un élément clé est non défini (objectif/horizon/chiffres/options).
  B) Incohérence interne : contradiction ou chiffre non compatible.
  C) Variation PROBLÈME → VISION (si contexte fourni) :
     - Si la VISION introduit un chiffre clé différent du PROBLÈME (capital/salaire/horizon…),
       ajouter une remark : "À clarifier : le problème dit X, la vision dit Y. D’où vient la différence ?"
- Ne conclus pas. Ne propose pas de solution.

Si tu n’arrives pas à reformuler fidèlement sans inventer :
- reformulation = ""
- remarks explique ce qui manque et demande au visiteur de reformuler.

Réponds STRICTEMENT en JSON, avec :
{
 "remarks": string[],
 "reformulation": string,
 "formal": object
}

formal :
- Pour l’instant, mets toujours {} (on traitera le mini-formulaire séparément).
`.trim();

    const user = [
      kind === "problem" ? "ÉTAPE : PROBLÈME" : "ÉTAPE : VISION",
      "",
      "TEXTE SAISI :",
      draftText,
      "",
      kind === "vision" && problemValidatedText
        ? ["CONTEXTE (PROBLÈME VALIDÉ) :", problemValidatedText, ""].join("\n")
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    // --- Appel IA (passage 1)
    async function callAI(extraSystemNudge?: string) {
      const sys = extraSystemNudge ? system + "\n\n" + extraSystemNudge : system;

      const resp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      });

      const output = resp.choices?.[0]?.message?.content ?? "";
      if (!output) throw new Error("Réponse IA vide");
      return output;
    }

    let parsed: any = null;
    let raw1 = "";
    let raw2 = "";

    raw1 = await callAI();

    try {
      parsed = JSON.parse(raw1);
    } catch {
      // 2e tentative (JSON)
      raw2 = await callAI(
        "IMPORTANT : le JSON doit être valide. Aucun texte hors JSON."
      );
      parsed = JSON.parse(raw2);
    }

    // Normalisation
    const remarks = Array.isArray(parsed?.remarks) ? parsed.remarks : [];
    const reform = (parsed?.reformulation ?? "").trim();
    const formal = parsed?.formal ?? {};

    // Si reformulation vide => on n’“interdit” pas, on demande au visiteur de reformuler
    if (!reform) {
      return jsonError(
        "Je n’arrive pas à reformuler votre texte de façon fiable. Merci de le reformuler (ajoutez objectif, horizon, chiffres, options).",
        400,
        { remarks }
      );
    }

    // --- Contrôle qualité : éviter “synonymes”
    if (isWeakReformulation(draftText, reform)) {
      // 2e passe : on force une reformulation plus structurée / différente
      const rawRetry = await callAI(
        "Ta dernière reformulation était trop faible (trop courte ou trop proche du texte). Recommence en respectant strictement la structure en 4 à 6 phrases, et en reformulant réellement."
      );

      let parsedRetry: any;
      try {
        parsedRetry = JSON.parse(rawRetry);
      } catch {
        parsedRetry = null;
      }

      const reform2 = (parsedRetry?.reformulation ?? "").trim();
      const remarks2 = Array.isArray(parsedRetry?.remarks) ? parsedRetry.remarks : remarks;

      if (reform2 && !isWeakReformulation(draftText, reform2)) {
        return NextResponse.json({
          ok: true,
          remarks: remarks2,
          reformulation: reform2,
          formal: formal ?? {},
        });
      }

      // Si même la relance est faible : on bloque et on demande au visiteur de réécrire (plutôt que mentir)
      return jsonError(
        "Je n’arrive pas à produire une reformulation convaincante (trop proche du texte). Merci de reformuler votre texte (plus structuré) puis relancez l’analyse.",
        400,
        {
          remarks: [
            "Essayez : 1) objectif + horizon, 2) situation, 3) chiffres, 4) options, 5) hésitation.",
          ],
        }
      );
    }

    // OK
    return NextResponse.json({
      ok: true,
      remarks,
      reformulation: reform,
      formal: formal ?? {},
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
