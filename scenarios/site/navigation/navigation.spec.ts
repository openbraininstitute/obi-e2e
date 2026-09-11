import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import type { Page } from '@playwright/test';

import { ABOUT_MENU, type Entry, PLATFORM_MENU, SIGN_IN_PROVIDERS, siteMenu } from './locators';

/**
 * A Next dev server floats its own toolbar over the page, and it lands on top of
 * the "Login" link in the corner. Nothing renders it on a deployed build, so
 * hiding it changes nothing there.
 */
function hideDevToolbar(): void {
  const style = document.createElement('style');
  style.textContent = 'nextjs-portal { display: none !important; }';

  // This runs before the document is built, so it waits if there is no root yet.
  if (document.documentElement) document.documentElement.append(style);
  else document.addEventListener('DOMContentLoaded', () => document.head.append(style));
}

/**
 * Walks a menu, following every entry and coming back.
 *
 * The submenu is hidden by opacity rather than by visibility, so a closed one
 * still counts as visible to Playwright. Following the entry and checking where
 * it lands is what actually says the menu works.
 */
async function followEach(
  page: Page,
  within: 'About' | 'The Platform',
  entries: readonly Entry[]
): Promise<void> {
  const menu = siteMenu(page);
  const open = within === 'About' ? menu.aboutButton : menu.platformButton;

  for (const entry of entries) {
    await page.goto('/');
    await open.click();

    await menu.entry(within, entry.label).click();

    await page.waitForURL(`**${entry.path}`);
    await expect(
      page.getByRole('heading', { name: entry.heading, exact: true, level: 1 })
    ).toBeVisible();
  }
}

test.describe('Site navigation', () => {
  test.beforeEach(async ({ page }) => {
    // In an init script, because this file navigates several times per test.
    await page.addInitScript(hideDevToolbar);

    await page.goto('/');
  });

  test('The top menu offers the same entries everywhere', { tag: VISITOR }, async ({ page }) => {
    const menu = siteMenu(page);

    await expect(menu.aboutButton).toBeVisible();
    await expect(menu.platformButton).toBeVisible();
    await expect(menu.news).toBeVisible();
    await expect(menu.contact).toBeVisible();
    await expect(menu.login).toBeVisible();
  });

  test('The About menu reaches each of its pages', { tag: VISITOR }, async ({ page }) => {
    await followEach(page, 'About', ABOUT_MENU);
  });

  test('The Platform menu reaches each of its pages', { tag: VISITOR }, async ({ page }) => {
    await followEach(page, 'The Platform', PLATFORM_MENU);
  });

  test('Login asks the visitor to sign in', { tag: VISITOR }, async ({ page }) => {
    const menu = siteMenu(page);

    await menu.login.click();

    await page.waitForURL('**/auth/realms/**');
    await expect(page.getByText('Log in or sign up')).toBeVisible();

    /*
     * Each provider is a bare icon with no caption, so it is matched by the
     * broker it hands off to. The theme keeps a username and password form in
     * the page as well, but hidden — signing in that way is not offered.
     */
    for (const broker of SIGN_IN_PROVIDERS) {
      await expect(page.locator(`a[href*="/broker/${broker}/login"]`)).toHaveCount(1);
    }
  });
});
