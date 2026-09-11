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

    await hub.category('build').click();

    // Choosing a category is a navigation, and the types arrive with the page.
    await page.waitForURL(/activity=build/);
    await expect(hub.typeMenu('build')).toBeVisible();

    for (const { label, type } of TYPES.build) {
      const card = workflowType(page, type);
      await expect(card).toBeVisible();
      await expect(card).toContainText(label);
    }
  });

  test('Simulate offers the models it can run', { tag: AUTHENTICATED }, async ({ page }) => {
    const hub = workflowsHub(page);

    await hub.category('simulate').click();

    await page.waitForURL(/activity=simulate/);
    await expect(hub.typeMenu('simulate')).toBeVisible();

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
