#!/usr/bin/env bun

/**
 * Turns Playwright's results.json into summary.md and summary.json.
 *
 * Usage: bun scripts/ci/summarize-results.ts <results.json> [outDir]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { CreditReport } from '@fixtures/credit-report';
import { baseURL, deploymentEnv, RUN_DIR } from '@fixtures/env';

type Result = { status?: string; duration?: number; error?: { message?: string } };
type TestCase = { status?: string; projectName?: string; results?: Result[] };
type Spec = { title?: string; file?: string; line?: number; tests?: TestCase[] };
type Suite = { title?: string; file?: string; specs?: Spec[]; suites?: Suite[] };
type Report = {
  suites?: Suite[];
  stats?: Record<string, number>;
  config?: { metadata?: { environment?: string; baseUrl?: string; runId?: string } };
};

export type Failure = { title: string; file: string; line: number; project: string; error: string };

export type ServiceSummary = {
  key: string;
  label: string;
  version?: string;
  status: 'healthy' | 'down' | 'skipped';
  problem?: string;
};

export type Feature = {
  name: string;
  section: string;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
};

export type Section = {
  name: string;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
  features: Feature[];
};

export type Summary = {
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
  environment: string;
  baseUrl: string;
  browser: string;
  commit: string;
  runUrl: string;
  reportUrl: string;
  trigger: string;
  failures: Failure[];
  totalFailures: number;
  services: ServiceSummary[];
  features: Feature[];
  credits?: CreditReport;
};

const FAILED = new Set(['failed', 'timedOut', 'interrupted']);

// oxlint-disable-next-line no-control-regex -- matching the ANSI escape prefix is the point
const ANSI = /\u001B\[[0-9;]*m/g;

export function firstLine(message: string): string {
  return (message.replace(ANSI, '').split('\n')[0] ?? '').trim();
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function detectTrigger(eventName = process.env.GITHUB_EVENT_NAME): string {
  switch (eventName) {
    case 'schedule':
      return 'Scheduled';
    case 'workflow_dispatch':
      return 'Manual';
    case 'push':
      return 'On deploy';
    case 'repository_dispatch':
      return 'PR preview';
    case 'pull_request':
      return 'Pull request';
    default:
      return eventName || 'Local';
  }
}

type Counts = { passed: number; failed: number; flaky: number; skipped: number };

export function featureStatus(counts: Counts): 'passed' | 'failed' | 'flaky' | 'skipped' {
  if (counts.failed > 0) return 'failed';
  if (counts.flaky > 0) return 'flaky';
  if (counts.passed === 0 && counts.skipped > 0) return 'skipped';
  return 'passed';
}

export function passRate(counts: { passed: number; failed: number; flaky: number }): string {
  const total = counts.passed + counts.failed + counts.flaky;
  if (total === 0) return '—';
  return `${Math.round((counts.passed / total) * 100)}%`;
}

export function collectSections(features: Feature[]): Section[] {
  const sections = new Map<string, Section>();

  for (const feature of features) {
    const section = sections.get(feature.section) ?? {
      name: feature.section,
      passed: 0,
      failed: 0,
      flaky: 0,
      skipped: 0,
      durationMs: 0,
      features: [],
    };

    section.passed += feature.passed;
    section.failed += feature.failed;
    section.flaky += feature.flaky;
    section.skipped += feature.skipped;
    section.durationMs += feature.durationMs;
    section.features.push(feature);
    sections.set(feature.section, section);
  }

  return [...sections.values()].toSorted((left, right) => left.name.localeCompare(right.name));
}

export function collectFailures(suites: Suite[] = [], parents: string[] = []): Failure[] {
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

function isFilename(title: string | undefined): boolean {
  return Boolean(title?.match(/\.(spec|test|setup)\.[cm]?[jt]sx?$/));
}

function scenarioFromFile(file: string): { section: string; folder: string } | undefined {
  const normalized = file.replaceAll('\\', '/');
  if (/(^|\/)setup\//.test(normalized)) return undefined;
  const match = normalized.match(/scenarios\/([^/]+)\/([^/]+)/);
  if (!match) return undefined;
  return { section: match[1] ?? '', folder: match[2] ?? '' };
}

function describeName(parents: string[], folder: string): string {
  for (let index = parents.length - 1; index >= 0; index -= 1) {
    const title = parents[index];
    if (title && !isFilename(title)) return title;
  }
  return folder.replaceAll('-', ' ');
}

function countTest(testCase: TestCase, feature: Feature): void {
  const last = testCase.results?.at(-1);
  feature.durationMs += last?.duration ?? 0;

  switch (testCase.status) {
    case 'unexpected':
      feature.failed += 1;
      break;
    case 'flaky':
      feature.flaky += 1;
      break;
    case 'skipped':
      feature.skipped += 1;
      break;
    default:
      if (last?.status === 'skipped') feature.skipped += 1;
      else feature.passed += 1;
  }
}

/** One row per scenario folder, with its test counts. */
export function collectFeatures(suites: Suite[] = [], parents: string[] = []): Feature[] {
  const features = new Map<string, Feature>();

  const walk = (nodes: Suite[] = [], trail: string[] = []): void => {
    for (const suite of nodes) {
      const next = [...trail, suite.title].filter(Boolean) as string[];

      for (const spec of suite.specs ?? []) {
        const scenario = scenarioFromFile(spec.file ?? suite.file ?? '');
        if (!scenario) continue;

        const key = `${scenario.section}/${scenario.folder}`;
        const feature = features.get(key) ?? {
          name: describeName(next, scenario.folder),
          section: scenario.section,
          passed: 0,
          failed: 0,
          flaky: 0,
          skipped: 0,
          durationMs: 0,
        };

        for (const testCase of spec.tests ?? []) countTest(testCase, feature);
        features.set(key, feature);
      }

      walk(suite.suites, next);
    }
  };

  walk(suites, parents);
  return [...features.values()].toSorted((left, right) =>
    `${left.section}/${left.name}`.localeCompare(`${right.section}/${right.name}`)
  );
}

