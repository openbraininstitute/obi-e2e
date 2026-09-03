#!/usr/bin/env bun
/**
 * Posts the run result to Microsoft Teams as an Adaptive Card.
 * Reads `summary.json` produced by summarize-results.ts.
 *
 * Usage: TEAMS_WEBHOOK_URL=... bun scripts/ci/teams-card.ts test-results/summary.json
 */

import {
  featureStatus,
  formatDuration,
  passRate,
  type Endpoint,
  type Feature,
  type Summary,
} from './summarize-results';

type TextColor = 'Default' | 'Dark' | 'Light' | 'Accent' | 'Good' | 'Warning' | 'Attention';
type ContainerStyle = 'default' | 'emphasis' | 'good' | 'attention' | 'warning' | 'accent';

const STATUS: Record<
  Endpoint['status'] | ReturnType<typeof featureStatus>,
  { label: string; color: TextColor; style: ContainerStyle }
> = {
  healthy: { label: '● Healthy', color: 'Good', style: 'good' },
  down: { label: '● Down', color: 'Attention', style: 'attention' },
  skipped: { label: '● Skipped', color: 'Default', style: 'emphasis' },
  passed: { label: '● Passed', color: 'Good', style: 'good' },
  failed: { label: '● Failed', color: 'Attention', style: 'attention' },
  flaky: { label: '● Flaky', color: 'Warning', style: 'warning' },
};

function text(
  value: string,
  options: {
    size?: 'Small' | 'Default' | 'Medium' | 'Large';
    weight?: 'Lighter' | 'Default' | 'Bolder';
    color?: TextColor;
    subtle?: boolean;
    spacing?: 'None' | 'Small' | 'Default' | 'Medium';
  } = {}
) {
  return {
    type: 'TextBlock',
    text: value,
    wrap: true,
    spacing: options.spacing ?? 'None',
    size: options.size,
    weight: options.weight,
    color: options.color,
    isSubtle: options.subtle,
  };
}

function cell(
  value: string,
  options: {
    weight?: 'Bolder';
    color?: TextColor;
    subtle?: boolean;
    style?: ContainerStyle;
    /** Second, quieter line. Used to say why an endpoint is down or skipped. */
    note?: string;
  } = {}
) {
  return {
    type: 'TableCell',
    style: options.style,
    verticalContentAlignment: 'Center',
    items: [
      text(value, { weight: options.weight, color: options.color, subtle: options.subtle }),
      ...(options.note ? [text(options.note, { size: 'Small', subtle: true })] : []),
    ],
  };
}

function headerCell(value: string) {
  return cell(value, { weight: 'Bolder', subtle: true });
}

function statusCell(kind: keyof typeof STATUS) {
  const status = STATUS[kind];
  return cell(status.label, { weight: 'Bolder', color: status.color, style: status.style });
}

function headerRow(labels: string[]) {
  return { type: 'TableRow', style: 'emphasis', cells: labels.map(headerCell) };
}

function table(columns: number[], rows: unknown[]) {
  return {
    type: 'Table',
    firstRowAsHeader: true,
    showGridLines: true,
    gridStyle: 'emphasis',
    verticalCellContentAlignment: 'Center',
    columns: columns.map((width) => ({ width })),
    rows,
  };
}

function fact(title: string, value: string) {
  return { title, value };
}

export function buildCard(summary: Summary) {
  const ok = summary.failed === 0 && summary.flaky === 0;
  const endpoints = summary.endpoints ?? [];
  const features = summary.features ?? [];

  const body: unknown[] = [
    {
      type: 'Container',
      style: ok ? 'good' : 'attention',
      items: [
        text(ok ? 'E2E passed' : 'E2E failed', {
          size: 'Large',
          weight: 'Bolder',
          color: ok ? 'Good' : 'Attention',
        }),
        text(`${summary.environment} · ${summary.browser} · ${summary.trigger ?? 'Local'}`, {
          subtle: true,
          spacing: 'Small',
        }),
      ],
    },
    {
      type: 'FactSet',
      spacing: 'Medium',
      facts: [
        {
          title: 'Result',
          value: `${summary.passed} passed · ${summary.failed} failed · ${summary.flaky} flaky · ${summary.skipped} skipped`,
        },
        { title: 'Pass rate', value: passRate(summary) },
        { title: 'Duration', value: formatDuration(summary.durationMs) },
        ...(summary.baseUrl ? [fact('App', summary.baseUrl)] : []),
        fact('Commit', summary.commit.slice(0, 8) || 'n/a'),
      ],
    },
  ];

  if (endpoints.length > 0) {
    body.push(
      text('Endpoints', { size: 'Medium', weight: 'Bolder', spacing: 'Medium' }),
      table(
        [3, 2, 2],
        [
          headerRow(['Endpoint', 'Version', 'Status']),
          ...endpoints.map((endpoint) => ({
            type: 'TableRow',
            cells: [
              cell(endpoint.label, { weight: 'Bolder', note: endpoint.problem }),
              cell(endpoint.version ?? '—', { subtle: !endpoint.version }),
              statusCell(endpoint.status),
            ],
          })),
        ]
      )
    );
  }

  if (features.length > 0) {
    body.push(
      text('Features', { size: 'Medium', weight: 'Bolder', spacing: 'Medium' }),
      table(
        [3, 2, 2, 1, 2],
        [
          headerRow(['Feature', 'Section', 'Status', 'Pass rate', 'Duration']),
          ...features.map((feature: Feature) => ({
            type: 'TableRow',
            cells: [
              cell(feature.name, { weight: 'Bolder' }),
              cell(feature.section),
              statusCell(featureStatus(feature)),
              cell(passRate(feature)),
              cell(formatDuration(feature.durationMs)),
            ],
          })),
        ]
      )
    );
  }

  if (summary.failures.length > 0) {
    body.push(
      text(`Failing tests (showing ${summary.failures.length} of ${summary.totalFailures})`, {
        weight: 'Bolder',
        spacing: 'Medium',
      })
    );

    for (const failure of summary.failures) {
      body.push(
        text(`**${failure.title}**`, { spacing: 'Small' }),
        text(failure.error, { size: 'Small', color: 'Attention' }),
        text(`\`${failure.file}:${failure.line}\``, { size: 'Small', subtle: true })
      );
    }
  }

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.5',
          msteams: { width: 'Full' },
          body,
          actions: summary.runUrl
            ? [{ type: 'Action.OpenUrl', title: 'Open run and report', url: summary.runUrl }]
            : [],
        },
      },
    ],
  };
}

async function post(): Promise<void> {
  const webhook = process.env.TEAMS_WEBHOOK_URL;
  const [summaryPath = 'test-results/summary.json'] = Bun.argv.slice(2);

  if (!webhook) {
    console.error('TEAMS_WEBHOOK_URL is not set — skipping Teams notification.');
    return;
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(buildCard((await Bun.file(summaryPath).json()) as Summary)),
  });

  if (!response.ok) {
    console.error(`Teams webhook failed: ${response.status} ${await response.text()}`);
    process.exit(1);
  }

  console.log('Posted Teams card.');
}

// Only post when run as a script. Importing this file for `buildCard` must not
// send anything to the channel.
if (import.meta.main) {
  await post();
}
