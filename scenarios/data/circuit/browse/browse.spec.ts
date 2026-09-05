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
  'Subcircuits',
  'Description',
  'Brain region',
  'Species',
  'Scale',
  'Number of neurons',
  'Number of synapses',
  'Number of connections',
  'Build category',
];

const SHOWN_COLUMNS = [
  'Name',
  'Subcircuits',
  'Description',
  'Brain region',
  'Species',
  'Scale',
  'Number of neurons',
  'Number of synapses',
  'Number of connections',
  'Build category',
  'Target simulator',
  'Derivation type',
  'Published in',
  'Experiment date',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = [
  'Has morphologies',
  'Has point neurons',
  'Has electrical cell models',
  'Has spines',
  'Strain',
  'Subject name',
  'Contributors',
];

const FILTERS = [
  'Name',
  'Brain region',
  'Species',
  'Scale',
  'Number of neurons',
  'Number of synapses',
  'Number of connections',
  'Build category',
  'Target simulator',
  'Derivation type',
  'Published in',
  'Experiment date',
];

test.use(WIDE_VIEWPORT);

test.describe('Circuit listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, entitySlug(Type.Circuit))
    );
    await expect(entityListing(page).table).toBeVisible();
  });

  test('See the Circuit table', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Circuit table offers no columns beyond these',
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

  test('Add a hidden column to the Circuit table', { tag: PRIVATE_READONLY }, async ({ page }) => {
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
  });

  test('See the Circuit results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    await expect(listing.cells.first()).toBeVisible();
  });

  test('Search the Circuit listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    await expect(listing.cells.first()).toBeVisible();
    const before = await listing.resultCount.innerText();

    await listing.search.fill('zzzz-no-such-entity');
    await expect(listing.resultCount).toHaveText(/^0 results/);

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(before);
  });

  test('Every Circuit filter narrows the listing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    test.slow();
    await expect(entityListing(page).table).toBeVisible();

    for (const column of FILTERS) {
      await test.step(column, () => checkFilter(page, column));
    }
  });

  test(
    'Switch between the flat and hierarchy views',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      const listing = entityListing(page);
      const subcircuits = listing.columnHeader('Subcircuits');
      const lifecycle = listing.columnHeader('Lifecycle status');

      await expect(subcircuits).toBeVisible();

      await listing.viewToggle.click();
      await expect(subcircuits).toBeHidden();
      await expect(lifecycle).toBeVisible();

      await listing.viewToggle.click();
      await expect(subcircuits).toBeVisible();
    }
  );
});
