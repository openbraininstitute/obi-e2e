/**
 * A window wide enough for the whole data page.
 *
 * The grid only renders the columns that fit, so a narrower window leaves the
 * right-hand ones out of the page entirely: a test looking for one of them
 * finds nothing, and reports a missing column rather than a window too small
 * to hold it.
 *
 * Passed to `test.use`, which Playwright only accepts at the top level of a
 * file, so each listing spec still declares it for itself.
 */
export const WIDE_VIEWPORT = { viewport: { width: 2560, height: 1080 } };
