import { hasCredentials } from '@fixtures/run/env';
import { teardownOnboardingWorkspace } from '@fixtures/run/onboarding-workspace';
import { expect, test as teardown } from '@playwright/test';

teardown('remove onboarding resources', async () => {
  teardown.skip(
    !hasCredentials('onboarding'),
    'No onboarding credentials are configured, so there are no onboarding resources to remove.'
  );

  const result = await teardownOnboardingWorkspace();
  if (!result) return;

  expect(
    result.removed,
    'Onboarding resources created by this run remain. The manifest was retained for reclaim.'
  ).toBe('ok');
});
