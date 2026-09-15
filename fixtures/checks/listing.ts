import { entityListing, listingError } from '@locators/listing';
import { expect, type Page } from '@playwright/test';

export async function expectListing(page: Page): Promise<void> {
  const listing = entityListing(page);
  const failed = listingError(page);

  await expect(listing.table).toBeVisible();

  await Promise.race([
    expect(listing.resultCount).toBeVisible(),
    failed.waitFor({ state: 'visible' }).then(async () => {
      throw new Error(`The listing did not load: ${(await failed.innerText()).trim()}`);
    }),
  ]);
}

/**
 * Waits for rows, and reports the listing's error banner instead when it shows.
 *
 * Waiting on the rows alone reports a backend failure as a gridcell that was
 * never found, which reads as a drifted locator.
 */
export async function expectRows(page: Page): Promise<void> {
  const listing = entityListing(page);
  const failed = listingError(page);

  await Promise.race([
    expect(listing.cells.first()).toBeVisible(),
    failed.waitFor({ state: 'visible' }).then(async () => {
      throw new Error(`The listing holds no rows: ${(await failed.innerText()).trim()}`);
    }),
  ]);
}
