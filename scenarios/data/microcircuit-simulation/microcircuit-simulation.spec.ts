import { routes } from '../../../fixtures/routes';
import { expect, test } from '../../../fixtures/test';
import { entityListing } from '../../../locators/listing';

// Scenario: scenarios/data/microcircuit-simulation/scenario.md
// Full column names, units included, because several share a prefix:
// "Temperature [°C]" and "Temperature dependent" are different columns.
const COLUMNS = [
  'Name',
  'Description',
  'Circuit',
  'Created by',
  'Registration date',
  'Status',
  'Lifecycle status',
];

// The grid only renders the columns that fit, so a narrow window leaves the
// right-hand ones out of the page entirely. Widen it so the whole table exists.
test.use({ viewport: { width: 2560, height: 1080 } });

test.describe('Microcircuit listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, 'microcircuit-simulation')
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

  test('shows results', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    // Header rows carry the columnheader role, so a gridcell means real data.
    await expect(listing.cells.first()).toBeVisible();
  });

  test(
    'search narrows and clearing restores',
    { tag: ['@private', '@readonly'] },
    async ({ page }) => {
      const listing = entityListing(page);
      await expect(listing.cells.first()).toBeVisible();
      const before = await listing.resultCount.innerText();

      await listing.search.fill('zzzz-no-such-entity');
      await expect(listing.resultCount).toHaveText(/^0 results/);

      await listing.search.clear();
      await expect(listing.resultCount).toHaveText(before);
    }
  );
});
