import { showAllSpecies } from '@fixtures/choose-species';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.SingleNeuronSimulation);

const PROPERTIES = ['circuit_name', 'legacy_activity_status', 'creation_date', 'lifecycle_status'];

const SECTIONS: string[] = [];

test.use(WIDE_VIEWPORT);

test.describe('Single neuron (legacy) details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await showAllSpecies(page);
    await expect(listing.table).toBeVisible();
    await expect(listing.resultCount).toBeVisible();

    const empty = await listing.resultCount.innerText();
    test.skip(
      empty.startsWith('0 results'),
      'This deployment holds no Single neuron (legacy) to open.'
    );

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test(
    'Open one Single neuron (legacy) beside the listing',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      const view = dataView(page);

      await expect(view.miniName).toBeVisible();
      for (const property of PROPERTIES) {
        await expect(view.miniProperty(property)).toBeVisible();
      }
      await expect(view.miniDownload).toBeVisible();
    }
  );

  test('Open the full Single neuron (legacy) page', { tag: PRIVATE_READONLY }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
