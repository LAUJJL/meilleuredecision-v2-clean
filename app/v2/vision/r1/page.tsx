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

  // Verrouillage : si R1 existe déjà, elle est considérée "validée" et devient lecture seule.
  const [locked, setLocked] = useState(false);

  // Champs R1 (aucun préremplissage automatique)
  const [stockName, setStockName] = useState("");
  const [stockUnit, setStockUnit] = useState("");
  const [stockInitialName, setStockInitialName] = useState("");
  const [stockInitialValue, setStockInitialValue] = useState<string>("");
  const [stockInitialMode, setStockInitialMode] = useState<"fixed" | "variable">("fixed");

  const [inflowName, setInflowName] = useState("");
  const [outflowName, setOutflowName] = useState("");

  const [horizonYears, setHorizonYears] = useState<string>("");

  const [savedOk, setSavedOk] = useState(false);

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

    // Charger R1 existant si déjà créé : si présent => lecture seule (immutabilité)
    const existingR1 = vDef?.formal?.r1 ?? null;
    if (existingR1) {
      setLocked(true);

      setStockName(existingR1?.stock?.name ?? "");
      setStockUnit(existingR1?.stock?.unit ?? "");
      setStockInitialName(existingR1?.stock?.initial?.name ?? "");
      setStockInitialValue(
        typeof existingR1?.stock?.initial?.value === "number" ? String(existingR1.stock.initial.value) : ""
      );
      setStockInitialMode(existingR1?.stock?.initial?.mode === "variable" ? "variable" : "fixed");
      setInflowName(existingR1?.flows?.inflow?.name ?? "");
      setOutflowName(existingR1?.flows?.outflow?.name ?? "");
      setHorizonYears(
        typeof existingR1?.time?.horizon_years === "number" ? String(existingR1.time.horizon_years) : ""
      );
    } else {
      setLocked(false);
      // Aucun préremplissage : tout reste vide tant que l'utilisateur ne valide pas.
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

    // Contrainte éventuelle : stock initial <= capital du problème si le capital est défini.
    // Si aucun capital n'est défini, aucune limite.
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

  const canSave = !locked && errors.length === 0;

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

    if (locked) {
      setMsg("R1 est déjà validée : elle est en lecture seule.");
      return;
    }

    if (errors.length > 0) {
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
      meta: { validated: true, validated_at: new Date().toISOString() },
    };

    persistR1(r1);
    setSavedOk(true);
    setLocked(true); // immutabilité immédiate après validation
  }

  if (!ready) return null;

  const inputDisabled = locked;

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
        {locked ? "R1 est validée : lecture seule." : "Saisissez les éléments de R1 puis validez."}
      </div>

      {msg ? <div style={styles.warn}>{msg}</div> : null}
      {savedOk ? <div style={styles.ok}>R1 validée et enregistrée (lecture seule).</div> : null}

      <section style={styles.card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button style={styles.btnBlue(!canSave)} onClick={saveR1} disabled={!canSave}>
            {locked ? "R1 validée (lecture seule)" : "Valider R1 (enregistrer)"}
          </button>
        </div>

        {!locked && errors.length > 0 ? (
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
              disabled={inputDisabled}
            />
          </div>

          <div>
            <div style={styles.label}>Unité du stock (optionnel)</div>
            <input
              style={styles.input}
              value={stockUnit}
              onChange={(e) => setStockUnit(e.target.value)}
              placeholder="Ex : €"
              disabled={inputDisabled}
            />
          </div>

          <div>
            <div style={styles.label}>Nom du stock de départ</div>
            <input
              style={styles.input}
              value={stockInitialName}
              onChange={(e) => setStockInitialName(e.target.value)}
              placeholder="Ex : Trésorerie de départ"
              disabled={inputDisabled}
            />
          </div>

          <div>
            <div style={styles.label}>Valeur du stock de départ</div>
            <input
              style={styles.input}
              value={stockInitialValue}
              onChange={(e) => setStockInitialValue(e.target.value)}
              placeholder="Ex : 300000"
              disabled={inputDisabled}
            />
          </div>

          <div>
            <div style={styles.label}>Stock de départ : fixé ou variable ?</div>
            <select
              style={styles.select}
              value={stockInitialMode}
              onChange={(e) => setStockInitialMode(e.target.value as "fixed" | "variable")}
              disabled={inputDisabled}
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
              disabled={inputDisabled}
            />
          </div>

          <div>
            <div style={styles.label}>Nom du flux sortant</div>
            <input
              style={styles.input}
              value={outflowName}
              onChange={(e) => setOutflowName(e.target.value)}
              placeholder="Ex : Décaissements"
              disabled={inputDisabled}
            />
          </div>

          <div>
            <div style={styles.label}>Horizon (années)</div>
            <input
              style={styles.input}
              value={horizonYears}
              onChange={(e) => setHorizonYears(e.target.value)}
              placeholder="Ex : 4"
              disabled={inputDisabled}
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
                  locked,
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
