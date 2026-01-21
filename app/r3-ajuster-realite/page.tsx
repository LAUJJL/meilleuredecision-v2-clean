// app/r3-ajuster-realite/page.tsx
"use client";

import { useEffect, useState } from "react";

const K = {
  nomEntree: "md.nomEntree",
  nomSortie: "md.nomSortie",
  entree: "md.entree",
  sortie: "md.sortie",
};

function getLS(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  return v ?? fallback;
}

function setLS(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export default function R3AjusterRealitePage() {
  const [nomEntree, setNomEntree] = useState("");
  const [nomSortie, setNomSortie] = useState("");

  const [entree, setEntree] = useState("");
  const [sortie, setSortie] = useState("");

  useEffect(() => {
    setNomEntree(getLS(K.nomEntree));
    setNomSortie(getLS(K.nomSortie));
    setEntree(getLS(K.entree));
    setSortie(getLS(K.sortie));
  }, []);

  // sauvegarde “live”
  useEffect(() => setLS(K.entree, entree), [entree]);
  useEffect(() => setLS(K.sortie, sortie), [sortie]);

  const labelEntree = nomEntree?.trim() ? `Facteur d’entrée (${nomEntree.trim()})` : "Facteur d’entrée";
  const labelSortie = nomSortie?.trim() ? `Facteur de sortie (${nomSortie.trim()})` : "Facteur de sortie";

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.45,
      }}
    >
      {/* Navigation haut */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Gauche (vert) */}
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              backgroundColor: "#2e7d32",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Retour à l’accueil
          </a>

          <a
            href="/choisir-vision"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              backgroundColor: "#2e7d32",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Retour à la liste des visions
          </a>
        </div>

        {/* Droite (bleu) */}
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/r2-objectif"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              backgroundColor: "#1976d2",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Revenir à la page précédente
          </a>
        </div>
      </div>

      <h1 style={{ marginTop: 0 }}>R3 — Ajuster la réalité</h1>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ margin: 0 }}>
          Vous avez fixé l’objectif en R2. Ici, vous ajustez la réalité : les valeurs des facteurs d’entrée et de
          sortie.
        </p>
      </section>

      {/* Entrée */}
      <section style={{ marginTop: 24 }}>
        <h2>1. {labelEntree}</h2>

        <label>
          Valeur (par unité de temps)<br />
          <input
            type="number"
            value={entree}
            onChange={(e) => setEntree(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>
      </section>

      {/* Sortie */}
      <section style={{ marginTop: 32 }}>
        <h2>2. {labelSortie}</h2>

        <label>
          Valeur (par unité de temps)<br />
          <input
            type="number"
            value={sortie}
            onChange={(e) => setSortie(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>
      </section>

      {/* Navigation bas (bleu uniquement) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/r2-objectif"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              backgroundColor: "#1976d2",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Revenir à la page précédente
          </a>
        </div>
      </div>
    </main>
  );
}
