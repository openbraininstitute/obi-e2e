/** Fails the spending tests early when the project has no credits. */

import { readCreditReport } from '@fixtures/credit-report';
import { hasCredentials, PROJECT_CREDITS } from '@fixtures/env';
import { expect, test as setup } from '@playwright/test';

setup('the project can pay for this run', async () => {
  setup.skip(!hasCredentials('primary'), 'No credentials for the primary user.');

  const report = readCreditReport();
  const problem =
    report?.problem ??
    `The project was never funded, so nothing can be launched. It needs ${PROJECT_CREDITS} credits.`;

  expect(report?.assigned ?? 0, problem).toBeGreaterThanOrEqual(PROJECT_CREDITS);
});
