/** Short helpers for role-based locators. */

import type { Locator, Page } from '@playwright/test';

export const by = {
  button: (page: Page, name: string | RegExp): Locator => page.getByRole('button', { name }),
  link: (page: Page, name: string | RegExp): Locator => page.getByRole('link', { name }),
  heading: (page: Page, name: string | RegExp, level?: number): Locator =>
    page.getByRole('heading', level === undefined ? { name } : { name, level }),
  testId: (page: Page, id: string): Locator => page.getByTestId(id),
};
