import { routes } from '../../../fixtures/routes';
import { expect, test } from '../../../fixtures/test';
import { entityListing } from '../../../locators/listing';

// Scenario: scenarios/data/single-neuron-synaptome-simulation/scenario.md
// Full column names, units included, because several share a prefix:
// "Temperature [°C]" and "Temperature dependent" are different columns.
const COLUMNS = [
  'Name',
  'Description',
  'Stimulus',
  'Response',
  'Synaptome name',
  'Brain region',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

// The grid only renders the columns that fit, so a narrow window leaves the
// right-hand ones out of the page entirely. Widen it so the whole table exists.
test.use({ viewport: { width: 2560, height: 1080 } });

test.describe('Synaptome (legacy) listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, 'single-neuron-synaptome-simulation')
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('shows its own columns', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(
        listing.columnHeader(new RegExp(`^${column.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
      ).toBeVisible();
    }
  });

  test('shows an empty listing', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);

    // Nothing of this type exists yet. The listing still has to build, so this
    // catches a broken page rather than an empty one.
    await expect(listing.resultCount).toHaveText(/^0 results/);
    await expect(listing.toolbar).toBeVisible();
  });
});
