// eleventy.config.js — Impactalyst
//
// Build-Layer über handgeschriebenem HTML/CSS/JS. Es kommt KEIN Client-JS hinzu:
// Eleventy läuft ausschließlich zur Build-Zeit, der Output ist statisches HTML.
//
//   npx @11ty/eleventy            -> baut nach _site/
//   npx @11ty/eleventy --serve    -> localhost:8080
//
// Deployment: Vercel baut bei jedem Push auf main. Die Seite liegt dort im
// Wurzelverzeichnis, deshalb pathPrefix "/" — der Unterordner-Präfix der alten
// GitHub-Pages-URL entfällt.

import { HtmlBasePlugin } from '@11ty/eleventy';
import eleventyNavigationPlugin from '@11ty/eleventy-navigation';

const PATH_PREFIX = process.env.ELEVENTY_PATH_PREFIX || '/';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // Setzt pathPrefix in alle wurzel-relativen URLs des fertigen HTML ein.
  // Nötig für Pfade, die NICHT durch den `url`-Filter laufen — vor allem
  // Bilder und Links, die im CMS in Markdown geschrieben werden
  // (`/assets/img/uploads/…`). Bereits präfixte URLs lässt der Plugin in Ruhe.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  /* ---- Passthrough -------------------------------------------------------
     Objekt-Syntax: Schlüssel sind projekt-root-relativ. Assets bleiben dort
     liegen, wo fetch-photos.mjs und generate-favicon.mjs sie erwarten.        */
  eleventyConfig.addPassthroughCopy({
    css: 'css',
    js: 'js',
    fonts: 'fonts',
    assets: 'assets',
    'favicon.svg': 'favicon.svg',
    'favicon.ico': 'favicon.ico',
    'apple-touch-icon.png': 'apple-touch-icon.png',
    // Redaktionsoberfläche (Sveltia CMS) — per robots.txt und noindex ausgeschlossen.
    admin: 'admin',
    // Sveltia-Bundle selbst hosten statt via unpkg: diese Site lädt nichts
    // von fremden Servern (CLAUDE.md §10). npm update @sveltia/cms zieht die
    // neue Version, der nächste Build kopiert sie mit.
    'node_modules/@sveltia/cms/dist/sveltia-cms.js': 'admin/sveltia-cms.js',
  });

  // Doku im Content-Ordner ist keine Seite.
  eleventyConfig.ignores.add('src/content/**/README.md');

  eleventyConfig.addWatchTarget('./css/');
  eleventyConfig.addWatchTarget('./js/');

  /* ---- Filter ----------------------------------------------------------- */

  // "14. Juni 2026"
  eleventyConfig.addFilter('dateDe', (value) =>
    new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Berlin',
    }).format(new Date(value))
  );

  // "14.06.2026" — kompakt für Listenzeilen
  eleventyConfig.addFilter('dateShort', (value) =>
    new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Berlin',
    }).format(new Date(value))
  );

  // <time datetime="2026-06-14">
  eleventyConfig.addFilter('isoDate', (value) =>
    new Date(value).toISOString().slice(0, 10)
  );

  // Lesezeit aus dem gerenderten HTML. 200 WpM ist der übliche Richtwert für
  // deutschsprachigen Fließtext; gerundet, mindestens 1.
  eleventyConfig.addFilter('lesezeit', (html) => {
    const woerter = String(html).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    return Math.max(1, Math.round(woerter / 200));
  });

  // Liegt das Datum vor heute? Tagesgenau — ein Event bleibt an seinem
  // eigenen Tag noch "kommend".
  eleventyConfig.addFilter('istVergangen', (value) => {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    return new Date(value) < heute;
  });

  // Andere Einträge derselben Sammlung, ohne den gerade offenen.
  eleventyConfig.addFilter('andereEintraege', (collection, aktuelleUrl, anzahl) =>
    (collection || []).filter((i) => i.url !== aktuelleUrl).slice(0, anzahl || 3)
  );

  // Absolute URL für canonical / og:image / JSON-LD
  eleventyConfig.addFilter('absoluteUrl', function (path, base) {
    return new URL(path, base).href;
  });

  /* ---- Collections ------------------------------------------------------
     Alle Listen der Site lesen aus diesen Collections. Ist eine leer, blendet
     sich die zugehörige Rubrik samt Navigationspunkt selbst aus — das ist die
     Mechanik hinter "kein Coming-soon-Friedhof".                             */

  const byDateDesc = (a, b) => new Date(b.data.date) - new Date(a.data.date);
  const byDateAsc = (a, b) => new Date(a.data.date) - new Date(b.data.date);

  // Tagesgenau vergleichen: ein Event bleibt an seinem eigenen Tag "kommend".
  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  eleventyConfig.addCollection('fachartikel', (api) =>
    api.getFilteredByTag('articles').sort(byDateDesc)
  );

  eleventyConfig.addCollection('eventRecaps', (api) =>
    api.getFilteredByTag('recaps').sort(byDateDesc)
  );

  eleventyConfig.addCollection('ressourcen', (api) =>
    api.getFilteredByTag('resources').sort((a, b) =>
      String(a.data.title).localeCompare(String(b.data.title), 'de')
    )
  );

  eleventyConfig.addCollection('teamMitglieder', (api) =>
    api.getFilteredByTag('team').sort(
      (a, b) => (a.data.reihenfolge ?? 99) - (b.data.reihenfolge ?? 99)
    )
  );

  // Kommende Events zuerst und aufsteigend — das nächste Treffen steht oben.
  eleventyConfig.addCollection('eventsKommend', (api) =>
    api.getFilteredByTag('events')
      .filter((item) => new Date(item.data.date) >= startOfToday())
      .sort(byDateAsc)
  );

  eleventyConfig.addCollection('eventsVergangen', (api) =>
    api.getFilteredByTag('events')
      .filter((item) => new Date(item.data.date) < startOfToday())
      .sort(byDateDesc)
  );

  // Sammel-Flag: hat "Impulse & Methoden" überhaupt Inhalt?
  eleventyConfig.addCollection('impulseVorhanden', (api) =>
    ['articles', 'recaps', 'resources'].some((t) => api.getFilteredByTag(t).length > 0)
      ? [true]
      : []
  );

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    pathPrefix: PATH_PREFIX,
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    templateFormats: ['njk', 'md', 'html'],
  };
}
