# EXTERNAL_ASSETS.md — Impactalyst

Every third-party request the production site makes. DSGVO accountability.

## Requests on page load (passive)

| URL / domain | Purpose | Justification | DSGVO note |
|---|---|---|---|
| (none) | — | — | Fonts self-hosted (`/fonts/*.woff2`), Bilder lokal, kein Analytics, keine Social-Embeds, keine CDN. **Beim reinen Seitenaufruf verlässt kein Visitor-Request die eigene Domain.** |

## Hosting (Auftragsverarbeiter, kein Third-Party-Request)

Kein externer Request im obigen Sinn — aber jeder Seitenaufruf trifft
zwangsläufig den Hoster, und das ist eine Auftragsverarbeitung.

| Dienst | Rolle | DSGVO note |
|---|---|---|
| Vercel (Vercel Inc., Walnut, CA, USA) | Hosting der Site, Auslieferung über Edge-Nodes, Server-Logfiles, Vercel Functions für den CMS-Login (`/auth`, `/callback`) | **Drittland USA.** AVV nach Art. 28 DSGVO, Standardvertragsklauseln (Art. 46 Abs. 2 lit. c) bzw. EU-US Data Privacy Framework. Rechtsgrundlage Art. 6 Abs. 1 lit. f. Logfiles ≤ 30 Tage. Dokumentiert in `src/datenschutz.njk` §3.1. |
| INWX (InterNetworX Ltd. & Co. KG, Berlin) | Domain-Registrar und autoritativer DNS für `impactalyst.de` | EU-Anbieter. DNS-Auflösung erzeugt keinen personenbezogenen Visitor-Request an INWX-Server im Sinne dieser Liste. |

## Requests on user action (active)

| URL / domain | Purpose | Justification | DSGVO note |
|---|---|---|---|
| `formspree.io/f/xppznnwr` | Versand des Beitritts-/Kontaktformulars | Formular-Backend (statische Seite kann nicht selbst mailen). Muster aus `jacobdigital/`. | **Drittland USA** (Formspree, Inc., Palo Alto, CA). Übermittlung von Name, E-Mail, Rolle/Branche, Nachricht **erst beim Absenden**. Rechtsgrundlage Art. 6 Abs. 1 lit. b/f + Art. 49 Abs. 1 lit. a DSGVO. Dokumentiert in `src/datenschutz.njk` §4.1. Gilt jetzt für **zwei** Formulare: Beitritt (Startseite) und Event-Anmeldung (Event-Detailseiten) — dieselbe Form-ID, unterschiedliche `_subject`. |
| `instagram.com/impactalyst.thenetwork` | Footer-Link zum Profil | Social-Präsenz | Reiner Link, **kein** eingebettetes Skript/Widget. Datenfluss erst nach aktivem Klick (dann Meta-Datenschutz). |
| `linkedin.com/in/julia-brauer-hamburg` | Link zu LinkedIn-Profilen (Team-Sektion auf `/netzwerk/`) | Persönlicher Trust-Anker | Reiner Link, **kein** eingebettetes Skript/Widget. Datenfluss erst nach aktivem Klick (dann LinkedIn-Datenschutz, LinkedIn Ireland Ltd.). |
| `mailto:julia.brauer@gmx.net` | Direkter E-Mail-Kontakt (Fehler-Fallback im Formular, Impressum, Datenschutz) | Alternative zum Formular | Kein Tracking. Adresse zentral in `src/_data/site.js`. `impactalyst.de` hat keine MX-Records, daher eine externe Mailbox. |


## Redaktionsoberfläche `/admin/` (nicht besucherseitig)

`/admin/` ist Sveltia CMS und wird ausschließlich von der Redaktion aufgerufen.
Das Bundle selbst wird **self-hosted** ausgeliefert (`node_modules/@sveltia/cms/`
→ `/admin/sveltia-cms.js`), statt es von unpkg zu laden.

**Geprüft und hier festgehalten:** Sveltia stellt zur Laufzeit trotzdem eigene
externe Requests. Self-Hosting des Bundles beseitigt das nicht.

| URL / domain | Zweck | DSGVO-Einordnung |
|---|---|---|
| `unpkg.com/@sveltia/cms/...` | Versionsprüfung + deutsche Sprachdatei | Nur bei Aufruf von `/admin/`. Keine Besucherdaten. |
| `cdn.jsdelivr.net/fontsource/...` | Schriften der CMS-Oberfläche | Nur bei Aufruf von `/admin/`. IP der Redaktion geht an jsDelivr. |
| `www.githubstatus.com/api/v2/status.json` | Status des Git-Backends | Nur bei Aufruf von `/admin/`. |

**Bewertung:** vertretbar, weil `/admin/` keine öffentliche Seite ist, per
`robots.txt` gesperrt und mit `noindex, nofollow` ausgezeichnet wird. Die
Redaktion weiß, dass sie ein Redaktionswerkzeug bedient. **Alle 11 öffentlichen
Seiten sind nachweislich frei von externen Requests** (automatisiert geprüft).

Wenn das nicht akzeptabel ist, bleibt nur, Sveltia zu ersetzen — die Requests
sind im Bundle fest verdrahtet und nicht abschaltbar.

## Build-time only (kein Visitor-Request)

| Quelle | Zweck | Hinweis |
|---|---|---|
| Google Fonts (`fonts.gstatic.com`) | woff2 zur **Build-Zeit** geladen | Dateien liegen self-hosted in `/fonts/` (latin + latin-ext). Zur Laufzeit **kein** Request an Google. |
| Pexels (`pexels.com`) | Fotografie (falls in Phase 3 genutzt) via `node fetch-photos.mjs` | Bilder lokal in `assets/img/`. Aktuell **keine** Pexels-Fotos eingebunden — die Direction trägt typografisch. Bei Nutzung: Attribution hier + im Footer ergänzen. |
| Gründerin-Foto (`brand_assets/Julia_Brauer.jpg`) | Portrait in der Gründerin-Sektion | **Client-supplied**, lokal self-hosted unter `assets/img/julia-brauer.jpg`. Kein Visitor-Request, keine Attribution nötig. |

## Offene Punkte vor Launch

- [ ] **Formspree-Form-ID** `xppznnwr` verifiziert (Test-Submit nach Deploy — kommt die Mail bei `julia.brauer@gmx.net` an?).
- [x] **Hosting-Anbieter** steht: Vercel → `src/datenschutz.njk` §3.1 ausformuliert (AVV, Drittland USA, 30 Tage Logfile-Aufbewahrung).
- [x] **Impressum-Daten** ausgefüllt (`src/impressum.njk`) — Privatperson ohne Gewerbe, daher ohne Registereintrag und USt-ID.
- [ ] Entscheiden, ob die externen Requests der Redaktionsoberfläche (siehe oben) so bleiben.
- [x] Domain `impactalyst.de` registriert (INWX). DNS auf Vercel umgestellt, `SITE_ORIGIN` gesetzt.
- [ ] **Julia gegenlesen lassen:** Impressum und Datenschutz nennen Privatanschrift und private Mailadresse öffentlich.

**Rule:** if it's not on this list, it doesn't load.
