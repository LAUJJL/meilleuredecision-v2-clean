"use client";

export default function ContactPage() {
  return (
    <main
      style={{
        padding: 40,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Contact</h1>

      <p>
  Pour toute question ou remarque concernant ce site, vous pouvez écrire à :
</p>

<p>
  <strong>Jean-Jacques Laublé</strong><br />
  <a href="mailto:sddp4119@gmail.com">
   sddp4119@gmail.com
  </a>
</p>


      <p>
        <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
          ← Retour à l’accueil
        </a>
      </p>
    </main>
  );
}
