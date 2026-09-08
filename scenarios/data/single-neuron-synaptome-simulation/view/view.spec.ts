import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.SingleNeuronSynaptomeSimulation);

const PROPERTIES = ['circuit_name', 'legacy_activity_status', 'creation_date', 'lifecycle_status'];

const SECTIONS: string[] = [];

test.use(WIDE_VIEWPORT);

test.describe('Synaptome (legacy) simulation details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await expect(listing.table).toBeVisible();
    await expect(listing.resultCount).toBeVisible();

    const empty = await listing.resultCount.innerText();
    test.skip(
      empty.startsWith('0 results'),
      'This deployment holds no Synaptome (legacy) to open.'
    );

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test(
    'Open one Synaptome (legacy) beside the listing',
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

  test('Open the full Synaptome (legacy) page', { tag: AUTHENTICATED }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
