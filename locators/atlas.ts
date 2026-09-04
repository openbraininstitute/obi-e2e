import type { Page } from '@playwright/test';

/**
 * The species and brain region controls, and the 3D area beside them.
 *
 * Both appear on the Data page and on every type listing, and both narrow what
 * the listing shows.
 */
export function atlas(page: Page) {
  const tree = page.getByTestId('brain-region-hierarchy');

  return {
    speciesSelector: page.getByTestId('species-selector'),
    /**
     * Anchored, because "Mouse" is also the start of "Hybrid Human-Mouse".
     * The option's name is the common name followed by the latin one.
     */
    speciesOption: (name: string) => page.getByRole('option', { name: new RegExp(`^${name}`) }),

    regionsSelector: page.getByTestId('atlas-regions-selector'),
    tree,
    /** Every region in the hierarchy. The id in each test id is the region's. */
    regionNodes: page.locator('[data-testid^="brain-region-tree-node-"]'),
    region: (name: string) => tree.getByText(name, { exact: true }),

    viewer: page.getByTestId('three-d-area'),
    canvas: page.getByTestId('three-d-area').locator('canvas'),
    speciesCards: page.getByTestId('all-species-atlas-card'),
  };
}

/** Species with a brain atlas: a 3D view and a hierarchy worth navigating. */
export const SPECIES_WITH_ATLAS = ['Human', 'Mouse', 'Rat'] as const;

/** Species with no atlas: one region, no 3D view, and nothing to browse. */
export const SPECIES_WITHOUT_ATLAS = [
  'American Bullfrog',
  'Chinese Hamster',
  'Cat',
  'Longfin Squid',
  'African Clawed Frog',
] as const;
