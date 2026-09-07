import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { navigation } from '@locators/navigation';

import { homeLocators } from './locators';

test.describe('Home page', () => {
  test('Open the home page', { tag: VISITOR }, async ({ page }) => {
    const home = homeLocators(page);
    const nav = navigation(page);

    await page.goto('/');

    await expect(home.heroHeading).toBeVisible();
    await expect(nav.login).toBeVisible();
    await expect(nav.virtualLabs).toBeVisible();
  });
});
