// app/problemes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type HelpMode = "guide" | "libre";
type ProblemStatus = "draft" | "in_progress" | "done";

type ProblemLite = {
  id: string;
  nomCourt: string;
  status: ProblemStatus;
  createdAt: number;
  updatedAt: number;
  data?: any;
};

const LS_PROBLEMS_KEY = "md_problems";
const LS_CURRENT_PROBLEM_KEY = "md_current_problem";
const LS_HELP_MODE_KEY = "md_help_mode";

// ✅ À adapter quand la route “définition du problème” sera stabilisée
const PROBLEM_DEFINITION_PATH = "/probleme";

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function statusLabel(s: ProblemStatus) {
  if (s === "done") return "Terminé";
  if (s === "in_progress") return "En cours";
  return "Brouillon";
}

function statusColor(s: ProblemStatus) {
  if (s === "done") return "#2e7d32";
  if (s === "in_progress") return "#1565c0";
  return "#6d4c41";
}

export default function ProblemesPage() {
  const [ready, setReady] = useState(false);

  const [problems, setProblems] = useState<ProblemLite[]>([]);
  const [newName, setNewName] = useState("");

  const [helpMode, setHelpMode] = useState<HelpMode>("libre");
  const [helpOpen, setHelpOpen] = useState(false);

  // Renommage inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.45,
      } as const,

      // Header tout en haut : aide au centre, nav à droite
      header: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 16,
        marginBottom: 22,
      } as const,
      headerLeftSpacer: {} as const,
      headerCenter: {
        display: "flex",
        justifyContent: "center",
        gap: 12,
      } as const,
      headerRight: {
        display: "flex",
        justifyContent: "flex-end",
      } as const,

      btnBlueNav: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#1976d2",
        color: "#fff",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
      } as const,

      btnHelpGuide: (active: boolean) =>
        ({
          padding: "10px 14px",
          borderRadius: 12,
          border: active ? "0" : "1px solid #6a1b9a",
          backgroundColor: active ? "#6a1b9a" : "transparent",
          color: active ? "#fff" : "#6a1b9a",
          cursor: "pointer",
          fontSize: 15,
          whiteSpace: "nowrap",
        }) as const,
      btnHelpLibre: (active: boolean) =>
        ({
          padding: "10px 14px",
          borderRadius: 12,
          border: active ? "0" : "1px solid #ef6c00",
          backgroundColor: active ? "#ef6c00" : "transparent",
          color: active ? "#fff" : "#ef6c00",
          cursor: "pointer",
          fontSize: 15,
          whiteSpace: "nowrap",
        }) as const,

      title: { margin: "0 0 8px 0" } as const,
      intro: { margin: "0 0 18px 0", color: "#444" } as const,

      helpBox: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        background: "#fafafa",
        margin: "0 0 26px 0",
      } as const,

      sectionTitle: { margin: "0 0 12px 0" } as const,
      empty: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        color: "#444",
        background: "#fff",
      } as const,

      card: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      } as const,
      cardLeft: { minWidth: 260 } as const,
      problemName: { margin: 0, fontSize: 18, fontWeight: 600 } as const,
      statusLine: { marginTop: 6, color: "#555" } as const,
      statusPill: (s: ProblemStatus) =>
        ({
          display: "inline-block",
          marginLeft: 8,
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 13,
          border: "1px solid #ddd",
          color: statusColor(s),
          background: "#fff",
        }) as const,
      cardBtns: { display: "flex", gap: 10, alignItems: "center" } as const,

      btnPrimary: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#90caf9",
        color: "#0d47a1",
        cursor: "pointer",
        fontSize: 15,
        whiteSpace: "nowrap",
      } as const,
      btnSecondary: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #bbb",
        backgroundColor: "transparent",
        color: "#333",
        cursor: "pointer",
        fontSize: 15,
        whiteSpace: "nowrap",
      } as const,
      btnDanger: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #d32f2f",
        backgroundColor: "transparent",
        color: "#d32f2f",
        cursor: "pointer",
        fontSize: 15,
      } as const,

      editRow: { display: "flex", gap: 10, alignItems: "center" } as const,
      editInput: {
        width: 320,
        maxWidth: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
      } as const,

      createBox: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
      } as const,
      row: { display: "flex", gap: 12, alignItems: "center" } as const,
      input: {
        flex: 1,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
      } as const,
      btnCreate: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#1976d2",
        color: "#fff",
        cursor: "pointer",
        fontSize: 16,
      } as const,
    }),
    []
  );

  function persist(next: ProblemLite[]) {
    setProblems(next);
    localStorage.setItem(LS_PROBLEMS_KEY, JSON.stringify(next));
  }

  useEffect(() => {
    setReady(true);

    // Chargement + nettoyage : supprimer les entrées dont le nom est vide
    const stored = safeParse<ProblemLite[]>(localStorage.getItem(LS_PROBLEMS_KEY), []);
    const cleaned = stored.filter((p) => (p.nomCourt ?? "").trim().length > 0);

    // Si on a nettoyé, on persiste tout de suite pour ne plus revoir la ligne vide
    if (cleaned.length !== stored.length) {
      localStorage.setItem(LS_PROBLEMS_KEY, JSON.stringify(cleaned));
    }
    setProblems(cleaned);

    const storedMode = localStorage.getItem(LS_HELP_MODE_KEY) as HelpMode | null;
    if (storedMode === "guide" || storedMode === "libre") setHelpMode(storedMode);
  }, []);

  function toggleHelp(mode: HelpMode) {
    if (mode === helpMode) {
      setHelpOpen((v) => !v);
    } else {
      setHelpMode(mode);
      localStorage.setItem(LS_HELP_MODE_KEY, mode);
      setHelpOpen(true);
    }
  }

  function createProblem() {
    const name = newName.trim();
    if (!name) {
      alert("Veuillez saisir un nom court.");
      return;
    }

    const now = Date.now();
    const p: ProblemLite = {
      id: uid(),
      nomCourt: name,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      data: {
        definitionCourte: "",
        definitionLongue: "",
        nomStock: "",
        uniteStock: "",
        nomStockInitial: "",
        valeurStockInitiale: undefined,
        stockInitialMode: "commun",
        nomFluxEntree: "",
        statutFluxEntree: "variable",
        valeurFluxEntree: undefined,
        nomFluxSortie: "",
        statutFluxSortie: "variable",
        valeurFluxSortie: undefined,
        horizonValeur: 12,
        horizonUnite: "mois",
        objectifValeur: 0,
      },
    };

    const next = [p, ...problems];
    persist(next);
    setNewName("");
  }

  function removeProblem(id: string) {
    if (!confirm("Supprimer ce problème ?")) return;

    const next = problems.filter((p) => p.id !== id);
    persist(next);

    const current = safeParse<any>(localStorage.getItem(LS_CURRENT_PROBLEM_KEY), null);
    if (current?.id === id) localStorage.removeItem(LS_CURRENT_PROBLEM_KEY);
  }

  function openProblem(p: ProblemLite) {
    localStorage.setItem(LS_CURRENT_PROBLEM_KEY, JSON.stringify(p));
    window.location.href = PROBLEM_DEFINITION_PATH;
  }

  function startRename(p: ProblemLite) {
    setEditingId(p.id);
    setEditingValue(p.nomCourt);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingValue("");
  }

  function saveRename(p: ProblemLite) {
    const v = editingValue.trim();
    if (!v) {
      alert("Le nom ne peut pas être vide.");
      return;
    }
    const now = Date.now();
    const next = problems.map((x) =>
      x.id === p.id ? { ...x, nomCourt: v, updatedAt: now } : x
    );
    persist(next);
    cancelRename();
  }

  if (!ready) return null;

  return (
    <main style={styles.page}>
      {/* Header tout en haut : Aide au centre, nav à droite */}
      <div style={styles.header}>
        <div style={styles.headerLeftSpacer} />
        <div style={styles.headerCenter}>
          <button
            type="button"
            onClick={() => toggleHelp("guide")}
            style={styles.btnHelpGuide(helpMode === "guide" && helpOpen)}
            aria-pressed={helpMode === "guide" && helpOpen}
          >
            Aide guidée
          </button>

          <button
            type="button"
            onClick={() => toggleHelp("libre")}
            style={styles.btnHelpLibre(helpMode === "libre" && helpOpen)}
            aria-pressed={helpMode === "libre" && helpOpen}
          >
            Aide libre
          </button>
        </div>
        <div style={styles.headerRight}>
          <a href="/" style={styles.btnBlueNav}>
            ← Page précédente
          </a>
        </div>
      </div>

      <h1 style={styles.title}>Mes problèmes</h1>

<div>
  <p style={{ ...styles.intro, display: "block" }}>
    Ici, vous gérez vos problèmes : vous pouvez en créer un, le reprendre plus tard, ou en supprimer.
  </p>

  <p style={{ ...styles.intro, display: "block" }}>
    Cliquez sur l’aide guidée pour saisir l’exemple de démonstration,
    et sur l’aide libre pour saisir votre propre problème.
  </p>
</div>

{helpOpen && (
  <div style={styles.helpBox}>
          {helpMode === "guide" ? (
            <>
              <strong>Aide guidée</strong>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Cette aide vous accompagne pas à pas avec un exemple simple, pour apprendre la logique du site.
                Vous pourrez ensuite créer votre propre problème en reprenant la même structure.
              </p>
            </>
          ) : (
            <>
              <strong>Aide libre</strong>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Cette aide donne seulement les consignes générales. Elle convient si vous créez votre propre problème
                et souhaitez avancer sans guidage détaillé.
              </p>
            </>
          )}
        </div>
      )}

      <h2 style={styles.sectionTitle}>Liste des problèmes</h2>

      {problems.length === 0 ? (
        <div style={styles.empty}>Aucun problème pour l’instant.</div>
      ) : (
        <div>
          {problems.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardLeft}>
                {editingId === p.id ? (
                  <div style={styles.editRow}>
                    <input
                      style={styles.editInput}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                    />
                    <button type="button" style={styles.btnSecondary} onClick={() => saveRename(p)}>
                      Enregistrer
                    </button>
                    <button type="button" style={styles.btnSecondary} onClick={cancelRename}>
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={styles.problemName}>{p.nomCourt}</p>
                    <div style={styles.statusLine}>
                      Statut :
                      <span style={styles.statusPill(p.status)}>{statusLabel(p.status)}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={styles.cardBtns}>
                <button type="button" style={styles.btnPrimary} onClick={() => openProblem(p)}>
                  Démarrer l’analyse du problème
                </button>

                {/* Renommage : autorisé seulement en brouillon (draft) */}
                {p.status === "draft" && editingId !== p.id && (
                  <button type="button" style={styles.btnSecondary} onClick={() => startRename(p)}>
                    Renommer
                  </button>
                )}

                <button type="button" style={styles.btnDanger} onClick={() => removeProblem(p.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.createBox}>
        <h2 style={{ marginTop: 0 }}>Créer un nouveau problème</h2>
        <div style={styles.row}>
          <input
            style={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom court (ex. Trésorerie à 12 mois)"
          />
          <button type="button" style={styles.btnCreate} onClick={createProblem}>
            Créer
          </button>
        </div>
      </div>
    </main>
  );
}
