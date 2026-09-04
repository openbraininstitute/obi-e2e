/** Returns the credits and deletes the project the run created. */

import * as fs from 'node:fs';

import { VirtualLabApi } from '@api/virtual-lab';
import { credits, readCreditReport, recordCredits } from '@fixtures/credit-report';
import { hasCredentials, RUN_ID, tokenPath, workspacePath } from '@fixtures/env';
import { log } from '@fixtures/logger';
import { expect, test as teardown } from '@playwright/test';

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
