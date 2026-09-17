/**
 * Fake runs for `bun run site`, written into gh-web/fixtures/ where Vite serves
 * them at the same paths the published branch uses.
 *
 * public/ is ignored by git: committing these would ship a fake runs.json that
 * shadows the real one on the published site.
 */

import * as fs from 'node:fs';
const feat = (section: string, name: string, p: number, f = 0, fl = 0, s = 0) => ({
  section,
  name,
  passed: p,
  failed: f,
  flaky: fl,
  skipped: s,
  durationMs: (p + f) * 9000,
});
const summary = (date: string, failed: number) => ({
  passed: 232 - failed,
  failed,
  flaky: failed ? 3 : 1,
  skipped: 12,
  durationMs: 64 * 60_000 + failed * 30_000,
  environment: 'staging',
  baseUrl: 'https://main.preview.openbraininstitute.org',
  browser: 'chromium',
  commit: 'abc1234',
  runUrl: 'https://github.com/o/r/actions/runs/1',
  reportUrl: '',
  trigger: 'schedule',
  failures: Array.from({ length: Math.min(failed, 3) }, (_, i) => ({
    title: `simulate microcircuit follows the campaign ${i + 1}`,
    file: 'scenarios/simulate/spec.ts',
    line: 40 + i,
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
      status: failed ? 'down' : 'healthy',
      problem: failed ? '500 on /estimate' : undefined,
    },
    { key: 'vlm', label: 'virtual-lab-manager', version: '1.9.3', status: 'healthy' },
    { key: 'nexus', label: 'entitycore', version: '0.31.2', status: 'healthy' },
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
});
for (const [date, failed] of [
  ['2026-09-17', 5],
  ['2026-09-16', 0],
] as const) {
  fs.mkdirSync(`gh-web/fixtures/runs/${date}/report`, { recursive: true });
  fs.writeFileSync(
    `gh-web/fixtures/runs/${date}/summary.json`,
    JSON.stringify(summary(date, failed))
  );
  fs.writeFileSync(
    `gh-web/fixtures/runs/${date}/report/index.html`,
    '<p style="font:14px system-ui;padding:2rem">Playwright report stands here.</p>'
  );
}
fs.writeFileSync('gh-web/fixtures/runs.json', JSON.stringify(['2026-09-17', '2026-09-16']));
const history = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 7, 19 + i));
  const date = d.toISOString().slice(0, 10);
  const failed = [0, 0, 1, 0, 6, 0, 0, 2, 0, 0][i % 10];
  return {
    date,
    finishedAt: `${date}T07:40:00Z`,
    environment: 'staging',
    passed: 232 - failed,
    failed,
    flaky: failed ? 3 : 1,
    skipped: 12,
    durationMs: (60 + (i % 7) * 2 + failed) * 60_000,
    commit: 'abc1234',
    runUrl: 'https://github.com/o/r/actions/runs/1',
  };
});
fs.writeFileSync('gh-web/fixtures/history.json', JSON.stringify(history));
console.log('fixtures written');
