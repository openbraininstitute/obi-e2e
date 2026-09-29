/** Options we pass to clicks, and a click that survives hydration. */

import { expect, type Locator } from '@playwright/test';

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
