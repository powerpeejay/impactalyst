# Impactalyst

Website des Leadership-Netzwerks **Impactalyst** (Hamburg) — „Leaders Shifting Culture."

**Live:** Vercel (Deployment bei jedem Push auf `main`)
**Direction:** C — „Ego ablegen" (bold · statement-typography), siehe `DESIGN.md`

Statische Site, gebaut mit Eleventy. Kein Framework im Browser, kein Tracking,
keine externen Requests auf Besucherseiten, Schriften self-hosted.

---

## Schnellstart

```bash
npm install
npm run dev        # http://localhost:8080/
```

| Befehl | Was er tut |
|---|---|
| `npm run dev` | Eleventy mit Live-Reload auf Port 8080 |
| `npm run build` | Baut nach `_site/` |
| `npm run clean` | Löscht `_site/` |
| `npm run test:oauth` | Testet die OAuth-Functions (ohne Netz, ohne Vercel) |
| `npm run audit` | Externe Requests · axe AA · Überlauf · Touch-Targets (Dev-Server muss laufen) |
| `npm run shoot:all` | Screenshots bei 375 / 768 / 1024 / 1440 px |

### Veröffentlichen

**Push auf `main` genügt.** Vercel installiert, baut mit Eleventy und deployt.
Kein manueller Schritt, kein `.publish/`-Klon mehr.

```bash
npm run dev & npm run audit                                    # vorher prüfen
git add -A && git commit -m "…" && git push
```

Die Build-Konfiguration steht in `vercel.json` (`buildCommand`,
`outputDirectory: _site`). Die Produktions-URL kommt aus `site.origin`: gesetzt
wird sie über die Environment Variable `SITE_ORIGIN` (`https://impactalyst.de`),
ohne sie fällt der Build auf `VERCEL_PROJECT_PRODUCTION_URL` zurück und lokal auf
`http://localhost:8080`. Alle absoluten URLs — canonical, `og:`-Tags, Sitemap,
robots.txt und die JSON-LD-Blöcke — hängen an dieser einen Variable.

---

## Aufbau

```
src/
  _data/site.js              Marke, URLs, Kontakt — eine Quelle der Wahrheit
  _data/eleventyComputed.js  URL-Struktur der Sammlungen + draft-Mechanik
  _includes/layouts/         base · page · article · event
  _includes/partials/        header · footer · join-band · entry-row · seo · schema-*
  content/                   ALLE Inhalte (siehe src/content/README.md)
  index.njk                  Startseite — hier lebt das Beitritts-Formular
  events.njk impulse.njk …   Bereichs- und Listenseiten
admin/                       Sveltia CMS (Redaktion)
css/ js/ fonts/ assets/      unverändert per Passthrough kopiert
vercel.json                  Build- und Header-Konfiguration für Vercel
_fixtures/                   erfundene Demo-Inhalte (nicht im Repo)
```

### Informationsarchitektur

```
/                          Startseite (Hero · Manifest · Gründerin · Werte · Beitreten)
/vision/                   Vision & Manifest
/events/                   Events & Meetups  ← „Lokale Meetups"
/events/<slug>/            Einzel-Event + Anmeldung
/impulse/                  Impulse & Methoden (Hub)
/impulse/artikel/          Fachartikel        → /impulse/artikel/<slug>/
/impulse/ressourcen/       Ressourcen-Bibliothek
/impulse/recaps/           Event-Recaps       → /impulse/recaps/<slug>/
/netzwerk/                 Netzwerk & Team
/impressum/  /datenschutz/
```

**Leere Rubriken existieren nicht.** Gibt es keine Events, wird weder
`/events/` gebaut noch der Navigationspunkt gezeigt. Technisch über
Eleventy-Pagination: leere Datenquelle = keine Seite. Beim aktuellen Stand
(keine Inhalte) stehen daher nur **Vision & Manifest** und **Netzwerk & Team**
in der Navigation.

---

## Inhalte pflegen

Alles unter `src/content/`. Der Frontmatter-Vertrag steht in
`src/content/README.md`, die Formularfelder in `admin/config.yml` — beide
beschreiben dieselben Felder und müssen zusammen geändert werden.

`draft: true` in einer Datei ⇒ weder Seite noch Listeneintrag.
Zur Vorschau: `BUILD_DRAFTS=1 npm run dev`.

### Sveltia CMS

```bash
npm run dev
```

