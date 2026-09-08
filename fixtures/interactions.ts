/** Options we pass to clicks. */

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
