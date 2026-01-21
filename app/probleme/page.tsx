// app/probleme/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type HelpMode = "guide" | "libre";
type ProblemStatus = "draft" | "in_progress" | "done";
type HorizonUnit = "jour" | "semaine" | "mois" | "annee";
type FacteurMode = "libre" | "fixe";

type ProblemLite = {
  id: string;
  nomCourt: string;
  status: ProblemStatus;
  createdAt: number;
  updatedAt: number;
  data?: any;
};

const LS_PROBLEMS_KEY = "md_problems";
const LS_CURRENT_PROBLEM_KEY = "md_current_problem";
const LS_HELP_MODE_KEY = "md_help_mode";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ProblemePage() {
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState<ProblemLite | null>(null);

  const [helpMode, setHelpMode] = useState<HelpMode>("libre");
  const [helpOpen, setHelpOpen] = useState(false);

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.45,
      } as const,

      // Bandeau haut : gauche (vert), centre (aide), droite (bleu)
      topBar: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 16,
        marginBottom: 18,
        paddingLeft: 4,
        paddingRight: 4,
      } as const,
      topLeft: { display: "flex", gap: 10, alignItems: "center" } as const,
      topCenter: { display: "flex", justifyContent: "center", gap: 12 } as const,
      topRight: { display: "flex", justifyContent: "flex-end", gap: 12 } as const,

      btnGreen: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#2e7d32",
        color: "#fff",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
      } as const,

      btnBlue: (disabled?: boolean) =>
        ({
          display: "inline-block",
          padding: "10px 16px",
          borderRadius: 12,
          border: "0",
          backgroundColor: disabled ? "#9dbce8" : "#1976d2",
          color: "#fff",
          textDecoration: "none",
          fontSize: 16,
          cursor: disabled ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }) as const,

      // Boutons d’aide (couleurs dédiées : violet/orange)
      btnHelpGuide: (active: boolean) =>
        ({
          padding: "10px 14px",
          borderRadius: 12,
          border: active ? "0" : "1px solid #6a1b9a",
          backgroundColor: active ? "#6a1b9a" : "transparent",
          color: active ? "#fff" : "#6a1b9a",
          cursor: "pointer",
          fontSize: 15,
          whiteSpace: "nowrap",
        }) as const,
      btnHelpLibre: (active: boolean) =>
        ({
          padding: "10px 14px",
          borderRadius: 12,
          border: active ? "0" : "1px solid #ef6c00",
          backgroundColor: active ? "#ef6c00" : "transparent",
          color: active ? "#fff" : "#ef6c00",
          cursor: "pointer",
          fontSize: 15,
          whiteSpace: "nowrap",
        }) as const,

      subtitle: { margin: "0 0 18px 0", color: "#444" } as const,

      helpBox: {
        border: "1px solid #e6e6e6",
        borderRadius: 14,
        padding: 16,
        background: "#fafafa",
        margin: "0 0 18px 0",
      } as const,

      warnBox: {
        border: "1px solid #f1c40f",
        borderRadius: 14,
        padding: 14,
        background: "#fffdf3",
        margin: "0 0 18px 0",
        color: "#5a4b00",
      } as const,

      lockBox: {
        border: "1px solid #e0e0e0",
        borderRadius: 14,
        padding: 14,
        background: "#f7f7f7",
        margin: "0 0 18px 0",
        color: "#333",
      } as const,

      grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 14,
        alignItems: "start",
      } as const,

      field: { display: "flex", flexDirection: "column", gap: 6 } as const,
      label: { fontWeight: 600 } as const,

      input: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
      } as const,

      textarea: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
        minHeight: 90,
        resize: "vertical",
      } as const,

      select: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        fontSize: 16,
        background: "#fff",
      } as const,

      hint: { color: "#555", fontSize: 14, marginTop: 2 } as const,

      actions: {
        marginTop: 18,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      } as const,

      btnSave: (disabled: boolean) =>
        ({
          padding: "10px 14px",
          borderRadius: 12,
          border: "0",
          backgroundColor: disabled ? "#c9c9c9" : "#1565c0",
          color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 16,
        }) as const,

      saved: { color: "#2e7d32", fontWeight: 600 } as const,

      // Bas de page : nav bleue à droite (pratique régulière)
      bottomNav: {
        marginTop: 28,
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
      } as const,
    }),
    []
  );

  function openHelp(mode: HelpMode) {
    if (helpOpen && helpMode === mode) {
      setHelpOpen(false);
      return;
    }
    setHelpMode(mode);
    localStorage.setItem(LS_HELP_MODE_KEY, mode);
    setHelpOpen(true);
  }

  function updateData(patch: any) {
    setSavedMsg(null);
    setProblem((prev) => {
      if (!prev) return prev;
      return { ...prev, data: { ...(prev.data ?? {}), ...patch } };
    });
  }

  function persistBoth(nextProblem: ProblemLite) {
    localStorage.setItem(LS_CURRENT_PROBLEM_KEY, JSON.stringify(nextProblem));

    const list = safeParse<ProblemLite[]>(localStorage.getItem(LS_PROBLEMS_KEY), []);
    const now = Date.now();

    const updated = list.map((x) =>
      x.id === nextProblem.id
        ? {
            ...x,
            nomCourt: nextProblem.nomCourt,
            status: nextProblem.status,
            updatedAt: now,
            data: nextProblem.data,
          }
        : x
    );

    const exists = updated.some((x) => x.id === nextProblem.id);
    const finalList = exists ? updated : [{ ...nextProblem, updatedAt: now }, ...updated];

    localStorage.setItem(LS_PROBLEMS_KEY, JSON.stringify(finalList));
  }

  function save() {
    if (!problem) return;

    const now = Date.now();
    const next: ProblemLite = {
      ...problem,
      updatedAt: now,
      status: problem.status ?? "draft",
      data: problem.data ?? {},
    };

    persistBoth(next);
    setProblem(next);
    setSavedMsg("Enregistré");
  }

  // Verrou : dès qu’une vision existe (même juste nommée)
  const locked = useMemo(() => {
    const d = problem?.data ?? {};
    return Array.isArray(d.visions) && d.visions.length > 0;
  }, [problem]);

  const errors = useMemo(() => {
    if (!problem) return [];
    const d = problem.data ?? {};
    const e: string[] = [];

    const dc = (d.definitionCourte ?? "").trim();
    const dl = (d.definitionLongue ?? "").trim();
    if (!dc) e.push("La définition courte est obligatoire.");
    if (!dl) e.push("La définition longue est obligatoire.");

    const nomStock = (d.nomStock ?? "").trim();
    const uniteStock = (d.uniteStock ?? "").trim();
    if (!nomStock) e.push("Le nom du stock est obligatoire.");
    if (!uniteStock) e.push("L’unité du stock est obligatoire.");

    const nomStockInitial = (d.nomStockInitial ?? "").trim();
    if (!nomStockInitial) e.push("Le nom du stock initial est obligatoire.");

    const objectifValeur = Number(d.objectifValeur);
    if (!Number.isFinite(objectifValeur) || objectifValeur <= 0) {
      e.push("La valeur de l’objectif minimal (valeur envisagée) doit être > 0.");
    }

    const horizonValeur = Number(d.horizonValeur);
    if (!Number.isFinite(horizonValeur) || horizonValeur <= 0) {
      e.push("Le délai maximum (horizon) doit être > 0.");
    }

    const horizonUnite = (d.horizonUnite ?? "") as HorizonUnit | "";
    if (!horizonUnite) e.push("L’unité de l’horizon est obligatoire.");

    // Flux : uniquement les noms
    const nomEntree = (d.nomFluxEntree ?? "").trim();
    const nomSortie = (d.nomFluxSortie ?? "").trim();
    if (!nomEntree) e.push("Le nom du flux d’entrée est obligatoire.");
    if (!nomSortie) e.push("Le nom du flux de sortie est obligatoire.");

    // Facteurs (optionnels)
    const nomFactEntree = (d.nomFacteurEntree ?? "").trim();
    if (nomFactEntree) {
      const mode = (d.facteurEntreeMode ?? "") as FacteurMode | "";
      if (!mode) e.push("Flux d’entrée : choisissez si le facteur est fixé ou libre.");
      if (mode === "fixe") {
        const v = Number(d.valeurFacteurEntree);
        if (!Number.isFinite(v)) e.push("Flux d’entrée : la valeur du facteur fixé est obligatoire.");
      }
    }

    const nomFactSortie = (d.nomFacteurSortie ?? "").trim();
    if (nomFactSortie) {
      const mode = (d.facteurSortieMode ?? "") as FacteurMode | "";
      if (!mode) e.push("Flux de sortie : choisissez si le facteur est fixé ou libre.");
      if (mode === "fixe") {
        const v = Number(d.valeurFacteurSortie);
        if (!Number.isFinite(v)) e.push("Flux de sortie : la valeur du facteur fixé est obligatoire.");
      }
    }

    return e;
  }, [problem]);


  

  function continueNext() {
  save();
  window.location.href = "/choisir-vision";
}



  useEffect(() => {
    setReady(true);

    const stored = safeParse<ProblemLite | null>(localStorage.getItem(LS_CURRENT_PROBLEM_KEY), null);
    if (!stored || !stored.id) {
      window.location.href = "/problemes";
      return;
    }

    const d = stored.data ?? {};
    const normalized: ProblemLite = {
      ...stored,
      data: {
        definitionCourte: d.definitionCourte ?? "",
        definitionLongue: d.definitionLongue ?? "",

        nomStock: d.nomStock ?? "",
        uniteStock: d.uniteStock ?? "",

        nomStockInitial: d.nomStockInitial ?? "",
        valeurStockInitiale: d.valeurStockInitiale,
        stockInitialMode: d.stockInitialMode ?? "fixe",

        nomFluxEntree: d.nomFluxEntree ?? "",
        nomFluxSortie: d.nomFluxSortie ?? "",

        // Facteurs (optionnels)
        nomFacteurEntree: d.nomFacteurEntree ?? "",
        facteurEntreeMode: d.facteurEntreeMode ?? "",
        valeurFacteurEntree: d.valeurFacteurEntree,

        nomFacteurSortie: d.nomFacteurSortie ?? "",
        facteurSortieMode: d.facteurSortieMode ?? "",
        valeurFacteurSortie: d.valeurFacteurSortie,

        objectifValeur: d.objectifValeur,
        horizonValeur: d.horizonValeur ?? 12,
        horizonUnite: d.horizonUnite ?? "mois",

        visions: Array.isArray(d.visions) ? d.visions : [],
      },
    };

    setProblem(normalized);

    const storedMode = localStorage.getItem(LS_HELP_MODE_KEY) as HelpMode | null;
    if (storedMode === "guide" || storedMode === "libre") setHelpMode(storedMode);
  }, []);

  if (!ready || !problem) return null;
  const d = problem.data ?? {};

  const nomFactEntree = (d.nomFacteurEntree ?? "").trim();
  const nomFactSortie = (d.nomFacteurSortie ?? "").trim();

  return (
    <main style={styles.page}>
      {/* Barre haute : vert gauche / aide centre / nav bleue droite */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <a href="/" style={styles.btnGreen}>
            ← Retour à l’accueil
          </a>
        </div>

        <div style={styles.topCenter}>
          <button
            type="button"
            onClick={() => openHelp("guide")}
            style={styles.btnHelpGuide(helpOpen && helpMode === "guide")}
            aria-pressed={helpOpen && helpMode === "guide"}
          >
            Aide guidée
          </button>
          <button
            type="button"
            onClick={() => openHelp("libre")}
            style={styles.btnHelpLibre(helpOpen && helpMode === "libre")}
            aria-pressed={helpOpen && helpMode === "libre"}
          >
            Aide libre
          </button>
        </div>

        <div style={styles.topRight}>
          <a href="/problemes" style={styles.btnBlue(false)}>
            ← Page précédente
          </a>
          <button
  type="button"
  onClick={continueNext}
  style={styles.btnBlue(false)}
  title="Continuer"
>
  Continuer vers la page suivante →
</button>


        </div>
      </div>

      <h1 style={{ margin: "0 0 10px 0" }}>Définition du problème</h1>
      <p style={styles.subtitle}>
        Vous définissez ici le tronc (texte + valeurs) commun aux visions qui viendront ensuite.
      </p>

      {locked && (
        <div style={styles.lockBox}>
          <strong>Définition figée</strong>
          <div style={{ marginTop: 6 }}>
            Une ou plusieurs visions existent déjà. Pour éviter toute incohérence, la définition du problème n’est plus modifiable.
            <br />
            (Si vous voulez changer le problème, supprimez d’abord toutes les visions associées.)
          </div>
        </div>
      )}

      {helpOpen && (
        <div style={styles.helpBox}>
          {helpMode === "guide" ? (
            <>
              <strong>Aide guidée</strong>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Remplissez la définition courte (1–2 phrases) puis la définition longue (un paragraphe).
                Nommez le stock (l’état à améliorer) et son unité.
                Nommez le stock initial (et une valeur moyenne si vous en avez une).
                Fixez l’objectif minimal (valeur envisagée) et le délai maximum (horizon).
                <br />
                <br />
                En V1, chaque flux (entrée/sortie) sera précisé dans les visions. Ici, on donne seulement les noms des flux.
                <br />
                <br />
                <strong>Facteurs (optionnels)</strong> : si vous nommez un facteur au niveau du problème, ce nom s’imposera à toutes les visions.
                Vous pouvez décider si ce facteur est <em>fixé</em> (valeur obligatoire) ou <em>libre</em>.
                Si vous ne nommez pas le facteur, chaque vision pourra choisir son propre facteur et son propre libellé.
              </p>
            </>
          ) : (
            <>
              <strong>Aide libre</strong>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Remplissez les champs obligatoires. Les flux sont nommés ici ; leur détail sera défini dans les visions.
                Les facteurs sont optionnels : si vous les nommez ici, ils deviennent communs à toutes les visions.
              </p>
            </>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div style={styles.warnBox}>
          <strong>Champs manquants / incohérents :</strong>
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            {errors.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.field}>
          <div style={styles.label}>Nom court du problème</div>
          <input
            style={styles.input}
            value={problem.nomCourt ?? ""}
            disabled={locked}
            onChange={(e) => {
              const v = e.target.value;
              setProblem((prev) => (prev ? { ...prev, nomCourt: v } : prev));
              setSavedMsg(null);
            }}
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Unité du stock</div>
          <input
            style={styles.input}
            value={d.uniteStock ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ uniteStock: e.target.value })}
            placeholder="ex. euros, kg, clients"
          />
        </div>

        <div style={{ gridColumn: "1 / -1" } as const} />

        <div style={styles.field}>
          <div style={styles.label}>Définition courte</div>
          <textarea
            style={styles.textarea}
            value={d.definitionCourte ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ definitionCourte: e.target.value })}
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Définition longue</div>
          <textarea
            style={styles.textarea}
            value={d.definitionLongue ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ definitionLongue: e.target.value })}
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Nom du stock</div>
          <input
            style={styles.input}
            value={d.nomStock ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ nomStock: e.target.value })}
            placeholder="ex. trésorerie, poids, nombre de clients"
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Nom du stock initial</div>
          <input
            style={styles.input}
            value={d.nomStockInitial ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ nomStockInitial: e.target.value })}
            placeholder="ex. trésorerie de départ"
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Valeur du stock initial (optionnelle)</div>
          <input
            style={styles.input}
            inputMode="decimal"
            type="text"
            value={d.valeurStockInitiale ?? ""}
            disabled={locked}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === "") updateData({ valeurStockInitiale: undefined });
              else updateData({ valeurStockInitiale: Number(raw.replace(",", ".")) });
            }}
            placeholder="valeur moyenne estimée (optionnel)"
          />
          <div style={styles.hint}>Même si c’est variable, une valeur moyenne aide à donner un ordre de grandeur.</div>
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Stock initial</div>
          <select
            style={styles.select}
            value={d.stockInitialMode ?? "fixe"}
            disabled={locked}
            onChange={(e) => updateData({ stockInitialMode: e.target.value })}
          >
            <option value="fixe">Fixé (identique pour toutes les visions)</option>
            <option value="variable">Variable selon la vision (à éviter en V1 sauf cas particulier)</option>
          </select>
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Objectif minimal (valeur envisagée)</div>
          <input
            style={styles.input}
            inputMode="decimal"
            type="text"
            value={d.objectifValeur ?? ""}
            disabled={locked}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === "") updateData({ objectifValeur: undefined });
              else updateData({ objectifValeur: Number(raw.replace(",", ".")) });
            }}
            placeholder="ex. 10000"
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Délai maximum pour atteindre l’objectif (horizon)</div>
          <div style={{ display: "flex", gap: 10 } as const}>
            <input
              style={{ ...styles.input, flex: 1 } as const}
              inputMode="numeric"
              type="text"
              value={d.horizonValeur ?? ""}
              disabled={locked}
              onChange={(e) => {
                const raw = e.target.value.trim();
                updateData({ horizonValeur: raw === "" ? undefined : Number(raw) });
              }}
              placeholder="ex. 12"
            />
            <select
              style={{ ...styles.select, width: 160 } as const}
              value={d.horizonUnite ?? "mois"}
              disabled={locked}
              onChange={(e) => updateData({ horizonUnite: e.target.value })}
            >
              <option value="jour">jours</option>
              <option value="semaine">semaines</option>
              <option value="mois">mois</option>
              <option value="annee">années</option>
            </select>
          </div>
        </div>

        {/* Flux */}
        <div style={{ gridColumn: "1 / -1" } as const} />
        <h2 style={{ margin: "10px 0 0 0" } as const}>Flux</h2>

        <div style={styles.field}>
          <div style={styles.label}>Nom du flux d’entrée</div>
          <input
            style={styles.input}
            value={d.nomFluxEntree ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ nomFluxEntree: e.target.value })}
            placeholder="ex. encaissements"
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Nom du flux de sortie</div>
          <input
            style={styles.input}
            value={d.nomFluxSortie ?? ""}
            disabled={locked}
            onChange={(e) => updateData({ nomFluxSortie: e.target.value })}
            placeholder="ex. décaissements"
          />
        </div>

        {/* Facteurs (optionnels) */}
        <div style={{ gridColumn: "1 / -1" } as const} />
        <h2 style={{ margin: "10px 0 0 0" } as const}>Facteurs des flux (optionnels)</h2>
        <div style={{ gridColumn: "1 / -1" } as const}>
          <div style={styles.hint}>
            Si vous nommez un facteur ici, il devient commun à toutes les visions.
            Si vous ne le nommez pas, chaque vision pourra choisir son facteur et son libellé.
          </div>
        </div>

        {/* Facteur entrée */}
        <div style={styles.field}>
          <div style={styles.label}>Facteur du flux d’entrée (optionnel)</div>
          <input
            style={styles.input}
            value={d.nomFacteurEntree ?? ""}
            disabled={locked}
            onChange={(e) => {
              const v = e.target.value;
              if (v.trim() === "") updateData({ nomFacteurEntree: "", facteurEntreeMode: "", valeurFacteurEntree: undefined });
              else updateData({ nomFacteurEntree: v });
            }}
            placeholder="ex. salaire, revenu (laisser vide = libre par vision)"
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Si nommé : fixé ou libre</div>
          <select
            style={styles.select}
            value={nomFactEntree ? (d.facteurEntreeMode ?? "") : ""}
            disabled={locked || !nomFactEntree}
            onChange={(e) => {
              const mode = e.target.value as FacteurMode | "";
              if (mode !== "fixe") updateData({ facteurEntreeMode: mode, valeurFacteurEntree: undefined });
              else updateData({ facteurEntreeMode: mode });
            }}
          >
            <option value="">(choisir)</option>
            <option value="libre">Libre (peut varier)</option>
            <option value="fixe">Fixé (valeur obligatoire)</option>
          </select>

          {nomFactEntree && (d.facteurEntreeMode ?? "") === "fixe" && (
            <>
              <div style={{ height: 6 }} />
              <input
                style={styles.input}
                inputMode="decimal"
                type="text"
                value={d.valeurFacteurEntree ?? ""}
                disabled={locked}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") updateData({ valeurFacteurEntree: undefined });
                  else updateData({ valeurFacteurEntree: Number(raw.replace(",", ".")) });
                }}
                placeholder="valeur du facteur fixé"
              />
            </>
          )}
        </div>

        {/* Facteur sortie */}
        <div style={styles.field}>
          <div style={styles.label}>Facteur du flux de sortie (optionnel)</div>
          <input
            style={styles.input}
            value={d.nomFacteurSortie ?? ""}
            disabled={locked}
            onChange={(e) => {
              const v = e.target.value;
              if (v.trim() === "") updateData({ nomFacteurSortie: "", facteurSortieMode: "", valeurFacteurSortie: undefined });
              else updateData({ nomFacteurSortie: v });
            }}
            placeholder="ex. dépenses, dépenses personnelles (laisser vide = libre par vision)"
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Si nommé : fixé ou libre</div>
          <select
            style={styles.select}
            value={nomFactSortie ? (d.facteurSortieMode ?? "") : ""}
            disabled={locked || !nomFactSortie}
            onChange={(e) => {
              const mode = e.target.value as FacteurMode | "";
              if (mode !== "fixe") updateData({ facteurSortieMode: mode, valeurFacteurSortie: undefined });
              else updateData({ facteurSortieMode: mode });
            }}
          >
            <option value="">(choisir)</option>
            <option value="libre">Libre (peut varier)</option>
            <option value="fixe">Fixé (valeur obligatoire)</option>
          </select>

          {nomFactSortie && (d.facteurSortieMode ?? "") === "fixe" && (
            <>
              <div style={{ height: 6 }} />
              <input
                style={styles.input}
                inputMode="decimal"
                type="text"
                value={d.valeurFacteurSortie ?? ""}
                disabled={locked}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") updateData({ valeurFacteurSortie: undefined });
                  else updateData({ valeurFacteurSortie: Number(raw.replace(",", ".")) });
                }}
                placeholder="valeur du facteur fixé"
              />
            </>
          )}
        </div>

        {/* actions */}
        <div style={{ gridColumn: "1 / -1" } as const} />
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.btnSave(locked)}
            onClick={save}
            disabled={locked}
            title={locked ? "Définition figée (des visions existent déjà)" : "Enregistrer"}
          >
            Enregistrer
          </button>
          {savedMsg && <span style={styles.saved}>{savedMsg}</span>}
        </div>
      </div>

      {/* Navigation bas droite : page précédente + page suivante */}
      <div style={styles.bottomNav}>
        <a href="/problemes" style={styles.btnBlue(false)}>
          ← Page précédente
        </a>
        <button
  type="button"
  onClick={continueNext}
  style={styles.btnBlue(false)}
  title="Continuer"
>
  Continuer vers la page suivante →
</button>

      </div>
    </main>
  );
}
