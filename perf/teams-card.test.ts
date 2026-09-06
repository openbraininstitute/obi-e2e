import { describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  budgetLine,
  buildPerfCard,
  outcomeOf,
  payload,
  type PerfSummary,
  readSummary,
} from './teams-card';

const summary: PerfSummary = {
  environment: 'staging',
  baseUrl: 'https://staging.openbraininstitute.org',
  runs: 3,
  formFactor: 'mobile',
  lighthouseVersion: '12.6.1',
  runUrl: 'https://github.com/obi/e2e/actions/runs/1',
  reportUrl: 'https://github.com/obi/e2e/actions/runs/1/artifacts/2',
  trigger: 'Scheduled',
  pages: [
    {
      url: 'https://staging.openbraininstitute.org/',
      score: 0.53,
      metrics: {
        'largest-contentful-paint': 27543.7,
        'cumulative-layout-shift': 0.0231,
        'total-blocking-time': 259,
      },
      misses: [
        { auditId: 'largest-contentful-paint', expected: 2500, actual: 27543.7, level: 'warn' },
        { auditId: 'total-blocking-time', expected: 200, actual: 259, level: 'warn' },
      ],
    },
    {
      url: 'https://staging.openbraininstitute.org/about',
      score: 0.95,
      metrics: {
        'largest-contentful-paint': 1800,
        'cumulative-layout-shift': 0.001,
        'total-blocking-time': 50,
      },
      misses: [],
    },
  ],
};

/** Every `text` string in the card, in document order. */
function texts(node: unknown, found: string[] = []): string[] {
  if (!node || typeof node !== 'object') return found;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'text' && typeof value === 'string') found.push(value);
    else texts(value, found);
  }
  return found;
}

type Row = { type?: string; cells?: { items?: { text?: string }[] }[] };

/** The table rows, each as the first line of every cell. */
function rows(card: { body: unknown[] }): string[][] {
  const tables = card.body.filter((item): item is { rows: Row[] } => {
    return (
      typeof item === 'object' && item !== null && (item as { type?: string }).type === 'Table'
    );
  });
  return tables
    .flatMap((item) => item.rows)
    .map((row) => (row.cells ?? []).map((tableCell) => tableCell.items?.[0]?.text ?? ''));
}

describe('buildPerfCard', () => {
  test('one row per page, with the missed budgets called out', () => {
    const card = buildPerfCard(summary);
    const all = texts(card);

    expect(card.version).toBe('1.5');
    expect(outcomeOf(summary)).toBe('over');
    expect(all).toContain('Over budget');
    expect(budgetLine()).toBe('LCP ≤ 2.5 s · CLS ≤ 0.1 · TBT ≤ 200 ms');
    expect(JSON.stringify(card)).toContain(budgetLine());
    expect(rows(card)).toEqual([
      ['Page', 'Score', 'LCP', 'CLS', 'TBT', 'Status'],
      ['/', '53', '27.5 s', '0.023', '259 ms', 'Over budget'],
      ['/about', '95', '1.8 s', '0.001', '50 ms', 'Within budget'],
    ]);
    expect(card.actions.map((action) => action.url)).toEqual([summary.runUrl, summary.reportUrl]);
  });

  test('says so when Lighthouse left no report', () => {
    const empty = { ...summary, pages: [] };
    expect(outcomeOf(empty)).toBe('missing');
    expect(texts(buildPerfCard(empty))).toContain('No report');
  });

  test('wraps the card the way each layout expects', () => {
    const card = buildPerfCard(summary);
    expect(payload(card, 'thread')).toEqual({ cards: [card] });
    expect(payload(card, '')).toMatchObject({ type: 'message' });
  });
});

describe('readSummary', () => {
  test('reads the representative run of each page and its misses', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
    const url = 'https://staging.openbraininstitute.org/features';
    fs.writeFileSync(
      path.join(dir, 'features.json'),
      JSON.stringify({
        lighthouseVersion: '12.6.1',
        configSettings: { formFactor: 'mobile' },
        audits: {
          'largest-contentful-paint': { numericValue: 3100 },
          'cumulative-layout-shift': { numericValue: 0.01 },
          'total-blocking-time': { numericValue: 120 },
        },
      })
    );
    fs.writeFileSync(
      path.join(dir, 'manifest.json'),
      JSON.stringify([
        {
          url,
          isRepresentativeRun: false,
          jsonPath: 'missing.json',
          summary: { performance: 0.1 },
        },
        {
          url,
          isRepresentativeRun: true,
          jsonPath: 'features.json',
          summary: { performance: 0.8 },
        },
      ])
    );
    const assertions = path.join(dir, 'assertion-results.json');
    fs.writeFileSync(
      assertions,
      JSON.stringify([
        {
          url,
          auditId: 'largest-contentful-paint',
          expected: 2500,
          actual: 3100,
          passed: false,
          level: 'warn',
        },
        {
          url: 'https://elsewhere.test/',
          auditId: 'total-blocking-time',
          expected: 200,
          actual: 900,
          passed: false,
          level: 'warn',
        },
      ])
    );

    const read = readSummary(dir, assertions, {});

    expect(read.environment).toBe('staging');
    expect(read.baseUrl).toBe('https://staging.openbraininstitute.org');
    expect(read.lighthouseVersion).toBe('12.6.1');
    expect(read.formFactor).toBe('mobile');
    expect(read.runs).toBe(3);
    expect(read.pages).toEqual([
      {
        url,
        score: 0.8,
        metrics: {
          'largest-contentful-paint': 3100,
          'cumulative-layout-shift': 0.01,
          'total-blocking-time': 120,
        },
        misses: [
          { auditId: 'largest-contentful-paint', expected: 2500, actual: 3100, level: 'warn' },
        ],
      },
    ]);
  });

  test('comes back empty when there is no manifest', () => {
    expect(
      readSummary(fs.mkdtempSync(path.join(os.tmpdir(), 'perf-')), 'nope.json', {}).pages
    ).toEqual([]);
  });
});
