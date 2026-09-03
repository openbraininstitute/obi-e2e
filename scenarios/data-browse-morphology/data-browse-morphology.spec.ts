import { routes } from '../../fixtures/routes';
import { expect, test } from '../../fixtures/test';
import { dataPage } from '../../locators/data';
import { morphologyListing } from './locators';

// Scenario: scenarios/data-browse-morphology/scenario.md
test.describe('Browse morphologies', () => {
  test(
    'opens the morphology listing from the Data page',
    { tag: ['@private', '@readonly'] },
    async ({ page, workspace }) => {
      const data = dataPage(page);
      const listing = morphologyListing(page);

      await page.goto(routes.data(workspace.labId, workspace.projectId));

      // The page rewrites its own URL to add the scope shortly after loading.
      // Clicking before that lands leaves the rewrite to overwrite the
      // navigation, so wait for both the rewrite and the rendered counters.
      await page.waitForURL(/[?&]s=/);
      await expect(data.typeCounter('cell_morphology')).toBeVisible();

      await data.dataType(/^Morphology/).click();

      await expect(page).toHaveURL(/\/data\/browse\/entity\/cell-morphology/);
      await expect(listing.table).toBeVisible();

      for (const column of ['Brain region', 'Species', 'M-type', 'Name']) {
        await expect(listing.columnHeader(column)).toBeVisible();
      }

      // One header row plus at least one morphology.
      await expect(listing.rows.nth(1)).toBeVisible();
    }
  );

  test(
    'offers filters and column choices',
    { tag: ['@private', '@readonly'] },
    async ({ page, workspace }) => {
      const listing = morphologyListing(page);

      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));

      await expect(listing.toolbar).toBeVisible();
      await expect(listing.filters).toBeVisible();
      await expect(listing.columns).toBeVisible();
    }
  );
});
