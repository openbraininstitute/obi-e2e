#!/usr/bin/env bun
/**
 * Posts the run result to Microsoft Teams as an Adaptive Card.
 * Reads `summary.json` produced by summarize-results.ts.
 *
 * Usage: TEAMS_WEBHOOK_URL=... bun scripts/ci/teams-card.ts test-results/summary.json
 */

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
 * Card text comes from test titles, service errors and scenario names, none of
 * which have a bound. One long string could push a message past the payload
 * limit and get the whole post rejected, so every variable string is clamped
 * before it reaches a cell.
 */
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

/**
 * The run's outcome as a donut, on the summary card only.
 *
 * `Chart.Donut` is a Teams extension rather than part of the Adaptive Cards
 * schema, so a host that cannot draw it — Teams mobile, Outlook, an older
 * client — is told to drop the element outright. The same counts sit in the
 * FactSet above it, so nothing is lost, and dropping beats rendering a hole.
 *
 * All four statuses are always drawn, including the ones at zero. The legend is
 * then the same from run to run, which is what makes two runs comparable at a
 * glance, and a run with no failures says so outright rather than leaving it to
 * be inferred from an entry that is not there.
 *
 * A run that produced no tests at all is the one case with nothing to draw.
 */
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
    // Standard Adaptive Cards fallback, understood even where the chart is not.
    fallback: 'drop',
    spacing: 'Medium',
    data: slices,
  };
}

/**
 * Where the budget went, as one stacked bar.
 *
 * The three parts add up to exactly what the project was given, and each is a
 * different thing that can happen to a credit: the run consumed it, it went
 * back to the lab, or it did neither and is now gone with the project. All
 * three are drawn even at zero, so the bar reads the same way every run and
 * "nothing was stranded" is stated rather than inferred.
 */
function creditChart(credits: CreditReport | undefined): unknown | null {
  if (!credits || credits.assigned === undefined || credits.remaining === undefined) return null;

  const spent = credits.spent ?? credits.assigned - credits.remaining;
  // A teardown that never finished returned nothing, and what it left in the
  // project went with it. `reversed` covers a report written before the amount
  // itself was recorded.
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

/**
 * People to pull into the channel when the run could not be paid for.
 *
 * Nobody watches a card that says a run failed for want of credits; a mention
 * reaches them. Read from `TEAMS_ALERT_MENTIONS` as `Name <id>`, comma
 * separated, where the id is the person's Teams sign-in address:
 *
 *   TEAMS_ALERT_MENTIONS="Ada Lovelace <ada@example.org>, Alan Turing <alan@example.org>"
 *
 * A mention only renders when the webhook is a Power Automate flow posting the
 * card; a plain incoming webhook drops it and shows the name as written.
 */
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

/** The `<at>` tags Teams swaps for real mentions, paired with their entities. */
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

/**
 * The head of the run: outcome, counts and the service table. Degrades the same
 * way the single card does, so a run with many failing services still posts.
 */
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
 * All the cards in one request, for a flow that posts the first and replies
 * with the rest. Each entry is the bare Adaptive Card, which is what the
 * "Post card in a chat or channel" action expects.
 */
export function buildThreadPayload(summary: Summary): { cards: unknown[] } {
  return {
    cards: buildPosts(summary).map((item) => item.message.attachments[0]?.content),
  };
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

export function buildCard(summary: Summary, detail: Detail = 'full', mentions = parseMentions()) {
  const ok = summary.failed === 0 && summary.flaky === 0;
  const services = detail === 'summary' ? [] : (summary.services ?? []);
  const features = detail === 'summary' ? [] : (summary.features ?? []);

  // A run nobody could pay for is not a run that found something, so this sits
  // above the counts rather than among the failures.
  const notice = creditNotice(summary.credits, summary.failed);
  const alert = notice && summary.credits?.problem ? mentionBlock(mentions) : null;

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
        ...(summary.baseUrl ? [fact('App', clamp(summary.baseUrl, MAX.baseUrl))] : []),
        fact('Commit', summary.commit.slice(0, 8) || 'n/a'),
      ],
    },
  ];

  const chart = outcomeChart(summary);
  if (chart) body.push(chart);

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
    body.push({
      type: 'FactSet',
      spacing: 'Medium',
      facts: [
        fact('Credits assigned', String(assigned)),
        fact('Credits spent', spent === undefined ? '—' : String(spent)),
        fact('Credits left', remaining === undefined ? '—' : String(remaining)),
        ...(summary.credits?.returned === undefined
          ? []
          : [fact('Returned to the lab', String(summary.credits.returned))]),
      ],
    });

    const bar = creditChart(summary.credits);
    if (bar) body.push(bar);
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
            // The HTML report is the thing someone actually wants: every test,
            // its trace and its screenshots, openable on their own machine.
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

/**
 * What was sent, and the fact that sending is not posting.
 *
 * A Power Automate endpoint answers as soon as it has the request, before the
 * flow behind it has done anything, so a send that succeeded is not a message
 * in the channel. Naming the shape matters too: a flow written for one layout
 * quietly posts nothing when it is handed the other, and the payload is the
 * only way to tell the two apart from here.
 */
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

  // `thread` sends every card in one request. The flow behind the webhook posts
  // the first and replies with the rest, which is the only way to get a thread.
  if (process.env.TEAMS_LAYOUT === 'thread') {
    const payload = buildThreadPayload(summary);
    if (!(await send(webhook, payload))) process.exit(1);
    report(
      `Sent ${payload.cards.length} cards in one request for the flow to thread.`,
      '{ "cards": [ … ] }'
    );
    return;
  }

  // `split` posts the summary first, then one message per section. The webhook
  // cannot thread, so these arrive as separate channel messages.
  if (process.env.TEAMS_LAYOUT === 'split') {
    const posts = buildPosts(summary);

    for (const [index, item] of posts.entries()) {
      if (!(await send(webhook, item.message))) {
        process.exit(1);
      }
      console.log(`Sent ${index + 1}/${posts.length}: ${item.label} (${item.bytes} bytes).`);

      // The webhook answers 202 before the message is created, so ordering is
      // not guaranteed. A short gap makes it far more likely to hold.
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

// Only post when run as a script. Importing this file for `buildCard` must not
// send anything to the channel.
if (import.meta.main) {
  await post();
}
