import { describe, expect, test } from 'bun:test';

import { endpointOf, pageOf } from './request-report';

describe('endpointOf', () => {
  test('folds ids and queries into one endpoint', () => {
    expect(
      endpointOf(
        '/api/entitycore/brain-atlas/3f2b9c1e-1d2a-4b3c-8d4e-5f6a7b8c9d0e/regions?page_size=1000'
      )
    ).toBe('/api/entitycore/brain-atlas/{id}/regions');
  });
});

describe('pageOf', () => {
  test('folds the lab and project into one page', () => {
    expect(
      pageOf(
        '/app/virtual-lab/3f2b9c1e-1d2a-4b3c-8d4e-5f6a7b8c9d0e/0d3251e9-9a9f-451f-880b-343b450019ec/data'
      )
    ).toBe('/app/virtual-lab/…/data');
  });
});
