import { DATA_TYPES, type DataSectionName } from '../../../fixtures/data-types';
import { routes } from '../../../fixtures/routes';
import { expect, test } from '../../../fixtures/test';
import { entityListing } from '../../../locators/listing';

// Scenario: scenarios/data/entity-listing/scenario.md
test.describe('Entity listing', () => {
  for (const section of Object.keys(DATA_TYPES) as DataSectionName[]) {
    for (const type of DATA_TYPES[section]) {
      test(
        `opens the ${type.label} listing (${section})`,
        { tag: ['@private', '@readonly'] },
        async ({ page, workspace }) => {
          const listing = entityListing(page);

          await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, type.slug));

          // The grid renders whether or not the type holds any data, so this
          // catches a listing that fails to build rather than one that is empty.
          await expect(listing.table).toBeVisible();
          await expect(listing.toolbar).toBeVisible();
          await expect(listing.search).toBeVisible();
        }
      );
    }
  }

  test(
    'shows morphology rows and their columns',
    { tag: ['@private', '@readonly'] },
    async ({ page, workspace }) => {
      const listing = entityListing(page);

      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));

      for (const column of ['Brain region', 'Species', 'M-type', 'Name']) {
        await expect(listing.columnHeader(column)).toBeVisible();
      }

      // Header rows carry the columnheader role, so a gridcell means real data.
      await expect(listing.cells.first()).toBeVisible();
    }
  );
});
