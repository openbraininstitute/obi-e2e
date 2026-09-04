import { atlas } from '@locators/atlas';
import { expect, type Page } from '@playwright/test';

/**
 * Picks a species from the data page's picker.
 *
 * The page re-renders while it loads and can swallow the click that opens the
 * list, so opening and choosing are retried together.
 */
export async function chooseSpecies(page: Page, name: string): Promise<void> {
  const controls = atlas(page);

  await expect(async () => {
    if (
      !(await controls
        .speciesOption(name)
        .isVisible()
        .catch(() => false))
    ) {
      await controls.speciesSelector.click();
    }
    await controls.speciesOption(name).click({ timeout: 3_000 });
  }).toPass({ timeout: 45_000 });

  await expect(controls.speciesSelector).toContainText(name);
}

/**
 * Puts the species picker back to all species.
 *
 * The choice is remembered for the user, not the tab, so it outlives a reload
 * and carries into whatever runs next. A test that needs a full listing has to
 * clear it first, or it inherits whichever species the last test left behind
 * and reads an empty table as a broken page.
 */
export async function showAllSpecies(page: Page): Promise<void> {
  await chooseSpecies(page, 'All');
}
