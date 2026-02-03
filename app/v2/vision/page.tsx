'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type VisionStatus = 'draft' | 'done';

type VisionItem = {
  id: string;
  nomCourt: string;
  status: VisionStatus;
  createdAt: string;
  updatedAt: string;
};

type VisionDoc = {
  id: string;
  texte: string;
  status: VisionStatus;
  validatedAt?: string;
  updatedAt: string;
};

type ProblemItem = {
  id: string;
  nomCourt: string;
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function loadProblem(problemId: string): ProblemItem | null {
  return safeJsonParse<ProblemItem>(localStorage.getItem(`md_v2_problem_${problemId}`));
}

function loadVisions(problemId: string): VisionItem[] {
  return safeJsonParse<VisionItem[]>(localStorage.getItem(`md_v2_visions_${problemId}`)) ?? [];
}

function saveVisions(problemId: string, visions: VisionItem[]) {
  localStorage.setItem(`md_v2_visions_${problemId}`, JSON.stringify(visions));
}

function loadVisionDoc(problemId: string, visionId: string): VisionDoc | null {
  return safeJsonParse<VisionDoc>(localStorage.getItem(`md_v2_vision_${problemId}_${visionId}`));
}

function saveVisionDoc(problemId: string, visionId: string, doc: VisionDoc) {
  localStorage.setItem(`md_v2_vision_${problemId}_${visionId}`, JSON.stringify(doc));
}

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const problemId = sp.get('problemId') ?? '';
  const visionId = sp.get('visionId') ?? '';

  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<ProblemItem | null>(null);
  const [visionMeta, setVisionMeta] = useState<VisionItem | null>(null);

  const [texte, setTexte] = useState('');
  const [status, setStatus] = useState<VisionStatus>('draft');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!problemId || !visionId) return;

    setProblem(loadProblem(problemId));

    const all = loadVisions(problemId);
    const meta = all.find((v) => v.id === visionId) ?? null;
    setVisionMeta(meta);

    const doc = loadVisionDoc(problemId, visionId);
    if (doc) {
      setTexte(doc.texte ?? '');
      setStatus(doc.status ?? 'draft');
    } else {
      setTexte('');
      setStatus(meta?.status ?? 'draft');
    }

    setReady(true);
  }, [problemId, visionId]);

  const visionName = useMemo(() => visionMeta?.nomCourt ?? '(sans nom)', [visionMeta]);

  function goHome() {
    router.push('/');
  }

  function goPrev() {
    router.push(`/v2/visions?problemId=${encodeURIComponent(problemId)}`);
  }

  function goNext() {
    alert("La suite (R1) n'est pas encore implémentée.");
  }

  function validate() {
    setMsg(null);

    const t = texte.trim();
    if (!t) {
      setMsg('Écrivez un texte libre (même court) avant de valider.');
      return;
    }

    const now = new Date().toISOString();

    const nextDoc: VisionDoc = {
      id: visionId,
      texte: t,
      status: 'done',
      validatedAt: now,
      updatedAt: now,
    };
    saveVisionDoc(problemId, visionId, nextDoc);
    setStatus('done');

    // mise à jour de la liste des visions
    const all = loadVisions(problemId);
    const nextAll = all.map((v) => (v.id === visionId ? { ...v, status: 'done', updatedAt: now } : v));
    saveVisions(problemId, nextAll);

    setMsg('Vision validée.');
  }

  if (!ready) return null;

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 40 }}>
      {/* Bandeau standard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <button
          onClick={goHome}
          style={{
            background: '#137333',
            color: 'white',
            padding: '18px 28px',
            borderRadius: 18,
            border: 'none',
            fontSize: 22,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Accueil
        </button>

        <button
          onClick={() => alert('Aide : écrivez votre vision librement. Formalisation à R1.')}
          style={{
            background: '#9aa0a6',
            color: 'white',
            padding: '18px 28px',
            borderRadius: 18,
            border: 'none',
            fontSize: 22,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Aide
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
          <button
            onClick={goPrev}
            style={{
              background: '#111827',
              color: 'white',
              padding: '18px 26px',
              borderRadius: 18,
              border: 'none',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Page précédente
          </button>
          <button
            onClick={goNext}
            style={{
              background: '#1a73e8',
              color: 'white',
              padding: '18px 26px',
              borderRadius: 18,
              border: 'none',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Page suivante →
          </button>
        </div>
      </div>

      <div style={{ marginTop: 34 }}>
        <h1 style={{ fontSize: 54, margin: 0 }}>V2 — Définition de la vision</h1>
        <div style={{ marginTop: 8, fontSize: 18 }}>
          Problème : <strong>{problem?.nomCourt ?? '(problème inconnu)'}</strong>
        </div>

        <div
          style={{
            marginTop: 18,
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            padding: 22,
          }}
        >
          <div style={{ fontSize: 16, opacity: 0.75 }}>Vision</div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>{visionName}</div>
          <div style={{ marginTop: 8, fontSize: 18, opacity: 0.85 }}>
            Statut actuel : <strong>{status === 'done' ? 'validé' : 'brouillon'}</strong>
          </div>

          <div style={{ marginTop: 18, fontSize: 18, lineHeight: 1.35 }}>
            Décrivez librement votre vision (texte libre). Aucune formalisation ici ; la formalisation commence à R1.
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Texte libre</div>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Écrivez ici..."
              style={{
                marginTop: 10,
                width: '100%',
                minHeight: 220,
                fontSize: 20,
                padding: 16,
                borderRadius: 16,
                border: '1px solid #111827',
              }}
            />
          </div>

          {msg ? (
            <div style={{ marginTop: 14, color: msg === 'Vision validée.' ? '#0b5' : '#b00020', fontSize: 18 }}>
              {msg}
            </div>
          ) : null}

          {status !== 'done' ? (
            <div style={{ marginTop: 18 }}>
              <button
                onClick={validate}
                style={{
                  background: '#111827',
                  color: 'white',
                  padding: '16px 22px',
                  borderRadius: 16,
                  border: 'none',
                  fontSize: 20,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Valider
              </button>
            </div>
          ) : null}
        </div>

        {/* Navigation bas de page */}
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <button
            onClick={goPrev}
            style={{
              background: '#111827',
              color: 'white',
              padding: '18px 26px',
              borderRadius: 18,
              border: 'none',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← Page précédente
          </button>
          <button
            onClick={goNext}
            style={{
              background: '#1a73e8',
              color: 'white',
              padding: '18px 26px',
              borderRadius: 18,
              border: 'none',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Page suivante →
          </button>
        </div>
      </div>
    </main>
  );
}
