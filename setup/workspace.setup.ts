import * as fs from 'node:fs';

import { PROJECT_LIMIT, VirtualLabApi } from '@api/virtual-lab';
import { credits, recordCredits } from '@fixtures/credit-report';
import {
  commit,
  hasCredentials,
  PROJECT_CREDITS,
  requireEnv,
  RUN_ID,
  RUN_STARTED_AT,
  tokenPath,
  workspacePath,
} from '@fixtures/env';
import { log } from '@fixtures/logger';
import { expect, test as setup } from '@playwright/test';

/**
 * Gives the run a project of its own to spend in.
 *
 * The lab is long-lived and shared: many runs point at it at once — a run per
 * open pull request, plus whoever is testing locally — and a lab holds at most
 * forty projects. So a run takes one for the duration and gives it back, rather
 * than everyone writing into a single project and reading each other's data.
 *
 * Money moves with it. A project starts empty and cannot pay for a simulation,
 * so the run transfers a budget in before the suite starts and returns what is
 * left at the end.
 *
 * A lab too poor to pay does not stop this step. Most of the suite only reads,
 * and reading costs nothing, so the project is still taken and those tests
 * still run. It is the credits check that stands in front of the tests which
 * spend, and it fails there instead.
 */
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

  // A lab that is already full cannot be told apart from a broken create call
  // by its error, and a run that leaked its project is the likeliest cause.
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

  // Written before the transfer, so a run that dies mid-transfer still leaves
  // the teardown something to clean up.
  await Bun.write(workspacePath(), `${JSON.stringify({ labId, projectId }, null, 2)}\n`);
  await recordCredits({ projectId });

  /**
   * Everything a later reader needs to place this run: which lab and project it
   * touched, which code it ran, when it started, and what it could afford
   * before it spent anything. One record, because these are only useful
   * together — a project id without the run that made it names nothing.
   */
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
    // The project is useless without a budget, so it is handed straight back
    // rather than left to count against the lab's forty.
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
