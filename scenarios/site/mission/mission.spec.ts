import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { missionLocators, PURPOSES } from './locators';

test.describe('Mission page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mission');
  });

  test('Open the Mission page', { tag: VISITOR }, async ({ page }) => {
    const mission = missionLocators(page);

    await expect(mission.heading).toBeVisible();
    await expect(mission.headline).toBeVisible();
    await expect(mission.heroImage).toBeVisible();
  });

  test(
    'The page names the four things a virtual lab is for',
    { tag: VISITOR },
    async ({ page }) => {
      const mission = missionLocators(page);

      for (const purpose of PURPOSES) {
        await expect(mission.purpose(purpose)).toBeVisible();
      }
    }
  );

  test('The mission statement can be downloaded', { tag: VISITOR }, async ({ page }) => {
    const mission = missionLocators(page);

    await mission.statement.scrollIntoViewIfNeeded();
    await expect(mission.statement).toBeVisible();
    await expect(mission.statement).toHaveAttribute('href', /\.pdf$/);
  });
});
