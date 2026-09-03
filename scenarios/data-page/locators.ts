import type { Page } from '@playwright/test';

/** Locators used only by the data page scenario. */
export function dataPageExtras(page: Page) {
  return {
    speciesAtlasGrid: page.getByTestId('all-species-atlas-grid'),
  };
}
