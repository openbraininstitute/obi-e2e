/**
 * Appends one row to the published `history.json`.
 *
 * The day sweep in `e2e.yml` keeps five days of reports, because each one is a
 * whole Playwright report. A trend chart wants far more than five points, so the
 * numbers it needs live here instead: a few hundred bytes per run, capped at
 * `KEEP`, which is a year of nightlies and still under a hundred kilobytes.
 *
 * Usage: bun scripts/ci/history.ts <summary.json> <history.json> [date]
 */

import * as fs from 'node:fs';

import type { Summary } from './summarize-results';

export type HistoryEntry = {
  date: string;
  finishedAt: string;
  environment: string;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
  commit: string;
  runUrl: string;
  noResults?: boolean;
};

export const KEEP = 400;

export function entryFrom(summary: Summary, date: string, finishedAt: string): HistoryEntry {
  return {
    date,
    finishedAt,
    environment: summary.environment,
    passed: summary.passed,
    failed: summary.failed,
    flaky: summary.flaky,
    skipped: summary.skipped,
    durationMs: summary.durationMs,
    commit: summary.commit,
    runUrl: summary.runUrl,
    ...(summary.noResults ? { noResults: true } : {}),
  };
}

/**
 * A day that ran twice — a push after the nightly — keeps only the later row, so
 * the charts stay one point per day and the newest verdict is the one shown.
 */
export function merge(existing: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const kept = existing.filter(
    (row) => !(row.date === entry.date && row.environment === entry.environment)
  );
  return [...kept, entry].toSorted((a, b) => a.finishedAt.localeCompare(b.finishedAt)).slice(-KEEP);
}

function read(path: string): HistoryEntry[] {
  if (!fs.existsSync(path)) return [];
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(path, 'utf8'));
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    // A truncated file from a cancelled push is not worth failing the publish for.
    return [];
  }
}

if (import.meta.main) {
  const [summaryPath, historyPath, date] = process.argv.slice(2);
  if (!summaryPath || !historyPath) {
    console.error('usage: bun scripts/ci/history.ts <summary.json> <history.json> [date]');
    process.exit(1);
  }

  if (!fs.existsSync(summaryPath)) {
    console.error(`No summary at ${summaryPath}; leaving the history alone.`);
    process.exit(0);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as Summary;
  const now = new Date();
  const entry = entryFrom(summary, date ?? now.toISOString().slice(0, 10), now.toISOString());
  const merged = merge(read(historyPath), entry);

  fs.writeFileSync(historyPath, `${JSON.stringify(merged)}\n`);
  console.log(`history.json now holds ${merged.length} runs.`);
}
