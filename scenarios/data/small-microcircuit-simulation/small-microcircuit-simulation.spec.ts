import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';

// Scenario: scenarios/data/small-microcircuit-simulation/scenario.md
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

// The columns the chooser shows as on, and the ones it shows as off. Listing
// both locks the table's shape: a column added to either side fails the guard.
const SHOWN_COLUMNS = [
  'Name',
  'Description',
  'Circuit',
  'Created by',
  'Registration date',
  'Status',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = [];

// The chooser adds its own "Select all" alongside one toggle per column.
const TOGGLE_COUNT = SHOWN_COLUMNS.length + HIDDEN_COLUMNS.length + 1;

function startsWith(column: string): RegExp {
  return new RegExp(`^${column.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

// The grid only renders the columns that fit, so a narrow window leaves the
// right-hand ones out of the page entirely. Widen it so the whole table exists.
test.use({ viewport: { width: 2560, height: 1080 } });

test.describe('Small microcircuit listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, 'small-microcircuit-simulation')
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('shows its own columns', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(startsWith(column))).toBeVisible();
    }
  });

  test('offers exactly these columns', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.columns.click();
    await expect(listing.columnsMenu).toBeVisible();

    for (const column of SHOWN_COLUMNS) {
      await expect(listing.columnToggle(column)).toBeChecked();
    }
    for (const column of HIDDEN_COLUMNS) {
      await expect(listing.columnToggle(column)).not.toBeChecked();
    }

    // Anything added to this table fails here rather than passing unnoticed.
    await expect(listing.columnToggles).toHaveCount(TOGGLE_COUNT);
  });

  test('shows results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    // Header rows carry the columnheader role, so a gridcell means real data.
    await expect(listing.cells.first()).toBeVisible();
  });

  test('search narrows and clearing restores', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    await expect(listing.cells.first()).toBeVisible();
    const before = await listing.resultCount.innerText();

    await listing.search.fill('zzzz-no-such-entity');
    await expect(listing.resultCount).toHaveText(/^0 results/);

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(before);
  });
});
