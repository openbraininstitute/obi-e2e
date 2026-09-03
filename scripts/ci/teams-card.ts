#!/usr/bin/env bun
/**
 * Posts the run result to Microsoft Teams as an Adaptive Card.
 * Reads `summary.json` produced by summarize-results.ts.
 *
 * Usage: TEAMS_WEBHOOK_URL=... bun scripts/ci/teams-card.ts test-results/summary.json
 */

import { argv, env, exit } from 'node:process';

type Failure = { title: string; file: string; line: number; error: string };
type Summary = {
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

const webhook = env.TEAMS_WEBHOOK_URL;
const [summaryPath = 'test-results/summary.json'] = argv.slice(2);

if (!webhook) {
  console.error('TEAMS_WEBHOOK_URL is not set — skipping Teams notification.');
  exit(0);
}

const summary = (await Bun.file(summaryPath).json()) as Summary;
const ok = summary.failed === 0;
const minutes = Math.floor(summary.durationMs / 60_000);
const seconds = Math.round((summary.durationMs % 60_000) / 1000);

const facts = [
  { title: 'Environment', value: `${summary.environment} (${summary.baseUrl})` },
  { title: 'Browser', value: summary.browser },
  {
    title: 'Result',
    value: `${summary.passed} passed · ${summary.failed} failed · ${summary.flaky} flaky · ${summary.skipped} skipped`,
  },
  { title: 'Duration', value: `${minutes}m ${seconds}s` },
  { title: 'Commit', value: summary.commit.slice(0, 8) || 'n/a' },
];

const body: unknown[] = [
  {
    type: 'TextBlock',
    size: 'Large',
    weight: 'Bolder',
    color: ok ? 'Good' : 'Attention',
    text: `${ok ? '✅' : '❌'} E2E tests — ${summary.environment}`,
  },
  { type: 'FactSet', facts },
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

const card = {
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

const response = await fetch(webhook, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(card),
});

if (!response.ok) {
  console.error(`Teams webhook failed: ${response.status} ${await response.text()}`);
  exit(1);
}

console.log('Posted Teams card.');
