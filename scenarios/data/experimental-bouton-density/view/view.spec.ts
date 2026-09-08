import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.ExperimentalBoutonDensity);

const PROPERTIES = ['brain_region', 'species', 'mtype', 'license', 'lifecycle_status'];

const SECTIONS = ['metadata-grid', 'subject-details'];

test.use(WIDE_VIEWPORT);

test.describe('Bouton density details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await expect(listing.cells.first()).toBeVisible();

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test('Open one Bouton density beside the listing', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = dataView(page);

    await expect(view.miniName).toBeVisible();
    for (const property of PROPERTIES) {
      await expect(view.miniProperty(property)).toBeVisible();
    }
    await expect(view.miniDownload).toBeVisible();
  });

  test('Open the full Bouton density page', { tag: AUTHENTICATED }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
