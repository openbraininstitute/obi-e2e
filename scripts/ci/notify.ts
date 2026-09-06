#!/usr/bin/env bun

/**
 * Posts a run to Teams.
 *
 *   bun run notify          the test run: rebuilds the summary, then posts its cards
 *   bun run notify --perf   the Lighthouse run: posts the performance card only
 */

const steps = Bun.argv.includes('--perf')
  ? [['bun', 'perf/teams-card.ts']]
  : [
      ['bun', 'run', 'summarize'],
      ['bun', 'scripts/ci/teams-card.ts', 'test-results/summary.json'],
    ];

for (const step of steps) {
  const { exitCode } = Bun.spawnSync(step, { stdout: 'inherit', stderr: 'inherit' });
  if (exitCode !== 0) process.exit(exitCode);
}
