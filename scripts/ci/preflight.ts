/** Prints what the run resolved to, and stops when something required is missing. */

import * as os from 'node:os';

import {
  baseURL,
  deploymentEnv,
  hasCredentials,
  resolveWorkers,
  virtualLabApiUrl,
} from '@fixtures/env';

const cpus = os.availableParallelism?.() ?? os.cpus().length;
const memoryGB = os.totalmem() / 1024 ** 3;

console.log(`deployment       ${deploymentEnv()}`);
console.log(`application      ${baseURL}`);
console.log(`virtual lab      ${virtualLabApiUrl()}`);
console.log(`primary user     ${hasCredentials('primary') ? 'set' : 'MISSING'}`);
console.log(
  `onboarding user  ${hasCredentials('onboarding') ? 'set' : 'not set, those tests skip'}`
);
console.log(`lab              ${process.env.LAB_ID ? 'set' : 'MISSING'}`);
console.log(`runner           ${cpus} cores, ${memoryGB.toFixed(1)} GB`);
console.log(
  `workers          ${resolveWorkers()}${process.env.PLAYWRIGHT_WORKERS ? ' (named)' : ' (from the runner)'}`
);

const missing = [
  ...(hasCredentials('primary') ? [] : ['the primary user']),
  ...(process.env.LAB_ID ? [] : ['LAB_ID']),
];

if (missing.length > 0) {
  console.error(`\nCannot start: ${missing.join(' and ')} missing.`);
  process.exit(1);
}
