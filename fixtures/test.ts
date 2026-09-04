/** The test object every spec imports. It adds the workspace fixture. */

import { test as base, expect } from '@playwright/test';

import { testWorkspace } from './env';

type Workspace = { labId: string; projectId: string };

type Fixtures = {
  workspace: Workspace;
};

export const test = base.extend<Fixtures>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern
  workspace: async ({}, use) => {
    await use(testWorkspace());
  },
});

export { expect };
