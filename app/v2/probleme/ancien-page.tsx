"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * V2 — Problème (V1 simplifiée)
 * - Texte libre uniquement (pas de mini-formulaire ici)
 * - Aucun autosave : quitter la page (Page suivante / Accueil / etc.) ne sauvegarde rien
 * - 1 action explicite :
 *    - Valider : sauvegarde, status=done
 * - Header commun (comme /v2/visions) : Accueil / Aide / Page précédente / Page suivante
 */

// Liste des problèmes (pour /v2/problemes)
const LS_V2_PROBLEMS_KEY = "md_v2_problemes";
// Détails d'un problème
const problemKey = (id: string) => `md_v2_problem_${id}`;

type ProblemLite = {
  id: string;
  nomCourt: string;
  status?: "draft" | "done";
  createdAt?: number;
  updatedAt?: number;
};

type SavedProblemPayload = {
  id: string;
  nomCourt: string;
  texte: string;
  commentaire: string | null;
  status: "draft" | "done";
  validatedAt?: string; // ISO
  updatedAt: number; // ms
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadProblemsLite(): ProblemLite[] {
  if (typeof window === "undefined") return [];
  return safeParse<ProblemLite[]>(localStorage.getItem(LS_V2_PROBLEMS_KEY), []);
}

function saveProblemsLite(next: ProblemLite[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_V2_PROBLEMS_KEY, JSON.stringify(next));
}

export default function V2ProblemePage() {
  const router = useRouter();
  const sp = useSearchParams();

  const problemId = useMemo(() => sp.get("problemId") || "", [sp]);

  const [busy, setBusy] = useState(false);
  const [remarks, setRemarks] = useState<string[]>([]);

  const [nomCourt, setNomCourt] = useState("");
  const [texte, setTexte] = useState("");
  const [commentaire, setCommentaire] = useState<string>("");

  const [status, setStatus] = useState<"draft" | "done">("draft");

  // Chargement initial depuis localStorage
  useEffect(() => {
    if (!problemId) {
      setRemarks(["Aucun problemId dans l'URL. Retournez à la liste des problèmes."]);
      return;
    }

    // Charger détails si existants
    const saved = safeParse<SavedProblemPayload | null>(
      localStorage.getItem(problemKey(problemId)),
      null
    );
    if (saved) {
      setNomCourt(saved.nomCourt || "");
      setTexte(saved.texte || "");
      setCommentaire(saved.commentaire || "");
      setStatus(saved.status || "draft");
      return;
    }

    // Sinon, essayer de pré-remplir le nomCourt depuis la liste
    const list = loadProblemsLite();
    const found = list.find((p) => p.id === problemId);
    if (found) {
      setNomCourt(found.nomCourt || "");
      setStatus((found.status as any) || "draft");
    }
  }, [problemId]);

  function goHome() {
    router.push("/");
  }

  function goProblemsList() {
    router.push("/v2/problemes");
  }

  function goNextNoSave() {
    // IMPORTANT : aucune sauvegarde ici (principe minimaliste)
    router.push(`/v2/visions?problemId=${encodeURIComponent(problemId)}`);
  }

  async function saveAs(nextStatus: "draft" | "done") {
    setRemarks([]);
    if (!problemId) {
      setRemarks(["Impossible d'enregistrer : problemId manquant dans l'URL."]);
      return;
    }

    const nc = nomCourt.trim();
    const t = texte.trim();

    if (!nc) {
      setRemarks(["Veuillez saisir un nom court (pour la liste)."]);
      return;
    }
    if (!t) {
      setRemarks(["Veuillez saisir un texte libre (votre description)."]);
      return;
    }

    setBusy(true);
    try {
      const now = Date.now();
      const payload: SavedProblemPayload = {
        id: problemId,
        nomCourt: nc,
        texte: t,
        commentaire: commentaire.trim() ? commentaire.trim() : null,
        status: nextStatus,
        validatedAt: nextStatus === "done" ? new Date().toISOString() : undefined,
        updatedAt: now,
      };

      // 1) sauvegarder le détail
      localStorage.setItem(problemKey(problemId), JSON.stringify(payload));

      // 2) mettre à jour la liste
      const list = loadProblemsLite();
      const idx = list.findIndex((p) => p.id === problemId);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          nomCourt: nc,
          status: nextStatus,
          updatedAt: now,
        };
      } else {
        list.unshift({
          id: problemId,
          nomCourt: nc,
          status: nextStatus,
          createdAt: now,
          updatedAt: now,
        });
      }
      saveProblemsLite(list);

      setStatus(nextStatus);

      // 3) si validation : aller aux visions (explicite)
      if (nextStatus === "done") {
        router.push(`/v2/visions?problemId=${encodeURIComponent(problemId)}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header (copie du style /v2/visions : 3 zones) */}
      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goHome}
            className="rounded-xl bg-green-700 px-6 py-3 text-white font-semibold hover:bg-green-800"
          >
            Accueil
          </button>

          <button
            type="button"
            onClick={() => alert("Aide (générale) — à définir plus tard.")}
            className="rounded-xl bg-gray-300 px-6 py-3 text-gray-900 font-semibold hover:bg-gray-400"
          >
            Aide
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goProblemsList}
              className="rounded-xl bg-gray-800 px-6 py-3 text-white font-semibold hover:bg-gray-900"
              title="Retour à la liste des problèmes"
            >
              ← Page précédente
            </button>

            <button
              type="button"
              onClick={goNextNoSave}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
              title="Aller aux visions (sans sauvegarder)"
            >
              Page suivante →
            </button>
          </div>
        </div>

        {/* Titre */}
        <div className="mt-10">
          <h1 className="text-3xl font-semibold">Problème</h1>
          <p className="mt-2 text-gray-700">Décrivez librement votre situation actuelle.</p>
        </div>

        {/* Form */}
        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-lg font-semibold">Nom court (pour la liste)</label>
            <input
              value={nomCourt}
              onChange={(e) => setNomCourt(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg"
              placeholder="Ex : salarié qui veut doubler son salaire"
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-lg font-semibold">Texte libre</label>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              className="mt-2 w-full min-h-[260px] rounded-lg border border-gray-300 px-4 py-3 text-lg"
              placeholder="Écrivez ici..."
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-lg font-semibold">Commentaire (optionnel)</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="mt-2 w-full min-h-[140px] rounded-lg border border-gray-300 px-4 py-3 text-lg"
              placeholder="Commentaire (facultatif)..."
              disabled={busy}
            />
          </div>

          {/* Actions explicites */}
          {status !== "done" && (
<div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={() => saveAs("done")}
              disabled={busy}
              className="rounded-xl border border-gray-700 px-6 py-3 text-lg font-semibold hover:bg-gray-50 disabled:opacity-60"
              title="Valider (figer) et enregistrer, puis continuer vers les visions"
            >
              Valider et continuer →
            </button>
          </div>
          )}


          <div className="text-gray-700">
            Statut actuel : <span className="font-semibold">{status === "done" ? "validé" : "brouillon"}</span>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-xl bg-neutral-800 px-5 py-3 text-white hover:bg-neutral-700"
              onClick={goProblemsList}
            >
              ← Page précédente
            </button>
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-500"
              onClick={goNextNoSave}
            >
              Page suivante →
            </button>
          </div>

</div>

          {remarks.length > 0 && (
            <div className="rounded-xl border border-orange-300 bg-orange-50 p-4">
              <div className="font-semibold text-orange-900">Remarques</div>
              <ul className="mt-2 list-disc pl-6 text-orange-900">
                {remarks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pb-16" />
        </div>
      </div>
    </div>
  );
}
