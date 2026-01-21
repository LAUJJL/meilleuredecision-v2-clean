// app/r3-ajuster-objectif/page.tsx
"use client";

import { useEffect, useState } from "react";

const K = {
  objectif: "md.objectif", // valeur
  statutObjectif: "md.statutObjectif", // "fixe" | "variable"
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

export default function R3AjusterObjectifPage() {
  const [objectif, setObjectif] = useState("");
  const [statutObjectif, setStatutObjectif] = useState<"fixe" | "variable">("variable");

  useEffect(() => {
    setObjectif(getLS(K.objectif));
    const s = getLS(K.statutObjectif) as "fixe" | "variable";
    if (s === "fixe" || s === "variable") setStatutObjectif(s);
  }, []);

  useEffect(() => setLS(K.objectif, objectif), [objectif]);
  useEffect(() => setLS(K.statutObjectif, statutObjectif), [statutObjectif]);

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
            href="/r2-realite"
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
            ← Retour à R2 (réalité d’abord)
          </a>
        </div>

        {/* Droite (bleu) */}
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/r2-realite"
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

      <h1 style={{ marginTop: 0 }}>R3 — Ajuster l’objectif</h1>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ margin: 0 }}>
          Vous avez fixé la réalité en R2. Ici, vous pouvez ajuster l’<b>objectif minimal</b> en fonction de cette
          réalité.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Objectif minimal (valeur envisagée)</h2>

        <div style={{ marginTop: 12 }}>
          <label>
            Valeur de l’objectif (dans l’unité du stock)<br />
            <input
              type="number"
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          Statut&nbsp;:
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="statutObjectifR3"
                checked={statutObjectif === "fixe"}
                onChange={() => setStatutObjectif("fixe")}
              />
              Fixe
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="statutObjectifR3"
                checked={statutObjectif === "variable"}
                onChange={() => setStatutObjectif("variable")}
              />
              Variable
            </label>
          </div>
        </div>
      </section>

      {/* Navigation bas (bleu uniquement) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/r2-realite"
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
