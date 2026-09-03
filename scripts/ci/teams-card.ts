#!/usr/bin/env bun
/**
 * Posts the run result to Microsoft Teams as an Adaptive Card.
 * Reads `summary.json` produced by summarize-results.ts.
 *
 * Usage: TEAMS_WEBHOOK_URL=... bun scripts/ci/teams-card.ts test-results/summary.json
 */

type Failure = { title: string; file: string; line: number; error: string };

export type Summary = {
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
  environment: string;
  baseUrl: string;
  browser: string;
  commit: string;
  runUrl: string;
  failures: Failure[];
  totalFailures: number;
};

export function buildCard(summary: Summary) {
  const ok = summary.failed === 0;
  const minutes = Math.floor(summary.durationMs / 60_000);
  const seconds = Math.round((summary.durationMs % 60_000) / 1000);

  const body: unknown[] = [
    {
      type: 'TextBlock',
      size: 'Large',
      weight: 'Bolder',
      color: ok ? 'Good' : 'Attention',
      text: `${ok ? '✅' : '❌'} E2E tests — ${summary.environment}`,
    },
    {
      type: 'FactSet',
      facts: [
        { title: 'Environment', value: `${summary.environment} (${summary.baseUrl})` },
        { title: 'Browser', value: summary.browser },
        {
          title: 'Result',
          value: `${summary.passed} passed · ${summary.failed} failed · ${summary.flaky} flaky · ${summary.skipped} skipped`,
        },
        { title: 'Duration', value: `${minutes}m ${seconds}s` },
        { title: 'Commit', value: summary.commit.slice(0, 8) || 'n/a' },
      ],
    },
  ];

  if (summary.failures.length > 0) {
    body.push({
      type: 'TextBlock',
      weight: 'Bolder',
      text: `Failing tests (showing ${summary.failures.length} of ${summary.totalFailures})`,
      wrap: true,
    });

    for (const failure of summary.failures) {
      body.push({
        type: 'TextBlock',
        text: `• **${failure.title}**\n\`${failure.file}:${failure.line}\``,
        wrap: true,
        spacing: 'Small',
      });
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
          version: '1.4',
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
