# DESIGN.md — Impactalyst

> Per-client visual system. Read by any AI agent before generating UI.
> Format follows the Google Stitch DESIGN.md spec, adapted for DACH SME projects.
> Pair with `CLAUDE.md` (build rules) in the project root.
> Locked direction: **C — „Ego ablegen"** (bold · statement-typography). See `directions/_archive/` for the alternatives.

---

## 1. Visual Theme & Atmosphere

**Direction:** `bold · statement-typography` (cross-pollination aus `exaggerated-minimalism` × `editorial`)
**Mood (3 words):** radikal-ehrlich, kompromisslos, hochwertig-dunkel
**Density:** controlled — wenige, große Gesten; viel dunkler Atemraum
**One-line philosophy:** „Schluss mit dem Business-Theater" wird zur Typo-Geste — eine Seite, die selbst Haltung zeigt statt sie zu behaupten.

**Reference anchors** (sites whose feel we're aiming at, not copying):
- https://www.off-white.com — riesige Typo bricht das Grid; *nur* die Mut-zur-Größe übernommen, Mode-Maximalismus verworfen.
- https://motionsites.ai — eine orchestrierte Reveal-Sequenz statt Streu-Effekten.
- https://www.typewolf.com — Beleg, dass Grotesque + Mono mutig *und* lesbar sein kann.

---

## 2. Color Palette & Roles

Define semantic role first, then the value. Hex literals never appear in markup — only CSS variables.

| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#23292F` | Base canvas (tiefes Navy) |
| `--color-surface` | `#2B3340` | Elevated surface (Marken-Navy) |
| `--color-surface-2` | `#333C49` | Secondary surface |
| `--color-border` | `#3F4855` | Hairlines, dividers |
| `--color-text` | `#F4F1EA` | Primary text (Creme auf dunkel) |
| `--color-text-muted` | `#9AA2AD` | Secondary text |
| `--color-accent` | `#D2A954` | Primary accent (CTA, Streich-Strich, Icon) |
| `--color-accent-hover` | `#E0BC6E` | Accent hover state |
| `--color-focus-ring` | `#F4F1EA` | Keyboard focus outline (Creme, max. Kontrast auf dunkel) |
| `--color-invert-bg` | `#F4F1EA` | Heller Invert-Block (Manifest-Atempause) |
| `--color-invert-text` | `#23292F` | Text im Invert-Block |

**Rules:**
- Dominant: `--color-bg` + `--color-text`. ~85% der Seite ist Navy-auf-Creme-Typo.
- Accent (Gold) auf max. ~5% jedes Viewports — CTA, Streich-Strich, Icon-Wasserzeichen, Mono-Labels.
- Gold **nie** für Fließtext oder große Flächen.
- Genau **ein** Invert-Block (hell) als Dramaturgie-Atempause — nicht inflationär einsetzen.
- Kontrast Creme `#F4F1EA` auf Navy `#23292F` ≈ 11:1 → WCAG AAA. Gold `#D2A954` auf Navy ≈ 6.3:1 → AA für Text, AAA für large/UI.

---

## 3. Typography

**Pairing:** Bricolage Grotesque (Display) / Geist (Body) — JetBrains Mono (Meta-Labels)
**Source:** Self-hosted woff2 in `/fonts/`. **Never** load from `fonts.googleapis.com`.

| Style | Family | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| Display (h1) | Bricolage Grotesque | clamp(3.5rem, 11vw, 8rem) | 800 | -0.04em | 0.98 |
| Heading (h2) | Bricolage Grotesque | clamp(2rem, 5vw, 3.4rem) | 700 | -0.03em | 1.04 |
| Subheading (h3) | Bricolage Grotesque | 1.35rem | 700 | -0.02em | 1.15 |
| Body | Geist | 1.0625rem | 400 | 0 | 1.65 |
| Lead | Geist | clamp(1.05rem, 1.6vw, 1.28rem) | 400 | 0 | 1.65 |
| Small / Meta | Geist | 0.875rem | 500 | 0.01em | 1.5 |
| Label / Eyebrow | JetBrains Mono | 0.76rem | 500 | 0.14em (uppercase) | 1.4 |

**Rules:**
- 3 Familien (Display + Body + Mono-Akzent) — Mono **nur** für Labels/Meta, nie für Fließtext.
- Weights gesamt: Bricolage 700/800, Geist 400/500, Mono 500 = 5 Schnitte, alle als Subset.
- Body measure: 46–65ch (kürzer als üblich — passt zur controlled-density-Geste).
- „IMPACT" immer 800, „ALYST" 400 (Wortmarken-Logik aus Logo).

---

## 4. Component Stylings

### Buttons

| Variant | Background | Text | Border | Hover | Notes |
|---|---|---|---|---|---|
| Primary | `--color-accent` | `#23292F` | none | `--color-accent-hover` + `translateY(-2px)` | CTA only, max 1 pro Viewport |
| Secondary | transparent | `--color-text` | 1px `--color-border` | `--color-surface-2` background | Supporting actions |
| Ghost | transparent | `--color-text-muted` | none | `--color-text` color | Tertiär; im Mono-Stil mit `→`-Präfix |

All buttons:
- Padding: `1rem 2.1rem`
- Border-radius: `2px` (kantig — passt zur „Klare Kante / Statement"-Haltung)
- Font: Geist 500, 1rem (Ghost: JetBrains Mono 500, 0.82rem)
- Transition: `transform 150ms ease-out, background-color 200ms ease-out`
- `:focus-visible` → 2px outline in `--color-focus-ring` (Creme), 3px offset
- `cursor: pointer` auf allem Klickbaren

### Cards

- Background: `--color-surface` (`#2B3340`)
- Border: 1px `--color-border` ODER eine Schatten-Ebene (nie beides)
- Padding: `1.5rem` mobile, `2rem` desktop
- Border-radius: `2px` (Button-Skala folgen)
- Sparsam einsetzen — Karten sind nicht das Leitmotiv dieser Direction.

### Inputs (Beitritts-Formular — primäres Ziel)

- Background: `--color-surface-2` (`#333C49`)
- Border: 1px `--color-border`, focus → 1px `--color-accent`
- Text: `--color-text`, Placeholder: `--color-text-muted`
- Padding: `0.85rem 1rem`
- Label: immer vorhanden + assoziiert (`<label for>`), nie placeholder-as-label
- Radius: `2px`

### Navigation

- Height: 64px desktop, 56px mobile
- Background: `--color-bg` mit `backdrop-filter: blur(12px)` ab Scroll
- Nav-Links: JetBrains Mono, lowercase, `--color-text-muted` → `--color-accent` on hover
- Border-bottom: erscheint erst beim Scrollen, 1px `--color-border`
- Mobile: Hamburger ab 768px → Full-screen-Overlay auf `--color-surface`

---

## 5. Layout Principles

**Spacing scale (8pt rhythm):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160px

**Grid:**
- Container max-width: 1180px
- Gutter: 24px mobile, 32px desktop
- Columns: 12 desktop, 4 mobile

**Section padding:**
- Vertical: 96px desktop, 64px mobile (Minimum)
- Hero: 120–160px desktop

**Whitespace philosophy:** controlled — große dunkle Flächen sind Teil der Geste, nicht „leer".
**Asymmetry:** ja — Hero linksbündig, Statement-Typo bricht nach links; Logo-Icon-Wasserzeichen überlappt rechts aus dem Container.

**Section-Dramaturgie (hell/dunkel als Erzählung):**
1. **Hero** (dunkel) — „~~Ego~~ ablegen." Statement + Lead + CTA + Icon-Wasserzeichen
2. **Manifest** (dunkel) — die radikal-ehrliche Haltung, 2–3 kurze Absätze, Pull-Quote in Gold-Linie
3. **Invert-Block** (hell, Creme) — *eine* Atempause: „Wofür wir stehen" / Werte (Offenheit, kollektives Lernen, echte Verantwortung) als ruhige Liste, kein Icon-Trio
4. **Beitreten** (dunkel) — kontraststarker CTA-Block + Beitritts-Formular (primäres Ziel)
5. **Footer** (dunkel, `--color-surface`) — Wortmarke, Instagram, Impressum, Datenschutz, Pexels-Attribution

---

## 6. Depth & Elevation

Three explicit layers. No flat-everything, no shadow-everything.

| Layer | Surface | Shadow | Use |
|---|---|---|---|
| Base | `--color-bg` | none | Page background |
| Elevated | `--color-surface` | `0 1px 3px rgba(0,0,0,0.25)` | Cards, Formular-Panel |
| Floating | `--color-surface` | `0 16px 40px -12px rgba(0,0,0,0.45)` | Sticky nav on scroll, Mobile-Overlay |

**Texture:**
- Grain/Noise als inline-SVG auf Navy, ~5% Opacity (Tiefe ohne Bild).
- *Ein* sehr weiches radiales Gold-Glow (`radial-gradient`, ~16% Alpha) hinter dem Hero-Statement — kein Neon, kein zweites Glow auf der Seite.

---

## 7. Do's and Don'ts

**Do**
- Gold sparsam — der Streich-Strich auf „Ego" ist die teuerste Geste, sie muss verdient wirken.
- Sektionen mit Typo führen, Bild nur stützen.
- Echte, entsättigte Fotografie von Gesprächen/Menschen statt Stock-Lächeln.
- CTAs verb-first: „Teil des Netzwerks werden", nie „Hier klicken".
- Hell/dunkel-Wechsel als bewusste Dramaturgie (genau ein Invert-Block).

**Don't**
- Gradients auf Text oder großen Flächen (das eine Hero-Glow ausgenommen).
- Emoji als Icons. Lucide / Heroicons SVG only. (Das 🎭 aus dem Briefing bleibt Konzept, nicht UI-Element.)
- Mehr als 2 Schatten-Ebenen.
- Künstliche Verknappung („nur X Plätze", Countdown, Members-only-Gehabe) — verstößt gegen die Markenhaltung (INTAKE §6).
- Card-Grids, Icon-Trios, Testimonial-Carousel, Pricing-Trio — die ganze Anti-Slop-Liste aus CLAUDE.md §7.

---

## 8. Responsive Behavior

**Breakpoints:** 375 / 768 / 1024 / 1440px

**Touch targets:** ≥ 44×44px auf Viewports ≤ 768px.

**Collapsing strategy:**
- Statement-Typo skaliert via `clamp()` — keine separate Mobile-Copy.
- Streich-Strich auf „Ego" muss bei Umbruch auf Mobile korrekt sitzen (Pseudo-Element folgt der Zeile; bei Wrap testen).
- Icon-Wasserzeichen: auf Mobile kleiner + weiter in die Ecke, opacity ggf. auf ~5% reduzieren (darf Text nie stören).
- Horizontal nav → Hamburger ab 768px.
- 2-Spalten (Manifest/Invert) → 1 Spalte ab 768px.
- Hero-Foto (falls genutzt): `<picture>` mit eigenem Mobile-Crop.

---

## 9. Agent Prompt Guide

**Quick color reference for prompts:**
- Background: tiefes Navy `#23292F`
- Surface: Marken-Navy `#2B3340`
- Accent: Gold `#D2A954`
- Text: Creme `#F4F1EA`

**Ready-to-use prompts:**

> „Baue den Hero für Impactalyst. Direction `bold · statement-typography`. H1 ‚Ego ablegen.' in Bricolage Grotesque 800 bei clamp(3.5rem, 11vw, 8rem), tracking -0.04em, line-height 0.98. ‚Ego' mit goldenem Streich-Strich als Pseudo-Element (rotiert -4deg, `--color-accent`), nicht `text-decoration`. Logo-Icon (offener Kreis + Pfeil) als SVG-Wasserzeichen rechts, opacity 7%. Eyebrow in JetBrains Mono uppercase mit `//`-Präfix. Ein Primary-CTA in `--color-accent`. Weiches radiales Gold-Glow hinter der Headline. Siehe DESIGN.md §4 für Button-Spec."

> „Baue den Beitritts-Block (primäres Ziel). Dunkle Sektion, Überschrift in Bricolage 700, darunter ein schlankes Formular: Name, E-Mail, Branche/Rolle, kurze Nachricht. Inputs auf `--color-surface-2`, Labels immer sichtbar + assoziiert. Submit = Primary-CTA ‚Teil des Netzwerks werden'. Kein Verknappungs-Text, keine Plätze-Zähler."

> **Formular-Backend = Formspree (AJAX)** — identisches Muster wie `jacobdigital/`: `<form action="https://formspree.io/f/<FORM_ID>" method="POST">` mit Hidden-Fields `_language=de` + `_subject`, dazu JS-Progressive-Enhancement (`e.preventDefault()` → `fetch(form.action, {method:'POST', headers:{Accept:'application/json'}, body:new FormData(form)})` → Success-Block einblenden, bei Fehler Button zurücksetzen + Fallback-Mailto-Hinweis). Ohne JS funktioniert der native POST weiterhin.
> **TODO Peter:** dedizierte Formspree-Form-ID für Impactalyst anlegen und in `index.html` eintragen (Platzhalter `FORM_ID` im Build).
> **DSGVO:** Formspree ist ein externer (US-)Auftragsverarbeiter → Eintrag in `EXTERNAL_ASSETS.md` **und** in der Datenschutzerklärung (Datenübermittlung in Drittland, Rechtsgrundlage Art. 6 Abs. 1 lit. b/f). *Hinweis: bei jacobdigital fehlt dieser Datenschutz-Eintrag — hier machen wir es korrekt.*

> „Baue den Invert-Block ‚Wofür wir stehen'. Heller Creme-Hintergrund (`--color-invert-bg`), Text Navy (`--color-invert-text`) — die einzige helle Sektion der Seite. Werte (Offenheit, kollektives Lernen, echte Verantwortung, Kulturwandel) als ruhige editoriale Liste, KEIN Icon-Trio, KEIN Card-Grid. Eine Pull-Quote in Gold-Linie."

---

## 10. Brand Identity Artifacts

### Logo

- **Client-supplied (Raster):** `brand_assets/logo.jpg`, `brand_assets/logo_banner.jpg`. **Kein SVG vorhanden.**
- **Header-Default:** typografisches Wordmark — „**IMPACT**ALYST" (IMPACT = Bricolage 800, ALYST = 400, weites Tracking) + SVG-Nachbau des Icons (offener Kreis mit Aufbruchs-Pfeil nach oben-rechts) links davor. SVG ist im C-Preview bereits prototypisiert (`directions/previews/C.html`, `.watermark` svg) — für Header verkleinern + auf `--color-accent` setzen.
- **Empfehlung:** Icon als sauberes `assets/logo.svg` vektorisieren (Phase 3) — schärfer + performanter als das JPG.
- **Sizing:** Header-Wordmark 1.1rem, Icon ~28px. Footer-Wordmark 1rem.

### Favicon

- **Generated default:** `node generate-favicon.mjs` — liest `--color-accent` (`#D2A954`) als Background, `--color-bg` (Navy) als Foreground, Letter „I". Output `favicon.svg`.
- **Besser (empfohlen):** das vektorisierte Icon (Kreis+Pfeil) in Gold auf Navy als `favicon.svg` — markentreuer als ein Buchstabe. In Phase 3 erstellen.
- **Fallback-Set:** falls `sharp` im master `node_modules` → zusätzlich `favicon.ico` + `apple-touch-icon.png` (180×180).
- **HTML head:**
  ```html
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  ```

### Photography

**Source-Hierarchie:**
1. **Client-supplied** → keine vorhanden (INTAKE §5). Später durch echte Event-/Netzwerk-Fotos ersetzbar.
2. **Pexels (DSGVO-clean self-hosted)** via `node fetch-photos.mjs` → `assets/img/` — **Default für Phase 3.**
3. **placehold.co** nur Phase-1-Mockups — niemals Production.

**Pexels-Queries (Start, Matrix-Zeile „Local SaaS / B2B service", angepasst an Leadership-Kontext):**
- `hero` (optional, sparsam): „people in deep conversation natural light", portrait/landscape — entsättigt, hoher Kontrast.
- `manifest`: „diverse leaders meeting candid", landscape — echte Gespräche, keine Anzug-Handschläge.
- *Art-Direction:* entsättigt/duotone-tauglich, hoher Kontrast (passt auf dunklen Grund), niemals Stock-Lächeln oder Developer-am-Laptop. **Disziplin:** lieber 2–4 sehr passende Fotos als 20 verstreute. Diese Direction trägt auch **ganz ohne Foto** (Typo-Geste ist der Held).

**Format-Rules:** JPG large (≈1880px), `width`/`height` Pflicht, `loading="lazy"` unter dem Fold, `fetchpriority="high"` auf Hero (falls genutzt). Attribution automatisch in `EXTERNAL_ASSETS.md` + kompakt im Footer.

---

## Sign-off

**Client:** Impactalyst
**Direction locked:** 2026-06-14 (C — „Ego ablegen", bold · statement-typography)
**Last updated:** 2026-06-14
