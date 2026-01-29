// app/v2/vision/r2/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// --- Keys cohérents V2 ---
const LS_V2_CURRENT_PROBLEM_ID = "md_v2_current_problem_id";
const LS_V2_CURRENT_VISION_ID = "md_v2_current_vision_id";

const problemDefKey = (problemId: string) => `md_v2_problem_def_${problemId}`;
const visionDefKey = (problemId: string, visionId: string) => `md_v2_vision_def_${problemId}_${visionId}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function V2VisionR2Page() {
  const router = useRouter();
  const sp = useSearchParams();

  const problemId = sp.get("problemId") || "";
  const visionId = sp.get("visionId") || "";
  const debug = sp.get("debug") === "1";

  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // Contexte
  const [problemValidatedText, setProblemValidatedText] = useState("");
  const [problemFormal, setProblemFormal] = useState<any>(null);

  const [visionValidatedText, setVisionValidatedText] = useState("");
  const [visionFormal, setVisionFormal] = useState<any>(null);

  // R1 obligatoire
  const [r1, setR1] = useState<any>(null);

  // Verrouillage : si R2 existe déjà, elle est "validée" et devient lecture seule.
  const [locked, setLocked] = useState(false);

  // R2 (libre)
  const [r2Text, setR2Text] = useState("");
  const [comment, setComment] = useState("");

  // IA obligatoire
  const [busyAI, setBusyAI] = useState(false);
  const [r2Analyzed, setR2Analyzed] = useState(false);
  const [dirtySinceAnalysis, setDirtySinceAnalysis] = useState(true);

  const [reformulation, setReformulation] = useState<string>("");
  const [analysisRemarks, setAnalysisRemarks] = useState<string[]>([]);
  const [r2Formal, setR2Formal] = useState<any>(null);

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

      label: { fontWeight: 700, marginBottom: 6 } as const,

      input: {
        width: "100%",
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        fontSize: 16,
        background: "#fff",
      } as const,

      textarea: {
        width: "100%",
        minHeight: 140,
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        fontSize: 16,
        background: "#fff",
        resize: "vertical" as const,
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
    setProblemValidatedText((pDef?.validatedText ?? "").trim());
    setProblemFormal(pDef?.formal ?? null);

    // Charger vision validée + r1/r2 éventuels
    const vKey = visionDefKey(pid, vid);
    const vDef = safeParse<any>(localStorage.getItem(vKey), null);
    setVisionValidatedText((vDef?.validatedText ?? "").trim());
    setVisionFormal(vDef?.formal ?? null);

    const existingR1 = vDef?.formal?.r1 ?? null;
    setR1(existingR1);

    const existingR2 = vDef?.formal?.r2 ?? null;
    if (existingR2) {
      setLocked(true);
      setR2Text(existingR2?.text ?? "");
      setComment(existingR2?.comment ?? "");
      setReformulation(existingR2?.ai?.reformulation ?? "");
      setAnalysisRemarks(Array.isArray(existingR2?.ai?.remarks) ? existingR2.ai.remarks : []);
      setR2Formal(existingR2?.ai?.r2Formal ?? null);

      // Comme c’est validé, on considère “analysé OK” et “propre”
      setR2Analyzed(true);
      setDirtySinceAnalysis(false);
    } else {
      setLocked(false);
      setR2Text("");
      setComment("");
      setReformulation("");
      setAnalysisRemarks([]);
      setR2Formal(null);
      setR2Analyzed(false);
      setDirtySinceAnalysis(true);
    }

    setReady(true);
  }, [problemId, visionId]);

  function goPrev() {
    if (!problemId || !visionId) return router.push("/v2/visions");
    router.push(`/v2/vision/r1?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(visionId)}`);
  }

  function goNext() {
    if (!problemId || !visionId) return;
    // R3 n'existe peut-être pas encore ; on garde la route prévue.
    router.push(`/v2/vision/r3?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(visionId)}`);
  }

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!problemValidatedText) e.push("Le problème n'est pas validé : revenez valider le problème avant R2.");
    if (!visionValidatedText) e.push("La vision n'est pas validée : revenez valider la vision avant R2.");
    if (!r1) e.push("R1 n'est pas validée : vous devez d'abord valider R1.");
    if (!r2Text.trim()) e.push("Texte R2 manquant : R2 doit apporter une information supplémentaire.");
    return e;
  }, [problemValidatedText, visionValidatedText, r1, r2Text]);

  const canAnalyze = !locked && errors.length === 0 && !busyAI;

  const canSave = !locked && errors.length === 0 && r2Analyzed && !dirtySinceAnalysis;

  function persistR2(r2: any) {
    const key = visionDefKey(problemId, visionId);
    const cur = safeParse<any>(localStorage.getItem(key), {}) || {};
    const curFormal = cur.formal ?? {};
    const next = { ...cur, formal: { ...curFormal, r2 } };
    localStorage.setItem(key, JSON.stringify(next));
    setVisionFormal(next.formal);
  }

  async function analyzeR2() {
    setMsg(null);
    setSavedOk(false);

    if (locked) {
      setMsg("R2 est déjà validée : elle est en lecture seule.");
      return;
    }
    if (errors.length > 0) {
      setMsg("Complétez les champs obligatoires avant l’analyse.");
      return;
    }

    setBusyAI(true);
    try {
      const res = await fetch("/api/v2/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemValidatedText,
          problemFormal,
          visionValidatedText,
          visionFormal,
          r1,
          draftText: r2Text.trim(),
        }),
      });

      const data = await res.json();

      if (!data?.ok) {
        // IMPORTANT : message simple
        setMsg(data?.error || "Pas assez d'information.");
        setReformulation(data?.reformulation ?? "");
        setAnalysisRemarks(Array.isArray(data?.remarks) ? data.remarks : []);
        setR2Formal(null);

        setR2Analyzed(false);
        setDirtySinceAnalysis(true);
        setBusyAI(false);
        return;
      }

      setReformulation(data?.reformulation ?? "");
      setAnalysisRemarks(Array.isArray(data?.remarks) ? data.remarks : []);
      setR2Formal(data?.formal ?? null);

      setR2Analyzed(true);
      setDirtySinceAnalysis(false);
      setBusyAI(false);
    } catch (e: any) {
      setMsg(e?.message || "Erreur réseau IA (R2)");
      setBusyAI(false);
    }
  }

  function saveR2() {
    setMsg(null);
    setSavedOk(false);

    if (locked) {
      setMsg("R2 est déjà validée : elle est en lecture seule.");
      return;
    }
    if (!r2Analyzed || dirtySinceAnalysis) {
      setMsg("Vous devez d'abord analyser R2 (et ne rien modifier après) avant de valider.");
      return;
    }
    if (errors.length > 0) {
      setMsg("Complétez les champs obligatoires avant de valider R2.");
      return;
    }

    const r2 = {
      kind: "r2",
      text: r2Text.trim(),
      comment: comment ?? "",
      ai: {
        reformulation: reformulation ?? "",
        remarks: Array.isArray(analysisRemarks) ? analysisRemarks : [],
        r2Formal: r2Formal ?? null,
      },
      meta: { validated: true, validated_at: new Date().toISOString() },
    };

    persistR2(r2);
    setSavedOk(true);
    setLocked(true); // immutabilité immédiate après validation
    setDirtySinceAnalysis(false);
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

      <h1 style={styles.h1}>V2 — R2 (raffinement libre)</h1>
      <div style={styles.muted}>
        {locked
          ? "R2 est validée : lecture seule. Pour modifier, supprimez la vision."
          : "Écrivez une information supplémentaire (texte libre), puis analysez (obligatoire), puis validez."}
      </div>

      {msg ? <div style={styles.warn}>{msg}</div> : null}
      {savedOk ? <div style={styles.ok}>R2 validée et enregistrée (lecture seule).</div> : null}

      <section style={styles.card}>
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

        <div style={{ marginTop: 14 }}>
          <div style={styles.label}>Texte R2 (obligatoire)</div>
          <textarea
            style={styles.textarea}
            value={r2Text}
            onChange={(e) => {
              setR2Text(e.target.value);
              if (!locked) {
                setDirtySinceAnalysis(true);
                setR2Analyzed(false);
              }
            }}
            placeholder="Ex : La trésorerie ne doit jamais descendre sous 100000 € sur tout l'horizon. / Ou : Le flux entrant représente le salaire net mensuel, constant les 2 premières années, puis augmente..."
            disabled={inputDisabled}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={styles.label}>Commentaire (sauvegardé)</div>
          <textarea
            style={{ ...styles.textarea, minHeight: 90 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire libre (visible en relecture une fois validé)."
            disabled={inputDisabled}
          />
        </div>

        {!locked ? (
          <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button style={styles.btnBlue(!canAnalyze)} onClick={analyzeR2} disabled={!canAnalyze}>
              {busyAI ? "Analyse R2…" : "Analyser R2 (obligatoire)"}
            </button>

            <button style={styles.btnBlue(!canSave)} onClick={saveR2} disabled={!canSave}>
              Valider R2 (enregistrer)
            </button>
          </div>
        ) : null}

        {!locked ? (
          !r2Analyzed ? (
            <div style={styles.warn}>
              <strong>Analyse requise</strong>
              <div style={{ marginTop: 6 }}>Cliquez sur <em>Analyser R2 (obligatoire)</em> avant de pouvoir valider.</div>
            </div>
          ) : dirtySinceAnalysis ? (
            <div style={styles.warn}>
              <strong>Modifié depuis la dernière analyse</strong>
              <div style={{ marginTop: 6 }}>Vous avez modifié le texte. Relancez l’analyse avant de valider.</div>
            </div>
          ) : (
            <div style={styles.ok}>
              <strong>OK</strong> — R2 analysé et prêt à valider.
            </div>
          )
        ) : null}

        {reformulation ? (
          <div style={{ marginTop: 14 }}>
            <div style={styles.label}>Reformulation</div>
            <div style={styles.ok}>{reformulation}</div>
          </div>
        ) : null}

        {analysisRemarks.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <div style={styles.label}>Remarques</div>
            <div style={styles.warn}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {analysisRemarks.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

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
                  r1,
                  locked,
                  r2Text,
                  comment,
                  reformulation,
                  analysisRemarks,
                  r2Formal,
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
