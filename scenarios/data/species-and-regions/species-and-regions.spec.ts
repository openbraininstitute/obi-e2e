import { chooseSpecies, showAllSpecies } from '@fixtures/choose-species';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { atlas, SPECIES_WITH_ATLAS, SPECIES_WITHOUT_ATLAS } from '@locators/atlas';
import { dataPage } from '@locators/data';
import { entityListing } from '@locators/listing';

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
      test(
        `Choose a species with an atlas: ${species}`,
        { tag: PRIVATE_READONLY },
        async ({ page }) => {
          const controls = atlas(page);
          const counter = dataPage(page).typeCounter('cell_morphology');
          const before = await counter.innerText();

          await chooseSpecies(page, species);

          await expect(controls.viewer).toBeVisible();
          await expect.poll(() => controls.regionNodes.count()).toBeGreaterThan(1);
          await expect.poll(() => counter.innerText()).not.toBe(before);
        }
      );
    }

    for (const species of SPECIES_WITHOUT_ATLAS) {
      test(
        `Choose a species without an atlas: ${species}`,
        { tag: PRIVATE_READONLY },
        async ({ page }) => {
          const controls = atlas(page);

          await chooseSpecies(page, species);

          await expect(controls.viewer).toBeVisible();
          await expect.poll(() => controls.regionNodes.count()).toBe(1);
        }
      );
    }

    test('Every species can be chosen', { tag: PRIVATE_READONLY }, async ({ page }) => {
      const controls = atlas(page);

      await expect(controls.speciesCards).toHaveCount(9);

      await controls.speciesSelector.click();
      await expect(page.getByRole('option')).toHaveCount(11);
    });
  });

  test.describe('on a listing', () => {
    test.beforeEach(async ({ page, workspace }) => {
      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));
      await showAllSpecies(page);
      await expect(entityListing(page).cells.first()).toBeVisible();
    });

    test('Change the species on a listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
      const listing = entityListing(page);
      const before = await listing.resultCount.innerText();

      await chooseSpecies(page, 'Mouse');

      await expect.poll(() => listing.resultCount.innerText()).not.toBe(before);
    });

    test('Change the brain region on a listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
      const listing = entityListing(page);
      const controls = atlas(page);

      await chooseSpecies(page, 'Mouse');
      await expect.poll(() => controls.regionNodes.count()).toBeGreaterThan(1);
      await expect(listing.cells.first()).toBeVisible();
      const before = await listing.resultCount.innerText();

      await controls.region('Cerebellum').click({ force: true });

      await expect.poll(() => listing.resultCount.innerText()).not.toBe(before);
    });
  });
});
