import { checkFilter } from '@fixtures/check-filter';
import { checkPagination } from '@fixtures/check-pagination';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { toggleCount } from '@fixtures/listing-columns';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { entityListing } from '@locators/listing';

// Scenario: scenarios/data/emodel/scenario.md
// Full column names, units included, because several share a prefix:
// "Temperature [°C]" and "Temperature dependent" are different columns.
const COLUMNS = [
  'Name',
  'Response',
  'Brain region',
  'Species',
  'M-type',
  'E-type',
  'Morphology',
  'Model cumulated score',
  'Contributors',
  'Registration date',
];

// The columns the chooser shows as on, and the ones it shows as off. Listing
// both locks the table's shape: a column added to either side fails the guard.
const SHOWN_COLUMNS = [
  'Name',
  'Response',
  'Brain region',
  'Species',
  'M-type',
  'E-type',
  'Morphology',
  'Model cumulated score',
  'Contributors',
  'Registration date',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = ['Segmented spines', 'Ion channel models', 'Strain'];

const FILTERS = [
  'Name',
  'Brain region',
  'Species',
  'M-type',
  'E-type',
  'Morphology',
  'Model cumulated score',
  'Contributors',
  'Registration date',
  'Lifecycle status',
];

test.use(WIDE_VIEWPORT);

test.describe('E-model listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, entitySlug(Type.Emodel))
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

  test('adds a hidden column to the table', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.columns.click();
    await expect(listing.columnsMenu).toBeVisible();

    // Free the width first. A wide table renders only the columns that fit,
    // so a newly added one can land outside the window and look like it never
    // arrived. Two columns are enough to keep the grid alive.
    for (const column of SHOWN_COLUMNS.slice(2)) {
      await listing.columnToggle(column).click();
    }

    for (const column of HIDDEN_COLUMNS) {
      const toggle = listing.columnToggle(column);

      // Click and assert, rather than check(), because the chooser re-renders
      // as the grid rebuilds and check() reads the state back too early.
      await toggle.click();
      await expect(toggle).toBeChecked();
      await expect(listing.columnHeader(column)).toBeVisible();

      await toggle.click();
      await expect(toggle).not.toBeChecked();
    }
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

  test('every filter narrows the listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    await expect(entityListing(page).table).toBeVisible();

    // One step per column, so a failure names the filter that broke.
    for (const column of FILTERS) {
      await test.step(column, () => checkFilter(page, column));
    }
  });

  test('pages through the listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    await checkPagination(page);
  });
});
