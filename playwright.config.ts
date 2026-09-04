import { defineConfig, devices } from '@playwright/test';

import {
  authStatePath,
  baseURL,
  deploymentEnv,
  isCI,
  resolveBrowser,
  resolveWorkers,
  RUN_ID,
} from './fixtures/env';
import { excludedEnvironmentTag } from './fixtures/tags';

// Not a sleep: a web-first assertion resolves as soon as its condition holds
// and only spends this budget when the condition never becomes true.
const ASSERTION_TIMEOUT = 30_000;

/**
 * What a project must not pick up: the other deployment's tests, plus whatever
 * else that project excludes.
 *
 * Every test runs against both deployments unless it says otherwise, and the
 * exclusion is composed here rather than set once at the top of the config,
 * because a project that declares its own `grepInvert` replaces the config's
 * instead of adding to it — which silently drops the deployment filter.
 */
function excluding(...also: RegExp[]): RegExp {
  const patterns = [excludedEnvironmentTag(deploymentEnv()), ...also];
  return new RegExp(patterns.map((pattern) => pattern.source).join('|'));
}

export default defineConfig({
  testIgnore: ['node_modules/**', 'test-results/**', 'playwright-report/**'],
  timeout: isCI ? 120_000 : 90_000,
  expect: { timeout: ASSERTION_TIMEOUT },

  metadata: { environment: deploymentEnv(), baseUrl: baseURL, runId: RUN_ID },

  fullyParallel: true,
  forbidOnly: isCI,
  // One retry exists to capture a trace, not to hide a flaky test.
  retries: isCI ? 1 : 0,
  workers: resolveWorkers(),
  // Playwright wipes outputDir at the start of every run, so the JSON report
  // must not live inside it.
  outputDir: 'test-results/artifacts',

  reporter: [
    ['list'],
    ['html', { open: isCI ? 'never' : 'on-failure' }],
    // `bun run summarize` and `bun run notify` read this, so every run writes it
    // and not only CI: a local run that cannot produce the card is a local run
    // that cannot check the card before it reaches the channel.
    ['json', { outputFile: 'test-results/results.json' }],
    ...(isCI ? [['github'] as const] : []),
  ],

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
    {
      // A project of this run's own, with a budget moved into it. Only the
      // private suite needs one, so a lab that cannot pay stops that suite
      // and leaves the other two to run.
      name: 'workspace',
      testDir: './setup',
      testMatch: /workspace\.setup\.ts/,
      dependencies: ['setup'],
      teardown: 'workspace-teardown',
    },
    {
      name: 'workspace-teardown',
      testDir: './setup',
      testMatch: /workspace\.teardown\.ts/,
    },
    {
      // Stands in front of the tests that spend, so a lab that cannot pay
      // stops those and leaves everything that only reads to run.
      name: 'credits',
      testDir: './setup',
      testMatch: /credits\.setup\.ts/,
      dependencies: ['workspace'],
    },
    // Every project reads the same scenario folders and selects its tests by
    // tag, so one scenario can run signed out and signed in without duplication.
    {
      name: 'public',
      testDir: './scenarios',
      grep: /@public/,
      grepInvert: excluding(),
      dependencies: ['health'],
    },
    {
      name: 'private',
      testDir: './scenarios',
      grep: /@private/,
      grepInvert: excluding(/@spends/),
      dependencies: ['workspace'],
      use: { storageState: authStatePath('primary') },
    },
    {
      // The tests that launch something. Same user, but they need a funded
      // project, so they wait for the credits check.
      name: 'spends',
      testDir: './scenarios',
      grep: /@spends/,
      grepInvert: excluding(),
      dependencies: ['credits'],
      use: { storageState: authStatePath('primary') },
    },
    {
      // Lab and project creation, run as a user that owns nothing.
      name: 'onboarding',
      testDir: './scenarios',
      grep: /@onboarding/,
      grepInvert: excluding(),
      dependencies: ['setup'],
      use: { storageState: authStatePath('onboarding') },
    },
  ],
});
