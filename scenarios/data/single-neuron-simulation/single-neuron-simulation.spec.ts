import { routes } from '../../../fixtures/routes';
import { expect, test } from '../../../fixtures/test';
import { entityListing } from '../../../locators/listing';

// Scenario: scenarios/data/single-neuron-simulation/scenario.md
// Full column names, units included, because several share a prefix:
// "Temperature [°C]" and "Temperature dependent" are different columns.
const COLUMNS = [
  'Name',
  'ME-model',
  'Stimulus',
  'Response',
  'Injection location',
  'Recording location',
  'Brain region',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

// The grid only renders the columns that fit, so a narrow window leaves the
// right-hand ones out of the page entirely. Widen it so the whole table exists.
test.use({ viewport: { width: 2560, height: 1080 } });

test.describe('Single neuron (legacy) listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, 'single-neuron-simulation')
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
