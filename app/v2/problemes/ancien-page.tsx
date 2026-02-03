// app/v2/problemes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ProblemStatus = "draft" | "done";

type ProblemLite = {
  id: string;
  nomCourt: string;
  status: ProblemStatus;
  createdAt: number;
  updatedAt: number;
};

const LS_V2_PROBLEMS_KEY = "md_v2_problemes";
const LS_V2_CURRENT_PROBLEM_ID = "md_v2_current_problem_id";

const LS_V2_VISIONS_KEY = "md_v2_visions";
const LS_V2_CURRENT_VISION_ID = "md_v2_current_vision_id";

const problemStorageKey = (problemId: string) => `md_v2_problem_${problemId}`;
// Ancienne clé conservée en fallback/compat
const legacyDefKey = (id: string) => `md_v2_probleme_def_${id}`;
const visionDefKey = (problemId: string, visionId: string) =>
  `md_v2_vision_def_${problemId}_${visionId}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function loadProblems(): ProblemLite[] {
  const list = safeParse<ProblemLite[]>(
    localStorage.getItem(LS_V2_PROBLEMS_KEY),
    []
  );
  return (Array.isArray(list) ? list : [])
    .map((p) => ({
      id: typeof p?.id === "string" ? p.id : uid(),
      nomCourt: typeof p?.nomCourt === "string" ? p.nomCourt : "",
      status: p?.status === "done" ? "done" : "draft",
      createdAt: typeof p?.createdAt === "number" ? p.createdAt : Date.now(),
      updatedAt: typeof p?.updatedAt === "number" ? p.updatedAt : Date.now(),
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function saveProblems(list: ProblemLite[]) {
  localStorage.setItem(LS_V2_PROBLEMS_KEY, JSON.stringify(list));
}

type HelpMode = "none" | "guided1" | "guided2" | "guided3" | "free";

export default function V2ProblemesPage() {
  const [ready, setReady] = useState(false);
  const [problems, setProblems] = useState<ProblemLite[]>([]);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [helpMode, setHelpMode] = useState<HelpMode>("none");

  useEffect(() => {
    setProblems(loadProblems());
    setReady(true);
  }, []);

  const styles = useMemo(
    () => ({
      page: {
        padding: 40,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.45,
      } as const,

      // En-tête sur 2 lignes
      topbar: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 16,
        marginBottom: 8,
      } as const,
      leftNav: {
        display: "flex",
        justifyContent: "flex-start",
        gap: 12,
        alignItems: "center",
      } as const,
      centerHelpRow1: {
        display: "flex",
        justifyContent: "center",
        gap: 12,
        alignItems: "center",
      } as const,
      rightNav: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        alignItems: "center",
      } as const,

      topbarRow2: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 16,
        marginBottom: 18,
      } as const,
      centerHelpRow2: {
        display: "flex",
        justifyContent: "center",
        gap: 12,
        alignItems: "center",
      } as const,

      btnGreenNav: {
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

      btnBlue: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid #1976d2",
        backgroundColor: "#1976d2",
        color: "#fff",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
      } as const,

      btnGhost: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: 12,
        border: "1px solid #cfcfcf",
        backgroundColor: "#fff",
        color: "#111",
        textDecoration: "none",
        fontSize: 16,
        cursor: "pointer",
        whiteSpace: "nowrap",
      } as const,

      h1: { fontSize: 28, margin: "10px 0 6px" } as const,
      muted: { color: "#666" } as const,

      card: {
        border: "1px solid #e6e6e6",
        borderRadius: 16,
        padding: 18,
        marginTop: 18,
      } as const,

      row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderTop: "1px solid #eee",
      } as const,

      name: { fontSize: 18, fontWeight: 700 } as const,
      status: { color: "#666" } as const,

      inputRow: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginTop: 14,
      } as const,

      input: {
        flex: 1,
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid #d8d8d8",
        fontSize: 16,
      } as const,

      btnSmallBlue: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "0",
        backgroundColor: "#1976d2",
        color: "#fff",
        cursor: "pointer",
        fontSize: 16,
        whiteSpace: "nowrap",
      } as const,

      btnSmallRed: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #d32f2f",
        backgroundColor: "#fff",
        color: "#d32f2f",
        cursor: "pointer",
        fontSize: 16,
        whiteSpace: "nowrap",
      } as const,

      help: {
        marginTop: 14,
        padding: 14,
        borderRadius: 12,
        background: "#f6f7fb",
        border: "1px solid #e2e6ff",
        whiteSpace: "pre-wrap",
      } as const,
    }),
    []
  );

  function setCurrentProblem(id: string) {
    localStorage.setItem(LS_V2_CURRENT_PROBLEM_ID, id);
  }

  function createProblem() {
    setMsg(null);
    const nom = newName.trim();
    if (!nom) {
      setMsg("Veuillez saisir un nom court.");
      return;
    }
    const now = Date.now();
    const p: ProblemLite = {
      id: uid(),
      nomCourt: nom,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    const next = [p, ...problems];
    setProblems(next);
    saveProblems(next);
    setNewName("");
    setCurrentProblem(p.id);
  }

  function deleteProblem(id: string) {
    setMsg(null);

    const ok = confirm(
      "Supprimer ce problème ?\n\n" +
        "Cela effacera aussi toutes ses visions et tous leurs raffinements (R1, R2, R3...).\n\n" +
        "Cette action est irréversible."
    );
    if (!ok) return;

    // 1) Supprimer le problème de la liste
    const next = problems.filter((p) => p.id !== id);
    setProblems(next);
    saveProblems(next);

    // 2) Supprimer la définition du problème (clé actuelle + compat)
    localStorage.removeItem(problemStorageKey(id));
    localStorage.removeItem(legacyDefKey(id));

    // 3) Supprimer toutes les visions de ce problème + leurs defs (qui contiennent aussi les raffinements)
    const allVisions = safeParse<any[]>(
      localStorage.getItem(LS_V2_VISIONS_KEY),
      []
    );
    const visionsArray = Array.isArray(allVisions) ? allVisions : [];

    const visionsToDelete = visionsArray.filter((v) => v?.problemId === id);
    const remainingVisions = visionsArray.filter((v) => v?.problemId !== id);

    for (const v of visionsToDelete) {
      if (typeof v?.id === "string") {
        // efface la vision_def => efface aussi formal.r1/r2/r3...
        localStorage.removeItem(visionDefKey(id, v.id));

        // nettoyage de la vision courante
        if (localStorage.getItem(LS_V2_CURRENT_VISION_ID) === v.id) {
          localStorage.removeItem(LS_V2_CURRENT_VISION_ID);
        }
      }
    }

    // Mettre à jour la liste globale des visions
    localStorage.setItem(LS_V2_VISIONS_KEY, JSON.stringify(remainingVisions));

    // 4) Nettoyer le problème courant si besoin
    if (localStorage.getItem(LS_V2_CURRENT_PROBLEM_ID) === id) {
      localStorage.removeItem(LS_V2_CURRENT_PROBLEM_ID);
    }
  }

  function statusLabel(p: ProblemLite) {
  return p.status === "done" ? "Validé" : "Brouillon";
}



  const helpText = useMemo(() => {
    if (helpMode === "none") return null;

    if (helpMode === "guided1") {
      return `PROBLÈME GUIDÉ 1 (exemple)
