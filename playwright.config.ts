import { defineConfig, devices } from '@playwright/test';

import { authStatePath, baseURL, isCI, resolveBrowser, resolveWorkers } from './fixtures/env';

// Not a sleep: a web-first assertion resolves as soon as its condition holds
// and only spends this budget when the condition never becomes true.
const ASSERTION_TIMEOUT = 30_000;

export default defineConfig({
  testIgnore: ['node_modules/**', 'test-results/**', 'playwright-report/**'],
  timeout: isCI ? 120_000 : 90_000,
  expect: { timeout: ASSERTION_TIMEOUT },

  fullyParallel: true,
  forbidOnly: isCI,
  // One retry exists to capture a trace, not to hide a flaky test.
  retries: isCI ? 1 : 0,
  workers: resolveWorkers(),
  // Playwright wipes outputDir at the start of every run, so the JSON report
  // must not live inside it.
  outputDir: 'test-results/artifacts',

  reporter: isCI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github'],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL,
    actionTimeout: ASSERTION_TIMEOUT,
    navigationTimeout: isCI ? 90_000 : 60_000,
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    ...resolveBrowser(devices),
  },

  projects: [
    {
      // Runs first. A down service fails here, not as a wall of broken tests.
      name: 'health',
      testDir: './setup',
      testMatch: /health\.setup\.ts/,
    },
    {
      name: 'setup',
      testDir: './setup',
      testMatch: /auth\.setup\.ts/,
      dependencies: ['health'],
    },
    // Every project reads the same scenario folders and selects its tests by
    // tag, so one scenario can run signed out and signed in without duplication.
    {
      name: 'public',
      testDir: './scenarios',
      grep: /@public/,
      dependencies: ['health'],
    },
    {
      name: 'private',
      testDir: './scenarios',
      grep: /@private/,
      dependencies: ['setup'],
      use: { storageState: authStatePath('primary') },
    },
    {
      // Lab and project creation, run as a user that owns nothing.
      name: 'onboarding',
      testDir: './scenarios',
      grep: /@onboarding/,
      dependencies: ['setup'],
      use: { storageState: authStatePath('onboarding') },
    },
  ],
});
