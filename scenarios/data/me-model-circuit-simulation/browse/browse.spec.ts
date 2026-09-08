import { checkFilter } from '@fixtures/checks/filter';
import { expectListing } from '@fixtures/checks/listing';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { toggleCount } from '@fixtures/steps/listing-columns';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { entityListing } from '@locators/listing';

const COLUMNS = [
  'Name',
  'Description',
  'ME-model',
  'Created by',
  'Species',
  'Registration date',
  'Status',
  'Lifecycle status',
];

const SHOWN_COLUMNS = [
  'Name',
  'Description',
  'ME-model',
  'Created by',
  'Species',
  'Registration date',
  'Status',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = [];

const FILTERS = ['Name', 'ME-model', 'Created by', 'Registration date', 'Lifecycle status'];

test.use(WIDE_VIEWPORT);

test.describe('Single neuron listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(
        workspace.labId,
        workspace.projectId,
        entitySlug(Type.MemodelCircuitSimulation)
      )
    );
    await expectListing(page);
  });

  test('See the Single neuron table', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Single neuron table offers no columns beyond these',
    { tag: AUTHENTICATED },
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

  test('See the Single neuron results', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    await expect(listing.cells.first()).toBeVisible();
  });

  test('Search the Single neuron listing', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);
    await expect(listing.cells.first()).toBeVisible();
    const before = await listing.resultCount.innerText();

    await listing.search.fill('zzzz-no-such-entity');
    await expect(listing.resultCount).toHaveText(/^0 results/);

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(before);
  });

  test(
    'Every Single neuron filter narrows the listing',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      test.slow();
      await expectListing(page);

      for (const column of FILTERS) {
        await test.step(column, () => checkFilter(page, column));
      }
    }
  );
});
