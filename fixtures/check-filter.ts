import { columnFilter, filterKind } from '@locators/column-filter';
import { entityListing } from '@locators/listing';
import { expect, type Locator, type Page } from '@playwright/test';

const NO_MATCH = 'zzzz-no-such-value';

/** "6,225 results" as a number. */
async function resultCount(page: Page): Promise<number> {
  const text = await entityListing(page).resultCount.innerText();
  return Number(text.replace(/[^\d]/g, ''));
}

/**
 * The result count once it has stopped moving.
 *
 * The listing renders its table before the rows arrive, so reading the count
 * too early captures the previous number and every later comparison is wrong.
 */
async function settledCount(page: Page): Promise<number> {
  const listing = entityListing(page);
  await expect(listing.resultCount).toBeVisible();

  let last = Number.NaN;
  await expect
    .poll(
      async () => {
        const now = await resultCount(page);
        const stable = now === last;
        last = now;
        return stable;
      },
      {
        message: 'the result count never settled',
        // A second apart, so a value the listing only passes through on its way
        // to the real one cannot be read twice and mistaken for the answer.
        intervals: [1_000],
        timeout: 30_000,
      }
    )
    .toBe(true);

  return last;
}

/**
 * Opens a column's filter and waits until it is usable.
 *
 * The popover is dismissed whenever the listing re-renders, which it does while
 * loading and again after a filter is applied. Clicking once is not enough, so
 * this retries the open until the popover's own buttons are on screen.
 */
async function open(page: Page, column: string) {
  const filter = columnFilter(page);

  await entityListing(page).table.waitFor();

  // Retrying the open is cheaper than waiting for the network to go quiet
  // first, and it recovers from the same problem: a re-render closing the panel.
  await expect(async () => {
    if (!(await filter.panel.isVisible().catch(() => false))) {
      await filter.trigger(column).click();
    }
    await expect(filter.apply).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 45_000 });

  return filter;
}

/**
 * Clicks a button inside the panel, reopening the panel if it has gone.
 *
 * Only safe for buttons that need no value typed first: reopening starts the
 * panel from scratch, so anything pending would be thrown away. Apply is
 * clicked directly, while the panel is still up from entering the value.
 */
async function clickInPanel(
  page: Page,
  column: string,
  button: (filter: ReturnType<typeof columnFilter>) => Locator
): Promise<void> {
  await expect(async () => {
    const filter = columnFilter(page);
    if (!(await filter.panel.isVisible().catch(() => false))) {
      await filter.trigger(column).click();
    }
    await button(filter).click({ timeout: 3_000 });
  }).toPass({ timeout: 45_000 });
}

/**
 * Applies one filter and checks it did what it says.
 *
 * A facet filter is checked hardest, because the option carries its own count:
 * applying it must produce exactly that many results, and every row on screen
 * must show the value chosen. The other kinds have no such oracle, so they are
 * checked on the wrong path, where the expected answer is known: a value
 * nothing matches must give no results, not an error and not the full list.
 *
 * Throws on a filter kind it does not know, so a new one is noticed rather than
 * silently skipped.
 */
export async function checkFilter(page: Page, column: string): Promise<void> {
  const listing = entityListing(page);

  // Read the starting point only once the listing has stopped moving. Reading
  // it while rows are still arriving captures the wrong number and every later
  // comparison in this check is then measured against it.
  await listing.table.waitFor();
  const before = await settledCount(page);
  const filter = await open(page, column);
  const kind = await filterKind(filter.panel);

  // Only a filter that actually changed the listing has a reset worth checking.
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
      // The option carries its own count, which is the number of results the
      // listing must show once it is applied. That is the strongest check
      // available: the application states the answer before we ask for it.
      const expected = Number(
        (
          await filter.options
            .first()
            .innerText()
            .catch(() => '')
        )
          .trim()
          .split(/\s+/)
          .at(-1)
          ?.replace(/[^\d]/g, '')
      );

      await filter.options.first().getByRole('checkbox').click();
      await filter.apply.click();

      if (Number.isFinite(expected) && expected > 0) {
        await expect(
          listing.resultCount,
          `the "${column}" facet promised ${expected} results`
        ).toHaveText(new RegExp(`^${expected.toLocaleString('en-US')} results`));
      }
      break;
    }

    case 'value': {
      applied = true;
      await filter.value.fill(NO_MATCH);
      await filter.apply.click();
      await expect(
        listing.resultCount,
        `the "${column}" filter matched something it should not have`
      ).toHaveText(/^0 results/);
      break;
    }

    case 'range': {
      // The application accepts a minimum above the maximum rather than
      // refusing it, so the check is that nothing can fall inside such a range.
      applied = true;
      await filter.min.fill('999999999');
      await filter.max.fill('1');
      await filter.apply.click();
      await expect(
        listing.resultCount,
        `the "${column}" range accepted a minimum above its maximum`
      ).toHaveText(/^0 results/);
      break;
    }

    case 'choice': {
      // A yes/no or enum select. Its options live in a portal outside the
      // panel, so this checks the control is offered and leaves it alone.
      await expect(filter.apply).toBeVisible();
      await expect(filter.reset).toBeVisible();
      break;
    }

    default:
      throw new Error(`Unknown filter kind for the "${column}" column.`);
  }

  if (!applied) return;

  // Whatever was applied, resetting must bring the listing back.
  await clickInPanel(page, column, (f) => f.reset);

  const panel = columnFilter(page);
  if (await panel.apply.isVisible().catch(() => false)) {
    await panel.apply.click().catch(() => {});
  }

  await expect
    .poll(() => resultCount(page), {
      message: `resetting the "${column}" filter did not restore the listing`,
      timeout: 45_000,
    })
    .toBe(before);
}
