import { routes } from '../../../fixtures/routes';
import { expect, test } from '../../../fixtures/test';
import { entityListing } from '../../../locators/listing';

/**
 * Scenario: scenarios/data/listing-filters/scenario.md
 *
 * The funnel beside each column header is not covered. Clicking it marks the
 * column as filtered but opens no panel under automation, so there is nothing
 * to choose a value from. Reported rather than worked around, because a test
 * that clicked it and asserted nothing would only look like coverage.
 */
test.describe('Filtering a listing', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'cell-morphology'));
    await expect(entityListing(page).cells.first()).toBeVisible();
  });

  test('search narrows the results', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);
    const before = await listing.resultCount.innerText();

    await listing.search.fill('Sst-IRES');

    await expect(listing.resultCount).not.toHaveText(before);
    await expect(listing.cells.first()).toBeVisible();
  });

  test('clearing the search restores it', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);
    const before = await listing.resultCount.innerText();

    await listing.search.fill('Sst-IRES');
    await expect(listing.resultCount).not.toHaveText(before);

    await listing.search.clear();

    await expect(listing.resultCount).toHaveText(before);
  });

  test('a search that matches nothing', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.search.fill('zzzz-no-such-entity');

    await expect(listing.resultCount).toHaveText(/^0 results/);
  });

  test('offers the additional filters', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const listing = entityListing(page);

    await listing.filters.click();

    await expect(listing.advancedFilters).toBeVisible();
    // Each filter is a menu item whose name repeats its own description.
    for (const filter of ['Generation type', 'Strain', 'Subject name']) {
      await expect(
        listing.advancedFilters.getByRole('menuitem', { name: new RegExp(`^${filter}`) })
      ).toBeVisible();
    }
  });

  test(
    'opening a filter reveals its control',
    { tag: ['@private', '@readonly'] },
    async ({ page }) => {
      const listing = entityListing(page);

      await listing.filters.click();
      await listing.advancedFilters.getByRole('menuitem', { name: /^ID/ }).click();

      await expect(listing.advancedFilters.getByRole('textbox')).toBeVisible();
    }
  );
});
