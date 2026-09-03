#!/usr/bin/env bun
/**
 * Turns Playwright's JSON report into two artefacts used by CI:
 *   - a Markdown summary of failures (for the PR comment / job summary)
 *   - a compact JSON stat block (for the Teams card)
 *
 * Usage: bun scripts/ci/summarize-results.ts <results.json> [outDir]
 */

type Result = { status?: string; duration?: number; error?: { message?: string } };
type TestCase = { status?: string; projectName?: string; results?: Result[] };
type Spec = { title?: string; file?: string; line?: number; tests?: TestCase[] };
type Suite = { title?: string; file?: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites?: Suite[]; stats?: Record<string, number> };

export type Failure = { title: string; file: string; line: number; project: string; error: string };

export type Endpoint = {
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
  trigger: string;
  failures: Failure[];
  totalFailures: number;
  endpoints: Endpoint[];
  features: Feature[];
};

const FAILED = new Set(['failed', 'timedOut', 'interrupted']);

// Playwright colours its error messages. The Teams card and the PR comment are plain text.
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

export function featureStatus(feature: Feature): 'passed' | 'failed' | 'flaky' | 'skipped' {
  if (feature.failed > 0) return 'failed';
  if (feature.flaky > 0) return 'flaky';
  if (feature.passed === 0 && feature.skipped > 0) return 'skipped';
  return 'passed';
}

/**
 * Share that passed, ignoring skips. Takes either a feature or the whole
 * summary, since both carry the same three counts.
 */
export function passRate(counts: { passed: number; failed: number; flaky: number }): string {
  const total = counts.passed + counts.failed + counts.flaky;
  if (total === 0) return '—';
  return `${Math.round((counts.passed / total) * 100)}%`;
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
  endpoints: Endpoint[] = [],
  env: NodeJS.ProcessEnv = process.env
): Summary {
  const failures = collectFailures(report.suites);
  const stats = report.stats ?? {};

  return {
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
    trigger: detectTrigger(env.GITHUB_EVENT_NAME),
    failures: failures.slice(0, 5),
    totalFailures: failures.length,
    endpoints,
    features: collectFeatures(report.suites),
  };
}

export function renderMarkdown(summary: Summary): string {
  const lines = [
    `## ${summary.failed > 0 ? '❌' : '✅'} E2E — ${summary.environment}`,
    '',
    `| Passed | Failed | Flaky | Skipped | Pass rate | Duration |`,
    `| --- | --- | --- | --- | --- | --- |`,
    `| ${summary.passed} | ${summary.failed} | ${summary.flaky} | ${summary.skipped} | ${passRate(summary)} | ${formatDuration(summary.durationMs)} |`,
  ];

  if (summary.endpoints.length > 0) {
    lines.push(
      '',
      `### Endpoints`,
      '',
      `| Endpoint | Version | Status | Note |`,
      `| --- | --- | --- | --- |`
    );
    for (const endpoint of summary.endpoints) {
      lines.push(
        `| ${endpoint.label} | ${endpoint.version ?? '—'} | ${endpoint.status} | ${endpoint.problem ?? ''} |`
      );
    }
  }

  if (summary.features.length > 0) {
    lines.push(
      '',
      `### Features`,
      '',
      `| Feature | Section | Status | Pass rate | Duration |`,
      `| --- | --- | --- | --- | --- |`
    );
    for (const feature of summary.features) {
      lines.push(
        `| ${feature.name} | ${feature.section} | ${featureStatus(feature)} | ${passRate(feature)} | ${formatDuration(feature.durationMs)} |`
      );
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

export async function loadEndpoints(outDir: string): Promise<Endpoint[]> {
  const file = Bun.file(`${outDir}/services.json`);
  if (!(await file.exists())) return [];
  const parsed = (await file.json()) as { endpoints?: Endpoint[] };
  return parsed.endpoints ?? [];
}

async function main(): Promise<void> {
  const [inputPath, outDir = 'test-results'] = Bun.argv.slice(2);
  if (!inputPath) {
    console.error('usage: bun scripts/ci/summarize-results.ts <results.json> [outDir]');
    process.exit(2);
  }

  const summary = buildSummary(
    (await Bun.file(inputPath).json()) as Report,
    await loadEndpoints(outDir)
  );
  const markdown = renderMarkdown(summary);

  await Bun.write(`${outDir}/summary.md`, `${markdown}\n`);
  await Bun.write(`${outDir}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(markdown);
}

if (import.meta.main) {
  await main();
}
