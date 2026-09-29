import { clickUntil } from '@fixtures/interactions';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { assistant, projectRoute, suggestions } from './locators';

test.describe('OBI Assistant', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(projectRoute(workspace.labId, workspace.projectId));
    await expect(assistant(page).open).toBeVisible();
  });

  test('Open the assistant panel', { tag: AUTHENTICATED }, async ({ page }) => {
    const panel = assistant(page);

    await clickUntil(panel.open, panel.question);

    await expect(panel.heading.first()).toBeVisible();
    await expect(panel.question).toBeVisible();
    await expect(panel.invitation).toBeVisible();
    await expect(panel.send).toBeVisible();
  });

  test('The panel suggests questions to start from', { tag: AUTHENTICATED }, async ({ page }) => {
    const panel = assistant(page);

    await clickUntil(panel.open, panel.question);

    // The panel fetches its suggestions once it opens, so they can arrive after it.
    await expect.poll(async () => (await suggestions(page)).length).toBeGreaterThan(0);
    const suggested = await suggestions(page);
    for (const question of suggested) {
      expect(question.trim()).not.toBe('');
    }

    await expect(panel.history).toBeVisible();
    await expect(panel.newChat).toBeVisible();
  });

  test('Close the assistant panel', { tag: AUTHENTICATED }, async ({ page }) => {
    const panel = assistant(page);

    await clickUntil(panel.open, panel.question);

    await panel.collapse.click();

    await expect(panel.question).toBeHidden();
    await expect(page.getByTestId('project-main-content')).toBeVisible();
  });
});
