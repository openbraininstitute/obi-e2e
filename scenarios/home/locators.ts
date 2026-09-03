import type { Page } from '@playwright/test';

import { by } from '../../locators/helpers';

/** Locators used only by the home scenario. */
export function homeLocators(page: Page) {
  return {
    heroHeading: by.heading(page, /Create your Virtual Lab/i, 1),
  };
}
