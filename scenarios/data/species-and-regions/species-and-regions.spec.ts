import { routes } from '@fixtures/routes';
import { chooseSpecies, showAllSpecies } from '@fixtures/steps/choose-species';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { atlas, EVERY_SPECIES, SPECIES_WITH_ATLAS, SPECIES_WITHOUT_ATLAS } from '@locators/atlas';
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

    test('Every species can be chosen', { tag: AUTHENTICATED }, async ({ page }) => {
      const controls = atlas(page);

      await expect(controls.speciesCards).toHaveCount(EVERY_SPECIES.length);

      for (const species of EVERY_SPECIES) {
        await chooseSpecies(page, species);
        await expect(controls.viewer).toBeVisible();
      }
    });
  });

  test.describe('on a listing', () => {
    test.beforeEach(async ({ page, workspace }) => {
      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));
      await showAllSpecies(page);
      await expect(entityListing(page).cells.first()).toBeVisible();
    });

    test('Change the species on a listing', { tag: AUTHENTICATED }, async ({ page }) => {
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
