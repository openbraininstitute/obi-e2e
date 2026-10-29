#!/usr/bin/env bun

/**
 * Tells this repository that a web-app release is live on staging, by hand.
 *
 * Normally the Azure deploy does this: azure-terraform-deployment's E2E gate
 * waits until staging serves the new tag, then sends `core-web-app-release`.
 * That starts the staging run and the `main` → `release` pull request. When the
 * gate did not fire, or a release has to be tested again, this sends the same
 * event, then follows it through: it finds the run the event started, waits for
 * its `release-branch` job, and opens the pull request itself if the job could
 * not (GitHub refuses it while Actions may not create pull requests here).
 *
 *   bun run release --tag 2026.10.28.2     the release, once staging serves it
 *   bun run release --tag latest           core-web-app's newest release
 *   bun run release --tag … --dry-run      checks everything, sends nothing
 *   bun run release --tag … --force        sends even if staging serves another tag
 *   bun run release --tag … --no-wait      sends, and leaves the run to itself
 *
 * Needs `gh`, signed in with write access to obi-e2e. Exit 1 on a failure,
 * 2 on a usage error.
 */

import { parseArgs } from 'node:util';

import { requestJson } from '@api/http';
import { Result } from 'better-result';
import { $ } from 'bun';

import { newestAfter, type Run } from './ci/app-version';

const E2E_REPO = 'openbraininstitute/obi-e2e';
const WEB_APP_REPO = 'openbraininstitute/core-web-app';

/** The event the Azure gate sends, and the title e2e.yml gives the run it starts. */
export const RELEASE_EVENT = 'core-web-app-release';

/** A dispatched run shows up in the run list within seconds; a minute is generous. */
const RUN_APPEARS_WITHIN_MS = 60_000;
/** `release-branch` needs only `matrix` before it, so it is done in a minute or two. */
const PR_JOB_DONE_WITHIN_MS = 5 * 60_000;

export class UsageError extends Error {}
/** A failure the person running this can act on: printed as is, without a stack. */
export class Stop extends Error {}

export type Options = { tag: string; dryRun: boolean; force: boolean; wait: boolean };

const HELP = `release — tell obi-e2e that a web-app release is live on staging

usage: bun run release --tag <tag | latest> [--dry-run] [--force] [--no-wait]

  --tag <tag>   the core-web-app release, e.g. 2026.10.28.2, or "latest"
  --dry-run     check the release and staging, print what would be sent, send nothing
  --force       send even when staging serves another tag
  --no-wait     send, print the run, and stop there
  -h, --help    this text

It sends ${RELEASE_EVENT}, as azure-terraform-deployment's E2E gate does, which
starts the staging run and the main → release pull request. It then waits for
the run's release-branch job and opens that pull request itself if the job could
not.`;

/** The command line, or a UsageError naming what is wrong with it. `null` asks for the help. */
export function parseOptions(argv: string[]): Options | null {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      strict: true,
      allowPositionals: false,
      options: {
        tag: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
        'no-wait': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
  } catch (error) {
    throw new UsageError((error as Error).message);
  }

  const { values } = parsed;
  if (values.help) return null;

  const tag = values.tag?.trim();
  if (!tag) throw new UsageError('--tag is required: a core-web-app release, or "latest".');

  return { tag, dryRun: values['dry-run'], force: values.force, wait: !values['no-wait'] };
}

export type Release = { tag: string; url: string; commit: string };

/**
 * The payload, field by field as `gh api --field` takes it.
 *
 * What the Azure gate sends, plus the release's commit, which the Teams card
 * links to. `repository` says where the event came from.
 */
export function dispatchFields(release: Release): string[] {
  return [
    `event_type=${RELEASE_EVENT}`,
    `client_payload[release]=${release.tag}`,
    `client_payload[release_url]=${release.url}`,
    `client_payload[commit]=${release.commit}`,
    'client_payload[repository]=manual (bun run release)',
  ];
}

/** Whether staging's `/app/version` answer names the tag. */
export function servesTag(answer: { version?: string } | null, tag: string): boolean {
  return answer?.version?.trim() === tag;
}

