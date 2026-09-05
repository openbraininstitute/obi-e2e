import { scanConfigControl, scanConfigField } from '@locators/scan-config';
import type { Locator, Page } from '@playwright/test';

export function memodelViewLocators(page: Page) {
  return {
    /** A campaign field of the simulation's Info block. */
    campaignField: (key: string): Locator =>
      scanConfigControl(scanConfigField(page.getByTestId('scan-config-block-info'), key)),
  };
}
