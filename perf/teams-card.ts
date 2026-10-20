#!/usr/bin/env bun

/**
 * Posts the Lighthouse result to Microsoft Teams as an Adaptive Card.
 * It reads what `bun run perf` leaves in perf/report and .lighthouseci.
 *
 * Usage: MS_TEAMS_WEBHOOK_URI=... bun perf/teams-card.ts [--start]
 * `--start` announces the thread at the start of the job, before there is a result.
 * Without a webhook it prints the card instead, so you can see what would go out.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { baseURL, deploymentEnv, envOfUrl } from '@fixtures/run/env';

import { detectTrigger, runUrl } from '@/scripts/ci/summarize-results';
import {
  badge,
  type BadgeStyle,
  BADGE_TOKEN,
  cell,
  type ContainerStyle,
  fact,
  headerRow,
  panel,
  send,
  table,
  text,
  type TextColor,
} from '@/scripts/ci/teams-card';

import config from './lighthouserc.json';

const TITLE = 'Open Brain Institute website performance';

const REPORT_DIR = 'perf/report';
const ASSERTIONS_FILE = '.lighthouseci/assertion-results.json';

/** The metrics the card shows, in column order. Each one has a budget in lighthouserc.json. */
const METRICS = [
  { id: 'largest-contentful-paint', label: 'LCP' },
  { id: 'cumulative-layout-shift', label: 'CLS' },
  { id: 'total-blocking-time', label: 'TBT' },
] as const;

type MetricId = (typeof METRICS)[number]['id'];

export type Miss = { auditId: string; expected: number; actual: number; level: 'warn' | 'error' };

export type PageResult = {
  url: string;
  /** Lighthouse's performance score, 0 to 1. */
  score: number | null;
  metrics: Partial<Record<MetricId, number | null>>;
  misses: Miss[];
};

export type PerfSummary = {
  environment: string;
  baseUrl: string;
  runs: number;
  formFactor: string;
  lighthouseVersion: string;
  pages: PageResult[];
  runUrl: string;
  reportUrl: string;
  /** The report on GitHub Pages, once the run has published it. */
  pageUrl: string;
  trigger: string;
};

type ManifestEntry = {
  url: string;
  isRepresentativeRun: boolean;
  jsonPath: string;
  summary?: { performance?: number };
};

type Assertion = Miss & { url: string; passed: boolean };

type Report = {
  lighthouseVersion?: string;
  configSettings?: { formFactor?: string };
  audits?: Record<string, { numericValue?: number }>;
};

function readJson<T>(file: string, fallback: T): T {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : fallback;
}

/** Reads the representative run of every page, and the budgets it missed. */
export function readSummary(
  dir = REPORT_DIR,
  assertionsFile = ASSERTIONS_FILE,
  env: NodeJS.ProcessEnv = process.env
): PerfSummary {
  const manifest = readJson<ManifestEntry[]>(path.join(dir, 'manifest.json'), []);
  const assertions = readJson<Assertion[]>(assertionsFile, []);

  let lighthouseVersion = '';
  let formFactor = '';

  const pages = manifest
    .filter((entry) => entry.isRepresentativeRun)
    .map((entry): PageResult => {
      const report = readJson<Report>(path.resolve(dir, entry.jsonPath), {});
      lighthouseVersion = report.lighthouseVersion ?? lighthouseVersion;
      formFactor = report.configSettings?.formFactor ?? formFactor;

      return {
        url: entry.url,
        score: entry.summary?.performance ?? null,
        metrics: Object.fromEntries(
          METRICS.map((metric) => [metric.id, report.audits?.[metric.id]?.numericValue ?? null])
        ),
        misses: assertions
          .filter((assertion) => assertion.url === entry.url && !assertion.passed)
          .map(({ auditId, expected, actual, level }) => ({ auditId, expected, actual, level })),
      };
    });

  /** The site as audited, so the card never names a base URL the run did not visit. */
  const site = pages[0] ? new URL(pages[0].url).origin : baseURL;

  return {
    environment: envOfUrl(site) ?? deploymentEnv(),
    baseUrl: site,
    runs: config.ci.collect.numberOfRuns,
    formFactor,
    lighthouseVersion,
    pages,
    runUrl: runUrl(env),
    reportUrl: env.E2E_REPORT_URL ?? '',
    pageUrl: env.PERF_REPORT_PAGE ?? '',
    trigger: detectTrigger(env.GITHUB_EVENT_NAME),
  };
}

export type Outcome = 'within' | 'over' | 'failed' | 'missing';

function outcomeOfMisses(misses: Miss[]): Exclude<Outcome, 'missing'> {
  if (misses.some((miss) => miss.level === 'error')) return 'failed';
  return misses.length > 0 ? 'over' : 'within';
}

