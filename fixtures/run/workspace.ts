/** Gives the project a run took back to the lab: the credits first, then the project. */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { VirtualLabApi } from '@api/virtual-lab';

import { credits, readCreditReport, recordCredits } from './credit-report';
import { isCI, RUN_DIR, RUN_ID, tokenPath, workspacePath } from './env';
import { log } from './logger';

export type Teardown = { projectId: string; removed: 'ok' | 'failed' };

/**
 * Returns the project's credits and deletes it. The workspace file goes with
 * the project, so calling this again finds nothing and does nothing. That is
 * what lets the teardown project, Playwright's global teardown, the guard and
 * the CI step all call it without treading on each other.
 */
export async function teardownWorkspace(): Promise<Teardown | undefined> {
  const file = workspacePath();
  if (!fs.existsSync(file)) {
    log.info({ run: RUN_ID }, 'this run holds no project, so there is nothing to give back');
    return undefined;
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

  if (removed === 'ok') {
    fs.rmSync(file, { force: true });
    log.info({ run: RUN_ID, project: projectId }, 'gave the project back');
  }

  return { projectId, removed };
}

/** True when a process with this id exists. */
export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

const TEARDOWN_SCRIPT = path.resolve(process.cwd(), 'scripts/ci/teardown.ts');

/**
 * Leaves a process behind that gives the project back once the runner is gone.
 *
 * One Ctrl+C lets Playwright run its global teardown. A second one, or a kill,
 * does not, so the give-back also waits in a process of its own, outside the
 * terminal's process group, for the runner to exit. Call it from a worker: its
 * parent is the runner. A worker has no terminal, so the guard writes to the
 * tty directly, or nowhere. Not in CI, where a workflow step does this.
 */
export function guardWorkspace(): void {
  if (isCI) return;

  const lock = path.join(RUN_DIR, 'teardown.pid');
  if (fs.existsSync(lock) && alive(Number(fs.readFileSync(lock, 'utf8')))) return;

  const tty = openTty();
  const guard = spawn(process.execPath, [TEARDOWN_SCRIPT, '--after', String(process.ppid)], {
    detached: true,
    stdio: ['ignore', tty, tty],
  });
  guard.on('error', (cause) => {
    log.warn({ run: RUN_ID, reason: String(cause) }, 'could not start the teardown guard');
  });
  guard.unref();

  if (guard.pid === undefined) return;
  fs.writeFileSync(lock, String(guard.pid));
  log.info(
    { run: RUN_ID, guard: guard.pid, runner: process.ppid },
    'a guard will give the project back if this run dies'
  );
}

function openTty(): number | 'ignore' {
  try {
    return fs.openSync('/dev/tty', 'w');
  } catch {
    return 'ignore';
  }
}
