import { PUBLIC_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { navigation } from '@locators/navigation';

import { homeLocators } from './locators';

test.describe('Home page', () => {
  test('shows the landing page and a way to log in', { tag: PUBLIC_READONLY }, async ({ page }) => {
    const home = homeLocators(page);
    const nav = navigation(page);

    await page.goto('/');

    await expect(home.heroHeading).toBeVisible();
    await expect(nav.login).toBeVisible();
    await expect(nav.virtualLabs).toBeVisible();
  });
});
