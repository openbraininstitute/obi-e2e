import { entityListing } from '@locators/listing';
import { expect, type Page } from '@playwright/test';

import { NO_NAVIGATION } from '../interactions';
import { expectListing, expectRows } from './listing';

async function pageSignature(page: Page): Promise<string> {
  const cells = await entityListing(page).cells.allInnerTexts();
  return cells
    .map((cell) => cell.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join('|');
}

/** Checks page 2 holds other rows, and page 1 comes back the same. */
export async function checkPagination(page: Page): Promise<void> {
  const listing = entityListing(page);

  await expectListing(page);
  await expectRows(page);
  await page.waitForLoadState('networkidle').catch(() => {});

  const total = await listing.resultCount.innerText();
  const firstPage = await pageSignature(page);
  expect(firstPage).not.toBe('');

  await listing.pageLink(2).click(NO_NAVIGATION);
  await expectRows(page);
  await expect
    .poll(() => pageSignature(page), { message: 'page 2 shows the same rows as page 1' })
    .not.toBe(firstPage);

  await expect(listing.resultCount).toHaveText(total);

  await listing.pageLink(1).click(NO_NAVIGATION);
  await expect.poll(() => pageSignature(page)).toBe(firstPage);
}
