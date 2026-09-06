import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { showAllSpecies } from '@fixtures/steps/choose-species';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.SmallMicrocircuitSimulation);

const PROPERTIES = ['circuit_name', 'legacy_activity_status', 'creation_date', 'lifecycle_status'];

const TABS = ['scan-config-tab-configuration', 'scan-config-tab-simulations'];

const SECTIONS = [
  'scan-config-root-element-info',
  'scan-config-root-element-initialize',
  'scan-config-root-element-neuron_sets',
  'scan-config-root-element-morphology_locations',
  'scan-config-root-element-stimuli',
  'scan-config-root-element-recordings',
  'scan-config-root-element-distributions',
  'scan-config-root-element-neuronal_manipulations',
  'scan-config-root-element-synaptic_manipulations',
  'scan-config-root-element-timestamps',
];

test.use(WIDE_VIEWPORT);

test.describe('Small microcircuit details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test(
    'Open one Small microcircuit beside the listing',
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

  test('Open the full Small microcircuit page', { tag: PRIVATE_READONLY }, async ({ page }) => {
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of TABS) {
      await expect(view.section(name).first()).toBeVisible();
    }

    await view.section('scan-config-tab-configuration').first().click();

    for (const name of SECTIONS) {
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
