import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { contactLocators } from './locators';

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('Open the Contact page', { tag: VISITOR }, async ({ page }) => {
    const contact = contactLocators(page);

    await expect(contact.heading).toBeVisible();
    await expect(contact.getInTouch).toBeVisible();
  });

  test('Both contact addresses are offered', { tag: VISITOR }, async ({ page }) => {
    const contact = contactLocators(page);

    await expect(contact.mailLinks).toHaveCount(2);
    await expect(contact.support).toHaveCount(1);
    await expect(contact.general).toHaveCount(1);
  });
});
