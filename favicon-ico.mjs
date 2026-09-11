// favicon-ico.mjs — echtes favicon.ico aus dem vorhandenen favicon.svg
//
// Warum ein eigenes Skript neben generate-favicon.mjs: das dort erzeugt die
// SVG-Marke selbst neu (Buchstabe auf Akzentquadrat) und wuerde das
// handgezeichnete Impactalyst-Logo ueberschreiben. Hier wird favicon.svg nur
// gelesen, nie geschrieben.
//
// Rasterisiert wird mit Playwright statt sharp — Playwright ist ohnehin
// devDependency (screenshot.mjs, audit.mjs), sharp waere eine zusaetzliche
// native Abhaengigkeit fuer eine einzige Datei.
//
//   node favicon-ico.mjs        # schreibt favicon.ico (16, 32, 48 px)

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SIZES = [16, 32, 48];

const svg = await readFile(join(ROOT, 'favicon.svg'), 'utf8');

const browser = await chromium.launch();
const pngs = [];

for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  pngs.push({ size, buf: await page.screenshot({ omitBackground: true }) });
  await page.close();
  console.log(`  ✓ ${size}×${size}`);
}

await browser.close();

/**
 * ICO-Container mit eingebetteten PNGs (seit Vista zulaessig und von allen
 * relevanten Browsern unterstuetzt) — 6 Byte Header, 16 Byte pro Eintrag.
 */
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserviert
header.writeUInt16LE(1, 2); // Typ 1 = Icon
header.writeUInt16LE(pngs.length, 4);

const entries = Buffer.alloc(16 * pngs.length);
let offset = header.length + entries.length;

pngs.forEach(({ size, buf }, i) => {
  const e = 16 * i;
  entries.writeUInt8(size >= 256 ? 0 : size, e + 0); // Breite (0 = 256)
  entries.writeUInt8(size >= 256 ? 0 : size, e + 1); // Hoehe
  entries.writeUInt8(0, e + 2); // Farbpalette: keine
  entries.writeUInt8(0, e + 3); // reserviert
  entries.writeUInt16LE(1, e + 4); // Farbebenen
  entries.writeUInt16LE(32, e + 6); // Bit pro Pixel
  entries.writeUInt32LE(buf.length, e + 8);
  entries.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});

const ico = Buffer.concat([header, entries, ...pngs.map((p) => p.buf)]);
await writeFile(join(ROOT, 'favicon.ico'), ico);
console.log(`\n✓ favicon.ico — ${pngs.length} Groessen, ${ico.length} Bytes`);
