import * as fs from 'node:fs';

/**
 * What the run did with credits, written where the reporter can find it.
 *
 * A suite that stops because nobody can pay for it has not found a bug, and a
 * card that says only "failed" sends people looking for one. So the money is
 * recorded as its own thing: what the lab held, what the run was given, and
 * what it spent.
 */
export type CreditReport = {
  /** What the lab held before the run took anything. */
  labBalance?: number;
  /** What the run asked the lab for. */
  required: number;
  /** What it actually received, once the transfer went through. */
  assigned?: number;
  /** The project the run made for itself, and then deleted. */
  projectId?: string;
  /** What was left in that project when the suite finished. */
  remaining?: number;
  /** What the suite spent: assigned less remaining. The number to budget by. */
  spent?: number;
  /** Whether the leftovers made it back to the lab. A failure here is survivable. */
  reversed?: 'ok' | 'failed' | 'nothing to return';
  /** Whether the project was removed. A failure here costs one of the lab's forty. */
  removed?: 'ok' | 'failed';
  /**
   * Why the run could not be paid for. Set only when the money is the reason
   * something did not happen, so the reporter can say so instead of leaving a
   * wall of failing tests to explain itself.
   */
  problem?: string;
};

const REPORT_FILE = 'test-results/credits.json';

/**
 * Merges into whatever is already recorded, because setup and teardown each
 * know a different half and the run may end between them.
 */
export async function recordCredits(patch: Partial<CreditReport>): Promise<void> {
  const current = readCreditReport() ?? {};
  const merged = { ...current, ...patch };
  // Bun.write creates test-results on the way.
  await Bun.write(REPORT_FILE, `${JSON.stringify(merged, null, 2)}\n`);
}

/**
 * Forgets what the last run did.
 *
 * The file outlives a run — Playwright only wipes its own artefacts directory —
 * so without this a run that never prepared a project reports the previous
 * run's credits as its own. Wrong numbers on a card are worse than none.
 */
export function resetCreditReport(): void {
  fs.rmSync(REPORT_FILE, { force: true });
}

export function readCreditReport(file = REPORT_FILE): CreditReport | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as CreditReport;
}

/** Credits, rounded the way the accounting service reports them. */
export function credits(amount: number): number {
  return Math.round(amount * 100) / 100;
}
