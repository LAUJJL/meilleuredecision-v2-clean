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

type SavedVisionPayload = {
  id: string;
  problemId: string;
  validatedText: string;
  validatedAt?: string;
  updatedAt: string;
};

const LS_V2_PROBLEMS_KEY = "md_v2_problemes";
const LS_V2_CURRENT_PROBLEM_ID = "md_v2_current_problem_id";

const LS_V2_VISIONS_KEY = "md_v2_visions";
const LS_V2_CURRENT_VISION_ID = "md_v2_current_vision_id";

const LS_V2_VISION_KEY = "md_v2_vision";

function safeJsonParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function statusLabel(p: VisionLite) {
  return p.status === "done" ? "Validée" : "Brouillon";
}

export default function VisionPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const visionId = sp.get("visionId") || "";
  const problemIdFromUrl = sp.get("problemId") || "";

  const [problems, setProblems] = useState<ProblemLite[]>([]);
  const [visions, setVisions] = useState<VisionLite[]>([]);

  const [nomCourt, setNomCourt] = useState("");
  const [draft, setDraft] = useState("");
  const [alreadyValidated, setAlreadyValidated] = useState(false);
  const [remarks, setRemarks] = useState<string[]>([]);

  const problemId = useMemo(() => {
    // 1) query param
    if (problemIdFromUrl) return problemIdFromUrl;
    // 2) stored current problem
    const stored = typeof window !== "undefined" ? localStorage.getItem(LS_V2_CURRENT_PROBLEM_ID) : null;
    return stored || "";
  }, [problemIdFromUrl]);

  const visionDefKey = useMemo(() => `${LS_V2_VISION_KEY}_${visionId}`, [visionId]);
  const visionsListKey = useMemo(() => LS_V2_VISIONS_KEY, []);
// Load problems + visions list
  useEffect(() => {
    const p = safeJsonParse<ProblemLite[]>(localStorage.getItem(LS_V2_PROBLEMS_KEY), []);
    setProblems(p);
  }, []);

  useEffect(() => {
    if (!problemId) return;
    const list = safeJsonParse<VisionLite[]>(localStorage.getItem(visionsListKey), []);
    setVisions(list);
  }, [visionsListKey, problemId]);

  // Load current vision
  useEffect(() => {
    if (!visionId) return;

    localStorage.setItem(LS_V2_CURRENT_VISION_ID, visionId);

    const list = safeJsonParse<VisionLite[]>(localStorage.getItem(visionsListKey), []);
    setVisions(list);

    const current = list.find((v) => v.id === visionId);
    if (current) setNomCourt(current.nomCourt);

    const saved = safeJsonParse<SavedVisionPayload | null>(localStorage.getItem(visionDefKey), null);
    if (saved?.validatedText) {
      setDraft(saved.validatedText);
      setAlreadyValidated(true);
    } else {
      setDraft("");
      setAlreadyValidated(false);
    }

    setRemarks([]);
  }, [visionId, visionDefKey, visionsListKey]);

  const currentProblem = useMemo(() => problems.find((p) => p.id === problemId) || null, [problems, problemId]);
  const currentVision = useMemo(() => visions.find((v) => v.id === visionId) || null, [visions, visionId]);

  function goPrev() {
    if (!problemId) return router.push("/v2/problemes");
    router.push(`/v2/visions?problemId=${encodeURIComponent(problemId)}`);
  }

  function goNext() {
    // R1 viendra ensuite (route à créer/adapter).
    if (!problemId || !visionId) return;
    router.push(`/v2/r1?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(visionId)}`);
  }

  function validateAndContinue() {
    setRemarks([]);

    const t = draft.trim();
    if (!t) {
      setRemarks(["Veuillez écrire un texte (vision) avant de valider."]);
      return;
    }

    const now = nowIso();

    // 1) Persist the validated vision text (definition)
    const payload: SavedVisionPayload = {
      id: visionId,
      problemId,
      validatedText: t,
      validatedAt: now,
      updatedAt: now,
    };
    localStorage.setItem(visionDefKey, JSON.stringify(payload));

    // 2) Mark vision as done in the list
    const list = safeJsonParse<VisionLite[]>(localStorage.getItem(visionsListKey), []);
    const updated = list.map((v) =>
      v.id === visionId ? { ...v, status: "done" as const, updatedAt: Date.now() } : v
    );
    localStorage.setItem(visionsListKey, JSON.stringify(updated));
    setVisions(updated);

    setAlreadyValidated(true);

    // 3) Continue
    goNext();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Header standard */}
      <div className="mb-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-green-700 px-8 py-4 text-xl font-semibold text-white hover:bg-green-800"
          >
            Accueil
          </Link>

          <button
            className="rounded-2xl bg-gray-400 px-8 py-4 text-xl font-semibold text-white hover:bg-gray-500"
            onClick={() => alert("Aide générale (à écrire).")}
          >
            Aide
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-2xl bg-slate-900 px-8 py-4 text-xl font-semibold text-white hover:bg-slate-800"
            onClick={goPrev}
            title="Revenir à la liste des visions"
          >
            ← Page précédente
          </button>

          <button
            className="rounded-2xl bg-blue-600 px-8 py-4 text-xl font-semibold text-white hover:bg-blue-700"
            onClick={goNext}
            title="Aller au raffinement R1"
          >
            Page suivante →
          </button>
        </div>
      </div>
<div style={{background:"#ff0", padding: 10}}>TEST JJ — VISIONS</div>

      <h1 className="mb-2 text-4xl font-bold">V2 — Définition de la vision</h1>
      {currentProblem ? (
        <p className="mb-6 text-gray-700">
          Problème : <span className="font-semibold">{currentProblem.nomCourt}</span>
        </p>
      ) : (
        <p className="mb-6 text-gray-500">Problème : (non trouvé)</p>
      )}

      <div className="rounded-2xl border p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-sm text-gray-600">Vision</div>
          <div className="text-2xl font-semibold">{nomCourt || "(sans nom)"}</div>
          <div className="mt-1 text-sm text-gray-600">
            Statut actuel : <span className="font-semibold">{currentVision ? statusLabel(currentVision) : "—"}</span>
          </div>
        </div>

        <p className="mb-4 text-gray-700">
          Décrivez librement votre vision (texte libre). Aucune formalisation ici ; la formalisation commence à R1.
        </p>

        <label className="mb-2 block text-lg font-semibold">Texte libre</label>
        <textarea
          className="h-64 w-full rounded-xl border p-4 text-lg"
          placeholder="Écrivez ici…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        {remarks.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="font-semibold">Remarques</div>
            <ul className="list-disc pl-5">
              {remarks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {!alreadyValidated && (
            <button
              className="rounded-xl border-2 border-slate-900 px-6 py-3 text-lg font-semibold hover:bg-slate-50"
              onClick={validateAndContinue}
            >
              Valider et continuer →
            </button>
          )}
          {alreadyValidated && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-green-800">
              Cette vision est déjà validée. Utilisez “Page suivante →” pour continuer.
            </div>
          )}
        </div>
      </div>

      {/* Répétition des boutons en bas pour pages longues */}
      <div className="mt-10 flex justify-end gap-3">
        <button
          className="rounded-2xl bg-slate-900 px-8 py-4 text-xl font-semibold text-white hover:bg-slate-800"
          onClick={goPrev}
        >
          ← Page précédente
        </button>
        <button
          className="rounded-2xl bg-blue-600 px-8 py-4 text-xl font-semibold text-white hover:bg-blue-700"
          onClick={goNext}
        >
          Page suivante →
        </button>
      </div>
    </main>
  );
}
