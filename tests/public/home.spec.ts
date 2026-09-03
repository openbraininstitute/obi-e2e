import { expect, test } from '../../fixtures/test';
import { HomePage } from '../../pages/home.page';

// Scenario: specs/home.md — "Open the home page".
test.describe('Home page', () => {
  test('shows the landing page and a way to log in @smoke @readonly', async ({ page }) => {
    const home = new HomePage(page);

    await home.goto();

    await expect(home.heroHeading).toBeVisible();
    await expect(home.loginLink).toBeVisible();
    await expect(home.virtualLabsLink).toBeVisible();
  });
});
