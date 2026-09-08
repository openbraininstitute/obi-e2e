/** Atlas page: species, brain regions, and the 3D view. */

import type { Page } from '@playwright/test';
import { kebabCase } from 'es-toolkit';

export const SPECIES = {
  Human: 'Homo sapiens',
  Mouse: 'Mus musculus',
  Rat: 'Rattus norvegicus',
  'Fruit Fly': 'Drosophila melanogaster',
  'American Bullfrog': 'Aquarana catesbeiana',
  'Chinese Hamster': 'Cricetulus griseus',
  Cat: 'Felis catus',
  'Longfin Squid': 'Loligo pealeii',
  'African Clawed Frog': 'Xenopus laevis',
} as const;

export type SpeciesName = keyof typeof SPECIES;

export type SpeciesChoice = SpeciesName | 'All';

export function speciesOptionId(species: SpeciesChoice): string {
  if (species === 'All') return 'species-selector-option__all';
  return `species-selector-option__${kebabCase(SPECIES[species])}`;
}

/**
 * The option's own name, which every deployment has.
 *
 * An option reads as its common name and then its scientific one — "Human Homo
 * sapiens", "All All species" — and the second half alone picks it out. The
 * test ids beside them are newer than the deployments this suite runs against,
 * and a run on staging found none of them.
 */
function speciesOptionName(species: SpeciesChoice): RegExp {
  const scientific = species === 'All' ? 'All species' : SPECIES[species];
  return new RegExp(scientific.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export function speciesCardId(species: SpeciesName): string {
  return `all-species-atlas-card__${kebabCase(SPECIES[species])}`;
}

export function atlas(page: Page) {
  const tree = page.getByTestId('brain-region-hierarchy');
  const grid = page.getByTestId('all-species-atlas-grid');

  return {
    speciesSelector: page.getByTestId('species-selector'),
    speciesOption: (species: SpeciesChoice) =>
      page
        .getByTestId(speciesOptionId(species))
        .or(page.getByRole('option', { name: speciesOptionName(species) }))
        .first(),
    speciesOptions: page.locator('[data-testid^="species-selector-option__"]'),

    regionsSelector: page.getByTestId('atlas-regions-selector'),
    tree,
    regionNodes: page.locator('[data-testid^="brain-region-tree-node-"]'),
    region: (name: string) => tree.getByText(name, { exact: true }),

    viewer: page.getByTestId('three-d-area'),
    canvas: page.getByTestId('three-d-area').locator('canvas'),
    // Rendered only once every atlas is known; a loader with no test id stands in before.
    speciesGrid: grid,
    /*
     * Each card is an article, which is what it is on every deployment. The
     * test ids beside them are newer, so they are tried first and the role
     * carries the older builds. Scoped to the grid, so nothing else counts.
     */
    speciesCards: grid
      .locator('[data-testid^="all-species-atlas-card__"]')
      .or(grid.getByRole('article')),
    speciesCard: (species: SpeciesName) =>
      grid
        .getByTestId(speciesCardId(species))
        .or(grid.getByRole('article').filter({ hasText: SPECIES[species] }))
        .first(),
  };
}

export const SPECIES_WITH_ATLAS = ['Human', 'Mouse', 'Rat'] as const;

export const SPECIES_WITHOUT_ATLAS = [
  'Fruit Fly',
  'American Bullfrog',
  'Chinese Hamster',
  'Cat',
  'Longfin Squid',
  'African Clawed Frog',
] as const;

export const EVERY_SPECIES: readonly SpeciesName[] = [
  ...SPECIES_WITH_ATLAS,
  ...SPECIES_WITHOUT_ATLAS,
];
