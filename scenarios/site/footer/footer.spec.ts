import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { FOOTER_LINKS, siteFooter, SOCIAL_ACCOUNTS } from './locators';

const ADDRESS = 'e2e@example.com';

test.describe('Site footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await siteFooter(page).copyright.scrollIntoViewIfNeeded();
  });

  test('The footer names the institute and the year', { tag: VISITOR }, async ({ page }) => {
    const footer = siteFooter(page);

    await expect(footer.name).toBeVisible();
    await expect(footer.copyright).toBeVisible();
  });

  test('The footer links reach every public page', { tag: VISITOR }, async ({ page }) => {
    const footer = siteFooter(page);

    for (const label of FOOTER_LINKS) {
      await expect(footer.link(label)).toBeVisible();
    }

    expect(FOOTER_LINKS).toHaveLength(12);
  });

  test('The footer links to all four social accounts', { tag: VISITOR }, async ({ page }) => {
    const footer = siteFooter(page);

    for (const url of Object.values(SOCIAL_ACCOUNTS)) {
      await expect(footer.social(url)).toHaveCount(1);
    }

    expect(Object.keys(SOCIAL_ACCOUNTS)).toHaveLength(4);
  });

  test('Subscribing needs an address and the privacy box', { tag: VISITOR }, async ({ page }) => {
    const footer = siteFooter(page);

    await expect(footer.newsletterHeading).toBeVisible();
    await expect(footer.subscribe).toBeDisabled();

    await footer.email.fill(ADDRESS);
    await expect(footer.email).toHaveValue(ADDRESS);

    await footer.privacy.check();
    await expect(footer.privacy).toBeChecked();

    await expect(footer.subscribe).toBeEnabled();
  });
});
