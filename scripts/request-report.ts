/**
 * Turns the request log a measured run wrote into the tables the cost report
 * reads: what the suite asks each service for, which endpoints carry the
 * load, which tests and pages send the most.
 *
 *   E2E_REQUEST_LOG=1 bun run test        # writes test-results/requests.jsonl
 *   bun scripts/request-report.ts         # prints Markdown
 */

import * as fs from 'node:fs';

import type { LoggedRequest } from '../fixtures/run/request-log';

const file = Bun.argv[2] ?? 'test-results/requests.jsonl';
const TOP = 15;

/** One endpoint for every id and page it was asked for. */
export function endpointOf(url: string): string {
  return url
    .replace(/\?.*$/, '')
    .replaceAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{id}');
}

/** One page for every lab and project it was opened in. */
export function pageOf(path: string): string {
  return endpointOf(path).replace(/^\/app\/virtual-lab\/\{id\}\/\{id\}/, '/app/virtual-lab/…');
}

type Row = { n: number; bytes: number; ms: number[]; errors: number };

function tally<K extends string>(lines: LoggedRequest[], key: (line: LoggedRequest) => K) {
  const rows = new Map<K, Row>();
  for (const line of lines) {
    const row = rows.get(key(line)) ?? { n: 0, bytes: 0, ms: [], errors: 0 };
    row.n += 1;
    row.bytes += line.bytes;
    if (line.ms >= 0) row.ms.push(line.ms);
    if (line.status >= 500) row.errors += 1;
    rows.set(key(line), row);
  }
  return rows;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;
}

const mb = (bytes: number): string => (bytes / 1_000_000).toFixed(1);

function table<K extends string>(
  title: string,
  rows: Map<K, Row>,
  by: (row: Row) => number,
  extra?: (key: K) => string
): string {
  const header = `| ${title} | Requests | MB | p50 ms | p95 ms | 5xx |${extra ? ' Per visit |' : ''}`;
  const rule = `| --- | ---: | ---: | ---: | ---: | ---: |${extra ? ' ---: |' : ''}`;
  const body = [...rows.entries()]
    .toSorted(([, a], [, b]) => by(b) - by(a))
    .slice(0, TOP)
    .map(
      ([key, row]) =>
        `| \`${key}\` | ${row.n} | ${mb(row.bytes)} | ${percentile(row.ms, 50)} | ` +
        `${percentile(row.ms, 95)} | ${row.errors} |${extra ? ` ${extra(key)} |` : ''}`
    );
  return [header, rule, ...body].join('\n');
}

if (import.meta.main) {
  const lines: LoggedRequest[] = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LoggedRequest);

  const entitycore = lines.filter((line) => line.service === 'entitycore');
  const tests = new Set(lines.map((line) => line.test)).size;

  // A visit is one test on one page: what a user's page load costs.
  const visits = new Map<string, Set<string>>();
  for (const line of entitycore) {
    const page = pageOf(line.page);
    visits.set(page, (visits.get(page) ?? new Set()).add(line.test));
  }
  const perVisit = (page: string): string => {
    const row = tally(
      entitycore.filter((line) => pageOf(line.page) === page),
      () => page
    ).get(page);
    const n = visits.get(page)?.size ?? 1;
    return row ? `${(row.n / n).toFixed(0)} req, ${mb(row.bytes / n)} MB` : '';
  };

  console.log(
    `${lines.length} backend responses in ${tests} tests, ${entitycore.length} to entitycore, ${mb(entitycore.reduce((sum, line) => sum + line.bytes, 0))} MB.\n`
  );
  console.log(
    table(
      'Service',
      tally(lines, (line) => line.service),
      (row) => row.n
    ),
    '\n'
  );
  console.log(
    table(
      'entitycore endpoint, by requests',
      tally(entitycore, (line) => endpointOf(line.url)),
      (row) => row.n
    ),
    '\n'
  );
  console.log(
    table(
      'entitycore endpoint, by bytes',
      tally(entitycore, (line) => endpointOf(line.url)),
      (row) => row.bytes
    ),
    '\n'
  );
  console.log(
    table(
      'entitycore endpoint, by p95',
      tally(entitycore, (line) => endpointOf(line.url)),
      (row) => percentile(row.ms, 95)
    ),
    '\n'
  );
  console.log(
    table(
      'Page',
      tally(entitycore, (line) => pageOf(line.page)),
      (row) => row.n,
      perVisit
    ),
    '\n'
  );
  console.log(
    table(
      'Spec file',
      tally(entitycore, (line) => line.file),
      (row) => row.bytes
    ),
    '\n'
  );
  console.log(
    table(
      'Test',
      tally(entitycore, (line) => line.test),
      (row) => row.n
    )
  );
}
