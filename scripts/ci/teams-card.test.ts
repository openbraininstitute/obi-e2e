import { describe, expect, test } from 'bun:test';

import { type Summary, buildSummary } from './summarize-results';
import {
  buildCard,
  buildCardWithinLimit,
  buildPosts,
  buildThreadPayload,
  parseMentions,
  TEAMS_PAYLOAD_LIMIT,
} from './teams-card';

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

describe('buildThreadPayload', () => {
  test('sends bare adaptive cards, first one being the summary', () => {
    const { cards } = buildThreadPayload(summaryWith(2, 2));

    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect((card as { type?: string }).type).toBe('AdaptiveCard');
    }

    const first: string[] = [];
    walk(cards[0], first);
    expect(first).toContain('Services');
  });
});

// Card text comes from test titles and service errors, which have no bound.
// Before clamping, one long string pushed a card to 92 KB and Teams would have
// refused the whole post.
const huge = (length: number, prefix: string) => prefix + 'x'.repeat(length);

describe('payload limits', () => {
  const pathological: Summary = {
    passed: 0,
    failed: 5,
    flaky: 0,
    skipped: 0,
    durationMs: 1_000,
    environment: 'staging',
    baseUrl: huge(300, 'https://'),
    browser: 'chromium',
    commit: 'abcdef1234',
    runUrl: '',
    trigger: 'Scheduled',
    failures: Array.from({ length: 5 }, (_, index) => ({
      title: huge(4_000, `title-${index}`),
      file: huge(500, 'path/'),
      line: 1,
      project: 'private',
      error: huge(4_000, 'error'),
    })),
    totalFailures: 5,
    services: Array.from({ length: 12 }, (_, index) => ({
      key: `service-${index}`,
      label: huge(200, 'service'),
      version: huge(100, 'version'),
      status: 'down' as const,
      problem: huge(3_000, 'boom'),
    })),
    features: Array.from({ length: 200 }, (_, index) => ({
      name: huge(30_000, `feature-${index}`),
      section: 'data',
      passed: 1,
      failed: 0,
      flaky: 0,
      skipped: 0,
      durationMs: 1_000,
    })),
  };

  test('no single card exceeds the limit, however long the content', () => {
    for (const post of buildPosts(pathological)) {
      expect(post.bytes).toBeLessThanOrEqual(TEAMS_PAYLOAD_LIMIT);
    }
  });

  test('the single card mode also stays under the limit', () => {
    const { bytes } = buildCardWithinLimit(pathological);
    expect(bytes).toBeLessThanOrEqual(TEAMS_PAYLOAD_LIMIT);
  });

  test('long text is clamped rather than dropped', () => {
    const found: string[] = [];
    walk(buildPosts(pathological)[0]?.message, found);
    expect(found.some((item) => item.includes('…'))).toBe(true);
  });
});

/** A run with nothing in it but the money. */
function spentSummary(credits: Summary['credits'], failed = 0): Summary {
  return { ...buildSummary({ suites: [], stats: {} }), failed, credits };
}

describe('parseMentions', () => {
  test('reads a name and the address behind it', () => {
    expect(parseMentions('Ada Lovelace <ada@example.org>')).toEqual([
      { name: 'Ada Lovelace', id: 'ada@example.org' },
    ]);
  });

  test('reads several, however they are spaced', () => {
    expect(parseMentions(' Ada <a@x.org> ,Alan  <b@x.org>')).toEqual([
      { name: 'Ada', id: 'a@x.org' },
      { name: 'Alan', id: 'b@x.org' },
    ]);
  });

  // A malformed entry must not take the rest of the list down with it.
  test('drops an entry with no address and keeps the others', () => {
    expect(parseMentions('Ada, Alan <b@x.org>')).toEqual([{ name: 'Alan', id: 'b@x.org' }]);
  });

  test('is empty when nothing is configured', () => {
    expect(parseMentions(undefined)).toEqual([]);
    expect(parseMentions('  ')).toEqual([]);
  });
});

describe('credits on the card', () => {
  test('tags the named people when the lab cannot pay', () => {
    const card = buildCard(
      spentSummary({ required: 2000, problem: 'The lab holds 12 credits.' }, 0),
      'full',
      [{ name: 'Ada', id: 'ada@example.org' }]
    );

    const content = (card.attachments[0] as { content: Record<string, unknown> }).content;
    expect(JSON.stringify(content)).toContain('<at>Ada</at>');
    expect((content.msteams as { entities?: unknown[] }).entities).toEqual([
      { type: 'mention', text: '<at>Ada</at>', mentioned: { id: 'ada@example.org', name: 'Ada' } },
    ]);
  });

  // Nobody is pulled into the channel for a run that merely spent its budget.
  test('tags nobody when the money was not the problem', () => {
    const card = buildCard(
      spentSummary({ required: 2000, assigned: 2000, remaining: 1200 }, 1),
      'full',
      [{ name: 'Ada', id: 'ada@example.org' }]
    );

    const content = (card.attachments[0] as { content: Record<string, unknown> }).content;
    expect((content.msteams as { entities?: unknown[] }).entities).toBeUndefined();
    expect(JSON.stringify(content)).not.toContain('<at>');
  });

  test('shows what the run was given and what it spent', () => {
    const card = buildCard(
      spentSummary({ required: 2000, assigned: 2000, spent: 800, remaining: 1200 })
    );
    const text = JSON.stringify(card);
    expect(text).toContain('Credits spent');
    expect(text).toContain('800');
  });
});

