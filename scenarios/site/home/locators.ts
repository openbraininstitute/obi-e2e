import { by } from '@locators/helpers';
import type { Page } from '@playwright/test';

export function homeLocators(page: Page) {
  return {
    heroHeading: by.heading(page, /Create your Virtual Lab/i, 1),
  };
}
