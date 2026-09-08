import { entityListing } from '@locators/listing';
import { expect, type Page } from '@playwright/test';

import { NO_NAVIGATION } from '../interactions';

/** Toggles the column chooser shows: one per column, plus "Select all". */
export function toggleCount(shown: string[], hidden: string[]): number {
  return shown.length + hidden.length + 1;
}

/**
 * Turns one column on or off. Retried, because a click landing while the table
 * is restoring its layout is dropped. Each attempt reads the table again, so a
 * click that did land is never undone.
 */
export async function setColumn(page: Page, column: string, shown: boolean): Promise<void> {
  const listing = entityListing(page);
  const header = listing.columnHeader(column);

  await expect(async () => {
    if ((await header.isVisible().catch(() => false)) === shown) return;

    if (!(await listing.columnsMenu.isVisible().catch(() => false))) {
      await listing.columns.click(NO_NAVIGATION);
    }
    await listing.columnToggle(column).click({ ...NO_NAVIGATION, timeout: 3_000 });

    if (shown) await expect(header).toBeVisible({ timeout: 3_000 });
    else await expect(header).toBeHidden({ timeout: 3_000 });
  }).toPass({ timeout: 45_000 });
}
