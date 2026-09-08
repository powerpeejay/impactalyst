// Tests fuer die OAuth-Functions. Laufen ohne Netz und ohne Vercel:
//   npm run test:oauth
import { GET as auth } from './api/auth.js';
import { GET as callback } from './api/callback.js';

process.env.GITHUB_CLIENT_ID = 'TEST_ID';
process.env.GITHUB_CLIENT_SECRET = 'TEST_SECRET';
process.env.ALLOWED_DOMAINS = 'impactalyst.vercel.app,impactalyst.de';

const req = (url, cookie) =>
  new Request(url, { headers: cookie ? { Cookie: cookie } : {} });
const B = 'https://impactalyst.vercel.app';
let ok = 0, bad = 0;
const pruefe = (name, bedingung, detail = '') => {
  if (bedingung) { console.log(`  ✓ ${name}`); ok++; }
  else { console.log(`  ✗ ${name} ${detail}`); bad++; }
};

console.log('--- /auth ---');
let r = await auth(req(`${B}/auth?provider=github&site_id=impactalyst.vercel.app`));
const loc = r.headers.get('Location') ?? '';
const cookie = r.headers.get('Set-Cookie') ?? '';
pruefe('302 zu GitHub', r.status === 302 && loc.startsWith('https://github.com/login/oauth/authorize'), loc.slice(0,60));
pruefe('client_id gesetzt', loc.includes('client_id=TEST_ID'));
pruefe('scope repo,user', decodeURIComponent(loc).includes('scope=repo,user'));
pruefe('CSRF-Cookie HttpOnly+Secure', /csrf-token=github_[0-9a-f]{32};/.test(cookie) && cookie.includes('HttpOnly') && cookie.includes('Secure'), cookie);
const state = loc.match(/state=([0-9a-f]{32})/)?.[1];
pruefe('state == Cookie-Token', !!state && cookie.includes(`github_${state}`));

console.log('--- Domain-Sperre ---');
r = await auth(req(`${B}/auth?provider=github&site_id=boese.example.com`));
let html = await r.text();
pruefe('fremde Domain abgewiesen', html.includes('UNSUPPORTED_DOMAIN'));
r = await auth(req(`${B}/auth?provider=gitlab&site_id=impactalyst.vercel.app`));
pruefe('anderes Backend abgewiesen', (await r.text()).includes('UNSUPPORTED_BACKEND'));

console.log('--- /callback CSRF ---');
r = await callback(req(`${B}/callback?code=abc&state=${'a'.repeat(32)}`, `csrf-token=github_${'b'.repeat(32)}`));
pruefe('state-Mismatch abgewiesen', (await r.text()).includes('CSRF_DETECTED'));
r = await callback(req(`${B}/callback?code=abc&state=${'a'.repeat(32)}`));
pruefe('ohne Cookie abgewiesen', (await r.text()).includes('UNSUPPORTED_BACKEND'));
r = await callback(req(`${B}/callback?state=${'a'.repeat(32)}`, `csrf-token=github_${'a'.repeat(32)}`));
pruefe('fehlender Code abgewiesen', (await r.text()).includes('AUTH_CODE_REQUEST_FAILED'));

console.log('--- fehlende Konfiguration ---');
delete process.env.GITHUB_CLIENT_ID;
r = await auth(req(`${B}/auth?provider=github&site_id=impactalyst.vercel.app`));
pruefe('ohne Client ID: klarer Fehler', (await r.text()).includes('MISCONFIGURED_CLIENT'));

console.log('--- Token-Tausch (GitHub gemockt) ---');
process.env.GITHUB_CLIENT_ID = 'TEST_ID';
const echtesFetch = globalThis.fetch;
const gueltig = 'c'.repeat(32);

globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);

  pruefe(
    'Secret geht an GitHub, nie an den Browser',
    String(url).includes('/login/oauth/access_token') &&
      body.client_secret === 'TEST_SECRET' &&
      body.code === 'code-123',
  );

  return new Response(JSON.stringify({ access_token: 'gho_testtoken' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

r = await callback(
  req(`${B}/callback?code=code-123&state=${gueltig}`, `csrf-token=github_${gueltig}`),
);
html = await r.text();
pruefe(
  'Token per postMessage zurueckgegeben',
  html.includes('gho_testtoken') && html.includes('authorization:github:success'),
);
pruefe(
  'CSRF-Cookie wird geloescht',
  (r.headers.get('Set-Cookie') ?? '').includes('csrf-token=deleted'),
);
// Die Muster stehen regex-escaped im eingebetteten Skript. Statt auf
// Zeichenketten zu raten, wird die tatsaechliche Regex funktional geprueft:
// erlaubte Domain trifft, fremde nicht.
const muster = JSON.parse(html.match(/trustedPatterns = (\[.*?\]);/)[1]);
pruefe(
  'eigene Domain gilt als vertrauenswuerdig',
  muster.some((m) => new RegExp(m).test('impactalyst.vercel.app')),
);
pruefe(
  'fremde Domain gilt NICHT als vertrauenswuerdig',
  !muster.some((m) => new RegExp(m).test('boese.example.com')),
);
pruefe(
  'Praefix-Trick greift nicht (verankerte Regex)',
  !muster.some((m) => new RegExp(m).test('impactalyst.vercel.app.evil.com')),
);

globalThis.fetch = async () =>
  new Response('kein JSON', { headers: { 'Content-Type': 'text/plain' } });
r = await callback(
  req(`${B}/callback?code=code-123&state=${gueltig}`, `csrf-token=github_${gueltig}`),
);
pruefe('fehlerhafte Antwort abgefangen', (await r.text()).includes('MALFORMED_RESPONSE'));

globalThis.fetch = echtesFetch;

console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
