"use client";

import { useEffect, useMemo, useState } from "react";

type ProblemStatus = "draft" | "in_progress" | "done";

type ProblemLite = {
  id: string;
  nomCourt: string;
  status: ProblemStatus;
  createdAt: number;
  updatedAt: number;
};

type V2ProblemData = {
  problemText?: string;
  reformulationText?: string | null;
  formalProblem?: any | null;
  manques?: any | null;
  accepted?: boolean;
};

const LS_V2_PROBLEMS_KEY = "md_v2_problems";
const LS_V2_CURRENT_PROBLEM_ID_KEY = "md_v2_current_problem_id";
const LS_V2_PROBLEM_DATA_PREFIX = "md_v2_problem_data__"; // + problemId

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export default function V2ProblemePage() {
  const [ready, setReady] = useState(false);

  const [problemId, setProblemId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemLite | null>(null);

  const [draft, setDraft] = useState("");
  const [reformulation, setReformulation] = useState<string | null>(null);
  const [formal, setFormal] = useState<any | null>(null);
  const [manques, setManques] = useState<any | null>(null);

  const [step, setStep] = useState<"edit" | "review" | "done">("edit");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Option B : pas de mémorisation. Ces boutons ne font qu’afficher un texte d’aide sur cette page.
  const [showGuidedHelp, setShowGuidedHelp] = useState(false);
  const [showFreeHelp, setShowFreeHelp] = useState(false);

  const debug = useMemo(() => getQueryParam("debug") === "1", []);

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.45,
      } as const,

      topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 18,
      } as const,

      leftTop: { display: "flex", alignItems: "center", gap: 12 } as const,
      rightTop: { display: "flex", alignItems: "center", gap: 12 } as const,

      btnGray: {
        display: "inline-block",
        padding: "12px 18px",
        borderRadius: 12,
        border: "1px solid #d9d9d9",
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
          padding: "12px 18px",
          borderRadius: 12,
          border: "0",
          backgroundColor: disabled ? "#9bbbe5" : "#1976d2",
          color: "#fff",
          textDecoration: "none",
          fontSize: 16,
          cursor: disabled ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }) as const,

      btnToggle: (active: boolean) =>
        ({
          display: "inline-block",
          padding: "12px 18px",
          borderRadius: 12,
          border: active ? "2px solid #1976d2" : "1px solid #d9d9d9",
          backgroundColor: active ? "#eaf2ff" : "#fff",
          color: "#1b1b1b",
          fontSize: 16,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }) as const,

      title: { margin: "0 0 6px 0", fontSize: 22 } as const,
      subtitle: { margin: "0 0 18px 0", color: "#444" } as const,

      card: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        background: "#fafafa",
        marginTop: 12,
      } as const,

      label: { fontWeight: 700, marginBottom: 8 } as const,

      textarea: {
        width: "100%",
        minHeight: 180,
        resize: "vertical" as const,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
      } as const,

      actions: { display: "flex", gap: 12, marginTop: 14, alignItems: "center" } as const,

      warn: {
        background: "#fff3cd",
        border: "1px solid #ffe69c",
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        color: "#5c4a00",
      } as const,

      ok: {
        background: "#e9f7ef",
        border: "1px solid #b7e3c7",
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        color: "#0a5f2b",
      } as const,

      help: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e6e6e6",
        background: "#fff",
        color: "#333",
      } as const,

      mono: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: 13,
        whiteSpace: "pre-wrap" as const,
      } as const,
    }),
    []
  );

  function loadProblemList(): ProblemLite[] {
    return safeParse<ProblemLite[]>(localStorage.getItem(LS_V2_PROBLEMS_KEY), []);
  }

  function saveProblemList(list: ProblemLite[]) {
    localStorage.setItem(LS_V2_PROBLEMS_KEY, JSON.stringify(list));
  }

  function updateProblemInList(nextProblem: ProblemLite) {
    const list = loadProblemList();
    const next = list.map((p) => (p.id === nextProblem.id ? nextProblem : p));
    saveProblemList(next);
  }

  function dataKey(id: string) {
    return `${LS_V2_PROBLEM_DATA_PREFIX}${id}`;
  }

  function loadData(id: string): V2ProblemData {
    return safeParse<V2ProblemData>(localStorage.getItem(dataKey(id)), {});
  }

  function saveData(id: string, data: V2ProblemData) {
    localStorage.setItem(dataKey(id), JSON.stringify(data));
  }

  useEffect(() => {
    const idFromQuery = getQueryParam("problemId");
    const id = idFromQuery ?? localStorage.getItem(LS_V2_CURRENT_PROBLEM_ID_KEY);

    if (!id) {
      window.location.href = "/v2/problemes";
      return;
    }

    localStorage.setItem(LS_V2_CURRENT_PROBLEM_ID_KEY, id);

    const list = loadProblemList();
    const p = list.find((x) => x.id === id) ?? null;

    setProblemId(id);
    setProblem(p);

    const data = loadData(id);
    const accepted = !!data.accepted;

    setDraft(data.problemText ?? "");
    setReformulation(data.reformulationText ?? null);
    setFormal(data.formalProblem ?? null);
    setManques(data.manques ?? null);

    setStep(accepted ? "done" : "edit");
    setReady(true);
  }, []);

  function saveDraft(nextText: string) {
    setDraft(nextText);
    if (!problemId) return;

    const data = loadData(problemId);
    saveData(problemId, { ...data, problemText: nextText });
  }

  function goBackList() {
    window.location.href = "/v2/problemes";
  }

  function goNextPlaceholder() {
    // Placeholder : à remplacer quand la "page suivante" existera (visions, etc.)
    // window.location.href = `/v2/visions?problemId=${encodeURIComponent(problemId ?? "")}`;
  }

  async function askReformulate() {
    setErrMsg(null);
    const text = draft.trim();
    if (!text) {
      setErrMsg("Veuillez écrire une définition du problème (texte libre) avant de continuer.");
      return;
    }

    if (!problemId || !problem) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v2/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "reformulate_and_formalize",
          user_text: text,
          context: {
            time_unit_preference: "annee",
            time_index_convention: "1..N",
          },
          debug,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || `HTTP ${res.status}`);
      }

      const json = await res.json();

      const nextReformulation = (json.reformulation_text ?? null) as string | null;
      const nextFormal = json.formal_problem ?? null;
      const nextManques = json.manques ?? null;

      setReformulation(nextReformulation);
      setFormal(nextFormal);
      setManques(nextManques);

      const data = loadData(problemId);
      saveData(problemId, {
        ...data,
        problemText: text,
        reformulationText: nextReformulation,
        formalProblem: nextFormal,
        manques: nextManques,
        accepted: false,
      });

      const now = Date.now();
      const nextProblem: ProblemLite = { ...problem, status: "in_progress", updatedAt: now };
      setProblem(nextProblem);
      updateProblemInList(nextProblem);

      setStep("review");
    } catch (e: any) {
      setErrMsg(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function accept() {
    if (!problemId || !problem) return;

    const data = loadData(problemId);
    saveData(problemId, { ...data, accepted: true });

    const now = Date.now();
    const nextProblem: ProblemLite = { ...problem, status: "in_progress", updatedAt: now };
    setProblem(nextProblem);
    updateProblemInList(nextProblem);

    setStep("done");
  }

  function backToEdit() {
    setStep("edit");
  }

  if (!ready) return null;

  return (
    <main style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.leftTop}>
          <a href="/v2/problemes" style={styles.btnGray}>
            ← Retour à la liste
          </a>

          <button
            type="button"
            style={styles.btnToggle(showGuidedHelp)}
            onClick={() => {
              setShowGuidedHelp((v) => !v);
              setShowFreeHelp(false);
            }}
          >
            Mode guidé
          </button>

          <button
            type="button"
            style={styles.btnToggle(showFreeHelp)}
            onClick={() => {
              setShowFreeHelp((v) => !v);
              setShowGuidedHelp(false);
            }}
          >
            Mode libre
          </button>
        </div>

        <div style={styles.rightTop}>
          {step !== "done" ? (
            <button type="button" style={styles.btnBlue(false)} onClick={goBackList}>
              Revenir à la page précédente →
            </button>
          ) : (
            <>
              <button type="button" style={styles.btnBlue(false)} onClick={goBackList}>
                Revenir à la page précédente →
              </button>
              <button type="button" style={styles.btnBlue(true)} disabled onClick={goNextPlaceholder}>
                Aller à la page suivante →
              </button>
            </>
          )}
        </div>
      </div>

      <h1 style={styles.title}>V2 — Définition du problème</h1>
      <p style={styles.subtitle}>
        Problème : <strong>{problem?.nomCourt ?? "(sans nom)"}</strong>
        {debug ? (
          <>
            {" "}
            — <strong>debug=1</strong>
          </>
        ) : null}
      </p>

      {showGuidedHelp && (
        <div style={styles.help}>
          <strong>Mode guidé (sur cette page)</strong>
          <div style={{ marginTop: 6 }}>
            Vous pouvez écrire une définition “imparfaite”. Le site reformule et signale les points manquants. Vous
            corrigez autant de fois que nécessaire, puis vous validez.
          </div>
        </div>
      )}

      {showFreeHelp && (
        <div style={styles.help}>
          <strong>Mode libre (sur cette page)</strong>
          <div style={{ marginTop: 6 }}>
            Même principe, mais sans texte d’aide : vous écrivez librement, le site reformule, vous validez.
          </div>
        </div>
      )}

      {errMsg && <div style={styles.warn}>{errMsg}</div>}

      {step === "edit" && (
        <div style={styles.card}>
          <div style={styles.label}>Votre définition (texte libre)</div>
          <textarea
            style={styles.textarea}
            value={draft}
            onChange={(e) => saveDraft(e.target.value)}
            placeholder="Écrivez librement votre problème… (vous pourrez corriger après la reformulation)"
          />

          <div style={styles.actions}>
            <button type="button" onClick={askReformulate} style={styles.btnBlue(loading)} disabled={loading}>
              {loading ? "Analyse en cours…" : "Analyser → (reformulation)"}
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <>
          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Reformulation proposée</div>
            <div>{reformulation ?? "(aucune reformulation reçue)"}</div>

            {manques ? (
              <div style={{ marginTop: 12, color: "#666" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Points manquants / incertains</div>
                <pre style={styles.mono}>{JSON.stringify(manques, null, 2)}</pre>
              </div>
            ) : null}
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={accept} style={styles.btnBlue(false)} disabled={!reformulation}>
              Valider
            </button>
            <button type="button" onClick={backToEdit} style={styles.btnGray}>
              Corriger / préciser
            </button>
          </div>

          {debug ? (
            <div style={styles.card}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Debug auteur (interne)</div>
              <div style={{ fontWeight: 700, marginTop: 10 }}>Formalisation interne</div>
              <pre style={styles.mono}>{formal ? JSON.stringify(formal, null, 2) : "(vide)"}</pre>
            </div>
          ) : null}
        </>
      )}

      {step === "done" && (
        <div style={styles.ok}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>OK</div>
          <div>Définition validée (stockée localement pour ce problème V2).</div>

          <div style={{ marginTop: 10 }}>
            <strong>Texte validé :</strong>
            <div style={{ marginTop: 6 }}>{reformulation ?? (draft.trim() || "(vide)")}</div>
          </div>

          {debug ? (
            <div style={{ marginTop: 12 }}>
              <strong>Formalisation interne (debug)</strong>
              <pre style={styles.mono}>{formal ? JSON.stringify(formal, null, 2) : "(vide)"}</pre>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
