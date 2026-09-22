/** What the run did with credits, in one file the summary reads. */

import * as fs from 'node:fs';

export type CreditReport = {
  labBalance?: number;
  required: number;
  /** The environment variable `required` came from; suites read different ones. */
  variable?: string;
  assigned?: number;
  projectId?: string;
  remaining?: number;
  spent?: number;
  reversed?: 'ok' | 'failed' | 'nothing to return';
  returned?: number;
  removed?: 'ok' | 'failed';
  problem?: string;
};

const REPORT_FILE = 'test-results/credits.json';

/** Adds fields to the report. */
export async function recordCredits(patch: Partial<CreditReport>): Promise<void> {
  const current = readCreditReport() ?? {};
  const merged = { ...current, ...patch };
  await Bun.write(REPORT_FILE, `${JSON.stringify(merged, null, 2)}\n`);
}

export function resetCreditReport(): void {
  fs.rmSync(REPORT_FILE, { force: true });
}

export function readCreditReport(file = REPORT_FILE): CreditReport | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as CreditReport;
}

/** An amount rounded to two decimals. */
export function credits(amount: number): number {
  return Math.round(amount * 100) / 100;
}
