/** Signs a user in through Keycloak. */

import type { BrowserContext, Page } from '@playwright/test';

import { authStatePath, credentials, type Role, tokenPath } from './env';

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

async function failOnRejectedCredentials(page: Page, role: Role): Promise<void> {
  const error = page.locator('#input-error, .kcInputErrorMessageClass, .alert-error');
  if ((await error.count()) === 0) return;

  const message = (await error.first().textContent())?.trim();
  throw new Error(
    `Keycloak rejected the ${role} user's credentials: ${message ?? 'no reason given'}`
  );
}

async function clearRequiredActions(page: Page): Promise<void> {
  while (page.url().includes('/login-actions/')) {
    const current = page.url();
    const accept = page.getByRole('button', { name: /accept|confirm|submit/i }).first();
    await accept.waitFor({ state: 'visible' });
    await accept.click();
    await page.waitForURL((url) => url.href !== current);
  }
}

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

/** Signs the user in, then saves its session and access token for the run. */
export async function signIn(page: Page, context: BrowserContext, role: Role): Promise<void> {
  await page.goto('/app/log-in', { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/auth/realms/**');

  await submitCredentials(page, role);

  await page.waitForURL((url) => !url.pathname.includes('/openid-connect/'));
  await failOnRejectedCredentials(page, role);
  await clearRequiredActions(page);
  // Any app page but the log-in one. A callback NextAuth cannot complete sends
  // the browser back to `/app/log-in?error=…`, which goes on to Keycloak and
  // signs in again by itself; `**/app/**` took that stop for the landing, and
  // the session read below came back empty: "No access token … Keys: none".
  await page.waitForURL(
    (url) => url.pathname.startsWith('/app/') && !url.pathname.startsWith('/app/log-in')
  );

  await Bun.write(authStatePath(role), JSON.stringify(await context.storageState()));
  await Bun.write(tokenPath(role), await readAccessToken(page, role));
}
