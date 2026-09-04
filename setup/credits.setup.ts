import { readCreditReport } from '@fixtures/credit-report';
import { hasCredentials, PROJECT_CREDITS } from '@fixtures/env';
import { expect, test as setup } from '@playwright/test';

/**
 * Stands in front of the tests that spend.
 *
 * Taking a project costs nothing, so the workspace setup takes one whatever the
 * lab holds and the reading tests run either way. Launching a simulation does
 * cost, so a lab that could not fund the project stops here, once, instead of
 * every launching test failing later for a reason that reads like a product bug.
 */
setup('the project can pay for this run', async () => {
  setup.skip(!hasCredentials('primary'), 'No credentials for the primary user.');

  const report = readCreditReport();
  const problem =
    report?.problem ??
    `The project was never funded, so nothing can be launched. It needs ${PROJECT_CREDITS} credits.`;

  expect(report?.assigned ?? 0, problem).toBeGreaterThanOrEqual(PROJECT_CREDITS);
});
