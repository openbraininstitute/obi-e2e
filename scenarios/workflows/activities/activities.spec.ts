import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';

import { activityFilters, BUILD_TYPES, CATEGORY_OPTIONS, SIMULATE_TYPES } from './locators';

test.describe('Workflow activities', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.workflows(workspace.labId, workspace.projectId));
    await expect(activityFilters(page).table).toBeVisible();
  });

  test('Both pickers are offered above the table', { tag: AUTHENTICATED }, async ({ page }) => {
    const filters = activityFilters(page);
    const listing = entityListing(page);

    await expect(filters.category).toBeVisible();
    await expect(filters.type).toBeVisible();
    await expect(listing.search).toBeVisible();
    await expect(listing.filters).toBeVisible();
  });

  test(
    'The category picker offers all five categories',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const filters = activityFilters(page);

      await filters.category.click();

      await expect(filters.options).toHaveCount(CATEGORY_OPTIONS.length);
      for (const category of CATEGORY_OPTIONS) {
        await expect(filters.option(category)).toBeVisible();
      }
    }
  );

  test(
    'The type picker offers the types of the chosen category',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const filters = activityFilters(page);

      await expect(filters.category).toHaveText('Build');
      await filters.type.click();

      for (const { group, type } of BUILD_TYPES) {
        await expect(filters.group(group)).toBeVisible();
        await expect(
          filters.group(group).getByRole('option', { name: type, exact: true })
        ).toBeVisible();
      }
    }
  );

  test(
    'Choosing another category changes the type picker',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const filters = activityFilters(page);

      await expect(filters.category).toHaveText('Build');
      const wasType = await filters.type.innerText();

      await filters.category.click();
      await filters.option('Simulate').click();

      await expect(filters.category).toHaveText('Simulate');
      await expect(filters.table).toBeVisible();

      const nowType = (await filters.type.innerText()).trim();
      expect(SIMULATE_TYPES).toContain(nowType);
      expect(nowType).not.toBe(wasType.trim());
    }
  );

  test('An activity offers what can be done with it', { tag: AUTHENTICATED }, async ({ page }) => {
    const filters = activityFilters(page);

    // The table heads itself with two rows, so an entry is a row holding cells.
    const entries = filters.table.getByRole('row').filter({ has: page.getByRole('gridcell') });
    const count = await entries.count();
    test.skip(count === 0, 'This project has launched nothing, so there is no activity to act on.');

    const first = entries.first();
    await first.click();

    const actions = first.getByTestId(/^workflow-activity-action-/);
    await expect(actions.first()).toBeVisible();
  });
});
