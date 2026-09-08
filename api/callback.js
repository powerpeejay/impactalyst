/**
 * Schritt 2 der Anmeldung: tauscht den Authorization Code gegen ein Access Token.
 *
 * GitHub leitet hierher zurück. Das ist die URL, die in der OAuth-App als
 * "Authorization callback URL" eingetragen sein muss: https://<domain>/callback
 * Erreichbar unter /callback über den Rewrite in vercel.json.
 */

import { outputHTML } from './_oauth.js';

export async function GET(request) {
  const env = process.env;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const [, provider, csrfToken] =
    request.headers.get('Cookie')?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/) ?? [];

  if (provider !== 'github') {
    return outputHTML({
      env,
      error: 'Dieses Git-Backend unterstützt der Authenticator nicht.',
      errorCode: 'UNSUPPORTED_BACKEND',
    });
  }

  if (!code || !state) {
    return outputHTML({
      env,
      provider,
      error: 'Es kam kein Authorization Code an. Bitte später erneut versuchen.',
      errorCode: 'AUTH_CODE_REQUEST_FAILED',
    });
  }

  // Der state aus der Rückleitung muss dem Cookie aus /auth entsprechen.
  if (!csrfToken || state !== csrfToken) {
    return outputHTML({
      env,
      provider,
      error: 'Möglicher CSRF-Angriff erkannt. Anmeldung abgebrochen.',
      errorCode: 'CSRF_DETECTED',
    });
  }

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_HOSTNAME = 'github.com' } = env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return outputHTML({
      env,
      provider,
      error: 'Client ID oder Secret der OAuth-App fehlt in den Environment Variables.',
      errorCode: 'MISCONFIGURED_CLIENT',
    });
  }

  let response;

  try {
    response = await fetch(`https://${GITHUB_HOSTNAME}/login/oauth/access_token`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
      }),
    });
  } catch {
    // Fällt unten in TOKEN_REQUEST_FAILED
  }

  if (!response) {
    return outputHTML({
      env,
      provider,
      error: 'Der Access Token konnte nicht angefragt werden. Bitte später erneut versuchen.',
      errorCode: 'TOKEN_REQUEST_FAILED',
    });
  }

  let token = '';
  let error = '';

  try {
    ({ access_token: token, error } = await response.json());
  } catch {
    return outputHTML({
      env,
      provider,
      error: 'Der Server hat fehlerhafte Daten geliefert. Bitte später erneut versuchen.',
      errorCode: 'MALFORMED_RESPONSE',
    });
  }

  return outputHTML({ env, provider, token, error });
}
