/** Creates the project this run works in, and funds it. */

import * as fs from 'node:fs';

import { PROJECT_LIMIT, VirtualLabApi } from '@api/virtual-lab';
import { credits, recordCredits } from '@fixtures/run/credit-report';
import {
  commit,
  hasCredentials,
  PROJECT_CREDITS,
  requireEnv,
  RUN_ID,
  RUN_STARTED_AT,
  tokenPath,
  workspacePath,
} from '@fixtures/run/env';
import { log } from '@fixtures/run/logger';
import { expect, test as setup } from '@playwright/test';

setup('prepare a project for this run', async () => {
  setup.skip(
    !hasCredentials('primary'),
    'No credentials for the primary user, so it has no lab to prepare.'
  );

  const labId = requireEnv('LAB_ID').LAB_ID;
  const api = new VirtualLabApi(fs.readFileSync(tokenPath('primary'), 'utf8').trim());
  const required = PROJECT_CREDITS;

  const labBalance = await api.labBalance(labId);
  await recordCredits({ labBalance, required });

  const affordable = labBalance >= required;
  if (!affordable) {
    await recordCredits({
      problem:
        `The virtual lab holds ${labBalance} credits and this run needs ${required}. ` +
        'Nothing can be launched until someone tops the lab up, so the tests that ' +
        'spend are not attempted. Everything that only reads still runs.',
    });
  }

  const projects = await api.listProjects(labId);
  if (projects.length >= PROJECT_LIMIT) {
    const problem =
      `The virtual lab already holds ${projects.length} of its ${PROJECT_LIMIT} projects, ` +
      'so this run cannot take one. Some are probably left over from runs that did not ' +
      'finish their teardown.';
    await recordCredits({ problem });
    log.error(
      { run: RUN_ID, lab: labId, projects: projects.length, limit: PROJECT_LIMIT },
      'virtual lab is full'
    );
    expect(projects.length, problem).toBeLessThan(PROJECT_LIMIT);
  }

  const projectId = await api.createProject(
    labId,
    `e2e-${RUN_ID}`,
    'Created by an end-to-end run. Deleted when that run finishes.'
  );

  await Bun.write(workspacePath(), `${JSON.stringify({ labId, projectId }, null, 2)}\n`);
  await recordCredits({ projectId });

  const announce = (assigned: number | null): void => {
    const fields = {
      run: RUN_ID,
      startedAt: RUN_STARTED_AT,
      commit: commit(),
      lab: labId,
      project: projectId,
      credits: { labBalanceBefore: labBalance, required, assigned },
    };

    if (assigned === null) log.warn(fields, 'run prepared without credits');
    else log.info(fields, 'run prepared');
  };

  if (!affordable) {
    announce(null);
    return;
  }

  try {
    await api.assignBudget(labId, projectId, credits(required));
  } catch (cause) {
    await api.deleteProject(labId, projectId).catch(() => undefined);
    await recordCredits({
      removed: 'ok',
      problem: `Could not move ${required} credits into the project: ${String(cause)}`,
    });
    throw cause;
  }

  await recordCredits({ assigned: required });
  announce(required);
});
