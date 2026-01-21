// app/r1/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const K = {
  uniteStock: "md.uniteStock",
  stockDepartValeur: "md.stockDepartValeur",
  objectifValeur: "md.objectifValeur",
  uniteTemps: "md.uniteTemps",
  horizon: "md.horizon",
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

function toNum(x: string) {
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function Raffinement1Page() {
  const searchParams = useSearchParams();
  const num = (searchParams.get("num") || "1").trim(); // pour revenir à la bonne vision

  const [uniteStock, setUniteStock] = useState("");
  const [uniteTemps, setUniteTemps] = useState("");

  const [stockDepart, setStockDepart] = useState("");
  const [objectif, setObjectif] = useState("");
  const [horizon, setHorizon] = useState("");

  const [entree, setEntree] = useState("");
  const [sortie, setSortie] = useState("");

  useEffect(() => {
    // Rappel depuis la définition du problème (via localStorage déjà alimenté)
    setUniteStock(getLS(K.uniteStock));
    setUniteTemps(getLS(K.uniteTemps));

    setStockDepart(getLS(K.stockDepartValeur));
    setObjectif(getLS(K.objectifValeur));
    setHorizon(getLS(K.horizon));

    // Saisie spécifique R1
    setEntree(getLS(K.entree));
    setSortie(getLS(K.sortie));
  }, []);

  // Persistance : uniquement ce qui est propre à R1 (flux)
  useEffect(() => setLS(K.entree, entree), [entree]);
  useEffect(() => setLS(K.sortie, sortie), [sortie]);

  // Calcul
  const calc = useMemo(() => {
    const sd = toNum(stockDepart);
    const obj = toNum(objectif);
    const H = toNum(horizon);
    const e = toNum(entree);
    const s = toNum(sortie);

    const stockFinal = sd + H * (e - s);
    const ecart = stockFinal - obj;
    const atteint = ecart >= 0;

    return { sd, obj, H, e, s, stockFinal, ecart, atteint };
  }, [stockDepart, objectif, horizon, entree, sortie]);

  const badgeColor = calc.atteint ? "#166534" : "#b91c1c";

  const hrefPrev = `/vision?num=${encodeURIComponent(num)}`;
  const hrefNext = `/r2?num=${encodeURIComponent(num)}`; // si /r2 existe chez vous

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
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

        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={hrefPrev}
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

          <a
            href={hrefNext}
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
            Continuer vers la page suivante
          </a>
        </div>
      </div>

      <h1 style={{ marginTop: 0 }}>R1 — Premier raffinement</h1>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ margin: 0 }}>
          Calcul minimal : <b>stock final</b> = stock départ + horizon × (entrée − sortie).
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Données (rappel du problème + saisie R1)</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Unité du stock (rappel)<br />
            <input type="text" value={uniteStock} readOnly style={{ width: "100%", marginTop: 6, background: "#f6f6f6" }} />
          </label>

          <label>
            Stock de départ (rappel, défini dans le problème)<br />
            <input type="number" value={stockDepart} readOnly style={{ width: "100%", marginTop: 6, background: "#f6f6f6" }} />
          </label>

          <label>
            Objectif minimal (rappel, défini dans le problème)<br />
            <input type="number" value={objectif} readOnly style={{ width: "100%", marginTop: 6, background: "#f6f6f6" }} />
          </label>

          <label>
            Unité de temps (rappel)<br />
            <input type="text" value={uniteTemps} readOnly style={{ width: "100%", marginTop: 6, background: "#f6f6f6" }} />
          </label>

          <label>
            Horizon (rappel, défini dans le problème)<br />
            <input type="number" value={horizon} readOnly style={{ width: "100%", marginTop: 6, background: "#f6f6f6" }} />
          </label>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Flux moyens (par unité de temps)</h2>

        <label>
          Entrée moyenne<br />
          <input
            type="number"
            value={entree}
            onChange={(e) => setEntree(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <label>
            Sortie moyenne<br />
            <input
              type="number"
              value={sortie}
              onChange={(e) => setSortie(e.target.value)}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>
        </div>
      </section>

      <section style={{ marginTop: 32, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Résultat provisoire</h2>

        <p style={{ marginTop: 0 }}>
          <b>Stock final</b> = {calc.sd.toLocaleString("fr-FR")} + {calc.H.toLocaleString("fr-FR")} × (
          {calc.e.toLocaleString("fr-FR")} − {calc.s.toLocaleString("fr-FR")}) ={" "}
          <b>{calc.stockFinal.toLocaleString("fr-FR")}</b> {uniteStock || ""}
        </p>

        <p style={{ marginTop: 0 }}>
          <b>Écart</b> = stock final − objectif ={" "}
          <b>{calc.ecart.toLocaleString("fr-FR")}</b> {uniteStock || ""}
        </p>

        <div
          style={{
            display: "inline-block",
            padding: "6px 10px",
            borderRadius: 999,
            backgroundColor: badgeColor,
            color: "white",
            fontSize: 13,
          }}
        >
          {calc.atteint ? "Objectif atteint (provisoirement)" : "Objectif non atteint (provisoirement)"}
        </div>
      </section>

      {/* Navigation bas (bleu uniquement) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={hrefPrev}
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

          <a
            href={hrefNext}
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
            Continuer vers la page suivante
          </a>
        </div>
      </div>
    </main>
  );
}
