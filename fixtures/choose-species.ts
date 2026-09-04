import { atlas } from '@locators/atlas';
import { expect, type Page } from '@playwright/test';

/** Picks a species in the atlas selector. */
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

export async function showAllSpecies(page: Page): Promise<void> {
  await chooseSpecies(page, 'All');
}
