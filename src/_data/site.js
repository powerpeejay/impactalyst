// src/_data/site.js — eine Quelle der Wahrheit für Marke, URLs und Kontakt.
//
// Das Origin bestimmt sich selbst:
//   1. SITE_ORIGIN, falls gesetzt — das ist der Schalter für impactalyst.de
//   2. sonst die Produktions-URL, die Vercel beim Build bereitstellt
//   3. sonst localhost, damit der lokale Build nicht auf eine fremde Domain zeigt

export default {
  name: 'Impactalyst',
  tagline: 'Leaders Shifting Culture.',
  claim: 'Ein offenes Leadership-Netzwerk aus Hamburg.',

  // NUR das Origin, ohne Pfad — den hängt der Build über pathPrefix an.
  origin: (
    process.env.SITE_ORIGIN ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:8080')
  ).replace(/\/$/, ''),

  lang: 'de',
  locale: 'de_DE',
  themeColor: '#23292F',

  city: 'Hamburg',
  email: 'julia.brauer@gmx.net',

  instagram: 'https://www.instagram.com/impactalyst.thenetwork/',
  founder: {
    name: 'Julia Brauer',
    role: 'Gründerin von Impactalyst',
    linkedin: 'https://www.linkedin.com/in/julia-brauer-hamburg/',
  },

  // Formspree — siehe EXTERNAL_ASSETS.md und Datenschutzerklärung
  formspree: 'https://formspree.io/f/xppznnwr',

  ogImage: '/assets/og-image.png',

  get year() {
    return new Date().getFullYear();
  },
};
