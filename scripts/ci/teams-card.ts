#!/usr/bin/env bun
/**
 * Posts the run result to Microsoft Teams as an Adaptive Card.
 * Reads `summary.json` produced by summarize-results.ts.
 *
 * Usage: TEAMS_WEBHOOK_URL=... bun scripts/ci/teams-card.ts test-results/summary.json
 */

import {
  collectSections,
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
    /** Makes the cell clickable. Applied to every cell so the row responds. */
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

/**
 * Expand and collapse affordance. Plain glyphs on purpose: Teams renders images
 * only from a public HTTPS URL, rejects SVG and redirects, and ignores base64
 * data URIs on desktop and web. A glyph costs nothing and always draws.
 */
const CHEVRON = { collapsed: '▸', expanded: '▾' } as const;

/**
 * A table row cannot be hidden: `TableRow` has no `id` or `isVisible`. A whole
 * `Table` can. So each section becomes a one-row table plus a hidden table of
 * its features, all sharing the same column widths so they line up as one grid.
 * Clicking any cell of the section row toggles its features and swaps the
 * chevron, using `Action.ToggleVisibility`, which needs no server round trip.
 */
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
          ...text(`${CHEVRON.collapsed} ${section.name}`, { weight: 'Bolder' }),
          id: collapsedId,
        },
        {
          ...text(`${CHEVRON.expanded} ${section.name}`, { weight: 'Bolder' }),
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
              expandable ? sectionCell : cell(section.name, { weight: 'Bolder' }),
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
            cell(`\u21b3 ${feature.name}`),
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

/** Wraps card content in the envelope the Teams webhook expects. */
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

/** The head of the run: outcome, counts and the service table. */
function rootPost(summary: Summary): Post {
  const card = buildCard({ ...summary, features: [] }, 'full');
  return { label: 'summary', message: card, bytes: JSON.stringify(card).length };
}

function sectionBody(section: Section, features: Feature[], part: string): unknown[] {
  return [
    text(`${section.name}${part}`, { size: 'Medium', weight: 'Bolder' }),
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
            cell(feature.name, { weight: 'Bolder' }),
            cell(feature.section, { subtle: true }),
            statusCell(featureStatus(feature)),
            cell(passRate(feature)),
            cell(formatDuration(feature.durationMs)),
          ],
        })),
      ]
    ),
  ];
}

/**
 * Splits a section's features into groups that each fit the payload limit.
 * Features are added one at a time and the card measured, so the split follows
 * the real byte count rather than a guessed row count. At least one feature per
 * group, so an oversized single feature still gets posted.
 */
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

/**
 * The run as a sequence of posts: the summary and services first, then one per
 * section. The webhook answers 202 with an empty body and no message id, so
 * these cannot be threaded from here; each is its own channel message.
 */
export function buildPosts(summary: Summary): Post[] {
  const sections = collectSections(summary.features ?? []);
  return [
    rootPost(summary),
    ...sections.flatMap((section) => sectionPosts(section, summary.runUrl)),
  ];
}

/**
 * The largest card that still fits Teams' payload limit. Detail is dropped a
 * level at a time rather than letting the post be rejected.
 */
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

/**
 * Teams rejects a message whose payload exceeds this, card JSON included. The
 * feature tables grow with every scenario, so the card is trimmed to fit rather
 * than being refused outright.
 */
export const TEAMS_PAYLOAD_LIMIT = 25_000;

/** How much of the card to draw. Each level is smaller than the one before. */
export type Detail = 'full' | 'sections' | 'summary';

export function buildCard(summary: Summary, detail: Detail = 'full') {
  const ok = summary.failed === 0 && summary.flaky === 0;
  const services = detail === 'summary' ? [] : (summary.services ?? []);
  const features = detail === 'summary' ? [] : (summary.features ?? []);

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

  // `split` posts the summary first, then one message per section. The webhook
  // cannot thread, so these arrive as separate channel messages.
  if (process.env.TEAMS_LAYOUT === 'split') {
    const posts = buildPosts(summary);

    for (const [index, item] of posts.entries()) {
      if (!(await send(webhook, item.message))) {
        process.exit(1);
      }
      console.log(`Posted ${index + 1}/${posts.length}: ${item.label} (${item.bytes} bytes).`);

      // The webhook answers 202 before the message is created, so ordering is
      // not guaranteed. A short gap makes it far more likely to hold.
      if (index < posts.length - 1) await Bun.sleep(1200);
    }

    return;
  }

  const { card, detail, bytes } = buildCardWithinLimit(summary);

  if (detail !== 'full') {
    console.error(
      `Card trimmed to "${detail}" at ${bytes} bytes to stay under the ${TEAMS_PAYLOAD_LIMIT} byte Teams limit.`
    );
  }

  if (!(await send(webhook, card))) process.exit(1);
  console.log(`Posted Teams card (${detail}, ${bytes} bytes).`);
}

// Only post when run as a script. Importing this file for `buildCard` must not
// send anything to the channel.
if (import.meta.main) {
  await post();
}
