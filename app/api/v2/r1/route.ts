// app/api/v2/r1/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  // Nouveau mode (analyse, cohérent avec Vision)
  kind?: "r1";
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

  // Ancien mode (compatibilité)
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

    // Support 2 formats
    const problemText = (body.problem?.validatedText ?? body.problemValidatedText ?? "").trim();
    const visionText = (body.vision?.validatedText ?? body.visionValidatedText ?? "").trim();
    const problemFormal = body.problem?.formal ?? body.problemFormal ?? null;
    const visionFormal = body.vision?.formal ?? body.visionFormal ?? null;

    if (!problemText) {
      return jsonError("Le problème doit être validé avant R1 (validatedText manquant)");
    }

    const draftText = (body.draftText ?? "").trim();
    const analyzeMode = body.kind === "r1" && !!draftText;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Schéma “formal” (R1)
    const r1FormalSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        stockName: { type: "string" },
        stockUnit: { type: "string" },
        stockInitialName: { type: "string" },
        stockInitialValue: { type: "number" },
        stockInitialMode: { type: "string", enum: ["fixed", "variable"] },
        inflowName: { type: "string" },
        outflowName: { type: "string" },
        horizonYears: { type: "integer" },
        notes: { type: "array", items: { type: "string" } },
      },
      required: [
        "stockName",
        "stockUnit",
        "stockInitialName",
        "stockInitialValue",
        "stockInitialMode",
        "inflowName",
        "outflowName",
        "horizonYears",
        "notes",
      ],
    } as const;

    // Sortie standard : remarks + reformulation + formal
    const outSchema = {
      type: "object",
      additionalProperties: false,
      properties: {
        remarks: { type: "array", items: { type: "string" } },
        reformulation: { type: "string" },
        formal: r1FormalSchema,
      },
      required: ["remarks", "reformulation", "formal"],
    } as const;

    const system = [
      "Tu aides à produire ou améliorer R1 (raffinement 1) pour une méthode de dynamique des systèmes.",
      "",
      "R1 minimal et générique :",
      "- stock (nom + unité)",
      "- stock initial (nom + valeur + mode fixed/variable)",
      "- flux entrant (nom) et flux sortant (nom)",
      "- horizonYears (entier), step=1 implicite",
      "",
      "Règles :",
      "- Ne pas inventer de nombres absents. Si une valeur initiale est indiquée dans le texte, tu peux la reprendre.",
      "- Si l'horizon n'est pas présent, proposer 10.",
      "- Noms simples (ex: Trésorerie / Encaissements / Décaissements si financier).",
      "",
      "Mode ANALYSE (draftText fourni) :",
      "- remarks : remarques courtes, utiles, non bavardes (ambiguïtés, manques, incohérences).",
      "- reformulation : reformulation fidèle et concise du draftText (sans enrichir gratuitement).",
      "- formal : un JSON R1 conforme au schéma.",
      "",
      "Mode GÉNÉRATION (pas de draftText) :",
      "- remarks : []",
      "- reformulation : \"\"",
      "- formal : proposer un R1 minimal à partir du problème/vision validés.",
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

    if (analyzeMode) {
      userParts.push("R1 — TEXTE SAISI (à analyser/reformuler) :");
      userParts.push(draftText);
      userParts.push("");
    } else {
      userParts.push("R1 — MODE : génération directe (pas de texte saisi).");
      userParts.push("");
    }

    if (problemFormal) userParts.push(`PROBLÈME (formal JSON, debug):\n${JSON.stringify(problemFormal)}`);
    if (visionFormal) userParts.push(`VISION (formal JSON, debug):\n${JSON.stringify(visionFormal)}`);

    const user = userParts.filter(Boolean).join("\n");

    const resp = await client.responses.create({
      model: "gpt-5.2",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "v2_r1_analyze_or_generate",
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

    // On renvoie aussi les champs à plat (compat)
    return NextResponse.json({
      ok: true,
      remarks: Array.isArray(parsed.remarks) ? parsed.remarks : [],
      reformulation: typeof parsed.reformulation === "string" ? parsed.reformulation : "",
      formal,
      ...(formal && typeof formal === "object" ? formal : {}),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
