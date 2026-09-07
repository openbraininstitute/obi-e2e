import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { showAllSpecies } from '@fixtures/steps/choose-species';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.ExperimentalSynapsesPerConnection);

const PROPERTIES = [
  'pre_region',
  'post_region',
  'pre_mtype',
  'post_mtype',
  'species',
  'subject_age',
  'license',
  'lifecycle_status',
];

const SECTIONS = ['metadata-grid', 'subject-details'];

test.use(WIDE_VIEWPORT);

test.describe('Synapse per connection details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test(
    'Open one Synapse per connection beside the listing',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const view = dataView(page);

      await expect(view.miniName).toBeVisible();
      for (const property of PROPERTIES) {
        await expect(view.miniProperty(property)).toBeVisible();
      }
      await expect(view.miniDownload).toBeVisible();
    }
  );

  test('Open the full Synapse per connection page', { tag: AUTHENTICATED }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
