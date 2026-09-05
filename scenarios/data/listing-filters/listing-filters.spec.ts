import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';

test.describe('Filtering a listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(
      routes.dataEntity(workspace.labId, workspace.projectId, entitySlug(Type.CellMorphology))
    );
    await expect(entityListing(page).cells.first()).toBeVisible();
  });

  test('Search narrows the results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    const before = await listing.resultCount.innerText();

    await listing.search.fill('Sst-IRES');

    await expect(listing.resultCount).not.toHaveText(before);
    await expect(listing.cells.first()).toBeVisible();
  });

  test('Clearing the search restores the results', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    const before = await listing.resultCount.innerText();

    await listing.search.fill('Sst-IRES');
    await expect(listing.resultCount).not.toHaveText(before);

    await listing.search.clear();

    await expect(listing.resultCount).toHaveText(before);
  });

  test('A search that matches nothing', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.search.fill('zzzz-no-such-entity');

    await expect(listing.resultCount).toHaveText(/^0 results/);
  });

  test('The additional filters are offered', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.filters.click();

    await expect(listing.advancedFilters).toBeVisible();
    for (const filter of ['Generation type', 'Strain', 'Subject name']) {
      await expect(
        listing.advancedFilters.getByRole('menuitem', { name: new RegExp(`^${filter}`) })
      ).toBeVisible();
    }
  });

  test('Opening a filter shows its control', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.filters.click();
    await listing.advancedFilters.getByRole('menuitem', { name: /^ID/ }).click();

    await expect(listing.advancedFilters.getByRole('textbox')).toBeVisible();
  });
});
