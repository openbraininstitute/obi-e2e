import type { Locator, Page } from '@playwright/test';

/**
 * Role helpers used when building locators. Prefer these over raw selectors so
 * every locator in the suite resolves the way a person finds the control.
 */
export const by = {
  button: (page: Page, name: string | RegExp): Locator => page.getByRole('button', { name }),
  link: (page: Page, name: string | RegExp): Locator => page.getByRole('link', { name }),
  heading: (page: Page, name: string | RegExp, level?: number): Locator =>
    page.getByRole('heading', level === undefined ? { name } : { name, level }),
  testId: (page: Page, id: string): Locator => page.getByTestId(id),
};
