import { atlas, type SpeciesChoice } from '@locators/atlas';
import { expect, type Page } from '@playwright/test';

/**
 * Picks a species in the atlas selector.
 *
 * Both clicks are bounded well under the retry budget on purpose: the selector
 * is a skeleton with no test id until the hierarchies arrive, so an unbounded
 * click would spend 30 of the 45 seconds on one attempt and leave no room to
 * try again.
 */
export async function chooseSpecies(page: Page, name: SpeciesChoice): Promise<void> {
  const controls = atlas(page);

  await expect(async () => {
    if (
      !(await controls
        .speciesOption(name)
        .isVisible()
        .catch(() => false))
    ) {
      await controls.speciesSelector.click({ timeout: 3_000 });
    }
    await controls.speciesOption(name).click({ timeout: 3_000 });
  }).toPass({ timeout: 45_000 });

  await expect(controls.speciesSelector).toContainText(name);
}

export async function showAllSpecies(page: Page): Promise<void> {
  await chooseSpecies(page, 'All');
}
