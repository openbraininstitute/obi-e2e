import { describe, expect, test } from 'bun:test';

import {
  EVERY_SPECIES,
  SPECIES,
  SPECIES_WITH_ATLAS,
  SPECIES_WITHOUT_ATLAS,
  speciesCardId,
  speciesOptionId,
} from './atlas';

describe('species test ids', () => {
  test('every species has an id, and the nine are distinct', () => {
    const ids = EVERY_SPECIES.map((species) => speciesOptionId(species));

    expect(EVERY_SPECIES).toHaveLength(9);
    expect(new Set(ids).size).toBe(9);
  });

  test('an id is the scientific name, kebab-cased', () => {
    expect(speciesOptionId('Fruit Fly')).toBe('species-selector-option__drosophila-melanogaster');
    expect(speciesCardId('American Bullfrog')).toBe('all-species-atlas-card__aquarana-catesbeiana');
    expect(speciesOptionId('All')).toBe('species-selector-option__all');
  });

  test('the atlas lists together account for every species', () => {
    const covered: string[] = [...SPECIES_WITH_ATLAS, ...SPECIES_WITHOUT_ATLAS];

    expect(covered.toSorted()).toEqual(Object.keys(SPECIES).toSorted());
  });
});