/** The newest run after `baseline` that the release event started. */
export function startedRun(runs: Run[], baseline: number): string {
  return newestAfter(runs, baseline, (run) => run.displayTitle === RELEASE_EVENT);
}

/**
 * What to do about the `main` → `release` pull request.
 *
 * By content, not by commits: a squash merge never makes main's commits part
 * of release, so "commits ahead" stays above zero after the release pull
 * request merged. The two trees are equal exactly when release has what main has.
 */
export function pullRequestPlan(
  openUrl: string,
  sameContent: boolean
): 'exists' | 'open' | 'nothing' {
  if (openUrl) return 'exists';
  return sameContent ? 'nothing' : 'open';
}

/** The same words the `release-branch` job of e2e.yml uses, so either one reads alike. */
export function pullRequestText(release: Release): { title: string; body: string } {
  return {
    title: `Release ${release.tag}: update the staging tests`,
    body:
      `The web app released [${release.tag}](${release.url}) to staging. Merge this so staging ` +
      'and production run the tests written for it. Resolve any conflict here.',
  };
}

/** Runs `gh` and returns its output, or stops with what `gh` said. */
async function gh(args: string[], what: string): Promise<string> {
  const result = await $`gh ${args}`.nothrow().quiet();
  if (result.exitCode !== 0) {
    throw new Stop(`Could not ${what}: ${result.stderr.toString().trim() || 'gh failed'}.`);
  }
  return result.stdout.toString().trim();
}

async function ghJson<T>(args: string[], what: string): Promise<T> {
  return JSON.parse(await gh(args, what)) as T;
}

/** Calls `check` every `everyMs` until it returns something, or gives up after `withinMs`. */
async function poll<T>(
  check: () => Promise<T | null>,
  everyMs: number,
  withinMs: number
): Promise<T | null> {
  for (let waited = 0; waited <= withinMs; waited += everyMs) {
    const found = await check();
    if (found !== null) return found;
    await Bun.sleep(everyMs);
  }
  return null;
}

type GitHubRelease = { tag_name: string; html_url: string; draft: boolean; prerelease: boolean };

async function resolveRelease(tag: string): Promise<Release> {
  const path = tag === 'latest' ? 'releases/latest' : `releases/tags/${encodeURIComponent(tag)}`;
  const found = await ghJson<GitHubRelease>(
    ['api', `repos/${WEB_APP_REPO}/${path}`],
    `find the core-web-app release "${tag}"`
  );
  // The gate never sends these, so neither does this.
  if (found.draft || found.prerelease) {
    throw new Stop(
      `${found.tag_name} is a ${found.draft ? 'draft' : 'pre-release'}, not a release.`
    );
  }

  const commit = await gh(
    ['api', `repos/${WEB_APP_REPO}/commits/${encodeURIComponent(found.tag_name)}`, '--jq', '.sha'],
    `read the commit of ${found.tag_name}`
  );
  return { tag: found.tag_name, url: found.html_url, commit };
}

/** The staging URL CI tests, from the same repository variable. */
async function stagingUrl(): Promise<string> {
  return gh(['variable', 'get', 'STAGING_APP_URI', '--repo', E2E_REPO], 'read STAGING_APP_URI');
}

async function checkStaging(release: Release, force: boolean): Promise<void> {
  const url = await stagingUrl();
  const answer = await requestJson<{ version?: string }>(new URL('/app/version', url).href);
  const served = Result.isError(answer) ? null : answer.value;

  if (servesTag(served, release.tag)) {
    console.log(`✓ ${url} serves ${release.tag}`);
    return;
  }

  const what = served?.version ? `serves ${served.version}` : 'did not say what it serves';
  if (!force) {
    throw new Stop(
      `${url} ${what}, not ${release.tag}. The run would test another build: deploy it first, ` +
        'or pass --force to send anyway.'
    );
  }
  console.log(`! ${url} ${what}, not ${release.tag}; sending anyway (--force)`);
}

async function recentRuns(): Promise<Run[]> {
  return ghJson<Run[]>(
    [
      'run',
      'list',
      '--repo',
      E2E_REPO,
      '--workflow',
      'e2e.yml',
      '--limit',
      '20',
      '--json',
      'databaseId,displayTitle,event,url',
    ],
    'list the E2E runs'
  );
}

