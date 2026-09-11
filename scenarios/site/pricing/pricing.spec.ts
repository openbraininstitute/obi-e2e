import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { PLANS, pricingLocators, SUBSCRIPTION_ADDRESS } from './locators';

const QUOTED_ON_REQUEST = ['Enterprise', 'Education'] as const;

test.describe('Pricing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('Open the Pricing page', { tag: VISITOR }, async ({ page }) => {
    const pricing = pricingLocators(page);

    await expect(pricing.heading).toBeVisible();
    await expect(pricing.intro).toBeVisible();
    await expect(pricing.discoverPlans).toBeVisible();
  });

  test('All four plans are offered', { tag: VISITOR }, async ({ page }) => {
    const pricing = pricingLocators(page);

    await expect(pricing.planCards).toHaveCount(PLANS.length);

    for (const plan of PLANS) {
      await expect(pricing.card(plan)).toHaveCount(1);
    }
  });

  test('The Pro plan shows a price in Swiss francs', { tag: VISITOR }, async ({ page }) => {
    const pro = pricingLocators(page).card('Pro');

    await expect(pro).toContainText('CHF');
    await expect(pro).toContainText('Monthly');
    await expect(pro).toContainText('Yearly');
  });

  test('Enterprise and Education are quoted on request', { tag: VISITOR }, async ({ page }) => {
    const pricing = pricingLocators(page);

    for (const plan of QUOTED_ON_REQUEST) {
      const contact = pricing.contactUs(plan);
      await expect(contact).toHaveCount(1);
      await expect(contact).toHaveAttribute('href', SUBSCRIPTION_ADDRESS);
    }
  });
});
