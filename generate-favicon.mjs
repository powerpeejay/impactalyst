#!/usr/bin/env node
// generate-favicon.mjs — emit favicon.svg (typographic letter on accent square)
//                        + optional favicon.ico + apple-touch-icon.png if `sharp` is installed
//
// Usage:
//   node generate-favicon.mjs                              # auto-detect from DESIGN.md
//   node generate-favicon.mjs --letter=G --bg=#9B4A1F --fg=#F8F3EB
//   node generate-favicon.mjs --no-fallback                # skip .ico + apple-touch (SVG only)
//
// Auto-detect (if no --letter / --bg / --fg given):
//   - letter: first character of the wordmark heuristic (looks for "Wordmark" string in DESIGN.md or scaffold name)
//   - bg/fg:  reads --color-accent and --color-bg from DESIGN.md §2 Color Palette table

import { readFile, writeFile, access } from 'node:fs/promises';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const DESIGN_PATH = join(ROOT, 'DESIGN.md');

// ---- args ----
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
);

const NO_FALLBACK = !!args['no-fallback'];

// ---- defaults from DESIGN.md ----
async function readDesign() {
  try { return await readFile(DESIGN_PATH, 'utf8'); } catch { return ''; }
}

const design = await readDesign();

function pickHexFromDesign(token) {
  // matches table rows like: | `--color-accent` | `#9B4A1F` | ... |
  const re = new RegExp(`\\\`${token}\\\`\\s*\\|\\s*\\\`(#[0-9A-Fa-f]{3,8})\\\``);
  const m = design.match(re);
  return m ? m[1] : null;
}

function pickLetter() {
  // heuristic: scaffold folder name first letter, uppercased
  const folder = basename(ROOT);
  return (folder.replace(/[^a-zA-Z]/g, '')[0] || 'G').toUpperCase();
}

const letter = (args.letter ?? pickLetter()).toUpperCase().slice(0, 1);
const bg = args.bg ?? pickHexFromDesign('--color-accent') ?? '#9B4A1F';
const fg = args.fg ?? pickHexFromDesign('--color-bg') ?? '#F8F3EB';

console.log(`→ letter='${letter}'  bg='${bg}'  fg='${fg}'`);

// ---- write favicon.svg ----
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="2" fill="${bg}"/>
  <text x="16" y="23.5" font-family="Georgia, serif" font-weight="700" font-size="22" text-anchor="middle" fill="${fg}">${letter}</text>
</svg>
`;
await writeFile(join(ROOT, 'favicon.svg'), svg);
console.log(`  ✓ favicon.svg`);

// ---- optional .ico + apple-touch-icon.png via sharp ----
if (NO_FALLBACK) {
  console.log('  ⊙ skipping .ico + apple-touch-icon.png (--no-fallback)');
  process.exit(0);
}

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.log('  ⊙ sharp not installed — SVG-only (88% browser coverage).');
  console.log('     For full fallback set: cd MasterWebsiteProject && npm install -D --save-exact sharp');
  process.exit(0);
}

const svgBuffer = Buffer.from(svg);

// apple-touch-icon: 180×180 PNG
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(join(ROOT, 'apple-touch-icon.png'));
console.log(`  ✓ apple-touch-icon.png (180×180)`);

// favicon.ico: multi-size PNG concatenation isn't trivial without ico-encoder lib.
// Pragmatic: emit a 32×32 PNG named favicon.ico — modern browsers accept PNG-bytes-with-.ico-extension as fallback.
// Real .ico generation can be a future polish.
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(ROOT, 'favicon.ico'));
console.log(`  ✓ favicon.ico (32×32 PNG-as-ICO — pragmatic fallback)`);

console.log('\n=== favicon set complete ===');
console.log('  Add to <head>:');
console.log('    <link rel="icon" href="/favicon.svg" type="image/svg+xml">');
console.log('    <link rel="icon" href="/favicon.ico" sizes="any">');
console.log('    <link rel="apple-touch-icon" href="/apple-touch-icon.png">');
