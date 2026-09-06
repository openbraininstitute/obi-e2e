/**
 * Playwright configuration.
 *
 * Setup runs in order: health, sign-in, workspace, credits. Each scenario
 * project then picks its tests by tag, and skips the other deployment's.
 */

import { defineConfig, devices } from '@playwright/test';

import {
  authStatePath,
  baseURL,
  deploymentEnv,
  isCI,
  resolveBrowser,
  resolveWorkers,
  RUN_ID,
} from './fixtures/run/env';
import { excludedEnvironmentTag } from './fixtures/tags';

const ASSERTION_TIMEOUT = 30_000;

/** Tags to skip: the other deployment's, plus any named here. */
function excluding(...also: RegExp[]): RegExp {
  const patterns = [excludedEnvironmentTag(deploymentEnv()), ...also];
  return new RegExp(patterns.map((pattern) => pattern.source).join('|'));
}

export default defineConfig({
  testIgnore: ['node_modules/**', 'test-results/**', 'playwright-report/**'],
  timeout: isCI ? 120_000 : 90_000,
  expect: { timeout: ASSERTION_TIMEOUT },

  metadata: { environment: deploymentEnv(), baseUrl: baseURL, runId: RUN_ID },

  /** Gives the project back on Ctrl+C, which never reaches the teardown project. */
  globalTeardown: './scripts/ci/teardown.ts',

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: resolveWorkers(),
  outputDir: 'test-results/artifacts',

  reporter: [
    ['list'],
    ['html', { open: isCI ? 'never' : 'on-failure' }],
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
      name: 'credits',
      testDir: './setup',
      testMatch: /credits\.setup\.ts/,
      dependencies: ['workspace'],
    },
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
      name: 'spends',
      testDir: './scenarios',
      grep: /@spends/,
      grepInvert: excluding(/@slow\b/),
      dependencies: ['credits'],
      use: { storageState: authStatePath('primary') },
    },
    /**
     * Runs that take longer than the nightly suite can hold: a microcircuit
     * simulation, a mesh skeletonisation. They are followed to the end, so this
     * project needs a job with hours rather than minutes — see
     * `.github/workflows/e2e-slow.yml`. Each test's own timeout comes from its
     * seed's `expect.completed.within`.
     */
    {
      name: 'slow',
      testDir: './scenarios',
      grep: /@slow/,
      grepInvert: excluding(),
      dependencies: ['credits'],
      use: { storageState: authStatePath('primary') },
    },
    {
      name: 'onboarding',
      testDir: './scenarios',
      grep: /@onboarding/,
      grepInvert: excluding(),
      dependencies: ['setup'],
      use: { storageState: authStatePath('onboarding') },
    },
  ],
});
