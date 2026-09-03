import { signIn } from '@fixtures/auth';
import { hasCredentials, ROLES } from '@fixtures/env';
import { test as setup } from '@playwright/test';

// One sign-in per role, in parallel. Every later spec reuses the saved state.
for (const role of ROLES) {
  setup(`authenticate ${role}`, async ({ page, context }) => {
    setup.skip(
      !hasCredentials(role),
      `No credentials configured for the ${role} user; its tests will not run.`
    );

    await signIn(page, context, role);
  });
}
