// app/vision/page.tsx
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function VisionPage() {
  const searchParams = useSearchParams();
  const num = (searchParams.get("num") || "1").trim();

  const vision = useMemo(() => {
    switch (num) {
      case "2":
        return {
          title: "Vision 2 — Ajuster l’objectif",
          short:
            "On fixe d’abord un objectif, puis on regarde quelles valeurs des facteurs d’entrée/sortie permettraient de l’atteindre.",
          long: (
            <>
              <p style={{ marginTop: 0 }}>
                Ici, on part de l’idée : <b>“je tiens à l’objectif”</b>. On examine ensuite ce que cela impose sur la
                réalité (par exemple sur les entrées/sorties), quitte à constater que ce n’est pas réaliste.
              </p>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Cette vision est utile si l’objectif est non négociable.</li>
                <li>Elle sert aussi à mesurer “l’effort” nécessaire pour atteindre cet objectif.</li>
                <li>On pourra comparer ensuite avec d’autres visions plus réalistes.</li>
              </ul>
            </>
          ),
        };
      case "3":
        return {
          title: "Vision 3 — Ajouter une activité annexe",
          short:
            "On conserve l’objectif, et on explore l’ajout d’une activité qui modifie les flux (entrées/sorties).",
          long: (
            <>
              <p style={{ marginTop: 0 }}>
                Ici, on part de l’idée : <b>“je peux agir sur la réalité”</b>, par exemple en ajoutant une activité qui
                apporte des entrées supplémentaires (mais souvent aussi des sorties).
              </p>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Cette vision compare implicitement “ne rien changer” vs “ajouter une activité”.</li>
                <li>Elle peut montrer qu’une petite marge mensuelle suffit… ou qu’elle ne suffit pas.</li>
                <li>Elle reste volontairement simple en V1.</li>
              </ul>
            </>
          ),
        };
      case "1":
      default:
        return {
          title: "Vision 1 — Rester dans la situation actuelle",
          short:
            "On décrit d’abord la réalité telle qu’elle est (ou ce qu’on considère comme réaliste), puis on observe ce que cela implique.",
          long: (
            <>
              <p style={{ marginTop: 0 }}>
                Cette vision sert de point de repère : <b>“si je ne change rien d’important”</b>, est-ce que j’atteins
                l’objectif à l’horizon ?
              </p>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>
                  Si l’objectif n’est pas atteint, on pourra ensuite ajuster l’objectif (Vision 2) ou la réalité (Vision
                  3).
                </li>
                <li>On reste volontairement sur un modèle très simple : un stock, une entrée, une sortie.</li>
                <li>Le but est de comprendre la mécanique avant de complexifier.</li>
              </ul>
            </>
          ),
        };
    }
  }, [num]);

  const styles = {
    main: {
      padding: 40,
      maxWidth: 900,
      margin: "0 auto",
      fontFamily: "system-ui, sans-serif",
      lineHeight: 1.45,
    } as const,
    navRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 16,
      paddingLeft: 24,
      paddingRight: 24,
      marginBottom: 18,
    } as const,
    navGroup: { display: "flex", gap: 10 } as const,
    btnGreen: {
      display: "inline-block",
      padding: "10px 18px",
      borderRadius: 10,
      backgroundColor: "#2e7d32",
      color: "white",
      textDecoration: "none",
      fontSize: 16,
      lineHeight: "20px",
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
    } as const,
    btnBlue: {
      display: "inline-block",
      padding: "10px 18px",
      borderRadius: 10,
      backgroundColor: "#1976d2",
      color: "white",
      textDecoration: "none",
      fontSize: 16,
      lineHeight: "20px",
      fontWeight: 600,
      border: "none",
      cursor: "pointer",
    } as const,
    h1: { marginTop: 0, marginBottom: 8 } as const,
    subtitle: { marginTop: 0, color: "#444" } as const,
    card: {
      marginTop: 18,
      padding: 18,
      border: "1px solid #ddd",
      borderRadius: 12,
      background: "white",
    } as const,
    bottomNav: {
      marginTop: 28,
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      paddingLeft: 24,
      paddingRight: 24,
    } as const,
  };

  const hrefPrev = "/choisir-vision";
  const hrefNext = `/r1?num=${encodeURIComponent(num)}`;

  return (
    <main style={styles.main}>
      {/* Navigation haut (déjà cohérente chez vous) */}
      <div style={styles.navRow}>
        <div style={styles.navGroup}>
          <a href="/" style={styles.btnGreen}>
            ← Retour à l’accueil
          </a>
          <a href="/choisir-vision" style={styles.btnGreen}>
            ← Retour à la liste des visions
          </a>
        </div>

        <div style={styles.navGroup}>
          <a href={hrefPrev} style={styles.btnBlue}>
            ← Page précédente
          </a>
          <a href={hrefNext} style={styles.btnBlue}>
            Continuer vers la page suivante →
          </a>
        </div>
      </div>

      <h1 style={styles.h1}>{vision.title}</h1>
      <p style={styles.subtitle}>
        <b>Définition courte :</b> {vision.short}
      </p>

      <section style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Définition longue</h2>
        {vision.long}
      </section>

      {/* Navigation bas */}
      <div style={styles.bottomNav}>
        <a href={hrefPrev} style={styles.btnBlue}>
          ← Page précédente
        </a>
        <a href={hrefNext} style={styles.btnBlue}>
          Continuer vers la page suivante →
        </a>
      </div>
    </main>
  );
}
