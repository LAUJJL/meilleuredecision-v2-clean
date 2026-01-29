// app/v2/visions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type VisionLite = {
  id: string;
  problemId: string;
  nomCourt: string;
  createdAt: number;
};

const LS_V2_VISIONS_KEY = "md_v2_visions";
const LS_V2_CURRENT_VISION_ID = "md_v2_current_vision_id";

function safeParse(raw: string | null) {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export default function V2VisionsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const problemId = sp.get("problemId") || "";

  const [ready, setReady] = useState(false);
  const [visions, setVisions] = useState<VisionLite[]>([]);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // Chargement
  useEffect(() => {
    if (!problemId) {
      setMsg("Aucun problème sélectionné.");
      setReady(true);
      return;
    }

    const all = safeParse(localStorage.getItem(LS_V2_VISIONS_KEY)) as VisionLite[];
    const list = all.filter((v) => v.problemId === problemId);
    setVisions(list);

    setReady(true);
  }, [problemId]);

  // Création
  function createVision() {
    setMsg(null);

    const nom = newName.trim();
    if (!nom) {
      setMsg("Veuillez saisir un nom court.");
      return;
    }

    const v: VisionLite = {
      id: uid(),
      problemId,
      nomCourt: nom,
      createdAt: Date.now(),
    };

    const all = safeParse(localStorage.getItem(LS_V2_VISIONS_KEY)) as VisionLite[];
    const nextAll = [v, ...all];

    localStorage.setItem(LS_V2_VISIONS_KEY, JSON.stringify(nextAll));
    localStorage.setItem(LS_V2_CURRENT_VISION_ID, v.id);

    setVisions([v, ...visions]);
    setNewName("");
  }

  // Ouvrir
  function openVision(id: string) {
    localStorage.setItem(LS_V2_CURRENT_VISION_ID, id);
    router.push(`/v2/vision?problemId=${encodeURIComponent(problemId)}&visionId=${encodeURIComponent(id)}`);
  }

  // Navigation
  function goPrev() {
    router.push(`/v2/probleme?problemId=${encodeURIComponent(problemId)}`);
  }

  function goNext() {
    if (visions.length === 0) {
      setMsg("Créez d’abord une vision.");
      return;
    }
    openVision(visions[0].id);
  }

  if (!ready) return null;

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 40 }}>
      {/* Bandeau standard */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Link
          href="/"
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            background: "#2e7d32",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Accueil
        </Link>

        <button
          disabled
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            background: "#9e9e9e",
            color: "#fff",
            border: 0,
            fontWeight: 700,
          }}
        >
          Aide
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={goPrev}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "#424242",
              color: "#fff",
              border: 0,
              fontWeight: 700,
            }}
          >
            ← Page précédente
          </button>

          <button
            onClick={goNext}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "#1976d2",
              color: "#fff",
              border: 0,
              fontWeight: 700,
            }}
          >
            Page suivante →
          </button>
        </div>
      </div>

      <h1>V2 — Visions</h1>

      {msg ? <div style={{ color: "#b00020", marginTop: 10 }}>{msg}</div> : null}

      {/* Liste */}
      <section style={{ marginTop: 20 }}>
        <h2>Liste des visions</h2>

        {visions.length === 0 ? (
          <p>Aucune vision pour l’instant.</p>
        ) : (
          <ul>
            {visions.map((v) => (
              <li key={v.id} style={{ marginTop: 10 }}>
                <button
                  onClick={() => openVision(v.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  {v.nomCourt} →
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Création */}
        <div style={{ marginTop: 20 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom court de la nouvelle vision"
            style={{
              padding: "10px",
              width: "70%",
              borderRadius: 10,
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={createVision}
            style={{
              marginLeft: 10,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#1976d2",
              color: "#fff",
              border: 0,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Créer
          </button>
        </div>
      </section>
    </main>
  );
}
