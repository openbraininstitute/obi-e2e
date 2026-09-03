import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { BrowserContext, Page } from '@playwright/test';

import { authStatePath, credentials, type Role, tokenPath } from './env';

// The Keycloak theme hides `#kc-form-wrapper` and offers only social providers,
// so the username and password fields render with a zero-size box. Playwright
// refuses to type into them, and submitting the form directly is the only way
// in for a credentials-based test account.
const LOGIN_FORM = '#kc-form-login';
const SUBMIT_BUTTON = '#kc-login';

async function submitCredentials(page: Page, role: Role): Promise<void> {
  const { username, password } = credentials(role);

  await page.locator(LOGIN_FORM).waitFor({ state: 'attached' });

  await page.evaluate(
    ({ user, secret, formSelector, submitSelector }) => {
      const form = document.querySelector<HTMLFormElement>(formSelector);
      const usernameInput = form?.querySelector<HTMLInputElement>('#username');
      const passwordInput = form?.querySelector<HTMLInputElement>('#password');

      if (!form || !usernameInput || !passwordInput) {
        throw new Error(`Keycloak login form not found at ${formSelector}`);
      }

      usernameInput.value = user;
      passwordInput.value = secret;

      // requestSubmit runs validation and sends the submit button's name and
      // value, which a plain form.submit() would drop.
      const submitter = form.querySelector<HTMLInputElement>(submitSelector);
      if (submitter && typeof form.requestSubmit === 'function') {
        form.requestSubmit(submitter);
      } else {
        form.submit();
      }
    },
    { user: username, secret: password, formSelector: LOGIN_FORM, submitSelector: SUBMIT_BUTTON }
  );
}

/**
 * Keycloak re-renders the login page with an error rather than redirecting when
 * credentials are rejected. Without this the run would instead time out waiting
 * for a redirect that is never coming.
 */
async function failOnRejectedCredentials(page: Page, role: Role): Promise<void> {
  const error = page.locator('#input-error, .kcInputErrorMessageClass, .alert-error');
  if ((await error.count()) === 0) return;

  const message = (await error.first().textContent())?.trim();
  throw new Error(
    `Keycloak rejected the ${role} user's credentials: ${message ?? 'no reason given'}`
  );
}

/** Clears required actions such as accepting terms before the app redirect. */
async function clearRequiredActions(page: Page): Promise<void> {
  while (page.url().includes('/login-actions/')) {
    const current = page.url();
    const accept = page.getByRole('button', { name: /accept|confirm|submit/i }).first();
    await accept.waitFor({ state: 'visible' });
    await accept.click();
    await page.waitForURL((url) => url.href !== current);
  }
}

/** Reads the Keycloak access token that API helpers use to arrange test data. */
async function readAccessToken(page: Page, role: Role): Promise<string> {
  const response = await page.request.get('/api/auth/session');
  const session = (await response.json()) as { accessToken?: string };

  if (!session.accessToken) {
    throw new Error(
      `No access token in the ${role} user's session. Keys: ${Object.keys(session).join(', ') || 'none'}`
    );
  }

  return session.accessToken;
}

/**
 * Signs a role in and writes its storage state and access token to the run
 * directory. Runs once per role per run; every spec reuses the result.
 */
export async function signIn(page: Page, context: BrowserContext, role: Role): Promise<void> {
  await page.goto('/app/log-in', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/auth/realms/**');

  await submitCredentials(page, role);

  await page.waitForURL((url) => !url.pathname.includes('/openid-connect/'));
  await failOnRejectedCredentials(page, role);
  await clearRequiredActions(page);
  await page.waitForURL('**/app/**');

  // Playwright spawns its workers with the node binary even under `bun run`, so
  // the Bun global does not exist here. Bun APIs are only usable in the CI
  // scripts, which run under bun directly.
  const statePath = authStatePath(role);
  await mkdir(dirname(statePath), { recursive: true });
  await context.storageState({ path: statePath });
  await writeFile(tokenPath(role), await readAccessToken(page, role), 'utf8');
}
