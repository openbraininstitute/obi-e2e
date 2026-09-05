import { checkFilter } from '@fixtures/check-filter';
import { checkPagination } from '@fixtures/check-pagination';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { toggleCount } from '@fixtures/listing-columns';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { entityListing } from '@locators/listing';

const COLUMNS = [
  'Name',
  'Description',
  'Brain region',
  'Species',
  'Scale',
  'Number of neurons',
  'Number of synapses',
  'Number of connections',
  'Target simulator',
  'Created by',
];

const SHOWN_COLUMNS = [
  'Name',
  'Description',
  'Brain region',
  'Species',
  'Scale',
  'Number of neurons',
  'Number of synapses',
  'Number of connections',
  'Target simulator',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = [];

const FILTERS = [
  'Name',
  'Brain region',
  'Species',
  'Number of neurons',
  'Number of synapses',
  'Number of connections',
  'Target simulator',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

test.use(WIDE_VIEWPORT);

test.describe('Synaptome listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, entitySlug(Type.SingleNeuronCircuit))
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('See the Synaptome table', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Synaptome table offers no columns beyond these',
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

  test('See the Synaptome results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    await expect(listing.cells.first()).toBeVisible();
  });

  test('Search the Synaptome listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    await expect(listing.cells.first()).toBeVisible();
    const before = await listing.resultCount.innerText();

    await listing.search.fill('zzzz-no-such-entity');
    await expect(listing.resultCount).toHaveText(/^0 results/);

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(before);
  });

  test(
    'Every Synaptome filter narrows the listing',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      test.slow();
      await expect(entityListing(page).table).toBeVisible();

      for (const column of FILTERS) {
        await test.step(column, () => checkFilter(page, column));
      }
    }
  );

  test('Page through the Synaptome listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    await checkPagination(page);
  });
});
