#!/usr/bin/env bun

/**
 * Keeps a run on the one build it started on.
 *
 * A deployment can change under a run: a core-web-app merge reaches the
 * preview, a release reaches staging. The open pages then ask for chunks the new
 * build no longer serves, and tests fail for a reason that is not theirs. On
 * 16 Oct a release reached staging partway through the nightly and failed two
 * campaigns that were not broken. Nothing tells this repository when a
 * release reaches staging, so the run watches for it itself.
 *
 * Usage, with E2E_BASE_URL set:
 *   bun scripts/ci/app-version.ts note     prints the build the target serves
 *   bun scripts/ci/app-version.ts watch    cancels this run once that changes
 *   bun scripts/ci/app-version.ts stopped  after a cancel: did the build move,
 *                                          and which run tests the new one
 */

import { appendFileSync } from 'node:fs';

import { requestJson } from '@api/http';
import { Result } from 'better-result';
import { $ } from 'bun';

/** What `/app/version` answers. `version` names the build; `buildTime` changes on every one. */
type Served = { version?: string; buildTime?: string };

export type Build = { version: string; label: string };

/** One request a minute: a deploy is noticed within that, for a few bytes each time. */
const CHECK_EVERY_MS = 60_000;

/** How long a restarted run may take to show up in the run list. */
const APPEARS_WITHIN_MS = 30_000;

/** What the merge relay names the run it dispatches. */
const MERGE_RUN = 'core-web-app-main';

/**
 * The build in words, which is also what two reads compare. The build time is
 * in it because a rebuild of one version still renames its chunks.
 */
export function describeBuild(answer: Served): Build | null {
  const version = answer.version?.trim();
  if (!version) return null;

  const built = answer.buildTime?.trim()
    ? `, built ${answer.buildTime.slice(0, 16).replace('T', ' ')} UTC`
    : '';
  return { version, label: `${version}${built}` };
}

/** The title `e2e.yml` gives a run that restarts on a new build. Its `run-name` matches. */
export function restartTitle(environment: string, version: string): string {
  return `E2E · ${environment} · ${version}`;
}

/**
 * Who starts the run for the new build.
 *
 * The preview's comes from core-web-app's merge relay. On staging, nothing
 * would, so a run that started on its own (a schedule, a release, a restart)
 * starts it. A run somebody started by hand is theirs to start again.
 */
export function successor(env: NodeJS.ProcessEnv): 'merge' | 'restart' | 'none' {
  if (env.E2E_ENVIRONMENT === 'preview') return 'merge';
  if (env.E2E_ENVIRONMENT !== 'staging') return 'none';

  const event = env.E2E_EVENT || env.GITHUB_EVENT_NAME;
  const automatic = event !== 'workflow_dispatch' || Boolean(env.E2E_RELEASE?.trim());
  return automatic ? 'restart' : 'none';
}

/** A read that fails is not a change: the next one decides. */
async function served(baseUrl: string): Promise<Build | null> {
  const answer = await requestJson<Served>(new URL('/app/version', baseUrl).href);
  return Result.isError(answer) ? null : describeBuild(answer.value);
}

type Run = { databaseId: number; displayTitle: string; url: string };

async function recentRuns(env: NodeJS.ProcessEnv): Promise<Run[]> {
  const listed =
    await $`gh run list --repo ${env.GITHUB_REPOSITORY ?? ''} --workflow e2e.yml --limit 30 --json databaseId,displayTitle,url`
      .nothrow()
      .quiet();
  return listed.exitCode === 0 ? (listed.json() as Run[]) : [];
}

/** The newest merge run started after this one: the run that replaced it on the preview. */
async function newerMergeRun(env: NodeJS.ProcessEnv): Promise<string> {
  const mine = Number(env.GITHUB_RUN_ID);
  const newer = (await recentRuns(env))
    .filter((run) => run.displayTitle === MERGE_RUN && run.databaseId > mine)
    .toSorted((left, right) => right.databaseId - left.databaseId);
  return newer[0]?.url ?? '';
}

/**
 * Starts the run for the new build, once.
 *
 * Both suites of a run watch the same build and both stop, so the second to
 * get here finds the run the first started, by its title, and leaves it be.
 */
async function restart(env: NodeJS.ProcessEnv, version: string): Promise<string> {
  const environment = env.E2E_ENVIRONMENT ?? '';
  const title = restartTitle(environment, version);
  const titled = async () =>
    (await recentRuns(env)).find((run) => run.displayTitle === title)?.url ?? '';

  const already = await titled();
  if (already) return already;

  const started =
    await $`gh workflow run e2e.yml --repo ${env.GITHUB_REPOSITORY ?? ''} --ref ${env.GITHUB_REF_NAME || 'main'} -f environment=${environment} -f slow=${env.E2E_RESTART_SLOW || 'false'} -f release=${version}`.nothrow();
  if (started.exitCode !== 0) {
    console.log(`Could not start a run for ${version}: ${started.stderr.toString().trim()}`);
    return '';
  }

  for (let waited = 0; waited < APPEARS_WITHIN_MS; waited += 3_000) {
    await Bun.sleep(3_000);
    const url = await titled();
    if (url) return url;
  }
  return '';
}

async function watch(env: NodeJS.ProcessEnv, baseUrl: string): Promise<void> {
  const from = env.E2E_APP_VERSION?.trim();
  if (!from) {
    console.log('No build was noted at the start, so there is nothing to compare.');
    return;
  }

  for (;;) {
    await Bun.sleep(CHECK_EVERY_MS);
    const now = await served(baseUrl);
    if (now && now.label !== from) {
      console.log(`${baseUrl} moved from ${from} to ${now.label}. Cancelling this run.`);
      await $`gh run cancel ${env.GITHUB_RUN_ID ?? ''} --repo ${env.GITHUB_REPOSITORY ?? ''}`.nothrow();
      return;
    }
  }
}

/**
 * Writes `to` (the new build) and `by` (the run testing it) when the build
 * moved, and nothing when it did not: a run cancelled for another reason posts
 * its usual card.
 */
async function stopped(env: NodeJS.ProcessEnv, baseUrl: string): Promise<void> {
  const from = env.E2E_APP_VERSION?.trim();
  const now = await served(baseUrl);
  if (!from || !now || now.label === from) {
    console.log(`The build did not move (${from || 'not noted'}).`);
    return;
  }

  // Written first: the thread still learns why the run stopped if what follows fails.
  console.log(`Moved from ${from} to ${now.label}.`);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `to=${now.label}\n`);

  const next = successor(env);
  const by =
    next === 'merge'
      ? await newerMergeRun(env)
      : next === 'restart'
        ? await restart(env, now.version)
        : '';

  if (by) console.log(`The new build is tested by ${by}.`);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `by=${by}\n`);
}

async function main(): Promise<void> {
  const [command] = Bun.argv.slice(2);
  const baseUrl = process.env.E2E_BASE_URL;
  if (!baseUrl) throw new Error('E2E_BASE_URL is not set.');

  switch (command) {
    case 'note':
      console.log((await served(baseUrl))?.label ?? '');
      return;
    case 'watch':
      return watch(process.env, baseUrl);
    case 'stopped':
      return stopped(process.env, baseUrl);
    default:
      throw new Error(`Unknown command "${command}". Use note, watch or stopped.`);
  }
}

if (import.meta.main) {
  await main();
}
