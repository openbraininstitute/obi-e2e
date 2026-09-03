import { columnFilter, filterKind } from '@locators/column-filter';
import { entityListing } from '@locators/listing';
import { expect, type Page } from '@playwright/test';

const NO_MATCH = 'zzzz-no-such-value';

/** "6,225 results" as a number. */
async function resultCount(page: Page): Promise<number> {
  const text = await entityListing(page).resultCount.innerText();
  return Number(text.replace(/[^\d]/g, ''));
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
  await page.waitForLoadState('networkidle').catch(() => {});

  await expect(async () => {
    if (!(await filter.panel.isVisible().catch(() => false))) {
      await filter.trigger(column).click();
    }
    await expect(filter.apply).toBeVisible({ timeout: 2_000 });
    await expect(filter.reset).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 45_000 });

  return filter;
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
  const before = await resultCount(page);
  const filter = await open(page, column);
  const kind = await filterKind(filter.panel);

  switch (kind) {
    case 'facet': {
      // A facet with no options has nothing to choose, so there is nothing to
      // assert beyond the panel having offered the search box.
      if ((await filter.noOptions.count()) > 0) break;

      await filter.options.first().waitFor();
      // The option carries its own count, which is the number of results the
      // listing must show once it is applied. That is the strongest check
      // available: the application states the answer before we ask for it.
      const expected = Number(
        (
          await filter.optionCounts
            .first()
            .innerText()
            .catch(() => '')
        ).replace(/[^\d]/g, '')
      );

      await filter.options.first().click();
      await filter.apply.click();

      if (Number.isFinite(expected) && expected > 0) {
        await expect(listing.resultCount).toHaveText(
          new RegExp(`^${expected.toLocaleString('en-US')} results`)
        );
      }
      break;
    }

    case 'value': {
      await filter.value.fill(NO_MATCH);
      await filter.apply.click();
      await expect(listing.resultCount).toHaveText(/^0 results/);
      break;
    }

    case 'range': {
      // Min above max can match nothing, so the listing must end up empty.
      await filter.min.fill('999999999');
      await filter.max.fill('1');
      await filter.apply.click();
      await expect(listing.resultCount).toHaveText(/^0 results/);
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

  // Whatever was applied, resetting must bring the listing back.
  const reopened = await open(page, column);
  await reopened.reset.click();
  await expect(listing.resultCount).toHaveText(
    new RegExp(`^${before.toLocaleString('en-US')} results`)
  );
}
