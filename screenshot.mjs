#!/usr/bin/env node
// screenshot.mjs — capture screenshots at standard breakpoints
//
// Prereqs (one-time per machine):
//   npm install -D playwright
//   npx playwright install chromium
//
// Usage:
//   node screenshot.mjs                              # all viewports of localhost:3000
//   node screenshot.mjs http://localhost:3000        # explicit URL
//   node screenshot.mjs https://staging.example.com  # any URL
//   node screenshot.mjs --viewport=mobile            # single viewport
//   node screenshot.mjs --full-page                  # full scrollable page
//   node screenshot.mjs --dark                       # prefers-color-scheme: dark
//   node screenshot.mjs --reduced-motion             # prefers-reduced-motion: reduce
//
// Output: screenshots/<timestamp>/<viewport>.png

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const VIEWPORTS = {
  mobile:  { name: 'mobile-375',   width: 375,  height: 812  },
  tablet:  { name: 'tablet-768',   width: 768,  height: 1024 },
  laptop:  { name: 'laptop-1024',  width: 1024, height: 768  },
  desktop: { name: 'desktop-1440', width: 1440, height: 900  },
};

// ---- parse args ----
const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http')) || 'http://localhost:3000';
const viewportArg = args.find(a => a.startsWith('--viewport='))?.split('=')[1];
const fullPage = args.includes('--full-page');
const dark = args.includes('--dark');
const reducedMotion = args.includes('--reduced-motion');

const targets = !viewportArg || viewportArg === 'all'
  ? Object.values(VIEWPORTS)
  : [VIEWPORTS[viewportArg]].filter(Boolean);

if (targets.length === 0) {
  console.error(`✗ Unknown viewport: ${viewportArg}`);
  console.error(`  Available: ${Object.keys(VIEWPORTS).join(', ')}, all`);
  process.exit(1);
}

// ---- import Playwright (with helpful error if missing) ----
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('\n✗ Playwright not installed.');
  console.error('  Run:');
  console.error('    npm install -D playwright');
  console.error('    npx playwright install chromium\n');
  process.exit(1);
}

// ---- prepare output dir ----
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const flagSuffix = [dark && 'dark', reducedMotion && 'rm', fullPage && 'full']
  .filter(Boolean).join('-');
const outDir = join('screenshots', flagSuffix ? `${ts}_${flagSuffix}` : ts);
await mkdir(outDir, { recursive: true });

console.log(`\n→ \x1b[36m${url}\x1b[0m`);
console.log(`→ output: ${outDir}/`);
if (dark) console.log(`  flag: prefers-color-scheme: dark`);
if (reducedMotion) console.log(`  flag: prefers-reduced-motion: reduce`);
if (fullPage) console.log(`  flag: full page`);
console.log('');

// ---- launch & capture ----
let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  if (err.message?.includes("Executable doesn't exist")) {
    console.error('✗ Chromium binary missing. Run:');
    console.error('    npx playwright install chromium\n');
    process.exit(1);
  }
  throw err;
}

let failures = 0;
for (const vp of targets) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    colorScheme: dark ? 'dark' : 'light',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    // Wait for fonts to load
    await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
    // Small settle for layout shifts and entry animations
    await page.waitForTimeout(400);

    const file = join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: file, fullPage });
    console.log(`  ✓ ${vp.name}.png  (${vp.width}×${vp.height})`);
  } catch (err) {
    console.error(`  ✗ ${vp.name}: ${err.message}`);
    failures++;
  }

  await ctx.close();
}

await browser.close();

if (failures > 0) {
  console.error(`\n✗ ${failures} viewport(s) failed.\n`);
  process.exit(1);
}

console.log(`\n✓ done. open ${outDir}/\n`);
