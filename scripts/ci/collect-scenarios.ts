#!/usr/bin/env bun

/**
 * Copies the scenario of every failed test into the report.
 *
 * A spec is the mechanics; its `scenario.md` is what the test was supposed to
 * prove, and reading a failure without it means opening the repository at the
 * right commit. Only the scenarios that failed are copied, so this stays a few
 * kilobytes next to a report that no longer carries videos or traces.
 *
 * It also writes `scenarios.json`, mapping each failing spec to the scenario
 * copied for it. The dashboard shows that scenario in a drawer, and resolving
 * "the nearest scenario.md at or above this spec" needs the file system — which
 * a page fetching over HTTP does not have.
 *
 * Usage: bun scripts/ci/collect-scenarios.ts <results.json> [reportDir]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { collectFailures } from './summarize-results';

const SCENARIO = 'scenario.md';
const INDEX = 'scenarios.json';

/** The scenario beside a spec, or the nearest one above it. */
function scenarioFor(specFile: string): string | null {
  let dir = path.dirname(specFile);

  while (dir && dir !== '.' && dir !== path.sep) {
    const candidate = path.join(dir, SCENARIO);
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return null;
}

async function main(): Promise<void> {
  const [inputPath, reportDir = 'playwright-report'] = Bun.argv.slice(2);
  if (!inputPath || !(await Bun.file(inputPath).exists())) {
    console.log('No results to read, so no scenarios to collect.');
    return;
  }

  const report = (await Bun.file(inputPath).json()) as {
    suites?: Parameters<typeof collectFailures>[0];
  };

  const failed = collectFailures(report.suites);

  /** Spec file to the scenario that covers it. Several specs can share one. */
  const bySpec = new Map<string, string>();

  for (const failure of failed) {
    const scenario = scenarioFor(failure.file);
    if (scenario) bySpec.set(failure.file, scenario);
  }

  if (bySpec.size === 0) {
    console.log('No scenario files to collect.');
    return;
  }

  for (const scenario of new Set(bySpec.values())) {
    // The path already begins with `scenarios/`, so it lands unnested under the report.
    const target = path.join(reportDir, scenario);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(scenario, target);
  }

  fs.writeFileSync(path.join(reportDir, INDEX), `${JSON.stringify(Object.fromEntries(bySpec))}\n`);

  console.log(
    `Collected ${new Set(bySpec.values()).size} scenario file(s) for ${failed.length} failure(s).`
  );
}

if (import.meta.main) {
  await main();
}
