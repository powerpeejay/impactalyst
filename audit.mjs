#!/usr/bin/env node
// audit.mjs — die Prüfungen aus CLAUDE.md §13, automatisiert.
//
//   npm run dev      (Terminal 1)
//   npm run audit    (Terminal 2)
//
// Prüft gegen den laufenden Dev-Server:
//   1. Externe Requests   — auf Besucherseiten muss es null geben (DSGVO)
//   2. Barrierefreiheit   — axe, WCAG 2.1/2.2 AA, zwei Viewports
//   3. Horizontaler Überlauf bei 375 / 768 / 1024 / 1440 px
//   4. Touch-Targets ≥ 44px (eigenständige Links; Inline-Links sind ausgenommen)
//
// /admin/ wird bewusst NICHT geprüft: Sveltia lädt dort von unpkg und jsdelivr,
// das ist in EXTERNAL_ASSETS.md dokumentiert und akzeptiert.

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.AUDIT_BASE || 'http://localhost:8080';
const HOST = new URL(BASE).host;

// Routen aus der Sitemap ziehen, damit neue Inhalte automatisch mitgeprüft werden.
async function routen(page) {
  const res = await page.goto(`${BASE}/sitemap.xml`);
  if (!res || !res.ok()) throw new Error(`sitemap.xml nicht erreichbar unter ${BASE}`);
  const xml = await res.text();
  const pfade = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  // Rechtstexte stehen wegen noindex nicht in der Sitemap, gehören aber geprüft.
  return [...new Set([...pfade, '/impactalyst/impressum/', '/impactalyst/datenschutz/'])].sort();
}

const browser = await chromium.launch();
const seite = await browser.newPage();
const PFADE = await routen(seite);
await seite.close();
console.log(`${PFADE.length} Routen aus sitemap.xml + Rechtstexte\n`);

let fehler = 0;

// --- 1. Externe Requests ----------------------------------------------------
{
  let treffer = 0;
  for (const pfad of PFADE) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const extern = [];
    p.on('request', (r) => {
      const u = new URL(r.url());
      if (u.host !== HOST && u.protocol !== 'data:' && u.protocol !== 'blob:') extern.push(r.url());
    });
    await p.goto(new URL(pfad, BASE).href, { waitUntil: 'networkidle' });
    if (extern.length) {
      console.log(`  ✗ ${pfad}: ${extern.join(', ')}`);
      treffer += extern.length;
    }
    await ctx.close();
  }
  fehler += treffer;
  console.log(treffer === 0 ? '1. Externe Requests: keine ✓' : `1. Externe Requests: ${treffer} ✗`);
}

// --- 2. Barrierefreiheit ----------------------------------------------------
{
  let v = 0;
  for (const pfad of PFADE) {
    for (const [w, h] of [[1440, 900], [375, 812]]) {
      // reducedMotion, damit Reveal-Animationen den Inhalt nicht vor axe verstecken.
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.goto(new URL(pfad, BASE).href, { waitUntil: 'networkidle' });
      const r = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      for (const viol of r.violations) {
        console.log(`  ✗ ${pfad} @${w}px [${viol.impact}] ${viol.id}: ${viol.help} (${viol.nodes.length}×)`);
        v++;
      }
      await ctx.close();
    }
  }
  fehler += v;
  console.log(v === 0 ? '2. Barrierefreiheit (axe AA): 0 Violations ✓' : `2. Barrierefreiheit: ${v} Violations ✗`);
}

// --- 3. Horizontaler Überlauf ----------------------------------------------
{
  let o = 0;
  for (const w of [375, 768, 1024, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    for (const pfad of PFADE) {
      await p.goto(new URL(pfad, BASE).href, { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => ({
        s: document.documentElement.scrollWidth,
        c: document.documentElement.clientWidth,
      }));
      if (r.s > r.c + 1) {
        console.log(`  ✗ ${w}px ${pfad}: scrollWidth ${r.s} > ${r.c}`);
        o++;
      }
    }
    await ctx.close();
  }
  fehler += o;
  console.log(o === 0 ? '3. Horizontaler Überlauf: keiner ✓' : `3. Überlauf: ${o} ✗`);
}

// --- 4. Touch-Targets -------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true });
  const p = await ctx.newPage();
  let klein = 0;
  for (const pfad of PFADE) {
    await p.goto(new URL(pfad, BASE).href, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() =>
      [...document.querySelectorAll('a[href], button, input, textarea')]
        .filter((el) => {
          const b = el.getBoundingClientRect();
          if (!b.width || !b.height || b.height >= 44) return false;
          // Inline-Links im Fließtext sind laut WCAG 2.2 von der Zielgröße ausgenommen.
          return !el.closest('.site-footer, .prose, .legal, .form__note, .footer__links');
        })
        .map((el) => `${el.tagName}.${el.className?.toString().split(' ')[0] || ''}`)
    );
    for (const t of new Set(r)) {
      console.log(`  ✗ ${pfad}: ${t} unter 44px hoch`);
      klein++;
    }
  }
  await ctx.close();
  fehler += klein;
  console.log(klein === 0 ? '4. Touch-Targets ≥ 44px ✓' : `4. Touch-Targets: ${klein} zu klein ✗`);
}

await browser.close();
console.log(fehler === 0 ? '\n✓ Audit bestanden.' : `\n✗ ${fehler} Befunde.`);
process.exit(fehler === 0 ? 0 : 1);
