import { chooseSpecies, showAllSpecies } from '@fixtures/choose-species';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { atlas, SPECIES_WITH_ATLAS, SPECIES_WITHOUT_ATLAS } from '@locators/atlas';
import { dataPage } from '@locators/data';
import { entityListing } from '@locators/listing';

// Scenario: scenarios/data/species-and-regions/scenario.md
test.use(WIDE_VIEWPORT);

test.describe('Species and brain regions', () => {
  test.describe('on the Data page', () => {
    test.beforeEach(async ({ page, workspace }) => {
      await page.goto(routes.data(workspace.labId, workspace.projectId));
      await page.waitForURL(/[?&]s=/);
      await expect(dataPage(page).typeCounter('cell_morphology')).toBeVisible();
      await showAllSpecies(page);
    });

    for (const species of SPECIES_WITH_ATLAS) {
      test(`${species} has an atlas`, { tag: PRIVATE_READONLY }, async ({ page }) => {
        const controls = atlas(page);
        const counter = dataPage(page).typeCounter('cell_morphology');
        const before = await counter.innerText();

        await chooseSpecies(page, species);

        await expect(controls.viewer).toBeVisible();
        // A real hierarchy to walk, rather than a single placeholder region.
        // Canvas count is not the signal: the species cards leave their own
        // previews behind, so the 3D area holds canvases either way.
        await expect.poll(() => controls.regionNodes.count()).toBeGreaterThan(1);
        await expect.poll(() => counter.innerText()).not.toBe(before);
      });
    }

    for (const species of SPECIES_WITHOUT_ATLAS) {
      test(`${species} has no atlas`, { tag: PRIVATE_READONLY }, async ({ page }) => {
        const controls = atlas(page);

        await chooseSpecies(page, species);

        // The area is still laid out; there is simply nothing to navigate.
        await expect(controls.viewer).toBeVisible();
        await expect.poll(() => controls.regionNodes.count()).toBe(1);
      });
    }

    test('offers every species', { tag: PRIVATE_READONLY }, async ({ page }) => {
      const controls = atlas(page);

      await expect(controls.speciesCards).toHaveCount(9);

      await controls.speciesSelector.click();
      // Nine species plus the "All species" entry.
      await expect(page.getByRole('option')).toHaveCount(11);
    });
  });

  test.describe('on a listing', () => {
    test.beforeEach(async ({ page, workspace }) => {
      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));
      await showAllSpecies(page);
      await expect(entityListing(page).cells.first()).toBeVisible();
    });

    test('narrows by species', { tag: PRIVATE_READONLY }, async ({ page }) => {
      const listing = entityListing(page);
      const before = await listing.resultCount.innerText();

      await chooseSpecies(page, 'Mouse');

      await expect.poll(() => listing.resultCount.innerText()).not.toBe(before);
    });

    test('narrows by brain region', { tag: PRIVATE_READONLY }, async ({ page }) => {
      const listing = entityListing(page);
      const controls = atlas(page);

      await chooseSpecies(page, 'Mouse');
      await expect.poll(() => controls.regionNodes.count()).toBeGreaterThan(1);
      await expect(listing.cells.first()).toBeVisible();
      const before = await listing.resultCount.innerText();

      // Forced: the region sits under the data type panel, which covers it
      // without hiding it. A person clicks it fine; only automation notices.
      await controls.region('Cerebellum').click({ force: true });

      await expect.poll(() => listing.resultCount.innerText()).not.toBe(before);
    });
  });
});
