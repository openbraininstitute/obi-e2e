/** Shared check for one column filter of a listing. */

import { columnFilter, filterKind } from '@locators/column-filter';
import { entityListing, listingError } from '@locators/listing';
import { expect, type Locator, type Page } from '@playwright/test';

import { NO_NAVIGATION } from '../interactions';
import { expectListing } from './listing';

const NO_MATCH = 'zzzz-no-such-value';

/** Asserts the count, unless the listing gave up — then it reports that instead. */
async function expectCount(page: Page, pattern: RegExp, message: string): Promise<void> {
  const failed = listingError(page);

  await Promise.race([
    expect(entityListing(page).resultCount, message).toHaveText(pattern),
    failed.waitFor({ state: 'visible' }).then(async () => {
      throw new Error(`${message}: the listing gave up — ${(await failed.innerText()).trim()}`);
    }),
  ]);
}

/** Whether a facet option is ticked, however the panel draws it. */
async function isTicked(box: Locator): Promise<boolean> {
  return box
    .isChecked()
    .catch(async () => (await box.getAttribute('aria-checked').catch(() => null)) === 'true');
}

async function resultCount(page: Page): Promise<number> {
  const text = await entityListing(page).resultCount.innerText();
  return Number(text.replace(/[^\d]/g, ''));
}

/** How many equal readings in a row count as settled. */
const STEADY_READINGS = 3;

/** Reads the count until it holds still. */
async function steady(
  page: Page,
  accept: (count: number) => boolean,
  timeout: number
): Promise<number> {
  let last = Number.NaN;
  let held = 0;

  await expect
    .poll(
      async () => {
        const now = await resultCount(page);
        held = now === last ? held + 1 : 0;
        last = now;
        return accept(now) && held + 1 >= STEADY_READINGS;
      },
      { intervals: [1_000], timeout }
    )
    .toBe(true);

  return last;
}

/**
 * The result count of the unfiltered listing.
 *
 * A listing shows "0 results" while it fetches, including the refetch after a
 * filter is cleared, so a non-zero figure is waited for first. A listing that
 * really is empty gives none, and its zero is taken after that wait.
 */
async function settledCount(page: Page): Promise<number> {
  await expect(entityListing(page).resultCount).toBeVisible();

  // Short: an empty listing spends this once per column.
  const populated = await steady(page, (count) => count > 0, 15_000)
    .then((count) => count)
    .catch(() => null);

  return populated ?? (await steady(page, () => true, 30_000).catch(() => resultCount(page)));
}

/** Opens a column filter. Retried, because a re-render closes the panel. */
async function open(page: Page, column: string) {
  const filter = columnFilter(page);

  await entityListing(page).table.waitFor();

  await expect(async () => {
    if (!(await filter.panel.isVisible().catch(() => false))) {
      await filter.trigger(column).click(NO_NAVIGATION);
    }
    await expect(filter.apply).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 45_000 });

  return filter;
}

/**
 * Runs one pass at the open panel, reopening it first when it has gone.
 *
 * The listing re-renders the table header when a background call lands, which
 * unmounts the popover — a panel opened while `regions?page_size=1000` was in
 * flight was gone a second later. `attempt` must be safe to run twice.
 */
async function inPanel(
  page: Page,
  column: string,
  attempt: (filter: ReturnType<typeof columnFilter>) => Promise<void>,
  message: string
): Promise<void> {
  await expect(async () => {
    const filter = columnFilter(page);
    if (!(await filter.panel.isVisible().catch(() => false))) {
      await filter.trigger(column).click(NO_NAVIGATION);
      await expect(filter.apply).toBeVisible({ timeout: 5_000 });
    }
    await attempt(filter);
  }, message).toPass({ timeout: 60_000 });
}

/** Filters the listing by one column, checks the count, then resets it. */
export async function checkFilter(page: Page, column: string): Promise<void> {
  await expectListing(page);
  const before = await settledCount(page);
  const filter = await open(page, column);
  const kind = await filterKind(filter.panel);

  let applied = false;

  switch (kind) {
    case 'facet': {
      const arrived = await filter.options
        .first()
        .waitFor({ state: 'visible', timeout: 20_000 })
        .then(() => true)
        .catch(() => false);

      if (!arrived) break;
      applied = true;

      let expected = Number.NaN;

      await inPanel(
        page,
        column,
        async (opened) => {
          const option = opened.options.first();
          await expect(option).toBeVisible({ timeout: 10_000 });

          const badge = opened.optionCount(option);
          const shown =
            (await badge.count()) > 0
              ? await badge.innerText().catch(() => '')
              : ((await option.innerText().catch(() => '')).trim().split(/\s+/).at(-1) ?? '');
          expected = Number(shown.replace(/[^\d]/g, ''));

          // Ticked, not clicked: a repeat pass would untick it.
          const box = option
            .getByTestId('column-filter-option-checkbox')
            .or(option.getByRole('checkbox'));
          if (!(await isTicked(box))) await box.click({ ...NO_NAVIGATION, timeout: 5_000 });

          await opened.apply.click({ ...NO_NAVIGATION, timeout: 5_000 });
        },
        `the "${column}" facet could not be applied`
      );

      if (Number.isFinite(expected) && expected > 0) {
        await expectCount(
          page,
          new RegExp(`^${expected.toLocaleString('en-US')} results`),
          `the "${column}" facet promised ${expected} results`
        );
      }
      break;
    }

    case 'value': {
      applied = true;
      await filter.value.fill(NO_MATCH);
      await filter.apply.click(NO_NAVIGATION);
      await expectCount(
        page,
        /^0 results/,
        `the "${column}" filter matched something it should not have`
      );
      break;
    }

    case 'range': {
      applied = true;
      await filter.min.fill('999999999');
      await filter.max.fill('1');
      await filter.apply.click(NO_NAVIGATION);
      await expectCount(
        page,
        /^0 results/,
        `the "${column}" range accepted a minimum above its maximum`
      );
      break;
    }

    case 'choice': {
      const reopened = await open(page, column);
      await expect(reopened.reset).toBeVisible();
      break;
    }

    default:
      throw new Error(`Unknown filter kind for the "${column}" column.`);
  }

  if (!applied) return;

  // Reset, wait for the count to come back, start over when it does not.
  // Resetting an already-reset filter changes nothing, so this repeats safely.
  await inPanel(
    page,
    column,
    async (opened) => {
      await opened.reset.click({ ...NO_NAVIGATION, timeout: 5_000 });

      if (await opened.apply.isVisible().catch(() => false)) {
        await opened.apply.click({ ...NO_NAVIGATION, timeout: 5_000 }).catch(() => {});
      }

      await expect.poll(() => resultCount(page), { timeout: 15_000 }).toBe(before);
    },
    `resetting the "${column}" filter did not restore the listing`
  );
}
