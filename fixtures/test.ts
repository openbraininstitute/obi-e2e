import { test as base, expect } from '@playwright/test';

import { testWorkspace } from './env';

type Workspace = { labId: string; projectId: string };

type Fixtures = {
  /** The only lab and project this run may write to. */
  workspace: Workspace;
};

/** Import `test` and `expect` from here, never from `@playwright/test`. */
export const test = base.extend<Fixtures>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern
  workspace: async ({}, use) => {
    await use(testWorkspace());
  },
});

export { expect };
