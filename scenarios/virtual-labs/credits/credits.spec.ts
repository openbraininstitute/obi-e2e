import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';

import { balanceOf, COST_COLUMN, credits, creditsRoute, HISTORY_COLUMNS } from './locators';

test.describe('Project credits', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(creditsRoute(workspace.labId, workspace.projectId));
    await expect(credits(page).panel).toBeVisible();
  });

  test('See what the lab and the project hold', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = credits(page);

    // Both figures arrive after the page does, so the assertion waits for them.
    await expect(view.panel).toHaveText(balanceOf('Virtual lab credits'));
    await expect(view.panel).toHaveText(balanceOf('Project credits'));
  });

  test('The two ways to add credits are offered', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = credits(page);

    await expect(view.buy).toBeVisible();
    await expect(view.transfer).toBeVisible();
    await expect(view.pricing).toBeVisible();
  });

  test('Pricing opens the public plans in a new tab', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = credits(page);

    const opened = page.waitForEvent('popup');
    await view.pricing.click();
    const plans = await opened;

    await expect(
      plans.getByRole('heading', { name: 'Pricing', exact: true, level: 1 })
    ).toBeVisible();

    await plans.close();
    await expect(view.panel).toBeVisible();
  });

  test('The history says what every credit went on', { tag: AUTHENTICATED }, async ({ page }) => {
    const view = credits(page);

    await expect(view.historyHeading).toBeVisible();
    await expect(view.history).toBeVisible();

    for (const column of HISTORY_COLUMNS) {
      await expect(view.column(column)).toBeVisible();
    }
    await expect(view.history).toContainText(COST_COLUMN);

    /*
     * A project that has just been created has spent nothing, so it has no
     * history to show — the columns above are all there is to check.
     */
    const entries = await view.entries.count();
    test.skip(entries === 0, 'This project has spent nothing yet, so its history is empty.');

    await expect(view.entries.first()).toContainText(/[\d,]+\.\d{2}/);
    await expect(entityListing(page).pagination).toBeVisible();
  });
});
