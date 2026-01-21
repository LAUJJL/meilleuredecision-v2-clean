// app/r2/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const K = {
  // Rappel du problème (immutables)
  uniteStock: "md.uniteStock",
  stockDepartValeur: "md.stockDepartValeur",
  objectifValeur: "md.objectifValeur",
  uniteTemps: "md.uniteTemps",
  horizon: "md.horizon",

  // R2 : réalité (noms + valeurs)
  nomEntree: "md.nomEntree",
  nomSortie: "md.nomSortie",
  entree: "md.entree",
  sortie: "md.sortie",
  statutEntree: "md.statutEntree", // "fixe" | "variable"
  statutSortie: "md.statutSortie", // "fixe" | "variable"
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

export default function R2Page() {
  const searchParams = useSearchParams();
  const num = (searchParams.get("num") || "1").trim();

  // Rappel problème
  const [uniteStock, setUniteStock] = useState("");
  const [uniteTemps, setUniteTemps] = useState("");
  const [stockDepart, setStockDepart] = useState("");
  const [objectif, setObjectif] = useState("");
  const [horizon, setHorizon] = useState("");

  // R2 réalité
  const [nomEntree, setNomEntree] = useState("");
  const [nomSortie, setNomSortie] = useState("");
  const [entree, setEntree] = useState("");
  const [sortie, setSortie] = useState("");
  const [statutEntree, setStatutEntree] = useState<"fixe" | "variable">("fixe");
  const [statutSortie, setStatutSortie] = useState<"fixe" | "variable">("fixe");

  useEffect(() => {
    // Rappel problème
    setUniteStock(getLS(K.uniteStock));
    setUniteTemps(getLS(K.uniteTemps));
    setStockDepart(getLS(K.stockDepartValeur));
    setObjectif(getLS(K.objectifValeur));
    setHorizon(getLS(K.horizon));

    // Réalité
    setNomEntree(getLS(K.nomEntree));
    setNomSortie(getLS(K.nomSortie));
    setEntree(getLS(K.entree));
    setSortie(getLS(K.sortie));

    const se = getLS(K.statutEntree) as "fixe" | "variable";
    const ss = getLS(K.statutSortie) as "fixe" | "variable";
    if (se === "fixe" || se === "variable") setStatutEntree(se);
    if (ss === "fixe" || ss === "variable") setStatutSortie(ss);
  }, []);

  // Sauvegarde “live” R2
  useEffect(() => setLS(K.nomEntree, nomEntree), [nomEntree]);
  useEffect(() => setLS(K.nomSortie, nomSortie), [nomSortie]);
  useEffect(() => setLS(K.entree, entree), [entree]);
  useEffect(() => setLS(K.sortie, sortie), [sortie]);
  useEffect(() => setLS(K.statutEntree, statutEntree), [statutEntree]);
  useEffect(() => setLS(K.statutSortie, statutSortie), [statutSortie]);

  // Verdict (objectif immuable, donc R2 est final)
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

  const hrefPrev = `/r1?num=${encodeURIComponent(num)}`;

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
            ← Revenir à R1
          </a>

          <a
            href="/choisir-vision"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              backgroundColor: "#1976d2",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
            }}
            title="Fin de l'analyse V1"
          >
            Terminer →
          </a>
        </div>
      </div>

      <h1 style={{ marginTop: 0 }}>R2 — Fixer la réalité (final)</h1>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ margin: 0 }}>
          On fixe la réalité : on nomme l’entrée/sortie, on donne leur valeur (et éventuellement leur statut).
          L’objectif étant immuable, le verdict est immédiat.
        </p>
      </section>

      {/* Rappel problème */}
      <section style={{ marginTop: 24 }}>
        <h2>Rappel (définition du problème)</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <b>Stock départ</b> : {stockDepart || "—"} {uniteStock || ""}
          </div>
          <div>
            <b>Objectif</b> : {objectif || "—"} {uniteStock || ""}
          </div>
          <div>
            <b>Horizon</b> : {horizon || "—"} {uniteTemps || ""}
          </div>
        </div>
      </section>

      {/* Entrée */}
      <section style={{ marginTop: 24 }}>
        <h2>1. Facteur d’entrée</h2>

        <label>
          Nom du facteur d’entrée<br />
          <input
            type="text"
            value={nomEntree}
            onChange={(e) => setNomEntree(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <label>
            Valeur (par unité de temps)<br />
            <input
              type="number"
              value={entree}
              onChange={(e) => setEntree(e.target.value)}
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
                name="statutEntree"
                checked={statutEntree === "fixe"}
                onChange={() => setStatutEntree("fixe")}
              />
              Fixe
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="statutEntree"
                checked={statutEntree === "variable"}
                onChange={() => setStatutEntree("variable")}
              />
              Variable
            </label>
          </div>
        </div>
      </section>

      {/* Sortie */}
      <section style={{ marginTop: 32 }}>
        <h2>2. Facteur de sortie</h2>

        <label>
          Nom du facteur de sortie<br />
          <input
            type="text"
            value={nomSortie}
            onChange={(e) => setNomSortie(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <label>
            Valeur (par unité de temps)<br />
            <input
              type="number"
              value={sortie}
              onChange={(e) => setSortie(e.target.value)}
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
                name="statutSortie"
                checked={statutSortie === "fixe"}
                onChange={() => setStatutSortie("fixe")}
              />
              Fixe
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name="statutSortie"
                checked={statutSortie === "variable"}
                onChange={() => setStatutSortie("variable")}
              />
              Variable
            </label>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section style={{ marginTop: 30, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Verdict</h2>

        <p style={{ marginTop: 0 }}>
          <b>Stock final</b> = {calc.sd.toLocaleString("fr-FR")} + {calc.H.toLocaleString("fr-FR")} × (
          {calc.e.toLocaleString("fr-FR")} − {calc.s.toLocaleString("fr-FR")}) ={" "}
          <b>{calc.stockFinal.toLocaleString("fr-FR")}</b> {uniteStock || ""}
        </p>

        <p style={{ marginTop: 0 }}>
          <b>Écart</b> = stock final − objectif = <b>{calc.ecart.toLocaleString("fr-FR")}</b> {uniteStock || ""}
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
          {calc.atteint ? "Objectif atteint" : "Objectif non atteint"}
        </div>
      </section>
    </main>
  );
}
