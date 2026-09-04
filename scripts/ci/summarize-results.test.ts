import { describe, expect, test } from 'bun:test';

import {
  buildSummary,
  collectFeatures,
  creditNotice,
  detectTrigger,
  featureStatus,
  formatDuration,
  passRate,
} from './summarize-results';

const suites = [
  {
    title: 'browse-morphology.spec.ts',
    file: 'scenarios/data/browse-morphology/browse-morphology.spec.ts',
    suites: [
      {
        title: 'Browse morphologies',
        specs: [
          {
            title: 'opens the listing',
            file: 'scenarios/data/browse-morphology/browse-morphology.spec.ts',
            tests: [{ status: 'expected', results: [{ status: 'passed', duration: 12_000 }] }],
          },
          {
            title: 'offers filters',
            file: 'scenarios/data/browse-morphology/browse-morphology.spec.ts',
            tests: [{ status: 'unexpected', results: [{ status: 'failed', duration: 8_000 }] }],
          },
        ],
      },
    ],
  },
  {
    title: 'home.spec.ts',
    file: 'scenarios/site/home/home.spec.ts',
    suites: [
      {
        title: 'Home page',
        specs: [
          {
            title: 'shows the landing page',
            file: 'scenarios/site/home/home.spec.ts',
            tests: [{ status: 'expected', results: [{ status: 'passed', duration: 3_000 }] }],
          },
        ],
      },
    ],
  },
  {
    title: 'health.setup.ts',
    file: 'setup/health.setup.ts',
    specs: [
      {
        title: 'backend services are healthy',
        file: 'setup/health.setup.ts',
        tests: [{ status: 'expected', results: [{ status: 'passed', duration: 1_000 }] }],
      },
    ],
  },
];

describe('collectFeatures', () => {
  test('groups scenario specs and ignores setup', () => {
    const features = collectFeatures(suites);

    expect(features).toHaveLength(2);
    expect(features[0]).toMatchObject({
      name: 'Browse morphologies',
      section: 'data',
      passed: 1,
      failed: 1,
      durationMs: 20_000,
    });
    expect(features[1]).toMatchObject({
      name: 'Home page',
      section: 'site',
      passed: 1,
      failed: 0,
      durationMs: 3_000,
    });
  });
});

describe('feature helpers', () => {
  test('status and pass rate follow failed then flaky then skipped', () => {
    expect(featureStatus({ passed: 1, failed: 1, flaky: 0, skipped: 0 })).toBe('failed');
    expect(featureStatus({ passed: 1, failed: 0, flaky: 1, skipped: 0 })).toBe('flaky');
    expect(featureStatus({ passed: 0, failed: 0, flaky: 0, skipped: 2 })).toBe('skipped');
    expect(passRate({ passed: 4, failed: 1, flaky: 0 })).toBe('80%');
    expect(passRate({ passed: 0, failed: 0, flaky: 0 })).toBe('—');
    expect(passRate({ passed: 9, failed: 1, flaky: 0 })).toBe('90%');
  });

  test('formatDuration and detectTrigger', () => {
    expect(formatDuration(51_000)).toBe('51s');
    expect(formatDuration(471_000)).toBe('7m 51s');
    expect(detectTrigger('schedule')).toBe('Scheduled');
    expect(detectTrigger('workflow_dispatch')).toBe('Manual');
    expect(detectTrigger('push')).toBe('On deploy');
    expect(detectTrigger(undefined)).toBe('Local');
  });
});

describe('buildSummary', () => {
  test('includes services, features and trigger from the environment', () => {
    const summary = buildSummary(
      { suites, stats: { expected: 2, unexpected: 1, flaky: 0, skipped: 0, duration: 24_000 } },
      [{ key: 'entitycore', label: 'Entity core', version: '1.2.3', status: 'healthy' }],
      {
        E2E_ENVIRONMENT: 'staging',
        E2E_BASE_URL: 'https://staging.example',
        PLAYWRIGHT_BROWSER: 'chromium',
        GITHUB_SHA: 'abcdef123456',
        GITHUB_EVENT_NAME: 'schedule',
      }
    );

    expect(summary.trigger).toBe('Scheduled');
    expect(summary.services).toHaveLength(1);
    expect(summary.features).toHaveLength(2);
    expect(summary.failed).toBe(1);
    expect(summary.commit).toBe('abcdef123456');
  });
});

describe('creditNotice', () => {
  test('says nothing when the run was paid for and passed', () => {
    expect(creditNotice({ required: 2000, assigned: 2000, remaining: 1500 }, 0)).toBeNull();
  });

  test('repeats the problem the setup recorded', () => {
    const notice = creditNotice({ required: 2000, problem: 'The lab holds 12 credits.' }, 3);
    expect(notice).toBe('The lab holds 12 credits.');
  });

  test('explains failures that follow an empty project', () => {
    const notice = creditNotice({ required: 2000, assigned: 2000, remaining: 0 }, 4);
    expect(notice).toContain('ran out of credits');
    expect(notice).toContain('E2E_PROJECT_CREDITS');
  });

  test('stays quiet about an empty project when nothing failed', () => {
    expect(creditNotice({ required: 2000, assigned: 2000, remaining: 0 }, 0)).toBeNull();
  });

  test('reports a project that outlived its run', () => {
    const notice = creditNotice(
      { required: 2000, assigned: 2000, remaining: 900, removed: 'failed', projectId: 'p-1' },
      0
    );
    expect(notice).toContain('p-1');
    expect(notice).toContain('could not be deleted');
  });
});
