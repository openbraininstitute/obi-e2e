import { describe, expect, test } from 'bun:test';

import { entryFrom, KEEP, merge } from './history';
import type { Summary } from './summarize-results';

const summary = (patch: Partial<Summary> = {}): Summary => ({
  passed: 10,
  failed: 0,
  flaky: 0,
  skipped: 1,
  durationMs: 60_000,
  environment: 'staging',
  baseUrl: 'https://example.test',
  browser: 'chromium',
  commit: 'abc1234',
  runUrl: 'https://github.test/run/1',
  reportUrl: '',
  trigger: 'schedule',
  failures: [],
  totalFailures: 0,
  services: [],
  features: [],
  ...patch,
});

const entry = (date: string, finishedAt: string, patch: Partial<Summary> = {}) =>
  entryFrom(summary(patch), date, finishedAt);

describe('entryFrom', () => {
  test('keeps the counts and drops the bulk', () => {
    const row = entry('2026-09-17', '2026-09-17T07:30:00Z', { failed: 3 });
    expect(row).toEqual({
      date: '2026-09-17',
      finishedAt: '2026-09-17T07:30:00Z',
      environment: 'staging',
      passed: 10,
      failed: 3,
      flaky: 0,
      skipped: 1,
      durationMs: 60_000,
      commit: 'abc1234',
      runUrl: 'https://github.test/run/1',
    });
  });

  test('marks a run that wrote no report, so zero is not read as a pass', () => {
    expect(entry('2026-09-17', '2026-09-17T07:30:00Z', { noResults: true }).noResults).toBe(true);
  });
});

describe('merge', () => {
  test('a second run the same day replaces the first', () => {
    const morning = entry('2026-09-17', '2026-09-17T07:30:00Z', { failed: 0 });
    const afternoon = entry('2026-09-17', '2026-09-17T15:00:00Z', { failed: 4 });

    const merged = merge([morning], afternoon);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.failed).toBe(4);
  });

  test('the same day on another deployment is its own row', () => {
    const staging = entry('2026-09-17', '2026-09-17T07:30:00Z');
    const production = entry('2026-09-17', '2026-09-17T08:00:00Z', { environment: 'production' });

    expect(merge([staging], production)).toHaveLength(2);
  });

  test('rows come back oldest first, whatever order they arrived in', () => {
    const older = entry('2026-09-15', '2026-09-15T07:00:00Z');
    const newer = entry('2026-09-16', '2026-09-16T07:00:00Z');

    expect(merge([newer], older).map((row) => row.date)).toEqual(['2026-09-15', '2026-09-16']);
  });

  test('the oldest rows fall off once the cap is reached', () => {
    const existing = Array.from({ length: KEEP }, (_, index) => {
      const row = entry(`day-${index}`, `2026-01-01T00:${index}:00Z`);
      row.date = `day-${index}`;
      return row;
    });

    const merged = merge(existing, entry('2026-09-17', '2026-12-31T00:00:00Z'));

    expect(merged).toHaveLength(KEEP);
    expect(merged[0]?.date).toBe('day-1');
    expect(merged.at(-1)?.date).toBe('2026-09-17');
  });
});