describe('the outcome donut', () => {
  function chartIn(card: unknown): Record<string, unknown> | undefined {
    return collect(card, (node) => node.type === 'Chart.Donut')[0];
  }

  test('charts each status the run actually produced', () => {
    const card = buildCard({
      ...buildSummary({ suites: [], stats: {} }),
      passed: 12,
      failed: 3,
      flaky: 1,
      skipped: 40,
    });

    expect(chartIn(card)?.data).toEqual([
      { legend: 'Passed', value: 12, color: 'good' },
      { legend: 'Failed', value: 3, color: 'attention' },
      { legend: 'Flaky', value: 1, color: 'warning' },
      { legend: 'Skipped', value: 40, color: 'neutral' },
    ]);
  });

  // The same four entries every run is what makes two runs comparable, and a
  // run with no failures should say so rather than leave the entry out.
  test('keeps the statuses at zero, so the legend never changes shape', () => {
    const card = buildCard({ ...buildSummary({ suites: [], stats: {} }), passed: 9 });
    expect(chartIn(card)?.data).toEqual([
      { legend: 'Passed', value: 9, color: 'good' },
      { legend: 'Failed', value: 0, color: 'attention' },
      { legend: 'Flaky', value: 0, color: 'warning' },
      { legend: 'Skipped', value: 0, color: 'neutral' },
    ]);
  });

  test('draws nothing when the run produced no tests at all', () => {
    expect(chartIn(buildCard(buildSummary({ suites: [], stats: {} })))).toBeUndefined();
  });

  // Teams mobile and Outlook cannot draw it, and the counts are in the FactSet
  // beside it, so an unsupported host drops the element rather than showing a hole.
  test('tells a host that cannot draw it to drop it', () => {
    const card = buildCard({ ...buildSummary({ suites: [], stats: {} }), passed: 1 });
    expect(chartIn(card)?.fallback).toBe('drop');
  });

  // Section cards carry a feature table; the chart belongs to the summary alone.
  test('appears on the summary card only', () => {
    const summary = {
      ...buildSummary({ suites: [], stats: {} }),
      passed: 4,
      features: [
        {
          name: 'Morphology listing',
          section: 'Data',
          passed: 4,
          failed: 0,
          flaky: 0,
          skipped: 0,
          durationMs: 10,
        },
      ],
    };

    const posts = buildPosts(summary);
    expect(chartIn(posts[0]?.message)).toBeDefined();
    for (const item of posts.slice(1)) expect(chartIn(item.message)).toBeUndefined();
  });
});

describe('the credits bar', () => {
  function barIn(card: unknown): Record<string, unknown> | undefined {
    return collect(card, (node) => node.type === 'Chart.HorizontalBar.Stacked')[0];
  }

  test('stacks spent and left to what the run was given', () => {
    const card = buildCard(
      spentSummary({ required: 2000, assigned: 2000, spent: 812.5, remaining: 1187.5 })
    );

    const bar = barIn(card);
    expect(bar?.title).toBe('Credits · 2000 assigned');
    expect(bar?.data).toEqual([
      {
        title: 'This run',
        data: [
          { legend: 'Spent', value: 812.5, color: 'neutral' },
          { legend: 'Left', value: 1187.5, color: 'good' },
        ],
      },
    ]);
  });

  // Teardown records the remaining balance; the spend follows from it.
  test('works out the spend when only the balance was recorded', () => {
    const card = buildCard(spentSummary({ required: 2000, assigned: 2000, remaining: 1500 }));
    const series = barIn(card)?.data as { data: unknown[] }[] | undefined;
    expect(series?.[0]?.data[0]).toEqual({ legend: 'Spent', value: 500, color: 'neutral' });
  });

  test('draws nothing before the teardown has read the balance', () => {
    expect(barIn(buildCard(spentSummary({ required: 2000, assigned: 2000 })))).toBeUndefined();
  });

  test('draws nothing when the lab could not pay in the first place', () => {
    expect(
      barIn(buildCard(spentSummary({ required: 2000, problem: 'no credits' })))
    ).toBeUndefined();
  });

  test('tells a host that cannot draw it to drop it', () => {
    const card = buildCard(
      spentSummary({ required: 2000, assigned: 2000, spent: 800, remaining: 1200 })
    );
    expect(barIn(card)?.fallback).toBe('drop');
  });
});
