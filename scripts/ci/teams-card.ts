#!/usr/bin/env bun

/**
 * Posts the run result to Microsoft Teams as an Adaptive Card.
 * It reads the summary.json that summarize-results.ts writes.
 *
 * Usage: TEAMS_WEBHOOK_URL=... bun scripts/ci/teams-card.ts test-results/summary.json
 */

/** Loads the .env files. The webhook URL lives in the deployment's local one. */
import '@fixtures/env';
import type { CreditReport } from '@fixtures/credit-report';

import {
  collectSections,
  creditNotice,
  featureStatus,
  formatDuration,
  passRate,
  type ServiceSummary,
  type Feature,
  type Section,
  type Summary,
} from './summarize-results';

type TextColor = 'Default' | 'Dark' | 'Light' | 'Accent' | 'Good' | 'Warning' | 'Attention';
type ContainerStyle = 'default' | 'emphasis' | 'good' | 'attention' | 'warning' | 'accent';
type BadgeStyle =
  | 'Default'
  | 'Subtle'
  | 'Informative'
  | 'Accent'
  | 'Good'
  | 'Attention'
  | 'Warning';

/** The card widths an element applies to. Teams picks one from the surface. */
type TargetWidth =
  | 'VeryNarrow'
  | 'Narrow'
  | 'Standard'
  | 'Wide'
  | `atLeast:${'VeryNarrow' | 'Narrow' | 'Standard' | 'Wide'}`
  | `atMost:${'VeryNarrow' | 'Narrow' | 'Standard' | 'Wide'}`;

const TITLE = 'Open Brain Institute Platform e2e';

const STATUS: Record<
  ServiceSummary['status'] | ReturnType<typeof featureStatus>,
  { label: string; color: TextColor; style: ContainerStyle }
> = {
  healthy: { label: '● Healthy', color: 'Good', style: 'good' },
  down: { label: '● Down', color: 'Attention', style: 'attention' },
  skipped: { label: '● Skipped', color: 'Default', style: 'emphasis' },
  passed: { label: '● Passed', color: 'Good', style: 'good' },
  failed: { label: '● Failed', color: 'Attention', style: 'attention' },
  flaky: { label: '● Flaky', color: 'Warning', style: 'warning' },
};

const OUTCOME: Record<ReturnType<typeof featureStatus>, { label: string; style: BadgeStyle }> = {
  passed: { label: 'Passed', style: 'Good' },
  failed: { label: 'Failed', style: 'Attention' },
  flaky: { label: 'Flaky', style: 'Warning' },
  skipped: { label: 'Skipped', style: 'Subtle' },
};

function text(
  value: string,
  options: {
    size?: 'Small' | 'Default' | 'Medium' | 'Large';
    weight?: 'Lighter' | 'Default' | 'Bolder';
    color?: TextColor;
    subtle?: boolean;
    spacing?: 'None' | 'Small' | 'Default' | 'Medium';
    targetWidth?: TargetWidth;
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
    targetWidth: options.targetWidth,
  };
}

/** A chip. Badge is Teams-only, so each one carries a text fallback. */
function badge(
  value: string,
  options: { style?: BadgeStyle; appearance?: 'Filled' | 'Tint'; tooltip?: string } = {}
) {
  return {
    type: 'Badge',
    text: value,
    style: options.style ?? 'Default',
    appearance: options.appearance ?? 'Tint',
    shape: 'Rounded',
    tooltip: options.tooltip,
    fallback: text(value, { size: 'Small', subtle: true }),
  };
}

function panel(
  items: unknown[],
  options: { area?: string; spacing?: 'None' | 'Small' | 'Default' | 'Medium' } = {}
) {
  return {
    type: 'Container',
    showBorder: true,
    roundedCorners: true,
    verticalContentAlignment: 'Center',
    spacing: options.spacing,
    'grid.area': options.area,
    items,
  };
}

