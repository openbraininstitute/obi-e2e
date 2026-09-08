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

const SHOWN_COLUMNS = [
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

const HIDDEN_COLUMNS: string[] = [];

const FILTERS = [
  'Name',
  'ME-model',
  'Brain region',
  'Created by',
  'Registration date',
  'Lifecycle status',
];

test.use(WIDE_VIEWPORT);

test.describe('Single neuron (legacy) listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(
        workspace.labId,
        workspace.projectId,
        entitySlug(Type.SingleNeuronSimulation)
      )
    );
    await expectListing(page);
  });

  test('See the Single neuron (legacy) table', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Single neuron (legacy) table offers no columns beyond these',
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

  test('See the Single neuron (legacy) results', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toHaveText(/^0 results/);
    await expect(listing.toolbar).toBeVisible();
  });

  test(
    'Every Single neuron (legacy) filter narrows the listing',
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
