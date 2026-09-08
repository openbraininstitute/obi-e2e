/** The test object every spec imports. It adds the workspace fixture. */

import { test as base, expect } from '@playwright/test';

import { testWorkspace } from './run/env';
import { attachPageProblems, watchPage } from './run/page-problems';

type Workspace = { labId: string; projectId: string };

type Fixtures = {
  workspace: Workspace;
};

export const test = base.extend<Fixtures>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern
  workspace: async ({}, use) => {
    await use(testWorkspace());
  },

  /** Every page keeps the calls that failed under it, for the report to carry. */
  page: async ({ page }, use, testInfo) => {
    watchPage(page);
    await use(page);
    await attachPageProblems(page, testInfo);
  },
});

export { expect };