Dann in **Chrome, Edge oder Brave** (nicht Firefox, nicht Safari):
`http://localhost:8080/admin/` öffnen →
**„Mit lokalem Repository arbeiten"** → im Dialog den Projektordner
`Desktop/impactalyst` wählen → Zugriff erlauben.

Kein Login, kein OAuth, kein Proxy-Server. Sveltia schreibt über die File
System Access API direkt in `src/content/`. Der Dev-Server baut sofort neu.

Warum nur Chromium: die File System Access API gibt es in Firefox und Safari
nicht. In Brave zusätzlich `brave://flags/#file-system-access-api` aktivieren.

### Damit Julia aus dem Netz arbeiten kann

Sveltia hat **kein eigenes Benutzersystem** — keinen Admin-User, kein Passwort,
keine Nutzerverwaltung. Die Anmeldung *ist* GitHub. Julias Berechtigung kommt
allein daraus, dass sie Collaborator mit Schreibrecht auf diesem Repo ist.

Der Server-Teil liegt in `api/` und läuft als Vercel Function im selben
Projekt — kein Cloudflare, kein zweiter Dienst. Er existiert nur, weil das CMS
im Browser läuft und das OAuth Client Secret nicht halten darf; der Tausch von
Authorization Code gegen Access Token muss serverseitig passieren.

| Datei | Rolle |
|---|---|
| `api/auth.js` | `/auth` → leitet zu GitHub, setzt den CSRF-Cookie |
| `api/callback.js` | `/callback` → tauscht Code gegen Token, gibt ihn per `postMessage` zurück |
| `api/_oauth.js` | gemeinsame Helfer (Scope, Domain-Whitelist, Antwort-HTML) |

Portiert aus [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
(MIT), das dort als Cloudflare Worker ausgeliefert wird. Die Logik nutzt nur
Web-Standard-APIs und läuft deshalb unverändert auf Vercel.

**Einrichtung — einmalig:**

1. **GitHub OAuth App** anlegen (Settings → Developer settings → OAuth Apps):
   - Homepage URL: `https://impactalyst.de`
   - Authorization callback URL: `https://impactalyst.de/callback`
   - Muss zu `base_url` in `admin/config.yml` passen: `api/auth.js` schickt
     bewusst **kein** `redirect_uri`, GitHub nimmt also die hier hinterlegte URL
2. **Environment Variables in Vercel** setzen (Production):
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET` (als Secret markieren)
   - `SITE_ORIGIN` = `https://impactalyst.de`
   - `ALLOWED_DOMAINS` = `impactalyst.de,www.impactalyst.de,impactalyst.vercel.app`
     — ohne diese Variable fällt der Code auf die Vercel-Produktionsdomain
     zurück; ein leerer Wert würde jede Domain zulassen
3. **Julia einladen:** Repo → Settings → Collaborators → **Write**

Danach: `/admin/` → „Mit GitHub anmelden" → schreiben → Veröffentlichen →
Commit auf `main` → Vercel baut → in etwa einer Minute live.

`npm run test:oauth` prüft die Kette lokal: Weiterleitung, CSRF-Schutz,
Domain-Whitelist, Token-Tausch und dass das Secret den Server nie verlässt.

---

## Was bewusst fehlt

- **Newsletter-Versand.** Kein ESP, kein Double-Opt-In. Der Knoten bleibt in
  der IA; Interesse wird vorerst über das Beitritts-Formular erfasst.
- **n8n-Publishing-Pipeline** (Mail an `support@jacobdigital.de` → GitHub).
  Eigenes Folgeprojekt. Voraussetzung ist ein GitHub-Remote. Vier Härtungen
  sind vorab festgehalten: Pull Request statt Push, Shared Secret plus
  DKIM-Prüfung, ein expliziter Bildverarbeitungs-Schritt, und ein LLM, das
  strukturiert statt umzuschreiben (sonst frisst es die Markenstimme).
- **E-Mail auf der Domain.** `impactalyst.de` hat keine MX-Records; Kontakt
  läuft über `julia.brauer@gmx.net` (`src/_data/site.js`). Kommt später eine
  Domain-Mailbox, ändert sich nur diese eine Zeile — alle Anzeigestellen hängen
  daran.

## Offene Punkte vor Launch

Siehe `EXTERNAL_ASSETS.md` → „Offene Punkte vor Launch". Kurzfassung:
Impressum-Platzhalter ausfüllen, Formspree-Form-ID testen, Hosting-Abschnitt
in der Datenschutzerklärung ergänzen.
