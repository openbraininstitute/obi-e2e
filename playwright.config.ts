import { defineConfig, devices } from '@playwright/test';

import { AUTH_STATE_PATH, baseURL, isCI, resolveBrowser, resolveWorkers } from './fixtures/env';

// Not a sleep: a web-first assertion resolves as soon as its condition holds
// and only spends this budget when the condition never becomes true.
const ASSERTION_TIMEOUT = 30_000;

export default defineConfig({
  testDir: '.',
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
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'public',
      testDir: './tests/public',
    },
    {
      name: 'private',
      testDir: './tests/private',
      dependencies: ['setup'],
      use: { storageState: AUTH_STATE_PATH },
    },
  ],
});
