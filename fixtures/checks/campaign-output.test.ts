import { describe, expect, test } from 'bun:test';

import { asNamed } from './campaign-output';

describe('asNamed', () => {
  test('a trailing * names a file by its start', () => {
    const names = ['Task logs', 'Extracellular Recording Array for *'];
    expect(asNamed('Extracellular Recording Array for CircuitFromID_1', names)).toBe(
      'Extracellular Recording Array for *'
    );
    expect(asNamed('Task logs', names)).toBe('Task logs');
    expect(asNamed('weights.h5', names)).toBe('weights.h5');
  });
});
