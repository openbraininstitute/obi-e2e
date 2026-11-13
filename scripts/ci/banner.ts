/**
 * Prints which deployment the run is about to hit, before the first test.
 *
 * A reporter, not a test: a test's output waits until the test ends, so lines
 * printed from the health check land under its tick. `onBegin` runs once, in
 * the runner, ahead of the list reporter's "Running N tests".
 */

import type { FullConfig, Reporter } from '@playwright/test/reporter';

export default class Banner implements Reporter {
  onBegin(config: FullConfig): void {
    const { environment, baseUrl } = config.metadata as { environment: string; baseUrl: string };
    console.log(`\n  env   ${environment}\n  url   ${baseUrl}`);
  }
}
