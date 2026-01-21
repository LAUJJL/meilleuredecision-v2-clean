// app/choisir-vision/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type HelpMode = "guide" | "libre";
type VisionStatus = "draft" | "in_progress" | "done";
type ProblemStatus = "draft" | "in_progress" | "done";

type VisionLite = {
  id: string;
  nomCourt: string;
  status: VisionStatus;
  createdAt: number;
  updatedAt: number;
  data?: any;
};

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
const LS_CURRENT_VISION_KEY = "md_current_vision";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export default function ChoisirVisionPage() {
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<ProblemLite | null>(null);

  const [helpMode, setHelpMode] = useState<HelpMode>("libre");
  const [helpOpen, setHelpOpen] = useState(false);

  const [newVisionName, setNewVisionName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const visions: VisionLite[] = useMemo(() => {
    const d = problem?.data ?? {};
    const v = Array.isArray(d.visions) ? d.visions : [];
    return v
      .map((x: any) => ({
        id: typeof x?.id === "string" ? x.id : uid(),
        nomCourt: typeof x?.nomCourt === "string" ? x.nomCourt : "",
        status:
          x?.status === "draft" || x?.status === "in_progress" || x?.status === "done" ? x.status : "draft",
        createdAt: typeof x?.createdAt === "number" ? x.createdAt : Date.now(),
        updatedAt: typeof x?.updatedAt === "number" ? x.updatedAt : Date.now(),
        data: x?.data ?? {},
      }))
      .sort((a: VisionLite, b: VisionLite) => b.updatedAt - a.updatedAt);
  }, [problem]);

  const isProblemLocked = useMemo(() => {
    const d = problem?.data ?? {};
    return Boolean(d?.isLocked || d?.lockedAt || d?.lockedFromVisionId);
  }, [problem]);

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.45,
      } as const,

      header: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 16,
        marginBottom: 18,
      } as const,
      headerLeft: { display: "flex", justifyContent: "flex-start", gap: 12 } as const,
      headerCenter: { display: "flex", justifyContent: "center", gap: 12 } as const,
      headerRight: { display: "flex", justifyContent: "flex-end", gap: 12 } as const,

      btnGreenNav: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#2e7d32",
        color: "#fff",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
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

      // Aide : ni vert ni bleu
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

      title: { margin: "0 0 10px 0" } as const,
      subtitle: { margin: "0 0 18px 0", color: "#444" } as const,

      badgeLock: {
        display: "inline-block",
        marginLeft: 10,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        border: "1px solid #ddd",
        color: "#444",
        background: "#f7f7f7",
        verticalAlign: "middle",
      } as const,

      helpBox: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        background: "#fafafa",
        margin: "0 0 18px 0",
      } as const,

      section: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
      } as const,

      empty: { color: "#666", marginTop: 10 } as const,

      list: { display: "flex", flexDirection: "column", gap: 10, marginTop: 12 } as const,

      row: {
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 12,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
      } as const,

      rowTitle: { fontWeight: 700 } as const,
      rowMeta: { color: "#666", fontSize: 14, marginTop: 4 } as const,

      rowActions: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      } as const,

      btnPrimary: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#1976d2",
        color: "#fff",
        cursor: "pointer",
        fontSize: 14,
        whiteSpace: "nowrap",
      } as const,

      btnDanger: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #d32f2f",
        backgroundColor: "transparent",
        color: "#d32f2f",
        cursor: "pointer",
        fontSize: 14,
        whiteSpace: "nowrap",
      } as const,

      btnDisabled: { opacity: 0.45, cursor: "not-allowed" } as const,

      createBox: {
        marginTop: 18,
        borderTop: "1px solid #eee",
        paddingTop: 16,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      } as const,

      input: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
        minWidth: 280,
      } as const,

      msg: { marginTop: 12, color: "#2e7d32", fontWeight: 600 } as const,
    }),
    []
  );

  function openHelp(mode: HelpMode) {
    if (helpOpen && helpMode === mode) {
      setHelpOpen(false);
      return;
    }
    setHelpMode(mode);
    localStorage.setItem(LS_HELP_MODE_KEY, mode);
    setHelpOpen(true);
  }

  function persistProblem(next: ProblemLite) {
    localStorage.setItem(LS_CURRENT_PROBLEM_KEY, JSON.stringify(next));

    const list = safeParse<ProblemLite[]>(localStorage.getItem(LS_PROBLEMS_KEY), []);
    const now = Date.now();
    const updated = list.map((x) =>
      x.id === next.id ? { ...x, nomCourt: next.nomCourt, status: next.status, updatedAt: now, data: next.data } : x
    );
    const exists = updated.some((x) => x.id === next.id);
    const finalList = exists ? updated : [{ ...next, updatedAt: now }, ...updated];
    localStorage.setItem(LS_PROBLEMS_KEY, JSON.stringify(finalList));
  }

  function setVisions(nextVisions: VisionLite[]) {
    setMsg(null);
    setProblem((prev) => {
      if (!prev) return prev;
      const next: ProblemLite = {
        ...prev,
        updatedAt: Date.now(),
        data: { ...(prev.data ?? {}), visions: nextVisions },
      };
      persistProblem(next);
      return next;
    });
  }

  function createVision() {
    const name = newVisionName.trim();
    if (!name) {
      setMsg("Veuillez donner un nom court à la vision.");
      return;
    }

    const now = Date.now();
    const v: VisionLite = {
      id: uid(),
      nomCourt: name,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      data: {},
    };

    setVisions([v, ...visions]);
    setNewVisionName("");
    setMsg("Vision créée");
  }

  function deleteVision(id: string) {
    const target = visions.find((x) => x.id === id);
    if (target && target.status !== "draft") {
      setMsg("Immutabilité V1 : une vision engagée (ou terminée) n’est pas supprimable.");
      return;
    }
    setVisions(visions.filter((v) => v.id !== id));
    setMsg("Vision supprimée");
  }

  function lockProblemIfNeeded(lockedFromVisionId: string) {
    setProblem((prev) => {
      if (!prev) return prev;
      const d = prev.data ?? {};
      const alreadyLocked = Boolean(d.isLocked || d.lockedAt || d.lockedFromVisionId);
      if (alreadyLocked) return prev;

      const now = Date.now();
      const next: ProblemLite = {
        ...prev,
        status: prev.status === "draft" ? "in_progress" : prev.status,
        updatedAt: now,
        data: { ...d, isLocked: true, lockedAt: now, lockedFromVisionId },
      };
      persistProblem(next);
      return next;
    });
  }

  function startVision(v: VisionLite) {
    // 1) Verrouillage V1 : dès qu'une vision est engagée
    lockProblemIfNeeded(v.id);

    // 2) Stocker la vision courante (utile pour afficher le nom ailleurs si besoin)
    const now = Date.now();
    const storedVision: VisionLite = {
      ...v,
      status: v.status === "done" ? "done" : "in_progress",
      updatedAt: now,
      data: { ...(v.data ?? {}) },
    };
    localStorage.setItem(LS_CURRENT_VISION_KEY, JSON.stringify(storedVision));

    // 3) Ouvrir la page de définition de la vision (sans “types 1/2/3”)
    window.location.href = `/vision`;
  }

  useEffect(() => {
    setReady(true);

    const stored = safeParse<ProblemLite | null>(localStorage.getItem(LS_CURRENT_PROBLEM_KEY), null);
    if (!stored || !stored.id) {
      window.location.href = "/problemes";
      return;
    }
    setProblem(stored);

    const storedMode = localStorage.getItem(LS_HELP_MODE_KEY) as HelpMode | null;
    if (storedMode === "guide" || storedMode === "libre") setHelpMode(storedMode);
  }, []);

  if (!ready || !problem) return null;

  const statusLabel =
    problem.status === "draft" ? "Brouillon" : problem.status === "in_progress" ? "En cours" : "Terminé";

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="/" style={styles.btnGreenNav}>
            ← Retour à l’accueil
          </a>
        </div>

        <div style={styles.headerCenter}>
          <button
            type="button"
            onClick={() => openHelp("guide")}
            style={styles.btnHelpGuide(helpOpen && helpMode === "guide")}
            aria-pressed={helpOpen && helpMode === "guide"}
          >
            Aide guidée
          </button>
          <button
            type="button"
            onClick={() => openHelp("libre")}
            style={styles.btnHelpLibre(helpOpen && helpMode === "libre")}
            aria-pressed={helpOpen && helpMode === "libre"}
          >
            Aide libre
          </button>
        </div>

        <div style={styles.headerRight}>
          <a href="/probleme" style={styles.btnBlueNav}>
            ← Page précédente
          </a>
        </div>
      </div>

      <h1 style={styles.title}>Visions</h1>
      <p style={styles.subtitle}>
        Problème courant : <b>{problem.nomCourt || "(sans nom)"}</b> —{" "}
        <span style={{ color: "#666" }}>{statusLabel}</span>
        {isProblemLocked && <span style={styles.badgeLock}>Verrouillé (vision engagée)</span>}
      </p>

      {helpOpen && (
        <div style={styles.helpBox}>
          {helpMode === "guide" ? (
            <>
              <strong>Aide guidée</strong>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Créez une vision (nom court). Ensuite cliquez “Démarrer l’analyse” → vous irez vers Vision, puis R1 puis R2.
              </p>
            </>
          ) : (
            <>
              <strong>Aide libre</strong>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Une vision est un angle d’analyse. En V1, dès qu’une vision est engagée, le problème devient immuable.
              </p>
            </>
          )}
        </div>
      )}

      <div style={styles.section}>
        <div style={{ fontWeight: 700 }}>Liste des visions</div>

        {visions.length === 0 ? (
          <div style={styles.empty}>Aucune vision pour l’instant.</div>
        ) : (
          <div style={styles.list}>
            {visions.map((v) => {
              const s = v.status === "draft" ? "Brouillon" : v.status === "in_progress" ? "En cours" : "Terminé";
              const canDelete = v.status === "draft";

              return (
                <div key={v.id} style={styles.row}>
                  <div>
                    <div style={styles.rowTitle}>{v.nomCourt || "(sans nom)"}</div>
                    <div style={styles.rowMeta}>{s}</div>
                  </div>

                  <div style={styles.rowActions}>
                    <button type="button" style={styles.btnPrimary} onClick={() => startVision(v)}>
                      Démarrer l’analyse →
                    </button>

                    <button
                      type="button"
                      style={{ ...styles.btnDanger, ...(canDelete ? {} : styles.btnDisabled) }}
                      onClick={() => deleteVision(v.id)}
                      disabled={!canDelete}
                      title={
                        canDelete
                          ? "Supprimer la vision (brouillon)"
                          : "Immutabilité : une vision engagée (ou terminée) n’est pas supprimable en V1"
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.createBox}>
          <input
            style={styles.input}
            value={newVisionName}
            onChange={(e) => setNewVisionName(e.target.value)}
            placeholder="Nom court de la nouvelle vision"
          />
          <button type="button" style={styles.btnPrimary} onClick={createVision}>
            Créer une vision
          </button>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}
      </div>
    </main>
  );
}
