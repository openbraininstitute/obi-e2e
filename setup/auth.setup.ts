/** Signs each user in and saves the session the tests reuse. */

import { signIn } from '@fixtures/run/auth';
import { hasCredentials, ROLES } from '@fixtures/run/env';
import { test as setup } from '@playwright/test';

for (const role of ROLES) {
  setup(`authenticate ${role}`, async ({ page, context }) => {
    setup.skip(
      !hasCredentials(role),
      `No credentials configured for the ${role} user; its tests will not run.`
    );

    await signIn(page, context, role);
  });
}
