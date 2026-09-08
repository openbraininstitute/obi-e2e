/** Fails the spending tests early when the project cannot pay. */

import * as fs from 'node:fs';

import { VirtualLabApi } from '@api/virtual-lab';
import { readCreditReport, recordCredits } from '@fixtures/run/credit-report';
import { hasCredentials, PROJECT_CREDITS, workspacePath } from '@fixtures/run/env';
import { accessToken } from '@fixtures/run/token';
import { expect, test as setup } from '@playwright/test';

setup('the project can pay for this run', async () => {
  setup.skip(!hasCredentials('primary'), 'No credentials for the primary user.');

  const report = readCreditReport();
  const problem =
    report?.problem ??
    `The project was never funded, so nothing can be launched. It needs ${PROJECT_CREDITS} credits.`;

  expect(report?.assigned ?? 0, problem).toBeGreaterThanOrEqual(PROJECT_CREDITS);

  /*
   * Then asks the accounting service, not our own bookkeeping. The assignment
   * answered success on a nightly whose project then read 0.00 for an hour:
   * the app refused all fourteen launches, each reported as a tab that never
   * enabled, while the report said "assigned: 6000" throughout. This is the
   * balance the app itself checks before it generates, so it is the one that
   * has to hold. Polled, because an assignment may take a moment to show.
   */
  const { labId, projectId } = JSON.parse(fs.readFileSync(workspacePath(), 'utf8')) as {
    labId: string;
    projectId: string;
  };
  const api = new VirtualLabApi(await accessToken('primary'));

  let balance = 0;
  try {
    await expect
      .poll(async () => {
        balance = (await api.projectBalance(labId, projectId)).balance;
        return balance;
      })
      .toBeGreaterThanOrEqual(PROJECT_CREDITS);
  } catch (cause) {
    const short =
      `The project was given ${report?.assigned} credits but holds ${balance}, so nothing ` +
      'can be launched. The assignment did not reach the accounting service.';
    await recordCredits({ problem: short });
    throw new Error(short, { cause });
  }
});
