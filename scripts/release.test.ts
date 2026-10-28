import { describe, expect, test } from 'bun:test';

import {
  dispatchFields,
  parseOptions,
  pullRequestPlan,
  pullRequestText,
  RELEASE_EVENT,
  servesTag,
  startedRun,
  UsageError,
} from './release';

const RELEASE = {
  tag: '2026.10.28.2',
  url: 'https://github.com/openbraininstitute/core-web-app/releases/tag/2026.10.28.2',
  commit: '0313941c02f66c27e6aedfd29d493cea11c7a1ac',
};

describe('parseOptions', () => {
  test('reads a tag, with every switch off', () => {
    expect(parseOptions(['--tag', '2026.10.28.2'])).toEqual({
      tag: '2026.10.28.2',
      dryRun: false,
      force: false,
      wait: true,
    });
  });

  test('takes --tag=value as well, and each switch', () => {
    expect(parseOptions(['--tag=latest', '--dry-run', '--force', '--no-wait'])).toEqual({
      tag: 'latest',
      dryRun: true,
      force: true,
      wait: false,
    });
  });

  test('asks for the help with -h, whatever else is there', () => {
    expect(parseOptions(['-h'])).toBeNull();
    expect(parseOptions(['--tag', 'x', '--help'])).toBeNull();
  });

  test('refuses a missing or blank tag', () => {
    expect(() => parseOptions([])).toThrow(UsageError);
    expect(() => parseOptions(['--tag', '  '])).toThrow('--tag is required');
  });

  test('refuses what it does not know, rather than ignoring a typo', () => {
    expect(() => parseOptions(['--tag', 'x', '--dryrun'])).toThrow(UsageError);
    expect(() => parseOptions(['--tag', 'x', 'extra'])).toThrow(UsageError);
  });
});

describe('dispatchFields', () => {
  test('sends what the Azure gate sends, and the commit', () => {
    expect(dispatchFields(RELEASE)).toEqual([
      `event_type=${RELEASE_EVENT}`,
      'client_payload[release]=2026.10.28.2',
      `client_payload[release_url]=${RELEASE.url}`,
      `client_payload[commit]=${RELEASE.commit}`,
      'client_payload[repository]=manual (bun run release)',
    ]);
  });
});

describe('servesTag', () => {
  test('matches the version staging names, trimmed', () => {
    expect(servesTag({ version: ' 2026.10.28.2\n' }, '2026.10.28.2')).toBe(true);
  });

  test('a different build, no version, or no answer is not the tag', () => {
    expect(servesTag({ version: '2026.10.28.1' }, '2026.10.28.2')).toBe(false);
    expect(servesTag({}, '2026.10.28.2')).toBe(false);
    expect(servesTag(null, '2026.10.28.2')).toBe(false);
  });
});

const run = (databaseId: number, displayTitle: string) => ({
  databaseId,
  displayTitle,
  event: 'repository_dispatch',
  url: `https://github.com/r/actions/runs/${databaseId}`,
});

describe('startedRun', () => {
  test('is the newest release run after the baseline', () => {
    const runs = [run(30, RELEASE_EVENT), run(20, RELEASE_EVENT), run(40, 'core-web-app-main')];
    expect(startedRun(runs, 10)).toBe('https://github.com/r/actions/runs/30');
  });

  test('ignores release runs from before it was sent', () => {
    expect(startedRun([run(10, RELEASE_EVENT)], 10)).toBe('');
  });
});

describe('pullRequestPlan', () => {
  test('leaves an open pull request alone', () => {
    expect(pullRequestPlan('https://github.com/r/pull/50', false)).toBe('exists');
  });

  test('opens one only when the two branches hold different files', () => {
    expect(pullRequestPlan('', false)).toBe('open');
    // After a squash merge: main still counts commits ahead, but the files match.
    expect(pullRequestPlan('', true)).toBe('nothing');
  });
});

describe('pullRequestText', () => {
  test('names the release and links it, as the workflow job does', () => {
    const { title, body } = pullRequestText(RELEASE);
    expect(title).toBe('Release 2026.10.28.2: update the staging tests');
    expect(body).toContain(`[2026.10.28.2](${RELEASE.url})`);
  });
});
