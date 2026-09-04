import { showAllSpecies } from '@fixtures/choose-species';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

// Scenario: scenarios/data/me-model-circuit-simulation/view/scenario.md
const SLUG = 'me-model-circuit-simulation';

/** Every property the panel shows for this type, named as the application names it. */
const PROPERTIES = ['circuit_name', 'legacy_activity_status', 'creation_date', 'lifecycle_status'];

/**
 * The page's structure: its tabs and the blocks of the configuration. The
 * controls inside them and the run status are state, not structure, so they
 * change with the record and are left out.
 */
const SECTIONS = [
  'scan-config-tab-configuration',
  'scan-config-tab-simulations',
  'scan-config-root-element-info',
  'scan-config-root-element-initialize',
  'scan-config-root-element-morphology_locations',
  'scan-config-root-element-stimuli',
  'scan-config-root-element-recordings',
  'scan-config-root-element-neuronal_manipulations',
  'scan-config-root-element-timestamps',
];

test.use(WIDE_VIEWPORT);

test.describe('Single neuron details', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));
    // The species choice is remembered for the user, so one left behind by an
    // earlier test would empty this listing and leave no row to open.
    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    await listing.cells.filter({ hasText: /\S/ }).first().click();
    await expect(dataView(page).viewDetails).toBeVisible();
  });

  test('opens one beside the listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const view = dataView(page);

    await expect(view.miniName).toBeVisible();
    for (const property of PROPERTIES) {
      await expect(view.miniProperty(property)).toBeVisible();
    }
    await expect(view.miniDownload).toBeVisible();
  });

  test('opens the full page', { tag: PRIVATE_READONLY }, async ({ page }) => {
    // The page draws its own viewers, which take a while under load.
    test.slow();
    const view = dataView(page);

    await view.viewDetails.click();
    await expect(page).toHaveURL(new RegExp(`/data/view/${SLUG}/[0-9a-f-]+/`));

    for (const name of SECTIONS) {
      // First match: a few of these name a control the page repeats rather
      // than a section it shows once.
      await expect(view.section(name).first()).toBeVisible();
    }
  });
});
