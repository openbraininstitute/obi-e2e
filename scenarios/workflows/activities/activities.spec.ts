import { clickUntil } from '@fixtures/interactions';
import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';
import { workflowsHub } from '@locators/workflows';

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
    'The category picker offers all six categories',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const filters = activityFilters(page);

      // core-web-app #1968 took Extract out from behind its feature flag; a
      // deployment older than that (staging, until it catches up) offers five.
      const extract = workflowsHub(page).category('extract');
      await expect(workflowsHub(page).category('build')).toBeVisible();
      test.skip(
        (await extract.count()) === 0,
        'Extract is still behind a feature flag on this deployment (ungated by core-web-app #1968).'
      );

      await clickUntil(filters.category, filters.options.first());

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
      await clickUntil(filters.type, filters.options.first());

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

      await clickUntil(filters.category, filters.option('Simulate'));
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
