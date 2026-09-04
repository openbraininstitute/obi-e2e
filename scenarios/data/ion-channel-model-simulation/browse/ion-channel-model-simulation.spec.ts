import { checkFilter } from '@fixtures/check-filter';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { toggleCount } from '@fixtures/listing-columns';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { entityListing } from '@locators/listing';

// Scenario: scenarios/data/ion-channel-model-simulation/scenario.md
// Full column names, units included, because several share a prefix:
// "Temperature [°C]" and "Temperature dependent" are different columns.
const COLUMNS = [
  'Name',
  'Description',
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
  'Created by',
  'Registration date',
  'Status',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = [];

const FILTERS = ['Name', 'Created by', 'Registration date', 'Lifecycle status'];

test.use(WIDE_VIEWPORT);

test.describe('Ion channel listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(
        workspace.labId,
        workspace.projectId,
        entitySlug(Type.IonChannelModelSimulation)
      )
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('shows its own columns', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
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
    await expect(listing.columnToggles).toHaveCount(toggleCount(SHOWN_COLUMNS, HIDDEN_COLUMNS));
  });

  test('shows an empty listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    // Nothing of this type exists yet. The listing still has to build, so this
    // catches a broken page rather than an empty one.
    await expect(listing.resultCount).toHaveText(/^0 results/);
    await expect(listing.toolbar).toBeVisible();
  });

  test('every filter narrows the listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    await expect(entityListing(page).table).toBeVisible();

    // One step per column, so a failure names the filter that broke.
    for (const column of FILTERS) {
      await test.step(column, () => checkFilter(page, column));
    }
  });
});
