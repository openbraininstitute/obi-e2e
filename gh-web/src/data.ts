/**
 * What the published branch holds, and how the page reads it.
 *
 * The CI job writes three things next to this bundle:
 *   runs.json                   the days that still have a report
 *   runs/<date>/summary.json    that day's full summary
 *   history.json                one small row per run, kept far longer
 *
 * Nothing here reads `history.json`. The page shows one run at a time, and the
 * trend charts that used it are gone. The publish job still writes it, because
 * a history is the one thing that cannot be rebuilt later — see gh-web/README.md.
 *
 * The report directory also carries the scenario of every failed test, and
 * `scenarios.json` beside it says which spec each one belongs to. See
 * scripts/ci/collect-scenarios.ts.
 *
 * `runs.json` is pruned to five days because each day carries a whole Playwright
 * report. `history.json` is a few hundred bytes a run, so the trend charts can
 * look back months without the branch growing.
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

export const loadDays = () => json<string[]>('runs.json').then((d) => d ?? []);
export const loadSummary = (date: string) => json<Summary>(`runs/${date}/summary.json`);

/** Spec file to the scenario copied for it, for the day given. */
export const loadScenarioIndex = (date: string) =>
  json<Record<string, string>>(`runs/${date}/report/scenarios.json`).then((index) => index ?? {});

/** The scenario's markdown, as published next to that day's report. */
export async function loadScenario(date: string, scenarioPath: string): Promise<string | null> {
  try {
    const response = await fetch(`runs/${date}/report/${scenarioPath}`);
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

/** 2026-09-17 reads as "17 Sep" in a tab strip and as the full date in a heading. */
export function shortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}