function cell(
  value: string,
  options: {
    weight?: 'Bolder';
    color?: TextColor;
    subtle?: boolean;
    style?: ContainerStyle;
    note?: string;
    selectAction?: unknown;
  } = {}
) {
  return {
    type: 'TableCell',
    style: options.style,
    verticalContentAlignment: 'Center',
    selectAction: options.selectAction,
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

function table(
  columns: number[],
  rows: unknown[],
  options: { id?: string; isVisible?: boolean; firstRowAsHeader?: boolean } = {}
) {
  return {
    type: 'Table',
    firstRowAsHeader: options.firstRowAsHeader ?? true,
    showGridLines: true,
    gridStyle: 'emphasis',
    verticalCellContentAlignment: 'Center',
    columns: columns.map((width) => ({ width })),
    rows,
    id: options.id,
    isVisible: options.isVisible,
    spacing: 'None',
  };
}

function fact(title: string, value: string) {
  return { title, value };
}

const FEATURE_COLUMNS = [3, 2, 2, 1, 2];

const CHEVRON = { collapsed: '▸', expanded: '▾' } as const;

function clamp(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

const MAX = {
  featureName: 120,
  sectionName: 60,
  serviceLabel: 60,
  serviceVersion: 40,
  problem: 140,
  failureTitle: 160,
  failureError: 200,
  filePath: 120,
  baseUrl: 120,
} as const;

function featureTables(sections: Section[], expandable: boolean): unknown[] {
  const elements: unknown[] = [
    table(
      [...FEATURE_COLUMNS],
      [headerRow(['Feature', 'Section', 'Status', 'Pass rate', 'Duration'])]
    ),
  ];

  for (const [index, section] of sections.entries()) {
    const rowsId = `features-${index}`;
    const collapsedId = `collapsed-${index}`;
    const expandedId = `expanded-${index}`;

    const toggle = {
      type: 'Action.ToggleVisibility',
      title: `Expand ${section.name}`,
      targetElements: [rowsId, collapsedId, expandedId],
    };

    const sectionCell = {
      type: 'TableCell',
      verticalContentAlignment: 'Center',
      selectAction: toggle,
      items: [
        {
          ...text(`${CHEVRON.collapsed} ${clamp(section.name, MAX.sectionName)}`, {
            weight: 'Bolder',
          }),
          id: collapsedId,
        },
        {
          ...text(`${CHEVRON.expanded} ${clamp(section.name, MAX.sectionName)}`, {
            weight: 'Bolder',
          }),
          id: expandedId,
          isVisible: false,
        },
      ],
    };

    elements.push(
      table(
        [...FEATURE_COLUMNS],
        [
          {
            type: 'TableRow',
            cells: [
              expandable
                ? sectionCell
                : cell(clamp(section.name, MAX.sectionName), { weight: 'Bolder' }),
              cell(
                `${section.features.length} ${section.features.length === 1 ? 'feature' : 'features'}`,
                {
                  subtle: true,
                  selectAction: toggle,
                }
              ),
              statusCell(featureStatus(section)),
              cell(passRate(section), { selectAction: toggle }),
              cell(formatDuration(section.durationMs), { selectAction: toggle }),
            ],
          },
        ],
        { firstRowAsHeader: false }
      )
    );

    if (!expandable) continue;

    elements.push(
      table(
        [...FEATURE_COLUMNS],
        section.features.map((feature: Feature) => ({
          type: 'TableRow',
          cells: [
            cell(`\u21b3 ${clamp(feature.name, MAX.featureName)}`),
            cell(feature.section, { subtle: true }),
            statusCell(featureStatus(feature)),
            cell(passRate(feature)),
            cell(formatDuration(feature.durationMs)),
          ],
        })),
        { id: rowsId, isVisible: false, firstRowAsHeader: false }
      )
    );
  }

  return elements;
}

function outcomeChart(summary: Summary): unknown | null {
  const slices = [
    { legend: 'Passed', value: summary.passed, color: 'good' },
    { legend: 'Failed', value: summary.failed, color: 'attention' },
    { legend: 'Flaky', value: summary.flaky, color: 'warning' },
    { legend: 'Skipped', value: summary.skipped, color: 'neutral' },
  ];

  if (slices.every((slice) => slice.value === 0)) return null;

  return {
    type: 'Chart.Donut',
    title: 'Tests',
    fallback: 'drop',
    data: slices,
  };
}

function creditChart(credits: CreditReport | undefined): unknown | null {
  if (!credits || credits.assigned === undefined || credits.remaining === undefined) return null;

  const spent = credits.spent ?? credits.assigned - credits.remaining;
  const returned = credits.returned ?? (credits.reversed === 'ok' ? credits.remaining : 0);
  const stranded = Math.round((credits.remaining - returned) * 100) / 100;

  return {
    type: 'Chart.HorizontalBar.Stacked',
    title: `Credits · ${credits.assigned} assigned`,
    fallback: 'drop',
    spacing: 'Small',
    data: [
      {
        title: 'This run',
        data: [
          { legend: 'Spent', value: spent, color: 'neutral' },
          { legend: 'Returned to the lab', value: returned, color: 'good' },
          { legend: 'Stranded', value: stranded, color: 'attention' },
        ],
      },
    ],
  };
}

export type Mention = { name: string; id: string };

export function parseMentions(raw = process.env.TEAMS_ALERT_MENTIONS): Mention[] {
  if (!raw?.trim()) return [];

  return raw
    .split(',')
    .map((entry) => /^\s*(?<name>[^<]+?)\s*<\s*(?<id>[^>]+?)\s*>\s*$/u.exec(entry))
    .flatMap((match) =>
      match?.groups?.name && match.groups.id
        ? [{ name: match.groups.name, id: match.groups.id }]
        : []
    );
}

function mentionBlock(mentions: Mention[]): { text: string; entities: unknown[] } {
  return {
    text: mentions.map((person) => `<at>${person.name}</at>`).join(' '),
    entities: mentions.map((person) => ({
      type: 'mention',
      text: `<at>${person.name}</at>`,
      mentioned: { id: person.id, name: person.name },
    })),
  };
}

function message(body: unknown[], runUrl: string) {
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
          actions: runUrl
            ? [{ type: 'Action.OpenUrl', title: 'Open run and report', url: runUrl }]
            : [],
        },
      },
    ],
  };
}

