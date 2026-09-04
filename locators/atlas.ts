/** Atlas page: species, brain regions, and the 3D view. */

import type { Page } from '@playwright/test';

export function atlas(page: Page) {
  const tree = page.getByTestId('brain-region-hierarchy');

  return {
    speciesSelector: page.getByTestId('species-selector'),
    speciesOption: (name: string) => page.getByRole('option', { name: new RegExp(`^${name}`) }),

    regionsSelector: page.getByTestId('atlas-regions-selector'),
    tree,
    regionNodes: page.locator('[data-testid^="brain-region-tree-node-"]'),
    region: (name: string) => tree.getByText(name, { exact: true }),

    viewer: page.getByTestId('three-d-area'),
    canvas: page.getByTestId('three-d-area').locator('canvas'),
    speciesCards: page.getByTestId('all-species-atlas-card'),
  };
}

export const SPECIES_WITH_ATLAS = ['Human', 'Mouse', 'Rat'] as const;

export const SPECIES_WITHOUT_ATLAS = [
  'American Bullfrog',
  'Chinese Hamster',
  'Cat',
  'Longfin Squid',
  'African Clawed Frog',
] as const;