export function buildSummary(
  report: Report,
  services: ServiceSummary[] = [],
  env: NodeJS.ProcessEnv = process.env,
  credits?: CreditReport
): Summary {
  const failures = collectFailures(report.suites);
  const stats = report.stats ?? {};

  return {
    passed: stats.expected ?? 0,
    failed: stats.unexpected ?? 0,
    flaky: stats.flaky ?? 0,
    skipped: stats.skipped ?? 0,
    durationMs: Math.round(stats.duration ?? 0),
    environment: report.config?.metadata?.environment ?? env.E2E_ENVIRONMENT ?? deploymentEnv(),
    baseUrl: report.config?.metadata?.baseUrl ?? env.E2E_BASE_URL ?? baseURL,
    browser: env.PLAYWRIGHT_BROWSER ?? 'chromium',
    commit: env.GITHUB_SHA ?? '',
    runUrl:
      env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
        ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
        : '',
    reportUrl: env.E2E_REPORT_URL ?? '',
    trigger: detectTrigger(env.GITHUB_EVENT_NAME),
    failures: failures.slice(0, 5),
    totalFailures: failures.length,
    services,
    features: collectFeatures(report.suites),
    ...(credits ? { credits } : {}),
  };
}

const EXHAUSTED = 1;

/** The credit line for the summary, when there is something to say. */
export function creditNotice(credits: CreditReport | undefined, failed: number): string | null {
  if (!credits) return null;
  if (credits.problem) return credits.problem;

  if (failed > 0 && credits.remaining !== undefined && credits.remaining <= EXHAUSTED) {
    return (
      `The project ran out of credits: it was given ${credits.assigned ?? credits.required} and ` +
      `finished with ${credits.remaining}. Tests that needed to launch something would have ` +
      'failed for that reason. Raise E2E_PROJECT_CREDITS.'
    );
  }

  if (credits.removed === 'failed') {
    return (
      `Project ${credits.projectId ?? 'this run created'} could not be deleted. It counts ` +
      "against the lab's forty until someone removes it."
    );
  }

  return null;
}

