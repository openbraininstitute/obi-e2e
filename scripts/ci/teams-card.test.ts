import { describe, expect, test } from 'bun:test';

import { type Summary, buildSummary } from './summarize-results';
import { buildCard, buildCardWithinLimit, buildPosts, TEAMS_PAYLOAD_LIMIT } from './teams-card';

type Node = Record<string, unknown> & { type?: string };

/** Every object in the card tree that matches. */
function collect(root: unknown, predicate: (node: Node) => boolean): Node[] {
  const found: Node[] = [];
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    if (!Array.isArray(node) && predicate(node as Node)) found.push(node as Node);
    for (const value of Object.values(node)) visit(value);
  };
  visit(root);
  return found;
}

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
    // Services, the feature header, then a parent and a hidden child table
    // for each section.
    expect(found.filter((item) => item === 'Table')).toHaveLength(4);
    expect(found).toContain('Services');
    expect(found).toContain('Features');
    expect(found).toContain('Entity core');
    expect(found).toContain('1.2.3');
    expect(found).toContain('● Healthy');
    expect(found).toContain('● Skipped');
    expect(found).toContain('● Passed');
    expect(found).toContain('100%');
    expect(found).toContain('E2E passed');
    expect(found).toContain('▸ site');
    expect(found).toContain('▾ site');
    expect(found).toContain('↳ Home page');
    expect(found).toContain('1 feature');
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
      services: [],
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

  test('each section toggles its own hidden table', () => {
    const summary = buildSummary(
      {
        suites: [
          {
            title: 'Data page',
            specs: [
              {
                title: 'shows types',
                file: 'scenarios/data/overview/overview.spec.ts',
                tests: [{ status: 'expected', results: [{ status: 'passed', duration: 1_000 }] }],
              },
            ],
          },
          {
            title: 'Home page',
            specs: [
              {
                title: 'shows the landing page',
                file: 'scenarios/site/home/home.spec.ts',
                tests: [{ status: 'expected', results: [{ status: 'passed', duration: 2_000 }] }],
              },
            ],
          },
        ],
        stats: { expected: 2, unexpected: 0, flaky: 0, skipped: 0, duration: 3_000 },
      },
      [],
      {}
    );

    const card = buildCard(summary);
    const toggles = collect(card, (node) => node.type === 'Action.ToggleVisibility');
    const hidden = collect(
      card,
      (node) => node.type === 'Table' && node.isVisible === false && typeof node.id === 'string'
    );

    // One toggle per cell of each section row, over two sections.
    expect(new Set(toggles.map((t) => JSON.stringify(t.targetElements))).size).toBe(2);
    expect(hidden.map((t) => t.id)).toEqual(['features-0', 'features-1']);

    // Every toggle names an id that exists on a hidden table.
    for (const toggle of toggles) {
      const [rowsId] = toggle.targetElements as string[];
      expect(hidden.some((table) => table.id === rowsId)).toBe(true);
    }
  });
});

function summaryWith(sectionCount: number, featuresPerSection: number): Summary {
  const features = [];
  for (let s = 0; s < sectionCount; s += 1) {
    for (let f = 0; f < featuresPerSection; f += 1) {
      features.push({
        name: `Feature ${s}-${f} with a fairly long descriptive name`,
        section: `section-${s}`,
        passed: 3,
        failed: 0,
        flaky: 0,
        skipped: 0,
        durationMs: 4_000,
      });
    }
  }

  return {
    passed: features.length * 3,
    failed: 0,
    flaky: 0,
    skipped: 0,
    durationMs: 60_000,
    environment: 'staging',
    baseUrl: 'https://staging.example',
    browser: 'chromium',
    commit: 'abcdef1234',
    runUrl: '',
    trigger: 'Scheduled',
    failures: [],
    totalFailures: 0,
    services: [{ key: 'entitycore', label: 'Entity core', version: '1.2.3', status: 'healthy' }],
    features,
  };
}

describe('buildCardWithinLimit', () => {
  test('keeps full detail while it fits', () => {
    const { detail, bytes } = buildCardWithinLimit(summaryWith(2, 2));

    expect(detail).toBe('full');
    expect(bytes).toBeLessThanOrEqual(TEAMS_PAYLOAD_LIMIT);
  });

  test('drops detail rather than exceeding the Teams limit', () => {
    const big = summaryWith(30, 8);

    // Full detail on this many scenarios would be refused by Teams.
    expect(JSON.stringify(buildCard(big, 'full')).length).toBeGreaterThan(TEAMS_PAYLOAD_LIMIT);

    const { detail, bytes } = buildCardWithinLimit(big);
    expect(detail).not.toBe('full');
    expect(bytes).toBeLessThanOrEqual(TEAMS_PAYLOAD_LIMIT);
  });
});

describe('buildPosts', () => {
  test('leads with the summary and services, then one post per section', () => {
    const posts = buildPosts(summaryWith(3, 2));

    expect(posts.map((post) => post.label)).toEqual([
      'summary',
      'section-0',
      'section-1',
      'section-2',
    ]);

    // The summary post carries the services, not the features.
    const first: string[] = [];
    walk(posts[0]?.message, first);
    expect(first).toContain('Services');
    expect(first).not.toContain('Feature');
  });

  test('splits one section across numbered posts when it is too big', () => {
    const posts = buildPosts(summaryWith(1, 120));
    const labels = posts.map((post) => post.label);

    expect(labels[0]).toBe('summary');
    expect(labels.length).toBeGreaterThan(2);
    expect(labels[1]).toMatch(/^section-0 \(1\/\d+\)$/);

    for (const post of posts) {
      expect(post.bytes).toBeLessThanOrEqual(TEAMS_PAYLOAD_LIMIT);
    }
  });

  test('every feature appears exactly once across the posts', () => {
    const summary = summaryWith(1, 120);
    const posts = buildPosts(summary);

    const rendered: string[] = [];
    for (const post of posts) walk(post.message, rendered);

    for (const feature of summary.features) {
      expect(rendered.filter((item) => item === feature.name)).toHaveLength(1);
    }
  });
});
