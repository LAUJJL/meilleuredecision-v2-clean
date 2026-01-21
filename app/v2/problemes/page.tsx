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

const LS_V2_PROBLEMS_KEY = "md_v2_problems";
const LS_V2_CURRENT_PROBLEM_ID_KEY = "md_v2_current_problem_id";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}

export default function V2ProblemesPage() {
  const [problems, setProblems] = useState<ProblemLite[]>([]);
  const [name, setName] = useState("");

  const [showGuidedHelp, setShowGuidedHelp] = useState(false);
  const [showFreeHelp, setShowFreeHelp] = useState(false);

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 1050,
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

      leftTop: {
        display: "flex",
        alignItems: "center",
        gap: 12,
      } as const,

      btnGreen: {
        display: "inline-block",
        padding: "12px 18px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#2e7d32",
        color: "#fff",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
      } as const,

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

      card: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        background: "#fafafa",
        marginTop: 10,
      } as const,

      title: { margin: "0 0 10px 0", fontSize: 22 } as const,

      list: { display: "flex", flexDirection: "column", gap: 12, marginTop: 12 } as const,

      row: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: 14,
        borderRadius: 14,
        border: "1px solid #eee",
        background: "#fff",
      } as const,

      rowTitle: { fontWeight: 800, fontSize: 18 } as const,
      rowMeta: { color: "#666", marginTop: 2 } as const,

      rowActions: { display: "flex", gap: 10, alignItems: "center" } as const,

      btnPrimary: {
        padding: "10px 14px",
        borderRadius: 14,
        border: "0",
        background: "#1976d2",
        color: "#fff",
        cursor: "pointer",
        fontSize: 16,
        whiteSpace: "nowrap",
      } as const,

      btnDanger: {
        padding: "10px 14px",
        borderRadius: 14,
        border: "1px solid #e74c3c",
        background: "#fff",
        color: "#e74c3c",
        cursor: "pointer",
        fontSize: 16,
        whiteSpace: "nowrap",
      } as const,

      form: { marginTop: 18, display: "flex", gap: 12, alignItems: "center" } as const,

      input: {
        flex: 1,
        padding: "12px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
      } as const,

      help: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e6e6e6",
        background: "#fff",
        color: "#333",
      } as const,

      small: { marginTop: 10, color: "#666", fontSize: 14 } as const,
    }),
    []
  );

  useEffect(() => {
    const list = safeParse<ProblemLite[]>(localStorage.getItem(LS_V2_PROBLEMS_KEY), []);
    setProblems(list);
  }, []);

  function persist(list: ProblemLite[]) {
    setProblems(list);
    localStorage.setItem(LS_V2_PROBLEMS_KEY, JSON.stringify(list));
  }

  function createProblem() {
    const n = name.trim();
    if (!n) return;

    const now = Date.now();
    const p: ProblemLite = {
      id: uid(),
      nomCourt: n,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    const next = [p, ...problems];
    persist(next);
    setName("");
  }

  function deleteProblem(id: string) {
    const next = problems.filter((p) => p.id !== id);
    persist(next);

    const current = localStorage.getItem(LS_V2_CURRENT_PROBLEM_ID_KEY);
    if (current === id) localStorage.removeItem(LS_V2_CURRENT_PROBLEM_ID_KEY);
  }

  function openProblem(p: ProblemLite) {
    localStorage.setItem(LS_V2_CURRENT_PROBLEM_ID_KEY, p.id);
    window.location.href = `/v2/probleme?problemId=${encodeURIComponent(p.id)}`;
  }

  return (
    <main style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.leftTop}>
          <a href="/" style={styles.btnGreen}>
            ← Retour à l’accueil
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

        <div />
      </div>

      <div style={styles.card}>
        <div style={styles.title}>Liste des problèmes</div>

        {showGuidedHelp && (
          <div style={styles.help}>
            <strong>Mode guidé (V2)</strong>
            <div style={{ marginTop: 6 }}>
              Le site vous guidera pas à pas. Il vous proposera un exemple de formulation et vous aidera à corriger les
              imprécisions.
            </div>
          </div>
        )}

        {showFreeHelp && (
          <div style={styles.help}>
            <strong>Mode libre (V2)</strong>
            <div style={{ marginTop: 6 }}>
              Vous écrivez librement votre définition. Le site reformule et signale les manques, puis vous validez.
            </div>
          </div>
        )}

        <div style={styles.list}>
          {problems.length === 0 ? (
            <div style={{ color: "#666", marginTop: 10 }}>Aucun problème pour l’instant.</div>
          ) : (
            problems.map((p) => {
              const s = p.status === "draft" ? "Brouillon" : p.status === "in_progress" ? "En cours" : "Terminé";
              return (
                <div key={p.id} style={styles.row}>
                  <div>
                    <div style={styles.rowTitle}>{p.nomCourt}</div>
                    <div style={styles.rowMeta}>{s}</div>
                  </div>

                  <div style={styles.rowActions}>
                    <button type="button" style={styles.btnPrimary} onClick={() => openProblem(p)}>
                      Ouvrir →
                    </button>
                    <button type="button" style={styles.btnDanger} onClick={() => deleteProblem(p.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={styles.form}>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom court du nouveau problème"
          />
          <button type="button" style={styles.btnPrimary} onClick={createProblem}>
            Créer
          </button>
        </div>

        <div style={styles.small}>“Brouillon” signifie : problème créé, mais définition V2 pas encore validée.</div>
      </div>
    </main>
  );
}