export function renderMarkdown(summary: Summary): string {
  const lines = [
    `## ${summary.failed > 0 ? '❌' : '✅'} E2E — ${summary.environment}`,
    '',
    `| Passed | Failed | Flaky | Skipped | Pass rate | Duration |`,
    `| --- | --- | --- | --- | --- | --- |`,
    `| ${summary.passed} | ${summary.failed} | ${summary.flaky} | ${summary.skipped} | ${passRate(summary)} | ${formatDuration(summary.durationMs)} |`,
  ];

  const notice = creditNotice(summary.credits, summary.failed);
  if (notice) lines.push('', `> **Credits** — ${notice}`);

  if (summary.credits?.assigned !== undefined) {
    const { assigned, spent, remaining } = summary.credits;
    lines.push(
      '',
      `### Credits`,
      '',
      `| Assigned | Spent | Left |`,
      `| --- | --- | --- |`,
      `| ${assigned} | ${spent ?? '—'} | ${remaining ?? '—'} |`
    );
  }

  if (summary.reportUrl) {
    lines.push('', `[Download the full Playwright report](${summary.reportUrl})`);
  }

  if (summary.services.length > 0) {
    lines.push(
      '',
      `### Services`,
      '',
      `| Service | Version | Status | Note |`,
      `| --- | --- | --- | --- |`
    );
    for (const endpoint of summary.services) {
      lines.push(
        `| ${endpoint.label} | ${endpoint.version ?? '—'} | ${endpoint.status} | ${endpoint.problem ?? ''} |`
      );
    }
  }

  if (summary.features.length > 0) {
    lines.push('', `### Features`);

    for (const section of collectSections(summary.features)) {
      lines.push(
        '',
        '<details>',
        `<summary><b>${section.name}</b> — ${featureStatus(section)} · ${passRate(section)} · ${formatDuration(section.durationMs)}</summary>`,
        '',
        `| Feature | Status | Pass rate | Duration |`,
        `| --- | --- | --- | --- |`
      );
      for (const feature of section.features) {
        lines.push(
          `| ${feature.name} | ${featureStatus(feature)} | ${passRate(feature)} | ${formatDuration(feature.durationMs)} |`
        );
      }
      lines.push('', '</details>');
    }
  }

  if (summary.totalFailures > 0) {
    lines.push('', `### Failing tests (${summary.totalFailures})`, '');
    for (const failure of summary.failures) {
      lines.push(
        `- **${failure.title}** — \`${failure.file}:${failure.line}\``,
        `  > ${failure.error}`
      );
    }
    if (summary.totalFailures > 5) {
      lines.push('', `…and ${summary.totalFailures - 5} more. See the HTML report.`);
    }
  }

  return lines.join('\n');
}

export async function loadCredits(outDir: string): Promise<CreditReport | undefined> {
  const file = Bun.file(`${outDir}/credits.json`);
  if (!(await file.exists())) return undefined;
  return (await file.json()) as CreditReport;
}

export async function loadServices(outDir: string): Promise<ServiceSummary[]> {
  const file = Bun.file(`${outDir}/services.json`);
  if (!(await file.exists())) return [];
  const parsed = (await file.json()) as { services?: ServiceSummary[] };
  return parsed.services ?? [];
}

const RUNS_DIR = path.dirname(RUN_DIR);

/** Stops when the report is older than the last run on this machine. */
function refuseIfStale(report: Report): void {
  const reported = report.config?.metadata?.runId;
  if (!reported || !fs.existsSync(RUNS_DIR)) return;

  const runs = fs
    .readdirSync(RUNS_DIR)
    .filter((name) => /^\d+-\d+$/.test(name))
    .toSorted(
      (left, right) =>
        fs.statSync(path.join(RUNS_DIR, right)).mtimeMs -
        fs.statSync(path.join(RUNS_DIR, left)).mtimeMs
    );

  const newest = runs[0];
  if (!newest || newest === reported) return;

  console.error(
    `This report is from run ${reported}, but the last run on this machine was ${newest}.\n` +
      'Nothing was summarised. A run started with `--reporter=line` writes no JSON report, ' +
      'because the flag replaces the reporters the config sets instead of adding to them. ' +
      'Run without it, or pass `--reporter=line,json,html`.'
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const [inputPath, outDir = 'test-results'] = Bun.argv.slice(2);
  if (!inputPath) {
    console.error('usage: bun scripts/ci/summarize-results.ts <results.json> [outDir]');
    process.exit(2);
  }

  const report = (await Bun.file(inputPath).json()) as Report;
  refuseIfStale(report);

  const summary = buildSummary(
    report,
    await loadServices(outDir),
    process.env,
    await loadCredits(outDir)
  );
  const markdown = renderMarkdown(summary);

  await Bun.write(`${outDir}/summary.md`, `${markdown}\n`);
  await Bun.write(`${outDir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(markdown);
}

if (import.meta.main) {
  await main();
}
