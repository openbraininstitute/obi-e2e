import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { showAllSpecies } from '@fixtures/steps/choose-species';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.Circuit);

const PROPERTIES = [
  'species',
  'brain_region',
  'scale',
  'xxxxx',
  'number_neurons',
  'number_synapses',
  'number_connections',
  'build_category',
  'creation_date',
  'license',
  'lifecycle_status',
];

const SECTIONS = ['visualizations', 'visualization', 'metadata-grid', 'subject-details'];

test.use(WIDE_VIEWPORT);

test.describe('Circuit details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test('Open one Circuit beside the listing', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = dataView(page);

    await expect(view.miniName).toBeVisible();
    for (const property of PROPERTIES) {
      await expect(view.miniProperty(property)).toBeVisible();
    }
    await expect(view.miniDownload).toBeVisible();
  });

  test('Open the full Circuit page', { tag: AUTHENTICATED }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
