import { by } from '@locators/helpers';
import type { Page } from '@playwright/test';

/** Locators used only by the home scenario. */
export function homeLocators(page: Page) {
  return {
    heroHeading: by.heading(page, /Create your Virtual Lab/i, 1),
  };
}
