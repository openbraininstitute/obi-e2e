import { describe, expect, test } from 'bun:test';

import { describeBuild, restartTitle, successor } from './app-version';

describe('describeBuild', () => {
  test('names the build and when it was built, from what staging answered on 16 Oct', () => {
    expect(
      describeBuild({ version: '2026.10.16.1', buildTime: '2026-10-16T07:55:16.830Z' })
    ).toEqual({ version: '2026.10.16.1', label: '2026.10.16.1, built 2026-10-16 07:55 UTC' });
  });

  test('tells a rebuild of one version from the first build', () => {
    const first = describeBuild({ version: '2026.10.16.1', buildTime: '2026-10-16T07:55:16Z' });
    const again = describeBuild({ version: '2026.10.16.1', buildTime: '2026-10-16T11:02:40Z' });
    expect(first?.label).not.toBe(again?.label);
  });

  test('is nothing without a version, so a bad answer is never a change', () => {
    expect(describeBuild({})).toBeNull();
    expect(describeBuild({ version: ' ', buildTime: '2026-10-16T07:55:16Z' })).toBeNull();
  });
});

describe('successor', () => {
  test('the preview leaves the next run to the merge relay', () => {
    expect(successor({ E2E_ENVIRONMENT: 'preview', E2E_EVENT: 'repository_dispatch' })).toBe(
      'merge'
    );
  });

  test('a staging run that started on its own starts the next one', () => {
    expect(successor({ E2E_ENVIRONMENT: 'staging', E2E_EVENT: 'schedule' })).toBe('restart');
    expect(successor({ E2E_ENVIRONMENT: 'staging', E2E_EVENT: 'repository_dispatch' })).toBe(
      'restart'
    );
    // A restart that moves again restarts again.
    expect(
      successor({
        E2E_ENVIRONMENT: 'staging',
        E2E_EVENT: 'workflow_dispatch',
        E2E_RELEASE: '2026.10.16.2',
      })
    ).toBe('restart');
  });

  test('a run started by hand, or on production, is left to whoever started it', () => {
    expect(successor({ E2E_ENVIRONMENT: 'staging', E2E_EVENT: 'workflow_dispatch' })).toBe('none');
    expect(successor({ E2E_ENVIRONMENT: 'production', E2E_EVENT: 'schedule' })).toBe('none');
  });
});

test('the restart title is the one e2e.yml gives the run', async () => {
  const workflow = await Bun.file(
    new URL('../../.github/workflows/e2e.yml', import.meta.url)
  ).text();
  expect(workflow).toContain("format('E2E · {0} · {1}', inputs.environment, inputs.release)");
  expect(restartTitle('staging', '2026.10.16.2')).toBe('E2E · staging · 2026.10.16.2');
});
