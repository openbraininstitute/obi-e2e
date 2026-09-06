/** Returns the credits and deletes the project the run created. */

import { hasCredentials } from '@fixtures/run/env';
import { teardownWorkspace } from '@fixtures/run/workspace';
import { expect, test as teardown } from '@playwright/test';

teardown('give the project back', async () => {
  teardown.skip(!hasCredentials('primary'), 'This run never prepared a project.');

  const result = await teardownWorkspace();
  if (!result) return;

  expect(
    result.removed,
    `Project ${result.projectId} is still in the lab. It counts against the lab's forty until ` +
      'someone deletes it, so later runs will start failing to create their own.'
  ).toBe('ok');
});
