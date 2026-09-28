/** Prints what the run resolved to, and stops when something required is missing. */

import { appendFileSync } from 'node:fs';
import * as os from 'node:os';

import {
  PROJECT_CREDITS,
  PROJECT_CREDITS_VARIABLE,
  baseURL,
  cellApiUrl,
  deploymentEnv,
  hasCredentials,
  resolveWorkers,
  virtualLabApiUrl,
} from '@fixtures/run/env';

const cpus = os.availableParallelism?.() ?? os.cpus().length;
const memoryGB = os.totalmem() / 1024 ** 3;

// Secrets only ever show as set or missing, never their value.
const rows: [string, string][] = [
  ['target', process.env.E2E_ENVIRONMENT ?? deploymentEnv()],
  ['deployment', deploymentEnv()],
  ['application', baseURL],
  ['backend API', cellApiUrl()],
  ['virtual lab', virtualLabApiUrl()],
  ['primary user', hasCredentials('primary') ? 'set' : 'MISSING'],
  ['onboarding user', hasCredentials('onboarding') ? 'set' : 'not set, those tests skip'],
  ['lab', process.env.LAB_ID ? 'set' : 'MISSING'],
  ['project credits', `${PROJECT_CREDITS} (${PROJECT_CREDITS_VARIABLE})`],
  ['grep', process.env.E2E_GREP || 'none'],
  ['runner', `${cpus} cores, ${memoryGB.toFixed(1)} GB`],
  [
    'workers',
    `${resolveWorkers()}${process.env.PLAYWRIGHT_WORKERS ? ' (named)' : ' (from the runner)'}`,
  ],
];

for (const [name, value] of rows) console.log(`${name.padEnd(17)}${value}`);

// On GitHub, the same table heads the run's summary page.
if (process.env.GITHUB_STEP_SUMMARY) {
  const table = rows.map(([name, value]) => `| ${name} | ${value} |`).join('\n');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Run configuration\n\n| | |\n|---|---|\n${table}\n\n`
  );
}

const missing = [
  ...(hasCredentials('primary') ? [] : ['the primary user']),
  ...(process.env.LAB_ID ? [] : ['LAB_ID']),
];

if (missing.length > 0) {
  console.error(`\nCannot start: ${missing.join(' and ')} missing.`);
  process.exit(1);
}