But : montrer comment V2 marche avec un problème “trésorerie + seuil + horizon”.
Dans la page suivante (définition), écrivez un texte libre qui mentionne :
- Trésorerie initiale (montant + unité)
- Seuil minimal de trésorerie à respecter
- Horizon d’observation (ex : 10 ans)
- (Optionnel) un objectif (ex : doubler un revenu en X ans)
Aucun champ n’est prérempli : vous tapez exactement comme en mode libre.`;
    }

    if (helpMode === "free") {
      return `AIDE LIBRE
Écrivez votre problème en texte libre, avec des quantités mesurables si possible :
- grandeurs surveillées (stocks), flux, horizon
- unités (€, €/an, kg, etc.)
- contraintes éventuelles (seuil, délai)
Vous pourrez ensuite corriger grâce aux retours du site.`;
    }

    if (helpMode === "guided2") {
      return `PROBLÈME GUIDÉ 2 (réservé)
Vous compléterez plus tard ce texte d’aide (quoi écrire).`;
    }

    return `PROBLÈME GUIDÉ 3 (réservé)
Vous compléterez plus tard ce texte d’aide (quoi écrire).`;
  }, [helpMode]);

  function toggle(mode: HelpMode) {
    setHelpMode((cur) => (cur === mode ? "none" : mode));
  }

  if (!ready) return null;

  return (
    <main style={styles.page}>
      {/* Ligne 1 */}
      <div style={styles.topbar}>
        <div style={styles.leftNav}>
          <Link href="/" style={styles.btnGreenNav}>
            Accueil
          </Link>

          <span style={{ color: "#666" }}>Liste des problèmes</span>
        </div>

        <div style={styles.centerHelpRow1}>
          <button
            style={helpMode === "guided1" ? styles.btnBlue : styles.btnGhost}
            onClick={() => toggle("guided1")}
          >
            Problème guidé 1
          </button>
          <button
            style={helpMode === "free" ? styles.btnBlue : styles.btnGhost}
            onClick={() => toggle("free")}
          >
            Aide libre
          </button>
        </div>

        <div style={styles.rightNav} />
      </div>

      {/* Ligne 2 */}
      <div style={styles.topbarRow2}>
        <div />
        <div style={styles.centerHelpRow2}>
          <button
            style={helpMode === "guided2" ? styles.btnBlue : styles.btnGhost}
            onClick={() => toggle("guided2")}
          >
            Problème guidé 2
          </button>
          <button
            style={helpMode === "guided3" ? styles.btnBlue : styles.btnGhost}
            onClick={() => toggle("guided3")}
          >
            Problème guidé 3
          </button>
        </div>
        <div />
      </div>

      <h1 style={styles.h1}>Liste des problèmes (V2)</h1>
      {msg ? <div style={{ marginTop: 10, color: "#b00020" }}>{msg}</div> : null}

      {helpText ? <div style={styles.help}>{helpText}</div> : null}

      <section style={styles.card}>
        <h2 style={{ margin: 0 }}>Mes problèmes</h2>
        <div style={styles.muted}>
          Créer, ouvrir, supprimer. ("Brouillon" = définition V2 pas encore validée ;
          "Validé" = mini-formulaire accepté.)
        </div>

        {problems.length === 0 ? (
          <div style={{ marginTop: 12, color: "#666" }}>
            Aucun problème pour l’instant.
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {problems.map((p) => (
              <div key={p.id} style={styles.row}>
                <div>
                  <div style={styles.name}>{p.nomCourt}</div>
                  <div style={styles.status}>{statusLabel(p)}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Link
                    href={`/v2/probleme?problemId=${encodeURIComponent(p.id)}`}
                    style={styles.btnSmallBlue}
                    onClick={() => setCurrentProblem(p.id)}
                  >
                    Ouvrir →
                  </Link>
                  <button
                    style={styles.btnSmallRed}
                    onClick={() => deleteProblem(p.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom court du nouveau problème"
          />
          <button style={styles.btnSmallBlue} onClick={createProblem}>
            Créer
          </button>
        </div>
      </section>
    </main>
  );
}
