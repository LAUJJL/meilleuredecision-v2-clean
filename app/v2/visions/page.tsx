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

type ProblemItem = {
  id: string;
  nomCourt: string;
  texte?: string;
  status?: string;
  updatedAt?: string;
};

function uid(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

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

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const problemId = sp.get('problemId') ?? '';

  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<ProblemItem | null>(null);

  const [visions, setVisions] = useState<VisionItem[]>([]);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!problemId) return;
    setProblem(loadProblem(problemId));
    setVisions(loadVisions(problemId));
    setReady(true);
  }, [problemId]);

  const countLabel = useMemo(() => {
    const n = visions.length;
    return `${n} vision(s).`;
  }, [visions.length]);

  function goHome() {
    router.push('/');
  }

  function goPrev() {
    router.push(`/v2/probleme?problemId=${encodeURIComponent(problemId)}`);
  }

  function createVision() {
    setMsg(null);

    const nom = newName.trim();
    if (!nom) {
      setMsg('Entrez un nom court pour créer une vision.');
      return;
    }

    const now = new Date().toISOString();
    const item: VisionItem = {
      id: uid(),
      nomCourt: nom,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    const next = [item, ...visions];
    setVisions(next);
    saveVisions(problemId, next);
    setNewName('');
  }

  function openVision(visionId: string) {
    router.push(
      `/v2/vision?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(visionId)}`
    );
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
          onClick={() => alert('Aide : page liste / création des visions.')}
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
          {/* Pas de Page suivante ici : la suite se fait via "Ouvrir" */}
        </div>
      </div>

      <div style={{ marginTop: 34 }}>
        <div style={{ fontSize: 22, opacity: 0.85 }}>V2 — Visions</div>

        <h2 style={{ marginTop: 28, fontSize: 28 }}>Liste des visions</h2>
        <div style={{ marginTop: 6, fontSize: 22 }}>{countLabel}</div>

        <div style={{ marginTop: 10, fontSize: 16, opacity: 0.8 }}>
          Problème : <strong>{problem?.nomCourt ?? '(problème inconnu)'}</strong>
        </div>

        {msg ? <div style={{ marginTop: 14, color: '#b00020', fontSize: 18 }}>{msg}</div> : null}

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 18 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom court de la nouvelle vision"
            style={{
              flex: 1,
              fontSize: 22,
              padding: '16px 18px',
              borderRadius: 16,
              border: '1px solid #cbd5e1',
            }}
          />
          <button
            onClick={createVision}
            style={{
              background: '#1a73e8',
              color: 'white',
              padding: '16px 26px',
              borderRadius: 16,
              border: 'none',
              fontSize: 24,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Créer
          </button>
        </div>

        <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
          {visions.map((v) => (
            <div
              key={v.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 18,
                padding: 22,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{v.nomCourt}</div>
                <div style={{ marginTop: 6, fontSize: 18, opacity: 0.85 }}>
                  {v.status === 'done' ? 'Validé' : 'Brouillon'}
                </div>
              </div>

              <button
                onClick={() => openVision(v.id)}
                style={{
                  background: '#1a73e8',
                  color: 'white',
                  padding: '16px 26px',
                  borderRadius: 18,
                  border: 'none',
                  fontSize: 24,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Ouvrir →
              </button>
            </div>
          ))}
        </div>

        {/* Navigation bas de page */}
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
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
        </div>
      </div>
    </main>
  );
}