export type Post = { label: string; message: ReturnType<typeof message>; bytes: number };

function rootPost(summary: Summary): Post {
  const { card, bytes } = buildCardWithinLimit({ ...summary, features: [] });
  return { label: 'summary', message: card, bytes };
}

function sectionBody(section: Section, features: Feature[], part: string): unknown[] {
  return [
    text(`${clamp(section.name, MAX.sectionName)}${part}`, { size: 'Medium', weight: 'Bolder' }),
    text(
      `${featureStatus(section)} · ${passRate(section)} · ${formatDuration(section.durationMs)}`,
      { subtle: true, spacing: 'Small' }
    ),
    table(
      [...FEATURE_COLUMNS],
      [
        headerRow(['Feature', 'Section', 'Status', 'Pass rate', 'Duration']),
        ...features.map((feature) => ({
          type: 'TableRow',
          cells: [
            cell(clamp(feature.name, MAX.featureName), { weight: 'Bolder' }),
            cell(clamp(feature.section, MAX.sectionName), { subtle: true }),
            statusCell(featureStatus(feature)),
            cell(passRate(feature)),
            cell(formatDuration(feature.durationMs)),
          ],
        })),
      ]
    ),
  ];
}

function chunkFeatures(section: Section, runUrl: string): Feature[][] {
  const chunks: Feature[][] = [];
  let current: Feature[] = [];

  for (const feature of section.features) {
    const candidate = [...current, feature];
    const bytes = JSON.stringify(message(sectionBody(section, candidate, ''), runUrl)).length;

    if (bytes > TEAMS_PAYLOAD_LIMIT && current.length > 0) {
      chunks.push(current);
      current = [feature];
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function sectionPosts(section: Section, runUrl: string): Post[] {
  const chunks = chunkFeatures(section, runUrl);

  return chunks.map((features, index) => {
    const part = chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : '';
    const built = message(sectionBody(section, features, part), runUrl);
    return {
      label: `${section.name}${part}`,
      message: built,
      bytes: JSON.stringify(built).length,
    };
  });
}

export function buildPosts(summary: Summary): Post[] {
  const sections = collectSections(summary.features ?? []);
  return [
    rootPost(summary),
    ...sections.flatMap((section) => sectionPosts(section, summary.runUrl)),
  ];
}

export function buildThreadPayload(summary: Summary): { cards: unknown[] } {
  return {
    cards: buildPosts(summary).map((item) => item.message.attachments[0]?.content),
  };
}

export function buildCardWithinLimit(summary: Summary): {
  card: ReturnType<typeof buildCard>;
  detail: Detail;
  bytes: number;
} {
  let last = { card: buildCard(summary, 'full'), detail: 'full' as Detail, bytes: 0 };

  for (const detail of ['full', 'sections', 'summary'] as const) {
    const card = buildCard(summary, detail);
    const bytes = JSON.stringify(card).length;
    last = { card, detail, bytes };
    if (bytes <= TEAMS_PAYLOAD_LIMIT) return last;
  }

  return last;
}

export const TEAMS_PAYLOAD_LIMIT = 25_000;

export type Detail = 'full' | 'sections' | 'summary';

export function buildCard(summary: Summary, detail: Detail = 'full', mentions = parseMentions()) {
  const ok = summary.failed === 0 && summary.flaky === 0;
  const services = detail === 'summary' ? [] : (summary.services ?? []);
  const features = detail === 'summary' ? [] : (summary.features ?? []);

  const notice = creditNotice(summary.credits, summary.failed);
  const alert = notice && summary.credits?.problem ? mentionBlock(mentions) : null;

  const outcome = OUTCOME[featureStatus(summary)];
  const chart = outcomeChart(summary);

  const body: unknown[] = [
    {
      type: 'Container',
      style: ok ? 'good' : 'attention',
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
              style: outcome.style,
              appearance: 'Filled',
              tooltip: 'How the run ended',
            }),
            badge(summary.environment, { style: 'Accent', tooltip: 'Deployment under test' }),
            badge(summary.browser, { style: 'Informative', tooltip: 'Browser' }),
            badge(summary.trigger ?? 'Local', { style: 'Subtle', tooltip: 'What started the run' }),
          ],
        },
      ],
    },
    {
      type: 'Container',
      spacing: 'Medium',
      layouts: [
        {
          type: 'Layout.AreaGrid',
          targetWidth: 'atLeast:Standard',
          columns: [70],
          columnSpacing: 'Medium',
          areas: [{ name: 'facts' }, { name: 'ring', column: 2 }],
        },
      ],
      items: [
        panel(
          [
            {
              type: 'FactSet',
              facts: [
                {
                  title: 'Result',
                  value: `${summary.passed} passed · ${summary.failed} failed · ${summary.flaky} flaky · ${summary.skipped} skipped`,
                },
                { title: 'Pass rate', value: passRate(summary) },
                { title: 'Duration', value: formatDuration(summary.durationMs) },
                ...(summary.baseUrl ? [fact('App', clamp(summary.baseUrl, MAX.baseUrl))] : []),
                fact('Commit', summary.commit.slice(0, 8) || 'n/a'),
              ],
            },
          ],
          { area: 'facts' }
        ),
        ...(chart ? [panel([chart], { area: 'ring' })] : []),
      ],
    },
  ];

  if (notice) {
    body.push({
      type: 'Container',
      style: 'warning',
      spacing: 'Medium',
      items: [
        text('Credits', { weight: 'Bolder', color: 'Warning' }),
        text(clamp(notice, MAX.failureError), { spacing: 'Small' }),
        ...(alert && alert.text ? [text(alert.text, { spacing: 'Small' })] : []),
      ],
    });
  }

  if (summary.credits?.assigned !== undefined) {
    const { assigned, spent, remaining } = summary.credits;
    const bar = creditChart(summary.credits);

    body.push(
      panel(
        [
          {
            type: 'FactSet',
            facts: [
              fact('Credits assigned', String(assigned)),
              fact('Credits spent', spent === undefined ? '—' : String(spent)),
              fact('Credits left', remaining === undefined ? '—' : String(remaining)),
              ...(summary.credits?.returned === undefined
                ? []
                : [fact('Returned to the lab', String(summary.credits.returned))]),
            ],
          },
          ...(bar ? [bar] : []),
        ],
        { spacing: 'Medium' }
      )
    );
  }

  if (services.length > 0) {
    body.push(
      text('Services', { size: 'Medium', weight: 'Bolder', spacing: 'Medium' }),
      table(
        [3, 2, 2],
        [
          headerRow(['Service', 'Version', 'Status']),
          ...services.map((endpoint) => ({
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
      ...featureTables(collectSections(features), detail === 'full')
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
        text(`**${clamp(failure.title, MAX.failureTitle)}**`, { spacing: 'Small' }),
        text(clamp(failure.error, MAX.failureError), { size: 'Small', color: 'Attention' }),
        text(`\`${clamp(failure.file, MAX.filePath)}:${failure.line}\``, {
          size: 'Small',
          subtle: true,
          targetWidth: 'atLeast:Narrow',
        })
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
          msteams: {
            width: 'Full',
            ...(alert && alert.entities.length > 0 ? { entities: alert.entities } : {}),
          },
          body,
          actions: [
            ...(summary.runUrl
              ? [{ type: 'Action.OpenUrl', title: 'Open the run', url: summary.runUrl }]
              : []),
            ...(summary.reportUrl
              ? [
                  {
                    type: 'Action.OpenUrl',
                    title: 'Download the full report',
                    url: summary.reportUrl,
                  },
                ]
              : []),
          ],
        },
      },
    ],
  };
}

function report(what: string, shape: string): void {
  console.log(`${what}\n  shape: ${shape}`);
  console.log(
    '  The endpoint accepted the request. If a flow is behind it, that is not yet a\n' +
      "  message: check the flow's run history if nothing appears in the channel."
  );
}

async function send(webhook: string, body: unknown): Promise<boolean> {
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(`Teams webhook failed: ${response.status} ${await response.text()}`);
    return false;
  }

  return true;
}

async function post(): Promise<void> {
  const webhook = process.env.TEAMS_WEBHOOK_URL;
  const [summaryPath = 'test-results/summary.json'] = Bun.argv.slice(2);

  if (!webhook) {
    console.error('TEAMS_WEBHOOK_URL is not set — skipping Teams notification.');
    return;
  }

  const summary = (await Bun.file(summaryPath).json()) as Summary;

  if (process.env.TEAMS_LAYOUT === 'thread') {
    const payload = buildThreadPayload(summary);
    if (!(await send(webhook, payload))) process.exit(1);
    report(
      `Sent ${payload.cards.length} cards in one request for the flow to thread.`,
      '{ "cards": [ … ] }'
    );
    return;
  }

  if (process.env.TEAMS_LAYOUT === 'split') {
    const posts = buildPosts(summary);

    for (const [index, item] of posts.entries()) {
      if (!(await send(webhook, item.message))) {
        process.exit(1);
      }
      console.log(`Sent ${index + 1}/${posts.length}: ${item.label} (${item.bytes} bytes).`);

      if (index < posts.length - 1) await Bun.sleep(1200);
    }

    report(
      `Sent ${posts.length} messages, one per card.`,
      '{ "type": "message", "attachments": [ … ] } each'
    );
    return;
  }

  const { card, detail, bytes } = buildCardWithinLimit(summary);

  if (detail !== 'full') {
    console.error(
      `Card trimmed to "${detail}" at ${bytes} bytes to stay under the ${TEAMS_PAYLOAD_LIMIT} byte Teams limit.`
    );
  }

  if (!(await send(webhook, card))) process.exit(1);
  report(
    `Sent one message (${detail}, ${bytes} bytes). Set TEAMS_LAYOUT=thread for a ` +
      'summary with the sections threaded under it.',
    '{ "type": "message", "attachments": [ … ] }'
  );
}

if (import.meta.main) {
  await post();
}
