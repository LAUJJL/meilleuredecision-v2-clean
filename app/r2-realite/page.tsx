// app/r2-realite/page.tsx
"use client";

export default function R2RealitePage() {
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
            href="/r2"
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
            ← Retour au choix R2
          </a>
        </div>

        {/* Droite (bleu) */}
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/r2"
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
            href="/r3-ajuster-objectif"
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

      <h1 style={{ marginTop: 0 }}>R2-A — Fixer la réalité (entrée et sortie)</h1>

      <section style={{ marginTop: 18, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ margin: 0 }}>
          Ici, on fixe la réalité d’abord : on décrit les deux <b>facteurs</b> (entrée et sortie) et on indique
          s’ils sont <b>fixes</b> ou <b>variables</b>. Ensuite, en R3, on pourra ajuster l’objectif à cette
          réalité.
        </p>
      </section>

      {/* Entrée */}
      <section style={{ marginTop: 24 }}>
        <h2>1. Facteur d’entrée</h2>

        <label>
          Nom du facteur d’entrée<br />
          <input type="text" style={{ width: "100%", marginTop: 6 }} />
        </label>

        <div style={{ marginTop: 12 }}>
          <label>
            Valeur (par unité de temps)<br />
            <input type="number" style={{ width: "100%", marginTop: 6 }} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          Statut&nbsp;:
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="statutEntree" />
              Fixe
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="statutEntree" />
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
          <input type="text" style={{ width: "100%", marginTop: 6 }} />
        </label>

        <div style={{ marginTop: 12 }}>
          <label>
            Valeur (par unité de temps)<br />
            <input type="number" style={{ width: "100%", marginTop: 6 }} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          Statut&nbsp;:
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="statutSortie" />
              Fixe
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="radio" name="statutSortie" />
              Variable
            </label>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 32, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ margin: 0 }}>
          (Squelette minimal) Les effets sur le stock final et l’évaluation de l’objectif seront ajoutés plus
          tard.
        </p>
      </section>

      {/* Navigation bas (bleu uniquement) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/r2"
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
            href="/r3-ajuster-objectif"
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
