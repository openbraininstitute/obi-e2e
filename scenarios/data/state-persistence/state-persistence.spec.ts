import { showAllSpecies } from '@fixtures/choose-species';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { setColumn } from '@fixtures/listing-columns';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

const SLUG = entitySlug(Type.CellMorphology);
const SEARCH = 'Sst-IRES';

test.use(WIDE_VIEWPORT);

test.describe('What the listing remembers', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));

    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(/^6,225 results/);
  });

  async function searchAndOpenOne(page: Parameters<typeof dataView>[0]) {
    const listing = entityListing(page);
    const view = dataView(page);

    await listing.search.fill(SEARCH);
    await expect(listing.resultCount).not.toHaveText(/^6,225 results/);
    const filtered = await listing.resultCount.innerText();

    await listing.cells
      .filter({ hasText: new RegExp(SEARCH) })
      .first()
      .click();
    await view.viewDetails.click();
    await page.waitForURL(/\/data\/view\//);

    return filtered;
  }

  test(
    'The close button brings the listing back as it was',
    { tag: PRIVATE_READONLY },
    async ({ page }) => {
      const listing = entityListing(page);
      const filtered = await searchAndOpenOne(page);

      await dataView(page).close.click();
      await page.waitForURL(/browse\/entity/);

      await expect(listing.search).toHaveValue(SEARCH);
      await expect(listing.resultCount).toHaveText(filtered);
    }
  );

  test('The breadcrumb starts the listing fresh', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    await searchAndOpenOne(page);

    await dataView(page).breadcrumbLink('Morphology').click();
    await page.waitForURL(/browse\/entity/);

    await expect(listing.search).toHaveValue('');
    await expect(listing.resultCount).toHaveText(/^6,225 results/);
  });

  test(
    'Leaving the section keeps the listing as it was',
    { tag: PRIVATE_READONLY },
    async ({ page, workspace }) => {
      const listing = entityListing(page);

      await listing.search.fill(SEARCH);
      await expect(listing.resultCount).not.toHaveText(/^6,225 results/);
      const filtered = await listing.resultCount.innerText();

      await page.goto(`/app/virtual-lab/${workspace.labId}/${workspace.projectId}/workflows`);
      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));

      await expect(listing.search).toHaveValue(SEARCH);
      await expect(listing.resultCount).toHaveText(filtered);
    }
  );

  test('The column layout outlives a fresh start', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    const column = 'Contributors';

    await setColumn(page, column, false);
    await expect(listing.columnToggle(column)).not.toBeChecked();
    await expect(listing.columnHeader(column)).toBeHidden();

    await searchAndOpenOne(page);
    await dataView(page).breadcrumbLink('Morphology').click();
    await page.waitForURL(/browse\/entity/);

    await expect(listing.search).toHaveValue('');
    await expect(listing.columnHeader(column)).toBeHidden();

    await setColumn(page, column, true);
    await expect(listing.columnHeader(column)).toBeVisible();
  });
});
