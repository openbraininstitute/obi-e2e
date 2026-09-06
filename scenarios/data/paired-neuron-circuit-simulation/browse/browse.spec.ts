import { checkFilter } from '@fixtures/checks/filter';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { toggleCount } from '@fixtures/steps/listing-columns';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { entityListing } from '@locators/listing';

const COLUMNS = [
  'Name',
  'Description',
  'Circuit',
  'Created by',
  'Registration date',
  'Status',
  'Lifecycle status',
];

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

const FILTERS = ['Name', 'Circuit', 'Created by', 'Registration date', 'Lifecycle status'];

test.use(WIDE_VIEWPORT);

test.describe('Paired neurons listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(
        workspace.labId,
        workspace.projectId,
        entitySlug(Type.PairedNeuronCircuitSimulation)
      )
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('See the Paired neurons table', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Paired neurons table offers no columns beyond these',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      const listing = entityListing(page);

      await listing.columns.click();
      await expect(listing.columnsMenu).toBeVisible();

      for (const column of SHOWN_COLUMNS) {
        await expect(listing.columnToggle(column)).toBeChecked();
      }
      for (const column of HIDDEN_COLUMNS) {
        await expect(listing.columnToggle(column)).not.toBeChecked();
      }

      await expect(listing.columnToggles).toHaveCount(toggleCount(SHOWN_COLUMNS, HIDDEN_COLUMNS));
    }
  );

  test('See the Paired neurons results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toHaveText(/^0 results/);
    await expect(listing.toolbar).toBeVisible();
  });

  test(
    'Every Paired neurons filter narrows the listing',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      test.slow();
      await expect(entityListing(page).table).toBeVisible();

      for (const column of FILTERS) {
        await test.step(column, () => checkFilter(page, column));
      }
    }
  );
});
