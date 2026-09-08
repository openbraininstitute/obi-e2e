/** The run's access token, current rather than however old the file is. */

import * as fs from 'node:fs';

import { authStatePath, baseURL, type Role, tokenPath } from './env';
import { log } from './logger';

/** Keycloak mints these to last an hour. A suite runs longer than that. */
const SESSION_ENDPOINT = '/api/auth/session';

type StorageState = { cookies?: { name: string; value: string; domain: string }[] };

/**
 * The cookies the app itself would send, and none of Keycloak's.
 *
 * Matched on the hostname, never `host`: that carries the port, so every
 * `localhost` cookie missed against `localhost:3000` and the caller quietly
 * fell back to the stale file — the very thing this exists to stop.
 */
function cookieHeader(role: Role, hostname: string): string | null {
  const file = authStatePath(role);
  if (!fs.existsSync(file)) return null;

  const state = JSON.parse(fs.readFileSync(file, 'utf8')) as StorageState;
  const mine = (state.cookies ?? []).filter((cookie) =>
    hostname.endsWith(cookie.domain.replace(/^\./, ''))
  );

  return mine.length === 0 ? null : mine.map(({ name, value }) => `${name}=${value}`).join('; ');
}

/**
 * The access token to call the API with.
 *
 * Asks the application for it rather than reading the one sign-in wrote an hour
 * ago. NextAuth holds the refresh token and renews the access token inside its
 * `jwt` callback, so every read of `/api/auth/session` comes back current for
 * as long as the Keycloak session behind it is alive — which a run keeps alive
 * by using it, and a teardown follows within minutes. A session left idle for
 * hours answers with no token at all, and the file is what is left. The tests never noticed
 * the difference because a browser goes through the app for everything. Only
 * the scripts that call the virtual lab API directly read the file, and at
 * seventy minutes that file is a dead string: the teardown could not delete its
 * project and leaked it against the lab's forty.
 *
 * Falls back to the file when the app cannot be reached, which is no worse than
 * what this replaces.
 */
export async function accessToken(role: Role = 'primary'): Promise<string> {
  /* Loud, because a silent fall back to the file is the bug this file exists to fix. */
  const fromFile = (why: string): string => {
    log.warn({ role, why }, 'falling back to the token sign-in wrote; it may have expired');
    return fs.readFileSync(tokenPath(role), 'utf8').trim();
  };

  const cookie = cookieHeader(role, new URL(baseURL).hostname);
  if (!cookie) return fromFile('no session cookie for this base URL');

  try {
    const response = await fetch(new URL(SESSION_ENDPOINT, baseURL), {
      headers: { cookie, accept: 'application/json' },
    });
    if (!response.ok) return fromFile(`the session endpoint answered ${response.status}`);

    const session = (await response.json()) as { accessToken?: string };
    return session.accessToken ?? fromFile('the session carried no access token');
  } catch (cause) {
    return fromFile(`the session endpoint could not be reached: ${String(cause)}`);
  }
}
