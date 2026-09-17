/**
 * Fake runs for `bun run site`, written into gh-web/fixtures/, which the dev
 * server serves at the same paths the published branch uses.
 *
 * The directory is ignored by git, and the production build is configured with
 * no public directory, so none of this can reach the published site.
 */

import * as fs from 'node:fs';

import type { Feature, ServiceStatus, Summary } from './src/data';

const OUT = 'gh-web/fixtures';

const feat = (
  section: string,
  name: string,
  passed: number,
  failed = 0,
  flaky = 0,
  skipped = 0
): Feature => ({
  section,
  name,
  passed,
  failed,
  flaky,
  skipped,
  durationMs: (passed + failed) * 9000,
});

/** Two specs get a scenario; a third failure deliberately has none. */
const WITH_SCENARIO = 'scenarios/workflows/simulate-microcircuit/simulate-microcircuit.spec.ts';
const WITHOUT_SCENARIO = 'scenarios/admin/credits/credits.spec.ts';

const scenarioMarkdown = (name: string) => `# ${name}

A signed-in user launches the campaign and follows it until the results tab
reports spikes. The run **pays credits**, so it carries the \`@credits\` tag.

## Before

- The project exists and has been given a budget.
- The species is pinned by URL, never by the picker.

## Steps

1. Open the workflow and pick a configuration.
2. Set a constant current clamp on every biophysical neuron.
3. Launch, then wait for the campaign to reach \`done\`.

## What it proves

| Expectation | Why it matters |
| --- | --- |
| The results tab enables | A campaign that never finishes reads as a UI bug |
| Spikes are plotted | An empty plot means the simulation produced nothing |

> A wrong result is a product bug. Report it, never soften the expectation.

\`\`\`ts
await expect(results.spikes()).toBeVisible();
\`\`\`
`;

const status = (down: boolean): ServiceStatus => (down ? 'down' : 'healthy');

function summary(failed: number): Summary {
  return {
    passed: 232 - failed,
    failed,
    flaky: failed ? 3 : 1,
    skipped: 12,
    durationMs: 64 * 60_000 + failed * 30_000,
    environment: 'staging',
    baseUrl: 'https://main.preview.openbraininstitute.org',
    browser: 'chromium',
    commit: 'abc1234',
    runUrl: 'https://github.com/openbraininstitute/obi-e2e/actions/runs/1',
    reportUrl: '',
    trigger: 'Scheduled',
    failures: Array.from({ length: Math.min(failed, 3) }, (_, index) => ({
      title: `simulate microcircuit follows the campaign ${index + 1}`,
      file: index === 2 ? WITHOUT_SCENARIO : WITH_SCENARIO,
      line: 40 + index,
      project: 'staging',
      error:
        'TimeoutError: locator.click: Timeout 30000ms exceeded.\nwaiting for getByTestId("launch")',
    })),
    totalFailures: failed,
    services: [
      {
        key: 'obi-one',
        label: 'obi-one',
        version: '2.14.0',
        status: status(failed > 0),
        ...(failed > 0 ? { problem: '500 on /estimate' } : {}),
      },
      { key: 'vlm', label: 'virtual-lab-manager', version: '1.9.3', status: 'healthy' },
      { key: 'entitycore', label: 'entitycore', version: '0.31.2', status: 'healthy' },
    ],
    features: [
      feat('Explore', 'browse listings', 48, failed ? 2 : 0, 1),
      feat('Explore', 'column filters', 22),
      feat('Build', 'single neuron', 31, 0, 1),
      feat('Simulate', 'microcircuit', 18, failed ? 3 : 0),
      feat('Simulate', 'e-feature extraction', 12),
      feat('Onboarding', 'virtual lab creation', 9, 0, 0, 4),
      feat('Admin', 'project credits', 14),
    ],
    credits: { required: 6000, assigned: 6000, spent: 1240, remaining: 4760, projectId: 'p-1' },
  };
}

const days = [
  ['2026-09-17', 5],
  ['2026-09-16', 0],
] as const;

for (const [date, failed] of days) {
  const run = `${OUT}/runs/${date}`;
  fs.mkdirSync(`${run}/report`, { recursive: true });
  fs.writeFileSync(`${run}/summary.json`, JSON.stringify(summary(failed)));

  // A stand-in unless a real Playwright report has already been copied in.
  if (!fs.existsSync(`${run}/report/index.html`)) {
    fs.writeFileSync(
      `${run}/report/index.html`,
      '<p style="font:14px system-ui;padding:2rem">The Playwright report stands here.</p>'
    );
  }

  // What collect-scenarios.ts publishes beside the report: the scenario of each
  // failing spec, and the index saying which spec each one belongs to.
  if (failed > 0) {
    const dir = WITH_SCENARIO.slice(0, WITH_SCENARIO.lastIndexOf('/'));
    fs.mkdirSync(`${run}/report/${dir}`, { recursive: true });
    fs.writeFileSync(`${run}/report/${dir}/scenario.md`, scenarioMarkdown('Simulate microcircuit'));
    fs.writeFileSync(
      `${run}/report/scenarios.json`,
      JSON.stringify({ [WITH_SCENARIO]: `${dir}/scenario.md` })
    );
  }
}

fs.writeFileSync(`${OUT}/runs.json`, JSON.stringify(days.map(([date]) => date)));

// Nothing on the page reads this any more, but the publish job still writes it.
const history = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 7, 19 + index)).toISOString().slice(0, 10);
  const failed = [0, 0, 1, 0, 6, 0, 0, 2, 0, 0][index % 10] ?? 0;
  return {
    date,
    finishedAt: `${date}T07:40:00Z`,
    environment: 'staging',
    passed: 232 - failed,
    failed,
    flaky: failed ? 3 : 1,
    skipped: 12,
    durationMs: (60 + (index % 7) * 2 + failed) * 60_000,
    commit: 'abc1234',
    runUrl: 'https://github.com/openbraininstitute/obi-e2e/actions/runs/1',
  };
});
fs.writeFileSync(`${OUT}/history.json`, JSON.stringify(history));

console.log('fixtures written');
