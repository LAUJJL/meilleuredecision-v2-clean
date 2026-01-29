// app/v2/vision/r1/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// --- Keys cohérents V2 ---
const LS_V2_CURRENT_PROBLEM_ID = "md_v2_current_problem_id";
const LS_V2_CURRENT_VISION_ID = "md_v2_current_vision_id";

const problemDefKey = (problemId: string) => `md_v2_problem_def_${problemId}`;
const visionDefKey = (problemId: string, visionId: string) => `md_v2_vision_def_${problemId}_${visionId}`;

// On stocke R1 dans la formalisation vision : formal.r1
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function V2VisionR1Page() {
  const router = useRouter();
  const sp = useSearchParams();

  const problemId = sp.get("problemId") || "";
  const visionId = sp.get("visionId") || "";
  const debug = sp.get("debug") === "1";

  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Contexte validé
  const [problemValidatedText, setProblemValidatedText] = useState("");
  const [problemFormal, setProblemFormal] = useState<any>(null);
  const [visionValidatedText, setVisionValidatedText] = useState("");
  const [visionFormal, setVisionFormal] = useState<any>(null);

  // Champs R1 (noms non préremplis)
  const [stockName, setStockName] = useState("");
  const [stockUnit, setStockUnit] = useState("€");
  const [stockInitialName, setStockInitialName] = useState("");
  const [stockInitialValue, setStockInitialValue] = useState<string>("");
  const [stockInitialMode, setStockInitialMode] = useState<"fixed" | "variable">("fixed");

  const [inflowName, setInflowName] = useState("");
  const [outflowName, setOutflowName] = useState("");

  const [horizonYears, setHorizonYears] = useState<string>("10");

    const [busyAI, setBusyAI] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // --- Analyse R1 ---
  const [r1Analyzed, setR1Analyzed] = useState(false);
  const [dirtySinceAnalysis, setDirtySinceAnalysis] = useState(true);
  const [analysisRemarks, setAnalysisRemarks] = useState<string[]>([]);


  const styles = useMemo(
    () => ({
      page: { padding: 40, maxWidth: 980, margin: "0 auto", fontFamily: "system-ui, sans-serif", lineHeight: 1.45 } as const,

      topbar: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
        marginBottom: 18,
        flexWrap: "wrap" as const,
      } as const,

      btnGray: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid #d0d0d0",
        background: "#fff",
        color: "#111",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
      } as const,

      btnBlue: (disabled: boolean) =>
        ({
          display: "inline-block",
          padding: "10px 16px",
          borderRadius: 12,
          border: 0,
          background: disabled ? "#9bbbe5" : "#1976d2",
          color: "#fff",
          fontSize: 16,
          cursor: disabled ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }) as const,

      h1: { fontSize: 30, margin: "12px 0 6px" } as const,
      muted: { color: "#666" } as const,

      card: { border: "1px solid #e6e6e6", borderRadius: 16, padding: 18, marginTop: 16, background: "#fafafa" } as const,

      grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as const,

      label: { fontWeight: 700, marginBottom: 6 } as const,

      input: {
        width: "100%",
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        fontSize: 16,
        background: "#fff",
      } as const,

      select: {
        width: "100%",
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        fontSize: 16,
        background: "#fff",
      } as const,

      warn: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        background: "#fff7ed",
        border: "1px solid #fdba74",
        color: "#7c2d12",
      } as const,

      ok: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        background: "#e9fbe9",
        border: "1px solid #a7f3a7",
        color: "#065f46",
      } as const,

      mono: {
        marginTop: 10,
        background: "#0b1020",
        color: "#e5e7eb",
        padding: 12,
        borderRadius: 12,
        overflowX: "auto" as const,
        fontSize: 13,
        whiteSpace: "pre-wrap" as const,
      } as const,
    }),
    []
  );

  useEffect(() => {
    const pid = problemId || localStorage.getItem(LS_V2_CURRENT_PROBLEM_ID) || "";
    const vid = visionId || localStorage.getItem(LS_V2_CURRENT_VISION_ID) || "";

    if (!pid || !vid) {
      setMsg("Il manque problemId / visionId. Revenez à la liste des visions et ouvrez une vision.");
      setReady(true);
      return;
    }

    localStorage.setItem(LS_V2_CURRENT_PROBLEM_ID, pid);
    localStorage.setItem(LS_V2_CURRENT_VISION_ID, vid);

    // Charger problème validé
    const pDef = safeParse<any>(localStorage.getItem(problemDefKey(pid)), null);
    const pText = (pDef?.validatedText ?? "").trim();
    const pFormal = pDef?.formal ?? null;

    setProblemValidatedText(pText);
    setProblemFormal(pFormal);

    // Charger vision validée
    const vDef = safeParse<any>(localStorage.getItem(visionDefKey(pid, vid)), null);
    const vText = (vDef?.validatedText ?? "").trim();
    const vFormal = vDef?.formal ?? null;

    setVisionValidatedText(vText);
    setVisionFormal(vFormal);

    // Charger R1 existant si déjà créé
    const existingR1 = vDef?.formal?.r1 ?? null;
    if (existingR1) {
      setStockName(existingR1?.stock?.name ?? "");
      setStockUnit(existingR1?.stock?.unit ?? "€");
      setStockInitialName(existingR1?.stock?.initial?.name ?? "");
      setStockInitialValue(
        typeof existingR1?.stock?.initial?.value === "number" ? String(existingR1.stock.initial.value) : ""
      );
      setStockInitialMode(existingR1?.stock?.initial?.mode === "variable" ? "variable" : "fixed");
      setInflowName(existingR1?.flows?.inflow?.name ?? "");
      setOutflowName(existingR1?.flows?.outflow?.name ?? "");
      setHorizonYears(
        typeof existingR1?.time?.horizon_years === "number" ? String(existingR1.time.horizon_years) : "10"
      );
    } else {
      // Préremplissage déterministe : valeur initiale = capital si présent (sans forcer)
      const capital =
        (typeof pFormal?.initialCapital === "number" && pFormal.initialCapital) ||
        (typeof pFormal?.capital_initial === "number" && pFormal.capital_initial) ||
        (typeof pFormal?.initial?.capital === "number" && pFormal.initial?.capital) ||
        null;

      const horizon =
        (typeof pFormal?.horizon_years === "number" && pFormal.horizon_years) ||
        (typeof pFormal?.horizon === "number" && pFormal.horizon) ||
        (typeof pFormal?.time?.horizon_years === "number" && pFormal.time.horizon_years) ||
        null;

      if (capital != null && stockInitialValue.trim() === "") setStockInitialValue(String(capital));
      if (horizon != null && horizonYears.trim() === "10") setHorizonYears(String(horizon));
    }

    setReady(true);
  }, [problemId, visionId]);

  function goPrev() {
    if (!problemId || !visionId) return router.push("/v2/visions");
    router.push(`/v2/vision?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(visionId)}`);
  }

  function goNext() {
    if (!problemId || !visionId) return;
    router.push(`/v2/vision/r2?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(visionId)}`);
  }

  const errors = useMemo(() => {
    const e: string[] = [];

    if (!problemValidatedText) e.push("Le problème n'est pas validé : revenez valider le problème avant R1.");

    if (!stockName.trim()) e.push("Nom du stock manquant.");
    if (!stockInitialName.trim()) e.push("Nom du stock de départ manquant.");

    if (stockInitialValue.trim() === "") e.push("Valeur du stock de départ manquante.");
    if (stockInitialValue.trim() !== "" && !Number.isFinite(Number(stockInitialValue))) e.push("Valeur du stock de départ invalide.");

    if (!inflowName.trim()) e.push("Nom du flux entrant manquant.");
    if (!outflowName.trim()) e.push("Nom du flux sortant manquant.");

    if (horizonYears.trim() === "") e.push("Horizon manquant.");
    if (horizonYears.trim() !== "" && (!Number.isFinite(Number(horizonYears)) || Number(horizonYears) <= 0))
      e.push("Horizon invalide (doit être un nombre > 0).");

    // Contrôle cohérence financière : stock initial <= capital du problème si on le connaît
    const capital =
      (typeof problemFormal?.initialCapital === "number" && problemFormal.initialCapital) ||
      (typeof problemFormal?.capital_initial === "number" && problemFormal.capital_initial) ||
      (typeof problemFormal?.initial?.capital === "number" && problemFormal.initial?.capital) ||
      null;

    const init = Number(stockInitialValue);
    if (capital != null && Number.isFinite(init) && init > capital) {
      e.push(`Le stock initial (${init.toLocaleString("fr-FR")}) dépasse le capital déclaré (${capital.toLocaleString("fr-FR")}).`);
    }

    return e;
  }, [problemValidatedText, stockName, stockInitialName, stockInitialValue, inflowName, outflowName, horizonYears, problemFormal]);

  const canSave = errors.length === 0;

  function persistR1(r1: any) {
    // Sauvegarde dans visionDefKey(problemId, visionId).formal.r1
    const key = visionDefKey(problemId, visionId);
    const cur = safeParse<any>(localStorage.getItem(key), {}) || {};
    const curFormal = cur.formal ?? {};
    const next = { ...cur, formal: { ...curFormal, r1 } };
    localStorage.setItem(key, JSON.stringify(next));
    setVisionFormal(next.formal);
  }

  function saveR1() {
    setMsg(null);
    setSavedOk(false);

    if (!canSave) {
      setMsg("Complétez les champs obligatoires avant de valider R1.");
      return;
    }

    const r1 = {
      kind: "r1",
      time: { horizon_years: Number(horizonYears), unit: "année", step: 1 },
      stock: {
        name: stockName.trim(),
        unit: (stockUnit || "").trim() || null,
        initial: {
          name: stockInitialName.trim(),
          value: Number(stockInitialValue),
          mode: stockInitialMode,
        },
      },
      flows: {
        inflow: { name: inflowName.trim() },
        outflow: { name: outflowName.trim() },
      },
      meta: { generated_by: "system", generated_at: new Date().toISOString() },
    };

    persistR1(r1);
    setSavedOk(true);
  }

  async function generateWithAI() {
    setMsg(null);
    setSavedOk(false);

    if (!problemValidatedText) {
      setMsg("Problème non validé : revenez d’abord valider le problème.");
      return;
    }

    setBusyAI(true);
    try {
      const res = await fetch("/api/v2/r1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemValidatedText,
          problemFormal,
          visionValidatedText,
          visionFormal,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setMsg(data?.error || "Erreur IA (R1)");
        setBusyAI(false);
       setR1Analyzed(true);
setDirtySinceAnalysis(false);

if (Array.isArray(data.remarks)) {
  setAnalysisRemarks(data.remarks);
}

        return;
      }

      // Remplit les champs (modifiable)
      setStockName(data.stockName ?? "");
      setStockUnit(data.stockUnit ?? "€");
      setStockInitialName(data.stockInitialName ?? "");
      setStockInitialValue(
        typeof data.stockInitialValue === "number" ? String(data.stockInitialValue) : ""
      );
      setStockInitialMode(data.stockInitialMode === "variable" ? "variable" : "fixed");
      setInflowName(data.inflowName ?? "");
      setOutflowName(data.outflowName ?? "");
      setHorizonYears(typeof data.horizonYears === "number" ? String(data.horizonYears) : "10");

      if (Array.isArray(data.notes) && data.notes.length > 0) {
        setMsg("IA : " + data.notes.join(" | "));
      }

      setBusyAI(false);
    } catch (e: any) {
      setMsg(e?.message || "Erreur réseau IA (R1)");
      setBusyAI(false);
    }
  }

  if (!ready) return null;

  return (
    <main style={styles.page}>
      <div style={styles.topbar}>
        <button style={styles.btnGray} onClick={() => router.push("/")}>
          Accueil
        </button>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button style={styles.btnGray} onClick={goPrev}>
            ← Page précédente
          </button>
          <button style={styles.btnBlue(false)} onClick={goNext}>
            Aller à la suivante →
          </button>
        </div>
      </div>

      <h1 style={styles.h1}>V2 — R1 (tronc commun)</h1>
      <div style={styles.muted}>
        Cette page doit fonctionner même sans IA. L’IA est optionnelle.
      </div>

      {msg ? <div style={styles.warn}>{msg}</div> : null}
      {savedOk ? <div style={styles.ok}>R1 enregistré.</div> : null}

      <section style={styles.card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button style={styles.btnBlue(false)} onClick={generateWithAI} disabled={busyAI}>
  {busyAI ? "Analyse R1…" : "Analyser R1 (IA, optionnel)"}
</button>


          <button
  style={styles.btnBlue(!canSave || !r1Analyzed || dirtySinceAnalysis)}
  onClick={saveR1}
  disabled={!canSave || !r1Analyzed || dirtySinceAnalysis}
>
  Valider R1 (enregistrer)
</button>
{!r1Analyzed ? (
  <div style={styles.warn}>
    <strong>Analyse requise</strong>
    <div style={{ marginTop: 6 }}>
      Cliquez sur <em>Analyser R1 (IA)</em> avant de pouvoir valider.
    </div>
  </div>
) : dirtySinceAnalysis ? (
  <div style={styles.warn}>
    <strong>Modifié depuis la dernière analyse</strong>
    <div style={{ marginTop: 6 }}>
      Vous avez modifié un champ. Relancez l’analyse avant de valider.
    </div>
  </div>
) : (
  <div style={styles.ok}>
    <strong>OK</strong> — R1 analysé et cohérent.
  </div>
)}

        </div>

        {errors.length > 0 ? (
          <div style={styles.warn}>
            <strong>À corriger</strong>
            <ul style={{ marginTop: 8 }}>
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div style={{ marginTop: 18, ...styles.grid }}>
          <div>
            <div style={styles.label}>Nom du stock</div>
            <input
              style={styles.input}
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="Ex : Trésorerie"
            />
          </div>

          <div>
            <div style={styles.label}>Unité du stock (optionnel)</div>
            <input
              style={styles.input}
              value={stockUnit}
              onChange={(e) => setStockUnit(e.target.value)}
              placeholder="Ex : €"
            />
          </div>

          <div>
            <div style={styles.label}>Nom du stock de départ</div>
            <input
              style={styles.input}
              value={stockInitialName}
              onChange={(e) => setStockInitialName(e.target.value)}
              placeholder="Ex : Trésorerie initiale"
            />
          </div>

          <div>
            <div style={styles.label}>Valeur du stock de départ</div>
            <input
              style={styles.input}
              value={stockInitialValue}
              onChange={(e) => setStockInitialValue(e.target.value)}
              placeholder="Ex : 300000"
            />
          </div>

          <div>
            <div style={styles.label}>Stock de départ : fixé ou variable ?</div>
            <select
              style={styles.select}
              value={stockInitialMode}
              onChange={(e) => setStockInitialMode(e.target.value as "fixed" | "variable")}
            >
              <option value="fixed">Fixé (recommandé)</option>
              <option value="variable">Variable (ajustable plus tard)</option>
            </select>
          </div>

          <div>
            <div style={styles.label}>Nom du flux entrant</div>
            <input
              style={styles.input}
              value={inflowName}
              onChange={(e) => setInflowName(e.target.value)}
              placeholder="Ex : Encaissements"
            />
          </div>

          <div>
            <div style={styles.label}>Nom du flux sortant</div>
            <input
              style={styles.input}
              value={outflowName}
              onChange={(e) => setOutflowName(e.target.value)}
              placeholder="Ex : Décaissements"
            />
          </div>

          <div>
            <div style={styles.label}>Horizon (années)</div>
            <input
              style={styles.input}
              value={horizonYears}
              onChange={(e) => setHorizonYears(e.target.value)}
              placeholder="Ex : 10"
            />
          </div>
        </div>

        {debug ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700 }}>Debug — contexte</div>
            <div style={styles.mono}>
              {JSON.stringify(
                {
                  problemValidatedText,
                  problemFormal,
                  visionValidatedText,
                  visionFormal,
                  savedFormal: visionFormal,
                },
                null,
                2
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