export function outcomeOf(summary: PerfSummary): Outcome {
  if (summary.pages.length === 0) return 'missing';
  return outcomeOfMisses(summary.pages.flatMap((page) => page.misses));
}

const OUTCOME: Record<
  Outcome,
  { label: string; badge: BadgeStyle; container: ContainerStyle; color: TextColor }
> = {
  within: { label: 'Within budget', badge: 'Good', container: 'good', color: 'Good' },
  over: { label: 'Over budget', badge: 'Warning', container: 'warning', color: 'Warning' },
  failed: { label: 'Over budget', badge: 'Attention', container: 'attention', color: 'Attention' },
  missing: { label: 'No report', badge: 'Attention', container: 'attention', color: 'Attention' },
};

export function formatMetric(id: MetricId, value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  switch (id) {
    case 'cumulative-layout-shift':
      return String(Number(value.toFixed(3)));
    case 'largest-contentful-paint':
      return `${(value / 1000).toFixed(1)} s`;
    default:
      return `${Math.round(value)} ms`;
  }
}

export function formatScore(score: number | null): string {
  return score === null ? '—' : String(Math.round(score * 100));
}

/** Lighthouse's own bands: 90 and up is good, 50 to 89 needs work. */
function scoreColor(score: number | null): TextColor {
  if (score === null) return 'Default';
  if (score >= 0.9) return 'Good';
  return score >= 0.5 ? 'Warning' : 'Attention';
}

/** The budgets as written in lighthouserc.json, e.g. "LCP ≤ 2.5 s". */
export function budgetLine(): string {
  return METRICS.map((metric) => {
    const [, options] = config.ci.assert.assertions[metric.id];
    const max = typeof options === 'object' ? options.maxNumericValue : null;
    return `${metric.label} ≤ ${formatMetric(metric.id, max)}`;
  }).join(' · ');
}

function pageRow(page: PageResult) {
  const status = OUTCOME[outcomeOfMisses(page.misses)];
  const missed = new Set(page.misses.map((miss) => miss.auditId));

  return {
    type: 'TableRow',
    cells: [
      cell(new URL(page.url).pathname, {
        weight: 'Bolder',
        selectAction: { type: 'Action.OpenUrl', url: page.url },
      }),
      cell(formatScore(page.score), { weight: 'Bolder', color: scoreColor(page.score) }),
      ...METRICS.map((metric) =>
        missed.has(metric.id)
          ? cell(formatMetric(metric.id, page.metrics[metric.id]), {
              weight: 'Bolder',
              color: 'Attention',
            })
          : cell(formatMetric(metric.id, page.metrics[metric.id]))
      ),
      cell(status.label, { weight: 'Bolder', color: status.color, style: status.container }),
    ],
  };
}

/** The card body and actions. Wrap it with `message` to post it on its own. */
export function buildPerfCard(summary: PerfSummary) {
  const outcome = OUTCOME[outcomeOf(summary)];
  const over = summary.pages.filter((page) => page.misses.length > 0).length;
  const emulation = [
    summary.lighthouseVersion && `Lighthouse ${summary.lighthouseVersion}`,
    summary.formFactor,
  ]
    .filter(Boolean)
    .join(' · ');

  const body: unknown[] = [
    {
      type: 'Container',
      style: outcome.container,
      roundedCorners: true,
      items: [
        text(TITLE, { size: 'Large', weight: 'Bolder' }),
        {
          type: 'Container',
          spacing: 'Small',
          layouts: [
            {
              type: 'Layout.Flow',
              horizontalItemsAlignment: 'Left',
              columnSpacing: 'Small',
              rowSpacing: 'Small',
            },
          ],
          items: [
            badge(outcome.label, {
              style: outcome.badge,
              appearance: 'Filled',
              tooltip: 'How the pages did against the budgets',
            }),
            badge(summary.environment, { style: 'Accent', tooltip: 'Deployment audited' }),
            ...(emulation
              ? [
                  badge(emulation, {
                    style: 'Informative',
                    tooltip: 'Lighthouse and the device it emulated',
                  }),
                ]
              : []),
            badge(summary.trigger, { style: 'Subtle', tooltip: 'What started the run' }),
          ],
        },
      ],
    },
  ];

  if (summary.pages.length === 0) {
    body.push(
      text('Lighthouse left no report. Open the run to see where it stopped.', {
        spacing: 'Medium',
        color: 'Attention',
      })
    );
  } else {
    body.push(
      panel(
        [
          {
            type: 'FactSet',
            facts: [
              fact('Pages', String(summary.pages.length)),
              fact('Over budget', `${over} of ${summary.pages.length}`),
              fact('Runs per page', `${summary.runs}, the median counts`),
              fact('Budgets', budgetLine()),
              fact('Site', summary.baseUrl),
            ],
          },
        ],
        { spacing: 'Medium' }
      ),
      text('Pages', { size: 'Medium', weight: 'Bolder', spacing: 'Medium' }),
      table(
        [3, 1, 1, 1, 1, 2],
        [
          headerRow(['Page', 'Score', ...METRICS.map((metric) => metric.label), 'Status']),
          ...summary.pages.map(pageRow),
        ]
      )
    );
  }

  return {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.5',
    msteams: { width: 'Full' },
    body,
    actions: [
      ...(summary.runUrl
        ? [{ type: 'Action.OpenUrl', title: 'Open the run', url: summary.runUrl }]
        : []),
      ...(summary.pageUrl
        ? [{ type: 'Action.OpenUrl', title: 'Open the reports', url: summary.pageUrl }]
        : []),
      ...(summary.reportUrl
        ? [{ type: 'Action.OpenUrl', title: 'Download the reports', url: summary.reportUrl }]
        : []),
    ],
  };
}

