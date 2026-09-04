import type { Page } from '@playwright/test';

export function dataPageExtras(page: Page) {
  return {
    speciesAtlasGrid: page.getByTestId('all-species-atlas-grid'),
  };
}
