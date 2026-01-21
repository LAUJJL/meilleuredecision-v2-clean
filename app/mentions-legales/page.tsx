"use client";

export default function MentionsLegalesPage() {
  return (
    <main
      style={{
        padding: 40,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Mentions légales</h1>

      <p>
        Site édité par :
        <br />
        <strong>Jean-Jacques Laublé</strong>
      </p>

      <p>
        Ce site ne collecte aucune donnée personnelle.
        <br />
        Les données saisies par l’utilisateur restent stockées localement sur son appareil.
      </p>

      <p>
        <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
          ← Retour à l’accueil
        </a>
      </p>
    </main>
  );
}