/** One card as a Teams message, for a webhook that posts it as it is. */
export function payload(card: ReturnType<typeof buildPerfCard>) {
  return {
    type: 'message',
    attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', content: card }],
  };
}

const flow = [
  {
    type: 'Layout.Flow',
    horizontalItemsAlignment: 'Left',
    columnSpacing: 'Small',
    rowSpacing: 'Small',
  },
];

/**
 * The message the result is threaded under, the same shape the test run's flow
 * keeps: it stores the first one it sees for a key and re-renders it, splicing
 * the badges where {{BADGES}} stands.
 */
export function buildPerfParent(env: NodeJS.ProcessEnv = process.env) {
  const environment = env.E2E_ENV || deploymentEnv();
  const link = runUrl(env);
  const started = `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

  return {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.5',
    msteams: { width: 'Full' },
    body: [
      {
        type: 'Container',
        style: 'emphasis',
        roundedCorners: true,
        items: [
          text(TITLE, { size: 'Large', weight: 'Bolder' }),
          {
            type: 'Container',
            spacing: 'Small',
            layouts: flow,
            items: [
              badge(environment, { style: 'Accent', tooltip: 'Deployment audited' }),
              badge(detectTrigger(env.GITHUB_EVENT_NAME), {
                style: 'Subtle',
                tooltip: 'What started the run',
              }),
            ],
          },
        ],
      },
      panel(
        [
          {
            type: 'FactSet',
            facts: [
              fact('Run', env.TEAMS_THREAD_KEY ?? ''),
              fact('Environment', environment),
              fact('Started', started),
            ],
          },
        ],
        { spacing: 'Medium' }
      ),
      panel(
        [
          {
            type: 'Container',
            layouts: flow,
            // The label keeps the array non-empty before the result is in, so the
            // token can carry its own leading comma.
            items: [text('Finished', { subtle: true, size: 'Small' }), BADGE_TOKEN],
          },
        ],
        { spacing: 'Medium' }
      ),
    ],
    actions: link ? [{ type: 'Action.OpenUrl', title: 'Open the run', url: link }] : [],
  };
}

/**
 * What the flow expects, for the announce (no summary: no badge, no cards) and
 * for the result. Without a `key` it has no thread to put the card in, and it
 * drops it while still answering 202.
 */
export function buildPerfThread(summary: PerfSummary | null, env: NodeJS.ProcessEnv = process.env) {
  const outcome = summary ? OUTCOME[outcomeOf(summary)] : null;

  return {
    key: env.TEAMS_THREAD_KEY ?? '',
    parent: JSON.stringify(buildPerfParent(env)),
    badge:
      summary && outcome
        ? JSON.stringify(
            badge('Lighthouse', {
              style: outcome.badge,
              appearance: 'Filled',
              tooltip: `${outcome.label} · ${summary.pages.length} pages`,
            })
          )
        : '',
    cards: summary ? [buildPerfCard(summary)] : [],
  };
}

async function post(): Promise<void> {
  const announce = Bun.argv.includes('--start');
  const thread = process.env.TEAMS_LAYOUT === 'thread';

  if (announce && !thread) {
    console.log('Only a thread has an announce; nothing sent.');
    return;
  }

  const summary = announce ? null : readSummary();
  const body = thread ? buildPerfThread(summary) : payload(buildPerfCard(readSummary()));
  const webhook = process.env.MS_TEAMS_WEBHOOK_URI;

  if (!webhook) {
    console.error('MS_TEAMS_WEBHOOK_URI is not set — printing the card instead of posting it.');
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  if (!(await send(webhook, body))) process.exit(1);

  console.log(
    summary
      ? `Sent the ${summary.environment} performance card: ${OUTCOME[outcomeOf(summary)].label}, ${summary.pages.length} pages.`
      : `Announced the thread ${process.env.TEAMS_THREAD_KEY ?? '(no key set)'}.`
  );
}

if (import.meta.main) {
  await post();
}
