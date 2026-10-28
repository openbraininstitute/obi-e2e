/**
 * `untilResponsive` against a page that holds its main thread.
 *
 * The real case is a viewer painting meshes with no GPU; here a busy loop
 * stands in for it, so the wait can be pinned to a page that cannot change.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { type Browser, chromium, type Page } from '@playwright/test';

import { untilResponsive } from './interactions';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});

afterAll(async () => {
  await browser?.close();
});

/**
 * Holds the main thread in `bursts` bursts of `burst` ms, yielding between them.
 *
 * In a function scope: `setContent` rewrites the same document, so a top-level
 * `let` would be a redeclaration the next time, and the script would not run.
 */
const busy = (burst: number, bursts: number) => `
  <script>
    (() => {
      let left = ${bursts};
      const hold = () => {
        const until = performance.now() + ${burst};
        while (performance.now() < until);
        if (--left > 0) setTimeout(hold, 0);
      };
      setTimeout(hold, 0);
    })();
  </script>`;

describe('untilResponsive', () => {
  test('returns at once on a page with nothing to do', async () => {
    await page.setContent('<p>idle</p>');
    const started = performance.now();
    await untilResponsive(page, 5_000);
    expect(performance.now() - started).toBeLessThan(1_000);
  });

  test('waits out a thread that is held, then returns', async () => {
    // Four bursts of 700 ms: every frame gap is over the idle gap until they end.
    await page.setContent(busy(700, 4));
    const started = performance.now();
    await untilResponsive(page, 10_000);
    expect(performance.now() - started).toBeGreaterThanOrEqual(2_500);
  });

  test('fails with its own reason when the thread never frees in time', async () => {
    // Held well past the deadline: twenty bursts of 700 ms.
    await page.setContent(busy(700, 20));
    await expect(untilResponsive(page, 2_000)).rejects.toThrow('The page never came back');
  });
});
