import { showAllSpecies } from '@fixtures/choose-species';
import { entitySlug, ExtendedEntitiesTypeDict as Type } from '@fixtures/entity-types';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { WIDE_VIEWPORT } from '@fixtures/viewport';
import { dataView } from '@locators/data-view';
import { entityListing } from '@locators/listing';

// Scenario: scenarios/data/state-persistence/scenario.md
const SLUG = entitySlug(Type.CellMorphology);
const SEARCH = 'Sst-IRES';

test.use(WIDE_VIEWPORT);

test.describe('What the listing remembers', () => {
  test.beforeEach(async ({ page, workspace }) => {
    const listing = entityListing(page);

    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));

    // The species choice is remembered for the user, so a species left by an
    // earlier test would narrow this listing and be read as its own doing.
    await showAllSpecies(page);
    await expect(listing.cells.first()).toBeVisible();

    // Start from a clean listing: the state under test survives a reload, so a
    // search left by an earlier test would be read as this test's own doing.
    await listing.search.clear();
    await expect(listing.resultCount).toHaveText(/^6,225 results/);
  });

  /** Searches, then opens the first match's details page. */
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

  test('the close button brings it back as it was', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    const filtered = await searchAndOpenOne(page);

    await dataView(page).close.click();
    await page.waitForURL(/browse\/entity/);

    await expect(listing.search).toHaveValue(SEARCH);
    await expect(listing.resultCount).toHaveText(filtered);
  });

  test('the breadcrumb starts it fresh', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    await searchAndOpenOne(page);

    await dataView(page).breadcrumbLink('Morphology').click();
    await page.waitForURL(/browse\/entity/);

    await expect(listing.search).toHaveValue('');
    await expect(listing.resultCount).toHaveText(/^6,225 results/);
  });

  test('leaving the section keeps it', { tag: PRIVATE_READONLY }, async ({ page, workspace }) => {
    const listing = entityListing(page);

    await listing.search.fill(SEARCH);
    await expect(listing.resultCount).not.toHaveText(/^6,225 results/);
    const filtered = await listing.resultCount.innerText();

    await page.goto(`/app/virtual-lab/${workspace.labId}/${workspace.projectId}/workflows`);
    await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, SLUG));

    await expect(listing.search).toHaveValue(SEARCH);
    await expect(listing.resultCount).toHaveText(filtered);
  });

  test('the column layout outlives a fresh start', { tag: PRIVATE_READONLY }, async ({ page }) => {
    const listing = entityListing(page);
    const column = 'Contributors';

    await listing.columns.click();
    await listing.columnToggle(column).click();
    await expect(listing.columnToggle(column)).not.toBeChecked();
    await expect(listing.columnHeader(column)).toBeHidden();

    await searchAndOpenOne(page);
    await dataView(page).breadcrumbLink('Morphology').click();
    await page.waitForURL(/browse\/entity/);

    // The breadcrumb clears the search but not the layout: the two are kept in
    // different places, one for the tab and one for good.
    await expect(listing.search).toHaveValue('');
    await expect(listing.columnHeader(column)).toBeHidden();

    // Put it back, so the next run starts from the same table.
    await listing.columns.click();
    await listing.columnToggle(column).click();
    await expect(listing.columnHeader(column)).toBeVisible();
  });
});
