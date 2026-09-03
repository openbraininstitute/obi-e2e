import type { Page } from '@playwright/test';

import { by } from './helpers';

/**
 * Site navigation. Shared because more than one scenario needs to reach the
 * login entry point or the application from the marketing pages.
 */
export function navigation(page: Page) {
  return {
    // Desktop and mobile navigation both render "Login", so this matches three
    // times. Any of them proves the entry point is on the page.
    login: by.link(page, 'Login').first(),
    virtualLabs: by.link(page, /Go to\s+Virtual Labs/i),
  };
}
