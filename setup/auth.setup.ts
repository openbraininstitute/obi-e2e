/** Signs each user in and saves the session the tests reuse. */

import { TOURS, VirtualLabApi } from '@api/virtual-lab';
import { signIn } from '@fixtures/run/auth';
import { hasCredentials, ROLES } from '@fixtures/run/env';
import { accessToken } from '@fixtures/run/token';
import { test as setup } from '@playwright/test';

for (const role of ROLES) {
  setup(`authenticate ${role}`, async ({ page, context }) => {
    setup.skip(
      !hasCredentials(role),
      `No credentials configured for the ${role} user; its tests will not run.`
    );

    await signIn(page, context, role);

    /*
     * A tour covers the page it introduces with an overlay that takes every
     * click. The server remembers per user whether it was dismissed, so a user
     * someone once clicked through never sees it and a fresh one always does:
     * production failed a hundred tests that staging passed. Dismissing them
     * here gives every deployment the same page.
     *
     * One at a time: the server rewrites the user's whole preference record on
     * each call, so parallel calls overwrite each other and some tours stay on.
     */
    const api = new VirtualLabApi(await accessToken(role));
    for (const tour of TOURS) await api.dismissTour(tour);
  });
}
