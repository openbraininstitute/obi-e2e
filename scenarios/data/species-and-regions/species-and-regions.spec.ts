import { routes } from '@fixtures/routes';
import { chooseSpecies } from '@fixtures/steps/choose-species';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { atlas, EVERY_SPECIES, SPECIES_WITH_ATLAS, SPECIES_WITHOUT_ATLAS } from '@locators/atlas';
import { dataPage } from '@locators/data';
import { entityListing } from '@locators/listing';

test.use(WIDE_VIEWPORT);

/*
 * One at a time. This is the only scenario that chooses a species through the
 * selector, and the choice is a preference the app keeps for the user, not for
 * the tab: run in parallel these are twelve writers to one value. Sequential
 * rather than serial, so a failing case does not take the file with it.
 */
test.describe.configure({ mode: 'default' });

test.describe('Species and brain regions', () => {
  test.describe('on the Data page', () => {
    // Every species by URL rather than through the selector: one load, not two.
    test.beforeEach(async ({ page, workspace }) => {
      // "All" loads every species' hierarchy and 3D atlas: the main thread
      // stays busy to ~47s, and until it is done the selector is a skeleton
      // carrying no test id.
      test.slow();

      await page.goto(routes.dataAllSpecies(workspace.labId, workspace.projectId));
      await expect(dataPage(page).typeCounter('cell_morphology')).toBeVisible();
      await expect(atlas(page).speciesSelector).toContainText('All', { timeout: 60_000 });
    });

    for (const species of SPECIES_WITH_ATLAS) {
      test(
        `Choose a species with an atlas: ${species}`,
        { tag: AUTHENTICATED },
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
        { tag: AUTHENTICATED },
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

      await expect(controls.speciesGrid).toBeVisible();
      await expect(controls.speciesCards).toHaveCount(EVERY_SPECIES.length);

      for (const species of EVERY_SPECIES) {
        await chooseSpecies(page, species);
        await expect(controls.viewer).toBeVisible();
      }
    });
  });

  test.describe('on a listing', () => {
    test.beforeEach(async ({ page, workspace }) => {
      // For the reason the Data page beforeEach gives.
      test.slow();

      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));
      await expect(atlas(page).speciesSelector).toContainText('All', { timeout: 60_000 });
      await expect(entityListing(page).cells.first()).toBeVisible();
    });

    test('Change the species on a listing', { tag: AUTHENTICATED }, async ({ page }) => {
      const listing = entityListing(page);
      const before = await listing.resultCount.innerText();

      await chooseSpecies(page, 'Mouse');

      await expect.poll(() => listing.resultCount.innerText()).not.toBe(before);
    });

    test('Change the brain region on a listing', { tag: AUTHENTICATED }, async ({ page }) => {
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
