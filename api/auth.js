/**
 * Schritt 1 der Anmeldung: leitet zu GitHub weiter.
 *
 * Sveltia CMS öffnet dafür ein Popup auf <base_url>/auth?provider=github&site_id=<domain>.
 * Erreichbar unter /auth über den Rewrite in vercel.json.
 */

import { getScope, getDomainPatterns, outputHTML } from './_oauth.js';

export function GET(request) {
  const env = process.env;
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const domain = searchParams.get('site_id') ?? '';

  if (provider !== 'github') {
    return outputHTML({
      env,
      error: 'Dieses Git-Backend unterstützt der Authenticator nicht.',
      errorCode: 'UNSUPPORTED_BACKEND',
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

  // Nur zugelassene Domains dürfen den Endpunkt nutzen — er ist öffentlich.
  const domainPatterns = getDomainPatterns(env);

  if (domainPatterns.length && !domainPatterns.some((p) => new RegExp(p).test(domain))) {
    return outputHTML({
      env,
      provider,
      error: 'Diese Domain darf den Authenticator nicht verwenden.',
      errorCode: 'UNSUPPORTED_DOMAIN',
    });
  }

  const csrfToken = globalThis.crypto.randomUUID().replaceAll('-', '');

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: getScope(searchParams.get('scope')),
    state: csrfToken,
  });

  // Kein redirect_uri: GitHub nimmt die in der OAuth-App hinterlegte
  // Callback-URL. Die muss daher auf <domain>/callback zeigen.
  return new Response('', {
    status: 302,
    headers: {
      Location: `https://${GITHUB_HOSTNAME}/login/oauth/authorize?${params.toString()}`,
      // 10 Minuten gültig. SameSite=Lax, damit der Browser den Cookie nach der
      // Rückleitung von GitHub mitschickt.
      'Set-Cookie':
        `csrf-token=github_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`,
    },
  });
}
