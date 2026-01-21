"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [authorMode, setAuthorMode] = useState<boolean>(false);

  useEffect(() => {
    const v = localStorage.getItem("md_author_debug");
    setAuthorMode(v === "1");
  }, []);

  function toggleAuthorMode() {
    const next = !authorMode;
    localStorage.setItem("md_author_debug", next ? "1" : "0");
    setAuthorMode(next);
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>Décider mieux</h1>

      <p style={{ marginTop: 0, marginBottom: 20, color: "#444", lineHeight: 1.6 }}>
        Ce site propose une méthode pour explorer un problème de décision et comparer différentes façons de l’aborder,
        de manière progressive et structurée.
      </p>

      <p style={{ marginTop: 0, marginBottom: 28, color: "#444", lineHeight: 1.6 }}>
        Choisissez une version :
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <Link
          href="/problemes"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 10,
            backgroundColor: "#1976d2",
            color: "white",
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          V1 — version structurée (sans IA)
        </Link>

        <Link
          href="/v2/problemes"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 10,
            backgroundColor: "#2e7d32",
            color: "white",
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          V2 — version texte + IA
        </Link>
      </div>

      {/* --- MODE AUTEUR --- */}
      <div
        style={{
          marginTop: 30,
          paddingTop: 20,
          borderTop: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={toggleAuthorMode}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "1px solid #999",
            backgroundColor: authorMode ? "#f5f5f5" : "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Mode auteur : {authorMode ? "ON" : "OFF"}
        </button>

        <span style={{ color: "#666", fontSize: 14 }}>
          (affiche la formalisation interne et les données techniques — usage personnel)
        </span>
      </div>
    </main>
  );
}
