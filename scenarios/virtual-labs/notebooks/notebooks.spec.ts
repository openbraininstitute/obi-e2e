import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { columnFilter } from '@locators/column-filter';
import { entityListing } from '@locators/listing';
import type { Page } from '@playwright/test';

import { COLUMNS, notebooks, notebooksRoute, PROPERTIES } from './locators';

const FIRST_NOTEBOOK = 'Visualize and test synapse mapping';
const FILTERED_NOTEBOOK = 'Circuit registration';

/**
 * What the listing says it holds, e.g. "40 results".
 *
 * Compared as the text rather than as a number, because narrowing the listing
 * only changes it after a pause: a count read too early is the old one, and two
 * early reads agree with each other.
 */
function stated(page: Page) {
  return entityListing(page).resultCount;
}

function count(text: string): number {
  return Number(text.replace(/[^\d]/g, ''));
}

test.describe('Notebooks', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(notebooksRoute(workspace.labId, workspace.projectId));
    await expect(entityListing(page).table).toBeVisible();
    await expect(stated(page)).toContainText(/\d+ results/);
  });

  test('See the notebooks the platform publishes', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = notebooks(page);

    await expect(view.scope('public')).toBeVisible();
    await expect(view.scope('project')).toBeVisible();
    await expect(view.scope('public')).toHaveAttribute('aria-selected', 'true');

    expect(count(await stated(page).innerText())).toBeGreaterThan(0);

    await expect(view.openJupyter).toBeVisible();
  });

  test('The listing shows the same five columns', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });

  test('Searching narrows the notebooks', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);
    const view = notebooks(page);

    await listing.search.fill(FIRST_NOTEBOOK);

    await expect(view.row(FIRST_NOTEBOOK)).toBeVisible();
    await expect(view.row(FILTERED_NOTEBOOK)).toBeHidden();
  });

  test('Clearing the search brings them all back', { tag: AUTHENTICATED }, async ({ page }) => {
    const listing = entityListing(page);
    const view = notebooks(page);

    await listing.search.fill(FIRST_NOTEBOOK);
    await expect(view.row(FILTERED_NOTEBOOK)).toBeHidden();

    await listing.search.fill('');

    await expect(listing.search).toHaveValue('');
    await expect(view.row(FIRST_NOTEBOOK)).toBeVisible();
    await expect(view.row(FILTERED_NOTEBOOK)).toBeVisible();
  });

  test('Filtering by name narrows the notebooks', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = notebooks(page);
    const filter = columnFilter(page);
    const before = await stated(page).innerText();

    await filter.trigger('Name').click();
    await filter.value.fill(FILTERED_NOTEBOOK);
    await filter.apply.click();

    await expect(stated(page)).not.toHaveText(before);
    expect(count(await stated(page).innerText())).toBeLessThan(count(before));
    await expect(view.row(FILTERED_NOTEBOOK)).toBeVisible();
  });

  test(
    'Clearing the name filter brings them all back',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const filter = columnFilter(page);
      const before = await stated(page).innerText();

      await filter.trigger('Name').click();
      await filter.value.fill(FILTERED_NOTEBOOK);
      await filter.apply.click();
      await expect(stated(page)).not.toHaveText(before);

      await filter.trigger('Name').click();
      await filter.reset.click();

      await expect(stated(page)).toHaveText(before);
    }
  );

  test('Opening a notebook shows what it does', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = notebooks(page);

    await view.row(FIRST_NOTEBOOK).click();

    await expect(view.detail.panel).toBeVisible();
    await expect(view.detail.name).toHaveText(FIRST_NOTEBOOK);

    for (const [label, key] of Object.entries(PROPERTIES)) {
      await expect(view.detail.property(key)).toContainText(label);
    }

    await expect(view.detail.cells).toBeVisible();
    await expect(view.detail.download).toBeVisible();
    await expect(view.detail.run).toBeVisible();
    await expect(view.detail.viewDetails).toBeVisible();
  });

  test("Switching to my project's notebooks", { tag: AUTHENTICATED }, async ({ page }) => {
    const view = notebooks(page);
    const listing = entityListing(page);

    await view.scope('project').click();

    await expect(view.scope('project')).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/\/notebooks\//);

    for (const column of COLUMNS) {
      await expect(listing.columnHeader(column)).toBeVisible();
    }
  });
});