type Job = { name: string; status: string; conclusion: string };

async function prJob(runUrl: string): Promise<Job | null> {
  const { jobs } = await ghJson<{ jobs: Job[] }>(
    ['run', 'view', runUrl, '--repo', E2E_REPO, '--json', 'jobs'],
    'read the run'
  );
  const job = jobs.find((one) => one.name === 'release-branch');
  return job?.status === 'completed' ? job : null;
}

async function ensurePullRequest(release: Release, dryRun: boolean): Promise<void> {
  const open = await gh(
    [
      'pr',
      'list',
      '--repo',
      E2E_REPO,
      '--base',
      'release',
      '--head',
      'main',
      '--json',
      'url',
      '--jq',
      '.[0].url // ""',
    ],
    'list the release pull requests'
  );
  const [mainTree, releaseTree] = await Promise.all(
    ['main', 'release'].map((branch) =>
      gh(
        ['api', `repos/${E2E_REPO}/commits/${branch}`, '--jq', '.commit.tree.sha'],
        `read the ${branch} branch`
      )
    )
  );

  switch (pullRequestPlan(open, mainTree === releaseTree)) {
    case 'exists':
      console.log(`✓ the release pull request is open: ${open}`);
      return;
    case 'nothing':
      console.log('✓ release already has everything main has: no pull request needed');
      return;
    case 'open': {
      if (dryRun) {
        console.log('· would open the release pull request: main differs from release');
        return;
      }
      const { title, body } = pullRequestText(release);
      const url = await gh(
        [
          'pr',
          'create',
          '--repo',
          E2E_REPO,
          '--base',
          'release',
          '--head',
          'main',
          '--title',
          title,
          '--body',
          body,
        ],
        'open the release pull request'
      );
      console.log(`✓ opened the release pull request: ${url}`);
    }
  }
}

async function sendRelease(options: Options): Promise<void> {
  const release = await resolveRelease(options.tag);
  console.log(`✓ ${release.tag} is a core-web-app release (${release.commit.slice(0, 7)})`);

  await checkStaging(release, options.force);

  const fields = dispatchFields(release);
  if (options.dryRun) {
    console.log(
      `· would send to ${E2E_REPO}:\n${fields.map((field) => `    ${field}`).join('\n')}`
    );
    await ensurePullRequest(release, true);
    return;
  }

  // Ids only grow, so the run this event starts is the first one newer than this.
  const baseline = Math.max(0, ...(await recentRuns()).map((one) => one.databaseId));

  await gh(
    ['api', `repos/${E2E_REPO}/dispatches`, ...fields.flatMap((field) => ['--field', field])],
    `send ${RELEASE_EVENT}`
  );
  console.log(`✓ sent ${RELEASE_EVENT} for ${release.tag}`);

  const runUrl = await poll(
    async () => startedRun(await recentRuns(), baseline) || null,
    3_000,
    RUN_APPEARS_WITHIN_MS
  );
  if (!runUrl) {
    throw new Stop(
      `The event was sent, but no run showed up within ${RUN_APPEARS_WITHIN_MS / 1000} s. ` +
        `Look at https://github.com/${E2E_REPO}/actions/workflows/e2e.yml.`
    );
  }
  console.log(`✓ the staging run: ${runUrl}`);
  if (!options.wait) return;

  const job = await poll(() => prJob(runUrl), 10_000, PR_JOB_DONE_WITHIN_MS);
  if (!job) {
    console.log(`! release-branch did not finish within ${PR_JOB_DONE_WITHIN_MS / 60_000} min`);
  } else if (job.conclusion !== 'success') {
    console.log(`! release-branch ended ${job.conclusion}; see the run`);
  }
  await ensurePullRequest(release, false);
}

async function main(): Promise<number> {
  try {
    const options = parseOptions(Bun.argv.slice(2));
    if (!options) {
      console.log(HELP);
      return 0;
    }
    await sendRelease(options);
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n\n${HELP}`);
      return 2;
    }
    if (error instanceof Stop) {
      console.error(`✗ ${error.message}`);
      return 1;
    }
    throw error;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
