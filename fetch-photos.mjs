#!/usr/bin/env node
// fetch-photos.mjs — Pexels build-time photo fetcher (DSGVO-clean self-host workflow)
//
// Reads:  ./pexels-config.json   (queries definition)
//         process.env.PEXELS_API_KEY  (one-time global env var, see master README)
// Writes: ./assets/img/<query-slug>-<photographer-slug>-<photo-id>.jpg
//         ./assets/img/credits.json  (photographer attribution)
//         appends a "Pexels Attribution" block to ./EXTERNAL_ASSETS.md
//
// Usage:
//   node fetch-photos.mjs           # fetch all queries from config
//   node fetch-photos.mjs --dry-run # preview what would be downloaded
//   node fetch-photos.mjs --force   # re-download even if file exists

import { readFile, writeFile, mkdir, access, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const CONFIG_PATH = join(ROOT, 'pexels-config.json');
const IMG_DIR = join(ROOT, 'assets', 'img');
const CREDITS_PATH = join(IMG_DIR, 'credits.json');
const EXTERNAL_ASSETS_PATH = join(ROOT, 'EXTERNAL_ASSETS.md');

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry-run');
const FORCE = args.has('--force');

// ---- guards ----
const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  console.error('✗ PEXELS_API_KEY not set.');
  console.error('  Get key: https://www.pexels.com/api/');
  console.error('  Set:     PowerShell  [Environment]::SetEnvironmentVariable("PEXELS_API_KEY","<key>","User")');
  console.error('           Bash         echo "export PEXELS_API_KEY=<key>" >> ~/.bashrc');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
} catch (err) {
  console.error(`✗ Cannot read ${CONFIG_PATH}: ${err.message}`);
  console.error('  Expected shape: { "queries": [{"name":"hero","query":"...","per_page":3,"orientation":"portrait"}] }');
  process.exit(1);
}

if (!Array.isArray(config.queries) || config.queries.length === 0) {
  console.error('✗ pexels-config.json has no queries. See INSPIRATION.md §6 for direction-matrix-specific starters.');
  process.exit(1);
}

await mkdir(IMG_DIR, { recursive: true });

// ---- helpers ----
const slug = s => String(s)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40);

const fileExists = async path => {
  try { await access(path); return true; } catch { return false; }
};

async function fetchPexels(query, perPage, orientation, locale) {
  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', String(perPage ?? 3));
  if (orientation) url.searchParams.set('orientation', orientation);
  if (locale) url.searchParams.set('locale', locale);

  const resp = await fetch(url, { headers: { Authorization: apiKey } });
  if (!resp.ok) {
    throw new Error(`Pexels API ${resp.status} ${resp.statusText} for "${query}"`);
  }
  return resp.json();
}

async function downloadTo(url, dest) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`download ${resp.status} ${resp.statusText}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

// ---- main ----
const credits = (await fileExists(CREDITS_PATH))
  ? JSON.parse(await readFile(CREDITS_PATH, 'utf8'))
  : { photos: [] };

let totalDownloaded = 0;
let totalSkipped = 0;
let totalBytes = 0;

for (const q of config.queries) {
  console.log(`\n→ "${q.query}"  (${q.name}, per_page=${q.per_page ?? 3}, orientation=${q.orientation ?? 'any'})`);

  const data = await fetchPexels(q.query, q.per_page, q.orientation, q.locale ?? 'de-DE');
  console.log(`  Pexels returned ${data.photos?.length ?? 0} photos.`);

  for (const photo of data.photos ?? []) {
    const photographerSlug = slug(photo.photographer);
    const filename = `${slug(q.name)}-${photographerSlug}-${photo.id}.jpg`;
    const dest = join(IMG_DIR, filename);

    if (!FORCE && await fileExists(dest)) {
      console.log(`  ⊙ skip (exists): ${filename}`);
      totalSkipped++;
      continue;
    }

    if (DRY) {
      console.log(`  ⌛ would download: ${filename} ← ${photo.src.large2x}`);
      continue;
    }

    const downloadUrl = photo.src?.large2x ?? photo.src?.large ?? photo.src?.original;
    const bytes = await downloadTo(downloadUrl, dest);
    totalDownloaded++;
    totalBytes += bytes;
    console.log(`  ✓ ${filename}  (${(bytes / 1024).toFixed(1)} KB · by ${photo.photographer})`);

    // dedupe credits by photo id
    if (!credits.photos.some(c => c.id === photo.id)) {
      credits.photos.push({
        id: photo.id,
        local_filename: filename,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        pexels_page: photo.url,
        alt: photo.alt,
        width: photo.width,
        height: photo.height,
        avg_color: photo.avg_color,
        query: q.query,
        query_name: q.name,
      });
    }
  }
}

if (!DRY) {
  await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2));

  // Update EXTERNAL_ASSETS.md with attribution block (idempotent — replace marker block)
  const markerStart = '<!-- PEXELS-ATTRIBUTION-START -->';
  const markerEnd = '<!-- PEXELS-ATTRIBUTION-END -->';
  const attribLines = credits.photos.map(c =>
    `- "${c.alt || c.query}" — Foto: [${c.photographer}](${c.photographer_url}) auf [Pexels](${c.pexels_page})`
  ).join('\n');
  const block = `${markerStart}\n## Pexels-Attribution\n\nSelf-hosted Photos in \`assets/img/\` — DSGVO-clean (kein CDN-Embed). Lizenz: Pexels License (frei kommerziell, Attribution requested).\n\n${attribLines}\n${markerEnd}`;

  let content = '';
  try { content = await readFile(EXTERNAL_ASSETS_PATH, 'utf8'); } catch {}

  if (content.includes(markerStart) && content.includes(markerEnd)) {
    content = content.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`), block);
  } else {
    content = (content.trimEnd() + '\n\n' + block + '\n');
  }
  await writeFile(EXTERNAL_ASSETS_PATH, content);
}

console.log(`\n=== summary ===`);
console.log(`  Downloaded: ${totalDownloaded}`);
console.log(`  Skipped:    ${totalSkipped}`);
console.log(`  Bytes:      ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Credits in: ${CREDITS_PATH}`);
console.log(`  Attribution block in: ${EXTERNAL_ASSETS_PATH}`);
