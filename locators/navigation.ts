/** Top navigation links. */

import type { Page } from '@playwright/test';

import { by } from './helpers';

export function navigation(page: Page) {
  return {
    login: by.link(page, 'Login').first(),
    virtualLabs: by.link(page, /Go to\s+Virtual Labs/i),
  };
}
