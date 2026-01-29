// app/v2/probleme/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function countWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function textLooksTooWeak(t: string) {
  const minChars = 80;
  const minWords = 15;
  return t.length < minChars || countWords(t) < minWords;
}

type Status = "" | "GLOBAL_CONST" | "VISION_PARAM" | "VISION_KNOB";

type FieldWithStatus = {
  value: string;
  status: Status;
};

type ProblemForm = {
  salaireActuel: FieldWithStatus;
  capitalInitial: FieldWithStatus;
  objectifDoublement: { value: boolean; status: Status };
  horizonAns: FieldWithStatus;
};

type SavedProblemPayload = {
  validatedText: string;
  comment?: string | null;
  form: ProblemForm;
  refusalReason?: string | null;
  validatedAt?: string;
};

function problemStorageKey(problemId: string) {
  return `md_v2_problem_${problemId}`;
}

/* ---------------------------------------------------------
   Page
--------------------------------------------------------- */

export default function V2ProblemePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const problemId = sp.get("problemId") || "new";

  const [ready, setReady] = useState(false);

  // Texte libre
  const [draft, setDraft] = useState("");
  const [comment, setComment] = useState("");

  // Messages système
  const [remarks, setRemarks] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Formulaire proposé
  const [formProposed, setFormProposed] = useState<ProblemForm | null>(null);

  // Acceptation obligatoire
  const [formAccepted, setFormAccepted] = useState(false);

  // Refus du formulaire
  const [formRefused, setFormRefused] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");

  // État validé
  const [alreadyValidated, setAlreadyValidated] = useState(false);
  const [validatedPayload, setValidatedPayload] =
    useState<SavedProblemPayload | null>(null);

  /* ---------------------------------------------------------
     Init : recharger si déjà validé
  --------------------------------------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem(problemStorageKey(problemId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SavedProblemPayload;
        if (parsed?.validatedText && parsed?.form) {
          setAlreadyValidated(true);
          setValidatedPayload(parsed);

          setDraft(parsed.validatedText);
          setComment(parsed.comment ?? "");

          setFormProposed(parsed.form);
          setFormAccepted(true);
        }
      } catch {
        // ignore
      }
    }
    setReady(true);
  }, [problemId]);

  /* ---------------------------------------------------------
     Étape principale : proposer un formulaire (système minimal)
  --------------------------------------------------------- */
  async function proposeForm() {
    setRemarks([]);
    setFormProposed(null);
    setFormAccepted(false);
    setFormRefused(false);
    setRefusalReason("");

    const t = draft.trim();
    if (!t) {
      setRemarks(["Veuillez saisir une définition du problème."]);
      return;
    }

    if (textLooksTooWeak(t)) {
      setRemarks([
        "Je ne peux pas construire un formulaire à partir de ce texte.",
        "Ajoutez : objectif, horizon, chiffres, contraintes, options.",
      ]);
      return;
    }

    setBusy(true);
    try {
      const proposed: ProblemForm = {
        salaireActuel: { value: "", status: "" },
        capitalInitial: { value: "", status: "" },
        objectifDoublement: { value: true, status: "" },
        horizonAns: { value: "", status: "" },
      };

      setFormProposed(proposed);

      setRemarks([
        "Formulaire proposé : vérifiez et complétez les champs.",
        "Choisir un statut est optionnel : si vous ne savez pas, laissez vide.",
        "Si vous choisissez un statut, vous ajoutez une précision qui guidera la suite du parcours.",
      ]);
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------------------------------------
     Validation finale
  --------------------------------------------------------- */
  function validate() {
    if (alreadyValidated) return;
    if (!formProposed) return;

    if (!formAccepted) {
      setRemarks(["Vous devez accepter le formulaire avant validation."]);
      return;
    }

    const payload: SavedProblemPayload = {
      validatedText: draft.trim(),
      comment: comment.trim() || null,
      form: formProposed,
      refusalReason: formRefused ? refusalReason.trim() || null : null,
      validatedAt: new Date().toISOString(),
    };

    localStorage.setItem(problemStorageKey(problemId), JSON.stringify(payload));

    setAlreadyValidated(true);
    setValidatedPayload(payload);

    router.push(`/v2/visions?problemId=${encodeURIComponent(problemId)}`);
  }

  /* ---------------------------------------------------------
     Navigation fixe
  --------------------------------------------------------- */
  function goPrev() {
    router.push("/v2/problemes");
  }

  function goNext() {
    if (!alreadyValidated) return;
    router.push(`/v2/visions?problemId=${encodeURIComponent(problemId)}`);
  }

  if (!ready) return null;

  /* ---------------------------------------------------------
     UI helpers
  --------------------------------------------------------- */
  function StatusSelect(props: {
    value: Status;
    disabled?: boolean;
    onChange: (v: Status) => void;
  }) {
    const { value, disabled, onChange } = props;
    return (
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Status)}
        style={{ marginTop: 4, padding: 6, width: "100%" }}
      >
        <option value="">(vide) — Je ne sais pas / je ne précise pas</option>
        <option value="GLOBAL_CONST">GLOBAL_CONST — invariant (problème)</option>
        <option value="VISION_PARAM">VISION_PARAM — fixé par vision</option>
        <option value="VISION_KNOB">VISION_KNOB — exploratoire (curseur)</option>
      </select>
    );
  }

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
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ← Page précédente
          </button>

          <button
            onClick={goNext}
            disabled={!alreadyValidated}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: alreadyValidated ? "#1976d2" : "#9e9e9e",
              color: "#fff",
              border: 0,
              cursor: alreadyValidated ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            Page suivante →
          </button>
        </div>
      </div>

      <h1>V2 — Définition du problème</h1>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          background: "#fff7ed",
          border: "1px solid #fdba74",
          color: "#7c2d12",
        }}
      >
        <strong>Important :</strong> rien n’est conservé tant que ce n’est pas
        validé.
        {alreadyValidated ? (
          <div style={{ marginTop: 8 }}>
            <strong>Définition validée :</strong> lecture seule.
          </div>
        ) : null}
      </div>

      {/* Texte libre */}
      <div style={{ marginTop: 24 }}>
        <label style={{ fontWeight: 700 }}>Votre définition (texte libre)</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={alreadyValidated}
          rows={8}
          style={{
            width: "100%",
            marginTop: 8,
            padding: 10,
            opacity: alreadyValidated ? 0.85 : 1,
          }}
        />
      </div>

      {/* Commentaire */}
      <div style={{ marginTop: 16 }}>
        <label style={{ fontWeight: 700 }}>Commentaire (optionnel)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={alreadyValidated}
          rows={3}
          style={{
            width: "100%",
            marginTop: 8,
            padding: 10,
            opacity: alreadyValidated ? 0.85 : 1,
          }}
        />
      </div>

      {/* Bouton proposer formulaire */}
      {!alreadyValidated && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={proposeForm}
            disabled={busy}
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "#1976d2",
              color: "#fff",
              border: 0,
              cursor: busy ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {busy ? "Construction…" : "Construire le mini-formulaire"}
          </button>
        </div>
      )}

      {/* Remarques */}
      {remarks.length > 0 && (
        <div
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#7c2d12",
          }}
        >
          <strong>Remarques</strong>
          <ul style={{ marginTop: 8 }}>
            {remarks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulaire proposé */}
      {!alreadyValidated && formProposed && (
        <div style={{ marginTop: 24 }}>
          <h3>Mini-formulaire (définition formelle)</h3>

          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: "#f0fdf4",
              border: "1px solid #86efac",
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <strong>Statut (optionnel)</strong> : si vous ne savez pas, laissez
              “vide”. Choisir un statut ajoute une précision qui guidera la suite.
            </div>

            <label style={{ fontWeight: 700 }}>Salaire actuel</label>
            <input
              value={formProposed.salaireActuel.value}
              onChange={(e) =>
                setFormProposed({
                  ...formProposed,
                  salaireActuel: { ...formProposed.salaireActuel, value: e.target.value },
                })
              }
              style={{ width: "100%", marginTop: 4, padding: 6 }}
              placeholder="ex : 80000 €/an"
            />
            <StatusSelect
              value={formProposed.salaireActuel.status}
              onChange={(v) =>
                setFormProposed({
                  ...formProposed,
                  salaireActuel: { ...formProposed.salaireActuel, status: v },
                })
              }
            />

            <hr style={{ margin: "16px 0" }} />

            <label style={{ fontWeight: 700 }}>Capital initial</label>
            <input
              value={formProposed.capitalInitial.value}
              onChange={(e) =>
                setFormProposed({
                  ...formProposed,
                  capitalInitial: { ...formProposed.capitalInitial, value: e.target.value },
                })
              }
              style={{ width: "100%", marginTop: 4, padding: 6 }}
              placeholder="ex : 300000 €"
            />
            <StatusSelect
              value={formProposed.capitalInitial.status}
              onChange={(v) =>
                setFormProposed({
                  ...formProposed,
                  capitalInitial: { ...formProposed.capitalInitial, status: v },
                })
              }
            />

            <hr style={{ margin: "16px 0" }} />

            <label style={{ fontWeight: 700 }}>
              Objectif : doubler le salaire
            </label>
            <div style={{ marginTop: 6 }}>
              <input
                type="checkbox"
                checked={formProposed.objectifDoublement.value}
                onChange={(e) =>
                  setFormProposed({
                    ...formProposed,
                    objectifDoublement: {
                      ...formProposed.objectifDoublement,
                      value: e.target.checked,
                    },
                  })
                }
              />{" "}
              Oui
            </div>
            <StatusSelect
              value={formProposed.objectifDoublement.status}
              onChange={(v) =>
                setFormProposed({
                  ...formProposed,
                  objectifDoublement: { ...formProposed.objectifDoublement, status: v },
                })
              }
            />

            <hr style={{ margin: "16px 0" }} />

            <label style={{ fontWeight: 700 }}>Horizon (années)</label>
            <input
              value={formProposed.horizonAns.value}
              onChange={(e) =>
                setFormProposed({
                  ...formProposed,
                  horizonAns: { ...formProposed.horizonAns, value: e.target.value },
                })
              }
              style={{ width: "100%", marginTop: 4, padding: 6 }}
              placeholder="ex : 4"
            />
            <StatusSelect
              value={formProposed.horizonAns.status}
              onChange={(v) =>
                setFormProposed({
                  ...formProposed,
                  horizonAns: { ...formProposed.horizonAns, status: v },
                })
              }
            />

            <hr style={{ margin: "16px 0" }} />

            {/* Acceptation obligatoire */}
            <label>
              <input
                type="checkbox"
                checked={formAccepted}
                onChange={(e) => setFormAccepted(e.target.checked)}
              />{" "}
              J’accepte ce mini-formulaire comme définition formelle.
            </label>

            {/* Refus */}
            {!formAccepted && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setFormRefused(true)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid #ccc",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Ce formulaire ne correspond pas
                </button>
              </div>
            )}

            {formRefused && (
              <div style={{ marginTop: 12 }}>
                <strong>Pourquoi ? (texte court)</strong>
                <textarea
                  value={refusalReason}
                  onChange={(e) => setRefusalReason(e.target.value)}
                  rows={3}
                  style={{ width: "100%", marginTop: 6, padding: 8 }}
                  placeholder="Expliquez brièvement ce qui ne correspond pas."
                />
    {/* Actions après refus */}
<div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
  <button
    onClick={() => {
      setRemarks([
        "Formulaire refusé : corrigez votre texte puis relancez la construction du formulaire.",
      ]);

      // On revient au texte libre
      setFormRefused(false);
      setFormAccepted(false);
      setFormProposed(null);
      // On garde la raison tapée (utile), tu peux la vider si tu préfères :
      // setRefusalReason("");
    }}
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid #ccc",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    Revenir au texte pour corriger
  </button>

  <button
    onClick={async () => {
      // On repart sur un nouveau cycle, sans obliger le visiteur à réécrire tout de suite
      setRemarks([
        "Nouveau formulaire : il est proposé à partir de votre texte.",
        refusalReason.trim()
          ? `Votre remarque a été notée : "${refusalReason.trim()}"`
          : "Si nécessaire, précisez votre remarque.",
      ]);

      setFormRefused(false);
      setFormAccepted(false);
      // IMPORTANT : on relance la construction
      await proposeForm();
    }}
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid #ccc",
      background: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    Proposer un nouveau formulaire
  </button>
</div>


              </div>
            )}
          </div>

          {/* Validation finale */}
          <div style={{ marginTop: 20 }}>
            <button
              onClick={validate}
              disabled={!formAccepted}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                background: formAccepted ? "#2e7d32" : "#9e9e9e",
                color: "#fff",
                border: 0,
                cursor: formAccepted ? "pointer" : "not-allowed",
                fontWeight: 700,
              }}
            >
              Valider la définition du problème
            </button>
          </div>
        </div>
      )}

      {/* Affichage validé */}
      {alreadyValidated && validatedPayload && (
        <div style={{ marginTop: 24 }}>
          <h3>Définition validée (formulaire)</h3>
          <pre
            style={{
              padding: 12,
              borderRadius: 12,
              background: "#f0fdf4",
              border: "1px solid #86efac",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(validatedPayload.form, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
