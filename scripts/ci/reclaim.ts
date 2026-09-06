#!/usr/bin/env bun

/** Deletes projects left by past runs and returns their credits to the lab. */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { VirtualLabApi } from '@api/virtual-lab';
import { requireEnv, RUN_DIR, RUN_ID } from '@fixtures/run/env';

const OURS = /^e2e-\d+-\d+$/;

/** The newest sign-in on this machine that has not expired. */
function newestToken(): string | undefined {
  const runs = path.dirname(RUN_DIR);
  if (!fs.existsSync(runs)) return undefined;

  const tokens = fs
    .readdirSync(runs)
    .map((dir) => path.join(runs, dir, 'auth', 'primary.token'))
    .filter((file) => fs.existsSync(file))
    .toSorted((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);

  for (const file of tokens) {
    const token = fs.readFileSync(file, 'utf8').trim();
    const payload = token.split('.')[1];
    if (!payload) continue;

    const expiry = JSON.parse(Buffer.from(payload, 'base64url').toString()).exp as number;
    if (expiry * 1000 > Date.now() + 60_000) return token;
  }

  return undefined;
}

const dryRun = process.argv.includes('--dry-run');
const { LAB_ID: labId } = requireEnv('LAB_ID');
const token = newestToken();

if (!token) {
  console.error('No sign-in left on this machine that has not expired. Run `bun run auth` first.');
  process.exit(1);
}

const api = new VirtualLabApi(token);
const projects = await api.listProjects(labId);
const mine = projects.filter(
  (project) => OURS.test(project.name) && project.name !== `e2e-${RUN_ID}`
);

if (mine.length === 0) {
  console.log('Nothing to reclaim: the lab holds no project from a past run.');
  process.exit(0);
}

let returned = 0;

for (const project of mine) {
  const balance = await api
    .projectBalance(labId, project.id)
    .then((report) => report.balance)
    .catch(() => 0);

  if (dryRun) {
    console.log(`would return ${balance} and delete ${project.name}`);
    returned += balance;
    continue;
  }

  if (balance > 0) {
    await api.reverseBudget(labId, project.id, balance);
    returned += balance;
  }

  await api.deleteProject(labId, project.id);
  console.log(`returned ${balance} and deleted ${project.name}`);
}

console.log(
  `${dryRun ? 'would reclaim' : 'reclaimed'} ${returned} credits from ${mine.length} projects`
);
console.log(`lab balance: ${await api.labBalance(labId)}`);
