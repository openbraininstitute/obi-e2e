/**
 * What the published branch holds, and how the page reads it.
 *
 * The CI jobs write these next to this bundle:
 *   runs.json                     every run folder that survives, newest first
 *   runs/<folder>/summary.json    that run's full summary
 *   runs/<folder>/report/         its Playwright report
 *   runs/<folder>/slow/           the same two, for the slow suite of that run
 *   history.json                  one small row per run, kept far longer
 *
 * A folder is `<date>-<HHhMM>-<environment>` in UTC, so one day can hold several
 * runs and a lexical sort still puts the newest first. The page reads all three
 * parts out of the name: the environment filters, the date picks the day, and
 * the time picks the version within it.
 *
 * Nothing here reads `history.json`. The page shows one run at a time, and the
 * trend charts that used it are gone. The publish job still writes it, because
 * a history is the one thing that cannot be rebuilt later — see gh-web/README.md.
 *
 * The report directory also carries the scenario of every failed test, and
 * `scenarios.json` beside it says which spec each one belongs to. See
 * scripts/ci/collect-scenarios.ts.
 *
 * The sweep keeps every run belonging to the five newest days, because each run
 * carries a whole Playwright report. `history.json` is a few hundred bytes a
 * run, so the record can look back months without the branch growing.
 */

export type ServiceStatus = 'healthy' | 'down' | 'skipped';

export type ServiceSummary = {
  key: string;
  label: string;
  version?: string;
  status: ServiceStatus;
  problem?: string;
};

export type Failure = {
  title: string;
  file: string;
  line: number;
  project: string;
  error: string;
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

export type CreditReport = {
  labBalance?: number;
  required: number;
  assigned?: number;
  projectId?: string;
  remaining?: number;
  spent?: number;
  reversed?: 'ok' | 'failed' | 'nothing to return';
  returned?: number;
  removed?: 'ok' | 'failed';
  problem?: string;
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
  /** No report was written at all, so the zeros above mean "unknown", not "passed". */
  noResults?: boolean;
};

async function json<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path);
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * The two suites of one run. They are separate workflows finishing hours apart,
 * so the slow half of a run is often missing — every loader below returns null
 * or an empty index for it rather than treating that as an error.
 */
export type Suite = 'regular' | 'slow';

/** Where a suite's files sit inside its run folder. */
export const suitePath = (run: string, suite: Suite) =>
  suite === 'slow' ? `runs/${run}/slow` : `runs/${run}`;

export const reportPath = (run: string, suite: Suite) => `${suitePath(run, suite)}/report`;

export const loadRuns = () => json<string[]>('runs.json').then((r) => r ?? []);

export const loadSummary = (run: string, suite: Suite = 'regular') =>
  json<Summary>(`${suitePath(run, suite)}/summary.json`);

/** Spec file to the scenario copied for it, for the run and suite given. */
export const loadScenarioIndex = (run: string, suite: Suite = 'regular') =>
  json<Record<string, string>>(`${reportPath(run, suite)}/scenarios.json`).then(
    (index) => index ?? {}
  );

/** The scenario's markdown, as published next to that suite's report. */
export async function loadScenario(
  run: string,
  scenarioPath: string,
  suite: Suite = 'regular'
): Promise<string | null> {
  try {
    const response = await fetch(`${reportPath(run, suite)}/${scenarioPath}`);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

export function passRate(counts: { passed: number; failed: number; flaky: number }): number {
  const ran = counts.passed + counts.failed + counts.flaky;
  return ran === 0 ? 0 : counts.passed / ran;
}

export const percent = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function duration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

/** The day a run belongs to: the folder's first ten characters. */
/**
 * A run folder is `<date>-<HHhMM>-<environment>` with an optional `-<n>` for a
 * second run inside the same minute: `2026-09-18-07h04-staging`. Everything the
 * page needs to group and filter runs is in that name, so listing them costs one
 * fetch rather than one per run.
 */
export const runDay = (run: string) => run.slice(0, 10);

/**
 * `2026-09-18-07h04-staging` reads as `07:04`. Folders published before the name
 * carried a time are a whole day on their own; they age out of the sweep within
 * five days, and until then an em dash beats a blank row in the picker.
 */
export const runTime = (run: string) => (run.split('-')[3] ?? '').replace('h', ':') || '—';

/** Old folders carry no environment; they were all staging. */
export const runEnvironment = (run: string) => run.split('-')[4] ?? 'staging';

/** 2026-09-17 reads as "17 Sep" in a tab strip and as the full date in a heading. */
export function shortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
