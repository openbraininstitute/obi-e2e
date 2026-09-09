#!/usr/bin/env bun

/**
 * Gives the run's project back when the test run could not do it itself.
 *
 * Playwright runs the teardown project only when a run reaches its end. One
 * Ctrl+C skips it but still runs this file as the global teardown. A second
 * Ctrl+C, or a kill, stops even that, so the workspace setup also starts this
 * file detached, with `--after <pid>`: it waits for the runner to exit, then
 * gives back whatever the run still holds. A cancelled CI job kills the process
 * outright, and a workflow step runs this file instead. A run that ended
 * normally has already given its project back, and every one of these finds
 * nothing.
 *
 * Usage: E2E_RUN_ID=<run> bun scripts/ci/teardown.ts [--after <pid>]
 */

import * as fs from 'node:fs';

import { workspacePath } from '@fixtures/run/env';
import { teardownOnboardingWorkspace } from '@fixtures/run/onboarding-workspace';
import { alive, teardownWorkspace } from '@fixtures/run/workspace';

export default async function globalTeardown(): Promise<void> {
  const primary = await teardownWorkspace();
  if (primary?.removed === 'failed') {
    throw new Error(
      `Project ${primary.projectId} is still in the lab. It counts against the lab's forty ` +
        'until someone deletes it. `bun run reclaim` does that.'
    );
  }

  const onboarding = await teardownOnboardingWorkspace();
  if (onboarding?.removed === 'failed') {
    throw new Error(
      'Onboarding resources created by this run are still present. The manifest was retained ' +
        'for reclaim.'
    );
  }
}

/** Waits for the runner to exit, then gives back what it left. Quiet when it left nothing. */
async function afterExit(pid: number): Promise<void> {
  if (!Number.isInteger(pid)) throw new Error('--after needs the pid of the runner to wait for.');

  // Ctrl+C is for the run, never for this.
  process.on('SIGINT', () => undefined);

  while (alive(pid)) await Bun.sleep(500);
  if (!fs.existsSync(workspacePath())) return;
  await globalTeardown();
}

if (import.meta.main) {
  const flag = process.argv.indexOf('--after');
  const pid = flag === -1 ? undefined : Number(process.argv[flag + 1]);
  (pid === undefined ? globalTeardown() : afterExit(pid)).catch((error: unknown) => {
    console.error(String(error));
    process.exitCode = 1;
  });
}
