// app/api/v2/r2/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  kind?: "r2";
  // Texte libre saisi en R2 (obligatoire)
  draftText?: string;

  problem?: {
    id?: string;
    validatedText?: string;
    formal?: any;
  };

  vision?: {
    id?: string;
    validatedText?: string;
    formal?: any;
  };

  // (optionnel) si vous voulez donner à l’IA le contexte R1 déjà validé
  r1Formal?: any;

  // Compat éventuelle
  problemValidatedText?: string;
  problemFormal?: any;
  visionValidatedText?: string;
  visionFormal?: any;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) return jsonError("OPENAI_API_KEY manquante (.env.local)", 500);

    const body = (await req.json()) as Body;

    const problemText = (body.problem?.validatedText ?? body.problemValidatedText ?? "").trim();
    const visionText = (body.vision?.validatedText ?? body.visionValidatedText ?? "").trim();
    const problemFormal = body.problem?.formal ?? body.problemFormal ?? null;
    const visionFormal = body.vision?.formal ?? body.visionFormal ?? null;

    const draftText = (body.draftText ?? "").trim();

    if (!problemText) return jsonError("Le problème doit être validé avant R2 (validatedText manquant)");
    if (!draftText) return jsonError("Texte R2 manquant");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    /**
     * IMPORTANT (votre règle) :
     * - L’IA est OBLIGATOIRE pour pouvoir valider.
     * - Si le texte n’apporte pas d’information exploitable, on renvoie ok:false avec "Pas assez d'information".
     *
     * On ne force pas une structure “métier” trop rigide à ce stade :
     * on retourne une formalisation R2 minimale qui dit si c’est exploitable,
     * + une reformulation, + des remarques courtes.
     */
    const r2FormalSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: { type: "string", const: "r2" },

        // Indique si le texte apporte une info nouvelle exploitable.
        hasEnoughInformation: { type: "boolean" },

        // Ce que l’IA “comprend” comme info nouvelle (libre mais structuré).
        // On reste volontairement large : vous voulez “voir large et ne rien imposer en R2”.
        additions: {
          type: "object",
          additionalProperties: false,
          properties: {
            // Définitions/relations utiles sur les flux (ex: encaissements = CA - charges hors salaire).
            flowDefinitions: { type: "array", items: { type: "string" } },

            // Hypothèses / conventions ajoutées (unités, pas de temps, conventions de signe…)
            assumptions: { type: "array", items: { type: "string" } },

            // Contraintes de viabilité (ex: trésorerie >= 100000 sur l’horizon)
            constraints: { type: "array", items: { type: "string" } },

            // Objectif / condition d’atteinte (si le texte en apporte, sinon vide)
            objectiveHints: { type: "array", items: { type: "string" } },
          },
          required: ["flowDefinitions", "assumptions", "constraints", "objectiveHints"],
        },

        // Timestamp interne
        meta: {
          type: "object",
          additionalProperties: false,
          properties: {
            generated_by: { type: "string" },
            generated_at: { type: "string" },
          },
          required: ["generated_by", "generated_at"],
        },
      },
      required: ["kind", "hasEnoughInformation", "additions", "meta"],
    } as const;

    const outSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        remarks: { type: "array", items: { type: "string" } },
        reformulation: { type: "string" },
        formal: r2FormalSchema,
      },
      required: ["remarks", "reformulation", "formal"],
    } as const;

    const system = [
      "Tu aides à analyser R2 (raffinement libre) d’une méthode top-down.",
      "",
      "Contexte : problème + vision + éventuellement R1 déjà formalisés existent.",
      "R2 doit apporter une information supplémentaire (nouvelle) par rapport au contexte existant.",
      "",
      "Règles de sortie :",
      "- remarks : remarques courtes, utiles, non bavardes.",
      "- reformulation : reformulation fidèle du texte R2 (sans enrichir gratuitement).",
      "- formal.hasEnoughInformation :",
      "    - true si le texte apporte au moins UNE information exploitable (définition, contrainte, relation, hypothèse, condition d’objectif, etc.)",
      "    - false sinon (dans ce cas, remarks doit contenir EXACTEMENT la phrase : \"Pas assez d'information.\" parmi les remarques).",
      "- additions : listes de phrases courtes classées (flowDefinitions / assumptions / constraints / objectiveHints).",
      "- Ne pas inventer de nombres absents du texte ou du contexte.",
      "",
      "Répondre STRICTEMENT en JSON conforme au schéma.",
    ].join("\n");

    const userParts: string[] = [];
    userParts.push("PROBLÈME (validé) :");
    userParts.push(problemText);
    userParts.push("");

    if (visionText) {
      userParts.push("VISION (validée) :");
      userParts.push(visionText);
      userParts.push("");
    }

    userParts.push("R2 — TEXTE SAISI :");
    userParts.push(draftText);
    userParts.push("");

    if (problemFormal) userParts.push(`PROBLÈME (formal JSON, debug):\n${JSON.stringify(problemFormal)}`);
    if (visionFormal) userParts.push(`VISION (formal JSON, debug):\n${JSON.stringify(visionFormal)}`);
    if (body.r1Formal) userParts.push(`R1 (formal JSON, debug):\n${JSON.stringify(body.r1Formal)}`);

    const user = userParts.filter(Boolean).join("\n");

    const resp = await client.responses.create({
      model: "gpt-5.2",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // ✅ Correction : plus de response_format, on utilise text.format
      text: {
        format: {
          type: "json_schema",
          name: "v2_r2_analyze",
          strict: true,
          schema: outSchema,
        },
      },
      temperature: 0.2,
    });

    const output = resp.output_text;
    if (!output) return jsonError("Réponse IA vide", 500);

    let parsed: any;
    try {
      parsed = JSON.parse(output);
    } catch {
      return jsonError("Impossible de parser le JSON IA", 500);
    }

    const formal = parsed.formal ?? null;

    // Si pas assez d'info => ok:false + message simple
    const enough = Boolean(formal?.hasEnoughInformation);
    if (!enough) {
      return NextResponse.json({
        ok: false,
        error: "Pas assez d'information",
        remarks: Array.isArray(parsed.remarks) ? parsed.remarks : ["Pas assez d'information."],
        reformulation: typeof parsed.reformulation === "string" ? parsed.reformulation : "",
        formal,
      });
    }

    return NextResponse.json({
      ok: true,
      remarks: Array.isArray(parsed.remarks) ? parsed.remarks : [],
      reformulation: typeof parsed.reformulation === "string" ? parsed.reformulation : "",
      formal,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
