/** Options we pass to clicks, a click that survives hydration, and a wait for a page that answers. */

import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Add this to a click that stays on the same page.
 *
 * After a click, Playwright pauses to see whether a new page starts loading.
 * Our app is always loading something in the background, so that pause can last
 * the full 30 seconds and the click fails — even though the click worked.
 *
 * This option removes the pause.
 *
 * Yes: menus, tabs, dropdown options, checkboxes, a button that swaps a panel.
 *
 * No: anything that opens a new page — a workflow card, "Use model", a link to
 * a details page. There the pause is useful.
 *
 * Passing other options too: `click({ ...NO_NAVIGATION, force: true })`
 */
export const NO_NAVIGATION = { noWaitAfter: true } as const;

/**
 * Clicks `target` until `shows` is visible. Use it for the first click after a
 * page load.
 *
 * The server sends a button before React listens to it. A click in that window
 * does nothing and raises no error. Staging hydrates slowly enough to lose that
 * click on every run; main.preview mostly does not.
 *
 * Clicks again only while `shows` is hidden, so a toggle (picker, panel, menu)
 * never gets clicked shut. Each click waits 5s at most and each check 2s, and
 * the whole attempt gives up after 45s with "The click never took".
 *
 * `shows` must be what this click alone brings up: an open picker's first
 * option, the panel's input, the menu the category opens. An element already on
 * the page makes the helper return without clicking.
 *
 * Yes: pickers, panels, menus, a category that swaps the page's content.
 *
 * No: a click that opens a tab (wait for the `popup` inside `toPass`, as the
 * credits spec does), or one that leaves the page, which a retry would fire
 * again mid-navigation.
 *
 * `await clickUntil(filters.category, filters.options.first())`
 */
export async function clickUntil(target: Locator, shows: Locator): Promise<void> {
  await expect(async () => {
    if (!(await shows.isVisible())) await target.click({ ...NO_NAVIGATION, timeout: 5_000 });
    await expect(shows).toBeVisible({ timeout: 2_000 });
  }, 'The click never took: the page did not answer it.').toPass({
    timeout: 45_000,
  });
}

/**
 * A frame this soon after the last is one from a thread that answers.
 *
 * Not one from a smooth page: the atlas alone draws 120 frames a second once
 * its spinner has gone, but four of them on one machine, or one on a runner
 * with no GPU, take longer than a smooth frame for every frame, and a click
 * still lands on such a page. What a click cannot survive is the thread held
 * outright — the runner's atlas answered nothing for over thirty seconds — and
 * half a second between frames tells the two apart.
 */
const IDLE_FRAME_GAP_MS = 500;

/**
 * Frames in a row that must come this soon: a page that paints in bursts
 * yields a frame or two between them, so one quick pair proves nothing.
 */
const IDLE_FRAMES = 5;

/**
 * Waits until the page draws five frames in succession: a main thread that
 * has finished whatever held it.
 *
 * A viewer that builds and paints meshes in WebGL does so on the main thread,
 * and on a runner with no GPU that holds the thread for tens of seconds after
 * its spinner has gone. While it is held, nothing answers: a locator does not
 * resolve, a click never finds its element "stable", and the action clock runs
 * out as if the element were missing. No wait on an element sees this coming,
 * since the element is there; only the thread itself says when it is free.
 *
 * Measured in the page, from `requestAnimationFrame`: a frame fires only once
 * the thread yields, so the gap between two is the time the thread was busy.
 * Resolves on the first `IDLE_FRAMES` in a row within `IDLE_FRAME_GAP_MS` of
 * each other, and fails with a plain reason when they never come within
 * `within` — never a timeout on the action that happened to run next.
 *
 * Use it right before an interaction with a page that paints heavily: a 3D
 * atlas, a circuit scene. A page that is already idle costs five frames.
 */
export async function untilResponsive(page: Page, within: number): Promise<void> {
  const idle = await page.evaluate(
    ({ gap, frames, deadline }) =>
      new Promise<boolean>((resolve) => {
        const end = performance.now() + deadline;
        let last = performance.now();
        let quick = 0;
        // The clock, not the frame's own timestamp: a frame the thread was late
        // for carries the time it was due, not the time it ran.
        const tick = () => {
          const now = performance.now();
          quick = now - last <= gap ? quick + 1 : 0;
          last = now;
          if (quick >= frames) resolve(true);
          else if (now > end) resolve(false);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { gap: IDLE_FRAME_GAP_MS, frames: IDLE_FRAMES, deadline: within }
  );

  if (!idle) {
    throw new Error(
      `The page never came back: no ${IDLE_FRAMES} frames in a row within ` +
        `${IDLE_FRAME_GAP_MS} ms of each other in ${within} ms.`
    );
  }
}
