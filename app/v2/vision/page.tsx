// app/v2/vision/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type ProblemLite = {
  id: string;
  nomCourt: string;
  status: "draft" | "done";
  createdAt: number;
  updatedAt: number;
};

type VisionLite = {
  id: string;
  problemId: string;
  nomCourt: string;
  status: "draft" | "done";
  createdAt: number;
  updatedAt: number;
};

const LS_V2_PROBLEMS_KEY = "md_v2_problemes";
const LS_V2_CURRENT_PROBLEM_ID = "md_v2_current_problem_id";

const LS_V2_VISIONS_KEY = "md_v2_visions";
const LS_V2_CURRENT_VISION_ID = "md_v2_current_vision_id";

// Problème validé (cohérent avec /v2/probleme/page.tsx)
const problemKey = (problemId: string) => `md_v2_problem_${problemId}`;

// Vision validée
const visionDefKey = (problemId: string, visionId: string) =>
  `md_v2_vision_def_${problemId}_${visionId}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadProblems(): ProblemLite[] {
  return safeParse<ProblemLite[]>(localStorage.getItem(LS_V2_PROBLEMS_KEY), []);
}

function loadVisions(): VisionLite[] {
  return safeParse<VisionLite[]>(localStorage.getItem(LS_V2_VISIONS_KEY), []);
}

type StoredProblemValidated = {
  validatedText?: string;
  comment?: string | null;
  formal?: any;
  validatedAt?: string;
};

type StoredVisionValidated = {
  validatedText?: string;
  validatedSource?: "draft" | "reformulation";
  remarks?: string[];
  comment?: string;
  aiReformulation?: string | null;
  formal?: any;
  validatedAt?: string;
};

export default function V2VisionPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const problemIdFromUrl = sp.get("problemId") || "";
  const visionIdFromUrl = sp.get("visionId") || "";

  const [ready, setReady] = useState(false);

  const [problem, setProblem] = useState<ProblemLite | null>(null);
  const [vision, setVision] = useState<VisionLite | null>(null);

  // saisie non persistante
  const [draft, setDraft] = useState("");
  const [remarks, setRemarks] = useState<string[]>([]);
  const [reformulation, setReformulation] = useState("");
  const [acceptSource, setAcceptSource] = useState<"draft" | "reformulation">(
    "draft"
  );
  const [analysisDone, setAnalysisDone] = useState(false);
  const [comment, setComment] = useState("");

  // validé persistant
  const [validatedText, setValidatedText] = useState("");
  const [validatedAiReformulation, setValidatedAiReformulation] =
    useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      } as const,

      btnGreen: {
        padding: "8px 14px",
        borderRadius: 10,
        background: "#2e7d32",
        color: "#fff",
        textDecoration: "none",
        fontWeight: 700,
      } as const,

      btnGrey: {
        padding: "8px 14px",
        borderRadius: 10,
        background: "#9e9e9e",
        color: "#fff",
        border: 0,
        fontWeight: 700,
      } as const,

      btnBlue: {
        padding: "8px 14px",
        borderRadius: 10,
        background: "#1976d2",
        color: "#fff",
        border: 0,
        fontWeight: 700,
        cursor: "pointer",
      } as const,

      btnGhost: {
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid #ccc",
        background: "#fff",
        cursor: "pointer",
      } as const,

      textarea: {
        width: "100%",
        minHeight: 160,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #ccc",
      } as const,

      warn: {
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        background: "#fff7ed",
        border: "1px solid #fdba74",
        color: "#7c2d12",
      } as const,

      okBox: {
        marginTop: 18,
        padding: 16,
        borderRadius: 12,
        background: "#f0fdf4",
        border: "1px solid #86efac",
      } as const,
    }),
    []
  );

  function loadValidated(pid: string, vid: string) {
    const stored = safeParse<StoredVisionValidated>(
      localStorage.getItem(visionDefKey(pid, vid)),
      {}
    );

    setValidatedText((stored?.validatedText ?? "").trim());
    setValidatedAiReformulation(
      typeof stored?.aiReformulation === "string" ? stored.aiReformulation : null
    );
    setRemarks(Array.isArray(stored?.remarks) ? stored.remarks : []);
    setComment(typeof stored?.comment === "string" ? stored.comment : "");
  }

  function persistValidated(pid: string, vid: string, next: StoredVisionValidated) {
    localStorage.setItem(visionDefKey(pid, vid), JSON.stringify(next));
  }

  function getProblemValidatedText(pid: string) {
    const stored = safeParse<StoredProblemValidated>(
      localStorage.getItem(problemKey(pid)),
      {}
    );
    return (stored?.validatedText ?? "").trim();
  }

  useEffect(() => {
    // On verrouille le pid/vid
    const pid =
      problemIdFromUrl || localStorage.getItem(LS_V2_CURRENT_PROBLEM_ID) || "";
    const vid =
      visionIdFromUrl || localStorage.getItem(LS_V2_CURRENT_VISION_ID) || "";

    if (!pid || !vid) {
      setMsg("Il manque problemId/visionId.");
      setReady(true);
      return;
    }

    localStorage.setItem(LS_V2_CURRENT_PROBLEM_ID, pid);
    localStorage.setItem(LS_V2_CURRENT_VISION_ID, vid);

    setProblem(loadProblems().find((x) => x.id === pid) || { id: pid, nomCourt: "", status: "draft", createdAt: 0, updatedAt: 0 });
    setVision(loadVisions().find((x) => x.id === vid) || { id: vid, problemId: pid, nomCourt: "", status: "draft", createdAt: 0, updatedAt: 0 });

    loadValidated(pid, vid);

    setDraft("");
    setReformulation("");
    setAnalysisDone(false);

    setReady(true);
  }, [problemIdFromUrl, visionIdFromUrl]);

  const readOnly = validatedText.trim().length > 0;

  function goPrev() {
    const pid = problem?.id || problemIdFromUrl;
    if (!pid) return;
    router.push(`/v2/visions?problemId=${encodeURIComponent(pid)}`);
  }

  function goNext() {
    if (!problem || !vision) return;
    router.push(
      `/v2/vision/r1?problemId=${encodeURIComponent(problem.id)}&visionId=${encodeURIComponent(vision.id)}`
    );
  }

  async function analyzeWithAI() {
    if (!problem) return;

    const txt = draft.trim();
    if (!txt) {
      setMsg("Veuillez saisir une vision.");
      return;
    }

    // ✅ POINT CRITIQUE : on exige un problème validé
    const problemValidatedText = getProblemValidatedText(problem.id);
    if (!problemValidatedText) {
      setMsg(
        "Problème non trouvé ou non validé : revenez à la page PROBLÈME et validez un texte avant d’analyser la vision."
      );
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch("/api/v2/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "vision",
          draftText: txt,
          problem: { validatedText: problemValidatedText },
        }),
      });

      const data = await res.json();
      if (!data?.ok) {
        setMsg(data?.error || "Erreur IA");
        setRemarks(Array.isArray(data?.remarks) ? data.remarks : []);
        setBusy(false);
        return;
      }

      setRemarks(Array.isArray(data.remarks) ? data.remarks : []);
      setReformulation(typeof data.reformulation === "string" ? data.reformulation : "");
      setAcceptSource("reformulation");
      setAnalysisDone(true);

      setBusy(false);
    } catch (e: any) {
      setMsg(e?.message || "Erreur réseau IA");
      setBusy(false);
    }
  }

  function validate() {
    if (!problem || !vision) return;
    if (!analysisDone) return;

    // règle : on valide seulement si une reformulation existe
    if (!reformulation.trim()) return;

    const chosen =
      acceptSource === "reformulation" && reformulation.trim()
        ? reformulation
        : draft;

    const txt = chosen.trim();
    if (!txt) return;

    persistValidated(problem.id, vision.id, {
      validatedText: txt,
      aiReformulation:
        reformulation.trim() && reformulation.trim() !== txt.trim()
          ? reformulation.trim()
          : null,
      remarks,
      comment: comment.trim() || "",
      validatedAt: new Date().toISOString(),
    });

    loadValidated(problem.id, vision.id);

    setDraft("");
    setReformulation("");
    setAnalysisDone(false);
    setMsg(null);
  }

  if (!ready) return null;

  return (
    <main style={styles.page}>
      {/* Bandeau standard */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Link href="/" style={styles.btnGreen}>
          Accueil
        </Link>

        <button disabled style={styles.btnGrey}>
          Aide
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.btnGhost} onClick={goPrev}>
            ← Page précédente
          </button>
          <button style={styles.btnBlue} onClick={goNext}>
            Page suivante →
          </button>
        </div>
      </div>

      <h1>V2 — Définition de la vision</h1>

      {msg ? <div style={{ color: "#b00020", marginTop: 10 }}>{msg}</div> : null}

      {!readOnly ? (
        <>
          <textarea
            style={styles.textarea}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setRemarks([]);
              setReformulation("");
              setAnalysisDone(false);
            }}
            placeholder="Décrivez votre vision…"
          />

          <div style={{ marginTop: 12 }}>
            <button style={styles.btnBlue} onClick={analyzeWithAI} disabled={busy}>
              {busy ? "Analyse…" : "Demander reformulation IA"}
            </button>

            {analysisDone ? (
              <button
                style={{ ...styles.btnGhost, marginLeft: 10 }}
                onClick={analyzeWithAI}
              >
                Reformulation insuffisante → recommencer
              </button>
            ) : null}
          </div>

          {remarks.length > 0 ? (
            <div style={styles.warn}>
              <strong>Remarques</strong>
              <ul>
                {remarks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {analysisDone && reformulation ? (
            <div style={styles.okBox}>
              <strong>Reformulation proposée</strong>
              <div style={{ marginTop: 8 }}>{reformulation}</div>

              <div style={{ marginTop: 12 }}>
                <label>
                  <input
                    type="radio"
                    checked={acceptSource === "draft"}
                    onChange={() => setAcceptSource("draft")}
                  />{" "}
                  Valider mon texte
                </label>

                <br />

                <label>
                  <input
                    type="radio"
                    checked={acceptSource === "reformulation"}
                    onChange={() => setAcceptSource("reformulation")}
                  />{" "}
                  Valider la reformulation IA
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <button style={styles.btnBlue} onClick={validate}>
                  Valider la vision
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div style={styles.okBox}>
          <h2>Vision validée</h2>
          <div>{validatedText}</div>

          {validatedAiReformulation ? (
            <div style={{ marginTop: 10 }}>
              <strong>Reformulation IA :</strong>
              <div>{validatedAiReformulation}</div>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
