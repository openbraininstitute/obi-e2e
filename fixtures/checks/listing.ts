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
