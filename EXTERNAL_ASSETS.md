# EXTERNAL_ASSETS.md — Impactalyst

Every third-party request the production site makes. DSGVO accountability.

## Requests on page load (passive)

| URL / domain | Purpose | Justification | DSGVO note |
|---|---|---|---|
| (none) | — | — | Fonts self-hosted (`/fonts/*.woff2`), Bilder lokal, kein Analytics, keine Social-Embeds, keine CDN. **Beim reinen Seitenaufruf verlässt kein Visitor-Request die eigene Domain.** |

## Requests on user action (active)

| URL / domain | Purpose | Justification | DSGVO note |
|---|---|---|---|
| `formspree.io/f/mgobrewv` | Versand des Beitritts-/Kontaktformulars | Formular-Backend (statische Seite kann nicht selbst mailen). Muster aus `jacobdigital/`. | **Drittland USA** (Formspree, Inc., Palo Alto, CA). Übermittlung von Name, E-Mail, Rolle/Branche, Nachricht **erst beim Absenden**. Rechtsgrundlage Art. 6 Abs. 1 lit. b/f + Art. 49 Abs. 1 lit. a DSGVO. Dokumentiert in `src/datenschutz.njk` §4.1. Gilt jetzt für **zwei** Formulare: Beitritt (Startseite) und Event-Anmeldung (Event-Detailseiten) — dieselbe Form-ID, unterschiedliche `_subject`. |
| `instagram.com/impactalyst.thenetwork` | Footer-Link zum Profil | Social-Präsenz | Reiner Link, **kein** eingebettetes Skript/Widget. Datenfluss erst nach aktivem Klick (dann Meta-Datenschutz). |
| `linkedin.com/in/julia-brauer-hamburg` | Link zu LinkedIn-Profilen (Team-Sektion auf `/netzwerk/`) | Persönlicher Trust-Anker | Reiner Link, **kein** eingebettetes Skript/Widget. Datenfluss erst nach aktivem Klick (dann LinkedIn-Datenschutz, LinkedIn Ireland Ltd.). |
| `mailto:hallo@impactalyst.de` | Direkter E-Mail-Kontakt (Fehler-Fallback im Formular) | Alternative zum Formular | Kein Tracking. |


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

- [ ] **Formspree-Form-ID** `mgobrewv` verifiziert (Test-Submit nach Deploy).
- [ ] **Hosting-Anbieter** wählen → Server-Logfile-Abschnitt + AVV in `datenschutz.html` §3 ergänzen.
- [ ] **Impressum-Daten** ausfüllen (`src/impressum.njk` Platzhalter `[…]`).
- [ ] Entscheiden, ob die externen Requests der Redaktionsoberfläche (siehe oben) so bleiben.
- [ ] Domain `impactalyst.de` bestätigen/registrieren (alle absoluten URLs nutzen sie bereits).

**Rule:** if it's not on this list, it doesn't load.
