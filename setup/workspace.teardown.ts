import * as fs from 'node:fs';

import { VirtualLabApi } from '@api/virtual-lab';
import { credits, readCreditReport, recordCredits } from '@fixtures/credit-report';
import { hasCredentials, RUN_ID, tokenPath, workspacePath } from '@fixtures/env';
import { log } from '@fixtures/logger';
import { expect, test as teardown } from '@playwright/test';

/**
 * Gives the project back.
 *
 * Two things happen here and they are not equally important. Returning the
 * leftover credits is bookkeeping: if it fails the lab is short for a while and
 * someone can move them by hand. Deleting the project is not: a lab holds forty,
 * every run takes one, and a run that keeps its project takes one away from
 * everyone else until a person notices. So a failed transfer is reported and
 * the run stays green, while a project that could not be deleted fails here.
 */
teardown('give the project back', async () => {
  teardown.skip(!hasCredentials('primary'), 'This run never prepared a project.');

  const file = workspacePath();
  if (!fs.existsSync(file)) {
    log.info({ run: RUN_ID }, 'no project was prepared, so there is nothing to give back');
    return;
  }

  const { labId, projectId } = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    labId: string;
    projectId: string;
  };
  const api = new VirtualLabApi(fs.readFileSync(tokenPath('primary'), 'utf8').trim());
  const assigned = readCreditReport()?.assigned;

  // What the suite actually cost is the number that sets E2E_PROJECT_CREDITS
  // for the next run, so it is worth reading even when the transfer back fails.
  const remaining = await api
    .projectBalance(labId, projectId)
    .then((balance) => balance.balance)
    .catch(() => undefined);

  if (remaining !== undefined) {
    const spent = assigned === undefined ? undefined : credits(assigned - remaining);
    await recordCredits({ remaining, ...(spent === undefined ? {} : { spent }) });
    log.info(
      { run: RUN_ID, project: projectId, credits: { remaining, spent: spent ?? null } },
      'read the project balance'
    );
  }

  const returnable = credits(remaining ?? 0);
  if (returnable > 0) {
    const reversed = await api
      .reverseBudget(labId, projectId, returnable)
      .then(() => 'ok' as const)
      .catch((cause: unknown) => {
        // Survivable: the credits stay with a project that is about to go, which
        // is a number in a ledger rather than a broken run.
        log.warn(
          { run: RUN_ID, project: projectId, amount: returnable, reason: String(cause) },
          'could not return credits to the lab'
        );
        return 'failed' as const;
      });
    await recordCredits({ reversed, returned: reversed === 'ok' ? returnable : 0 });
  } else {
    await recordCredits({ reversed: 'nothing to return', returned: 0 });
  }

  const removed = await api
    .deleteProject(labId, projectId)
    .then(() => 'ok' as const)
    .catch((cause: unknown) => {
      log.error(
        { run: RUN_ID, project: projectId, reason: String(cause) },
        'could not delete the project'
      );
      return 'failed' as const;
    });
  await recordCredits({ removed });

  expect(
    removed,
    `Project ${projectId} is still in the lab. It counts against the lab's forty until ` +
      'someone deletes it, so later runs will start failing to create their own.'
  ).toBe('ok');
});
