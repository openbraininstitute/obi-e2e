import { describe, expect, test } from 'bun:test';

import { buildSummary } from './summarize-results';
import { buildCard } from './teams-card';

function walk(node: unknown, found: string[]): void {
  if (!node || typeof node !== 'object') return;
  const record = node as {
    type?: string;
    text?: string;
    version?: string;
    msteams?: { width?: string };
  };
  if (typeof record.type === 'string') found.push(record.type);
  if (typeof record.text === 'string') found.push(record.text);
  if (record.version === '1.5') found.push('schema:1.5');
  if (record.msteams?.width === 'Full') found.push('width:Full');
  if (Array.isArray(node)) {
    for (const item of node) walk(item, found);
    return;
  }
  for (const value of Object.values(node)) walk(value, found);
}

describe('buildCard', () => {
  test('renders endpoint and feature tables on Adaptive Card 1.5', () => {
    const summary = buildSummary(
      {
        suites: [
          {
            title: 'Home page',
            specs: [
              {
                title: 'shows the landing page',
                file: 'scenarios/site/home/home.spec.ts',
                tests: [{ status: 'expected', results: [{ status: 'passed', duration: 3_000 }] }],
              },
            ],
          },
        ],
        stats: { expected: 1, unexpected: 0, flaky: 0, skipped: 0, duration: 3_000 },
      },
      [
        { key: 'entitycore', label: 'Entity core', version: '1.2.3', status: 'healthy' },
        {
          key: 'launch-system',
          label: 'Launch system',
          status: 'skipped',
          problem: 'reachable only inside the VPC',
        },
      ],
      { E2E_ENVIRONMENT: 'staging', PLAYWRIGHT_BROWSER: 'chromium', GITHUB_EVENT_NAME: 'schedule' }
    );

    const card = buildCard(summary);
    const found: string[] = [];
    walk(card, found);

    expect(found).toContain('schema:1.5');
    expect(found).toContain('width:Full');
    expect(found.filter((item) => item === 'Table')).toHaveLength(2);
    expect(found).toContain('Endpoints');
    expect(found).toContain('Features');
    expect(found).toContain('Entity core');
    expect(found).toContain('1.2.3');
    expect(found).toContain('● Healthy');
    expect(found).toContain('● Skipped');
    expect(found).toContain('Home page');
    expect(found).toContain('● Passed');
    expect(found).toContain('100%');
    expect(found).toContain('E2E passed');
    // A skipped endpoint has to say why, or the reader cannot act on it.
    expect(found).toContain('reachable only inside the VPC');
  });

  test('marks the header failed when a test failed', () => {
    const card = buildCard({
      passed: 0,
      failed: 1,
      flaky: 0,
      skipped: 0,
      durationMs: 1000,
      environment: 'staging',
      baseUrl: '',
      browser: 'chromium',
      commit: 'deadbeef',
      runUrl: '',
      trigger: 'Manual',
      failures: [
        {
          title: 'Home page › boom',
          file: 'home.spec.ts',
          line: 4,
          project: 'public',
          error: 'timeout',
        },
      ],
      totalFailures: 1,
      endpoints: [],
      features: [],
    });

    const found: string[] = [];
    walk(card, found);
    expect(found).toContain('E2E failed');
    expect(found).toContain('**Home page › boom**');
    // The message is the part a reader acts on, so it belongs on the card.
    expect(found).toContain('timeout');
    expect(found).not.toContain('Table');
  });
});
