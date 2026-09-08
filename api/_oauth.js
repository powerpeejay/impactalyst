/**
 * OAuth-Helfer für die Sveltia-CMS-Anmeldung über GitHub.
 *
 * Portiert aus sveltia/sveltia-cms-auth (MIT), das dort als Cloudflare Worker
 * ausgeliefert wird. Der Worker nutzt ausschließlich Web-Standard-APIs
 * (Request, Response, fetch, crypto), deshalb läuft dieselbe Logik unverändert
 * als Vercel Function — Cloudflare wird nicht gebraucht.
 *
 * Warum es diesen Server-Teil überhaupt gibt: Das CMS läuft komplett im
 * Browser und kann das OAuth Client Secret nicht halten. Der Tausch von
 * Authorization Code gegen Access Token muss serverseitig passieren.
 *
 * GitLab-Unterstützung ist bewusst weggelassen — hier wird nur GitHub genutzt.
 *
 * Nötige Environment Variables in Vercel:
 *   GITHUB_CLIENT_ID       aus der GitHub OAuth App
 *   GITHUB_CLIENT_SECRET   aus der GitHub OAuth App (verschlüsselt)
 *   ALLOWED_DOMAINS        optional, Standard: die eigene Produktions-Domain
 */

/** Scopes, die angefragt werden dürfen. Alles andere fällt auf den Standard zurück. */
const SCOPES = {
  default: 'repo,user',
  separator: ',',
  allowed: ['repo', 'public_repo', 'user', 'read:user', 'user:email'],
};

/**
 * Der Endpunkt ist öffentlich erreichbar. Ein Token mit weiterem Scope als
 * nötig behält diesen Scope bei jeder späteren Anmeldung — deshalb wird die
 * Anfrage nicht ungeprüft übernommen.
 */
export const getScope = (requested) => {
  const scopes = (requested ?? '').split(/[\s,]+/).filter(Boolean);

  if (!scopes.length) return SCOPES.default;
  if (scopes.every((s) => SCOPES.allowed.includes(s))) return scopes.join(SCOPES.separator);

  console.warn(`Scope "${requested}" nicht unterstützt; fordere "${SCOPES.default}" an.`);

  return SCOPES.default;
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * ALLOWED_DOMAINS in verankerte Regex-Quellen übersetzen. Ohne gesetzte
 * Variable wird die eigene Vercel-Produktions-Domain genommen — ein leerer
 * Wert würde jede Domain zulassen, und das wäre die schlechtere Vorgabe.
 */
export const getDomainPatterns = (env = process.env) => {
  const konfiguriert = env.ALLOWED_DOMAINS ?? env.VERCEL_PROJECT_PRODUCTION_URL ?? '';

  return konfiguriert
    .split(/,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `^${escapeRegExp(s).replaceAll('\\*', '.+')}$`);
};

const serialize = (value) => JSON.stringify(value ?? null).replaceAll('<', '\\u003c');

/**
 * HTML-Antwort, die das Ergebnis per postMessage an das öffnende Fenster gibt.
 * Der CSRF-Cookie wird dabei gelöscht.
 */
export const outputHTML = ({ provider = 'github', token, error, errorCode, env = process.env }) => {
  const state = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };

  return new Response(
    `<!doctype html><html><body><script>
      (() => {
        const trustedPatterns = ${serialize(getDomainPatterns(env))};
        const hasToken = ${serialize(!!token)};

        const isTrusted = (origin) => {
          try {
            const { hostname } = new URL(origin);
            return trustedPatterns.some((pattern) => new RegExp(pattern).test(hostname));
          } catch {
            return false;
          }
        };

        window.addEventListener('message', ({ data, origin }) => {
          if (data !== 'authorizing:${provider}') return;

          // Der Origin eines message-Events wird vom Browser gesetzt und kann
          // vom Absender nicht gefälscht werden — anders als der site_id-
          // Parameter. Er ist damit der einzige verlässliche Hinweis darauf,
          // wer dieses Popup geöffnet hat. Fehler enthalten kein Geheimnis und
          // werden immer durchgereicht, damit der Login-Screen sprechend bleibt.
          if (hasToken && trustedPatterns.length && !isTrusted(origin)) return;

          window.opener?.postMessage(
            'authorization:${provider}:${state}:${JSON.stringify(content)}',
            origin
          );
        });

        window.opener?.postMessage('authorizing:${provider}', '*');
      })();
    </script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Set-Cookie': 'csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure',
      },
    },
  );
};
