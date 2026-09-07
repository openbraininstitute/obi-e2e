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

export function speciesCardId(species: SpeciesName): string {
  return `all-species-atlas-card__${kebabCase(SPECIES[species])}`;
}

export function atlas(page: Page) {
  const tree = page.getByTestId('brain-region-hierarchy');

  return {
    speciesSelector: page.getByTestId('species-selector'),
    speciesOption: (species: SpeciesChoice) => page.getByTestId(speciesOptionId(species)),
    speciesOptions: page.locator('[data-testid^="species-selector-option__"]'),

    regionsSelector: page.getByTestId('atlas-regions-selector'),
    tree,
    regionNodes: page.locator('[data-testid^="brain-region-tree-node-"]'),
    region: (name: string) => tree.getByText(name, { exact: true }),

    viewer: page.getByTestId('three-d-area'),
    canvas: page.getByTestId('three-d-area').locator('canvas'),
    speciesCards: page.locator('[data-testid^="all-species-atlas-card__"]'),
    speciesCard: (species: SpeciesName) => page.getByTestId(speciesCardId(species)),
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
