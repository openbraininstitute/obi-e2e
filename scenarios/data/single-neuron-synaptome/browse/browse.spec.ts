import { checkFilter } from '@fixtures/check-filter';
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
  'ME-model',
  'M-type',
  'E-type',
  'Brain region',
  'Species',
  'Created by',
  'Registration date',
];

const SHOWN_COLUMNS = [
  'Name',
  'Description',
  'ME-model',
  'M-type',
  'E-type',
  'Brain region',
  'Species',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = ['ME-model validation status', 'Contributors'];

const FILTERS = [
  'Name',
  'ME-model',
  'M-type',
  'E-type',
  'Brain region',
  'Species',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

test.use(WIDE_VIEWPORT);

test.describe('Synaptome (legacy) listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(
        workspace.labId,
        workspace.projectId,
        entitySlug(Type.SingleNeuronSynaptome)
      )
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('See the Synaptome (legacy) table', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Synaptome (legacy) table offers no columns beyond these',
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

  test(
    'Add a hidden column to the Synaptome (legacy) table',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      const listing = entityListing(page);

      await listing.columns.click();
      await expect(listing.columnsMenu).toBeVisible();

      for (const column of SHOWN_COLUMNS.slice(2)) {
        await listing.columnToggle(column).click();
      }

      for (const column of HIDDEN_COLUMNS) {
        const toggle = listing.columnToggle(column);

        await toggle.click();
        await expect(toggle).toBeChecked();
        await expect(listing.columnHeader(column)).toBeVisible();

        await toggle.click();
        await expect(toggle).not.toBeChecked();
      }
    }
  );

  test('See the Synaptome (legacy) results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    await expect(listing.cells.first()).toBeVisible();
  });

  test('Search the Synaptome (legacy) listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    await expect(listing.cells.first()).toBeVisible();
    const before = await listing.resultCount.innerText();

    await listing.search.fill('zzzz-no-such-entity');
    await expect(listing.resultCount).toHaveText(/^0 results/);

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(before);
  });

  test(
    'Every Synaptome (legacy) filter narrows the listing',
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
