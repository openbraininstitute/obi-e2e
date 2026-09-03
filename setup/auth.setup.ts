import * as fs from 'node:fs';
import * as path from 'node:path';

import { test as setup } from '@playwright/test';

import { AUTH_STATE_PATH, testUser } from '../fixtures/env';

// TODO(phase-1): replace these steps with the real Keycloak flow when the
// existing tests are migrated in.
setup('authenticate', async ({ page, context }) => {
  const user = testUser();

  await setup.step('sign in', async () => {
    await page.goto('/app/log-in');
    await page.waitForURL('**/auth/realms/**');

    await page.getByLabel('Username or email').fill(user.username);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Leaving the OpenID Connect path is what marks the login as complete.
    await page.waitForURL((url) => !url.pathname.includes('/openid-connect/'));
  });

  await setup.step('save storage state', async () => {
    fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
    await context.storageState({ path: AUTH_STATE_PATH });
  });
});
