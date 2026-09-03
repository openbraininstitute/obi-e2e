#!/usr/bin/env bun
/**
 * Turns Playwright's JSON report into two artefacts used by CI:
 *   - a Markdown summary of failures (for the PR comment / job summary)
 *   - a compact JSON stat block (for the Teams card)
 *
 * Usage: bun scripts/ci/summarize-results.ts <results.json> [outDir]
 */

import { argv, env, exit } from 'node:process';

type Result = { status?: string; duration?: number; error?: { message?: string } };
type TestCase = { status?: string; projectName?: string; results?: Result[] };
type Spec = { title?: string; file?: string; line?: number; tests?: TestCase[] };
type Suite = { title?: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites?: Suite[]; stats?: Record<string, number> };

type Failure = { title: string; file: string; line: number; project: string; error: string };

const FAILED = new Set(['failed', 'timedOut', 'interrupted']);

// Playwright colours its error messages. The Teams card and the PR comment are plain text.
// oxlint-disable-next-line no-control-regex -- matching the ANSI escape prefix is the point
const ANSI = /\u001B\[[0-9;]*m/g;

function firstLine(message: string): string {
  return (message.replace(ANSI, '').split('\n')[0] ?? '').trim();
}

function collectFailures(suites: Suite[] = [], parents: string[] = []): Failure[] {
  const failures: Failure[] = [];

  for (const suite of suites) {
    const trail = [...parents, suite.title].filter(Boolean) as string[];

    for (const spec of suite.specs ?? []) {
      for (const testCase of spec.tests ?? []) {
        const failed = (testCase.results ?? []).filter((r) => FAILED.has(r.status ?? ''));
        if (testCase.status !== 'unexpected' && failed.length === 0) continue;

        failures.push({
          title: [...trail, spec.title].filter(Boolean).join(' › '),
          file: spec.file ?? 'unknown',
          line: spec.line ?? 0,
          project: testCase.projectName ?? '',
          error: firstLine(failed.at(-1)?.error?.message ?? 'No error message'),
        });
      }
    }

    failures.push(...collectFailures(suite.suites, trail));
  }

  return failures;
}

const [inputPath, outDir = 'test-results'] = argv.slice(2);
if (!inputPath) {
  console.error('usage: bun scripts/ci/summarize-results.ts <results.json> [outDir]');
  exit(2);
}

const report = (await Bun.file(inputPath).json()) as Report;
const failures = collectFailures(report.suites);
const stats = report.stats ?? {};

const summary = {
  passed: stats.expected ?? 0,
  failed: stats.unexpected ?? 0,
  flaky: stats.flaky ?? 0,
  skipped: stats.skipped ?? 0,
  durationMs: Math.round(stats.duration ?? 0),
  environment: env.E2E_ENVIRONMENT ?? 'unknown',
  baseUrl: env.E2E_BASE_URL ?? '',
  browser: env.PLAYWRIGHT_BROWSER ?? 'chromium',
  commit: env.GITHUB_SHA ?? '',
  runUrl:
    env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : '',
  // Card shows at most five; the report has the rest.
  failures: failures.slice(0, 5),
  totalFailures: failures.length,
};

const minutes = Math.floor(summary.durationMs / 60_000);
const seconds = Math.round((summary.durationMs % 60_000) / 1000);
const lines = [
  `## ${summary.failed > 0 ? '❌' : '✅'} E2E — ${summary.environment}`,
  '',
  `| Passed | Failed | Flaky | Skipped | Duration |`,
  `| --- | --- | --- | --- | --- |`,
  `| ${summary.passed} | ${summary.failed} | ${summary.flaky} | ${summary.skipped} | ${minutes}m ${seconds}s |`,
];

if (failures.length > 0) {
  lines.push('', `### Failing tests (${failures.length})`, '');
  for (const failure of failures.slice(0, 5)) {
    lines.push(
      `- **${failure.title}** — \`${failure.file}:${failure.line}\``,
      `  > ${failure.error}`
    );
  }
  if (failures.length > 5) lines.push('', `…and ${failures.length - 5} more. See the HTML report.`);
}

await Bun.write(`${outDir}/summary.md`, `${lines.join('\n')}\n`);
await Bun.write(`${outDir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);

console.log(lines.join('\n'));
exit(0);
