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
  'Brain region',
  'Species',
  'M-type',
  'Mean ± STD [µm⁻¹]',
  'SEM',
  'N° of Measurements',
  'Contributors',
  'Lifecycle status',
];

const SHOWN_COLUMNS = [
  'Brain region',
  'Species',
  'M-type',
  'Mean ± STD',
  'SEM',
  'N° of Measurements',
  'Contributors',
  'Lifecycle status',
];

const HIDDEN_COLUMNS: string[] = ['Name', 'Strain', 'Subject name'];

const FILTERS = ['Brain region', 'Species', 'M-type', 'Contributors', 'Lifecycle status'];

test.use(WIDE_VIEWPORT);

test.describe('Bouton density listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(
        workspace.labId,
        workspace.projectId,
        entitySlug(Type.ExperimentalBoutonDensity)
      )
    );
    await expectListing(page);
  });

  test('See the Bouton density table', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test(
    'The Bouton density table offers no columns beyond these',
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

  test(
    'Add a hidden column to the Bouton density table',
    { tag: AUTHENTICATED },
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

  test('See the Bouton density results', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    await expect(listing.resultCount).toBeVisible();
    await expect(listing.cells.first()).toBeVisible();
  });

  test('Search the Bouton density listing', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);
    await expect(listing.cells.first()).toBeVisible();
    const before = await listing.resultCount.innerText();

    await listing.search.fill('zzzz-no-such-entity');
    await expect(listing.resultCount).toHaveText(/^0 results/);

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(before);
  });

  test(
    'Every Bouton density filter narrows the listing',
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
