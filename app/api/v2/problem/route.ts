import { NextResponse } from "next/server";

// ⚠️ En V2, on reste minimaliste :
// - 1 appel IA : reformulation + formalisation minimale du PROBLÈME
// - pas de vision, pas de raffinements ici

type ReqBody = {
  stage: "reformulate_and_formalize";
  user_text: string;
  context?: {
    time_unit_preference?: "jour" | "semaine" | "mois" | "annee";
    time_index_convention?: "0..N-1" | "1..N";
  };
  debug?: boolean;
};

function devDebugAllowed(debugFlag: boolean) {
  return process.env.NODE_ENV === "development" && debugFlag === true;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody;

    if (!body?.user_text || !body.user_text.trim()) {
      return NextResponse.json({ error: "user_text manquant" }, { status: 400 });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY manquante (mettez-la dans .env.local)" },
        { status: 500 }
      );
    }

    const userText = body.user_text.trim();
    const timePref = body.context?.time_unit_preference ?? "annee";
    const timeIndex = body.context?.time_index_convention ?? "1..N";

    // Prompt minimal et stable (V2)
    const system = [
      "Tu es un assistant qui aide à formaliser un PROBLÈME de décision.",
      "Tu dois produire :",
      "1) une reformulation textuelle courte (3-6 lignes) fidèle au texte de l'utilisateur, sans jargon, avec les chiffres clés si présents.",
      "2) une formalisation interne MINIMALE sous forme JSON avec :",
      "- horizon_analyse (nombre) si présent ou inférable, sinon null",
      "- unite_temps (jour|semaine|mois|annee) = préférence fournie",
      "- convention_temps ('0..N-1' ou '1..N') = fournie",
      "- constantes: liste d'objets { nom, valeur, unite }",
      "- regles: liste de règles testables (texte court), sans équations",
      "- objectif: objet minimal (texte + éventuellement cible chiffrée)",
      "Règles :",
      "- Ne pas inventer de nombres absents du texte.",
      "- Si une info manque, laisser null / vide et le signaler dans 'manques'.",
      "- JSON strict et parseable.",
    ].join("\n");

    const user = [
      "Texte utilisateur :",
      userText,
      "",
      `Préférence unité de temps : ${timePref}`,
      `Convention de temps : ${timeIndex}`,
      "",
      "Réponds en JSON uniquement avec les clés : reformulation_text, formal_problem, manques.",
    ].join("\n");

    // Appel API OpenAI (Responses API)
    const payload = {
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      // On veut un JSON propre
      text: { format: { type: "json_object" } },
    };

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const raw = await resp.text();
      return NextResponse.json({ error: "OpenAI error", details: raw }, { status: 502 });
    }

    const data = await resp.json();

    // Extraction robuste
    const textOut =
      data?.output_text ??
      (Array.isArray(data?.output)
        ? data.output
            .flatMap((o: any) => o?.content ?? [])
            .map((c: any) => c?.text)
            .filter(Boolean)
            .join("\n")
        : "");

    let parsed: any = null;
    try {
      parsed = JSON.parse(textOut);
    } catch {
      return NextResponse.json(
        { error: "Réponse IA non-JSON", output_text: textOut },
        { status: 502 }
      );
    }

    const debugAllowed = devDebugAllowed(body.debug === true);

    return NextResponse.json({
      reformulation_text: parsed.reformulation_text ?? null,
      formal_problem: parsed.formal_problem ?? null,
      manques: parsed.manques ?? null,
      debug: debugAllowed
        ? {
            system,
            user,
            model: payload.model,
            raw_output_text: textOut,
            raw_response_meta: {
              id: data?.id ?? null,
              usage: data?.usage ?? null,
            },
          }
        : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
