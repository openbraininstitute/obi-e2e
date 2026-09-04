import * as fs from 'node:fs';

import { PROJECT_LIMIT, VirtualLabApi } from '@api/virtual-lab';
import { credits, recordCredits } from '@fixtures/credit-report';
import {
  hasCredentials,
  PROJECT_CREDITS,
  requireEnv,
  RUN_ID,
  tokenPath,
  workspacePath,
} from '@fixtures/env';
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
 * left at the end. A transfer that fails stops the private suite here: the
 * alternative is every workflow test failing further in, for a reason that
 * would look like a product bug.
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
  console.log(`Virtual lab holds ${labBalance} credits; this run needs ${required}.`);

  if (labBalance < required) {
    const problem =
      `The virtual lab holds ${labBalance} credits and this run needs ${required}. ` +
      'Nothing can be launched until someone tops the lab up, so the private suite ' +
      'is not attempted. The public and onboarding suites are unaffected.';
    await recordCredits({ problem });
    expect(labBalance, problem).toBeGreaterThanOrEqual(required);
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
  console.log(`Project ${projectId} created with ${required} credits.`);
});
