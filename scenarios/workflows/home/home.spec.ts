import { clickUntil } from '@fixtures/interactions';
import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { workflowsHub } from '@locators/workflows';

import { ACTIVITY_COLUMNS, activityTable, CATEGORIES, TYPES, workflowType } from './locators';

test.describe('Workflows page', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.workflows(workspace.labId, workspace.projectId));
    await expect(workflowsHub(page).categoryMenu).toBeVisible();
  });

  test('See what the project can do', { tag: AUTHENTICATED }, async ({ page }) => {
    const hub = workflowsHub(page);

    for (const category of CATEGORIES) {
      await expect(hub.category(category)).toBeVisible();
    }
  });

  test('Build offers the models it can make', { tag: AUTHENTICATED }, async ({ page }) => {
    const hub = workflowsHub(page);

    // Choosing a category is a navigation, and the types arrive with the page.
    await clickUntil(hub.category('build'), hub.typeMenu('build'));
    await expect(page).toHaveURL(/activity=build/);

    for (const { label, type } of TYPES.build) {
      const card = workflowType(page, type);
      await expect(card).toBeVisible();
      await expect(card).toContainText(label);
    }
  });

  test('Simulate offers the models it can run', { tag: AUTHENTICATED }, async ({ page }) => {
    const hub = workflowsHub(page);

    await clickUntil(hub.category('simulate'), hub.typeMenu('simulate'));
    await expect(page).toHaveURL(/activity=simulate/);

    for (const { label, type } of TYPES.simulate) {
      const card = workflowType(page, type);
      await expect(card).toBeVisible();
      await expect(card).toContainText(label);
    }
  });

  test(
    'What the project has done already is listed underneath',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const activities = activityTable(page);

      await expect(activities.table).toBeVisible();
      await expect(activities.filters).toBeVisible();
      await expect(activities.filters).toContainText('Build');

      for (const column of ACTIVITY_COLUMNS) {
        await expect(activities.column(column)).toBeVisible();
      }
    }
  );
});
