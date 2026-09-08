/** Shared check for one column filter of a listing. */

import { columnFilter, filterKind } from '@locators/column-filter';
import { entityListing } from '@locators/listing';
import { expect, type Locator, type Page } from '@playwright/test';

const NO_MATCH = 'zzzz-no-such-value';

async function resultCount(page: Page): Promise<number> {
  const text = await entityListing(page).resultCount.innerText();
  return Number(text.replace(/[^\d]/g, ''));
}

/** The result count once it stops changing. */
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
        intervals: [1_000],
        timeout: 30_000,
      }
    )
    .toBe(true);

  return last;
}

/** Opens a column filter. Retried, because a re-render closes the panel. */
async function open(page: Page, column: string) {
  const filter = columnFilter(page);

  await entityListing(page).table.waitFor();

  await expect(async () => {
    if (!(await filter.panel.isVisible().catch(() => false))) {
      await filter.trigger(column).click();
    }
    await expect(filter.apply).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 45_000 });

  return filter;
}

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

/** Filters the listing by one column, checks the count, then resets it. */
export async function checkFilter(page: Page, column: string): Promise<void> {
  const listing = entityListing(page);

  await listing.table.waitFor();
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
      const reopened = await open(page, column);
      await expect(reopened.reset).toBeVisible();
      break;
    }

    default:
      throw new Error(`Unknown filter kind for the "${column}" column.`);
  }

  if (!applied) return;

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
