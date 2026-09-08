// Gilt für JEDES Template. Zwei Aufgaben, bewusst an einer Stelle:
//
// 1. Drafts (draft: true) erzeugen weder eine Datei noch einen Collection-Eintrag.
//    Das ist das offizielle Eleventy-Draft-Rezept — `permalink: false` funktioniert
//    nur aus eleventyComputed heraus zuverlässig, nicht aus Directory-Data.
//    Mit BUILD_DRAFTS=1 werden Entwürfe zur Vorschau mitgebaut.
//
// 2. Die URL-Struktur der Content-Sammlungen. Hier statt in den Directory-Data-
//    Dateien, weil die Draft-Prüfung sonst vor dem Permalink laufen müsste.

const ROUTEN = {
  articles: (slug) => `/impulse/artikel/${slug}/`,
  recaps: (slug) => `/impulse/recaps/${slug}/`,
  // Dateiname trägt einen Datums-Präfix zur Sortierung im Editor — nicht in die URL.
  events: (slug) => `/events/${slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')}/`,
};

const istEntwurf = (data) => Boolean(data.draft) && !process.env.BUILD_DRAFTS;

export default {
  eleventyExcludeFromCollections: (data) =>
    istEntwurf(data) ? true : data.eleventyExcludeFromCollections,

  permalink: (data) => {
    if (istEntwurf(data)) return false;
    // Eleventy tastet computed-Funktionen zuerst mit einem Proxy ab, um
    // Abhängigkeiten zu finden — data.tags ist dabei ein Symbol. Und im
    // Normalfall ist tags ein Array, kein String. Beides abfangen.
    const tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === 'string'
        ? [data.tags]
        : [];
    const tag = tags.find((t) => typeof t === 'string' && ROUTEN[t]);
    return tag ? ROUTEN[tag](data.page.fileSlug) : data.permalink;
  },
};
