import { describe, expect, test } from 'bun:test';

import { marketingPages } from './run';

describe('marketingPages', () => {
  test('keeps the same-host pages linked from home and drops the rest', () => {
    const pages = marketingPages('https://staging.openbraininstitute.org', [
      '/',
      '/about',
      '/features#pricing',
      '/news?page=2',
      '/news/',
      '/app/virtual-lab',
      '/api/health',
      '/sitemap.xml',
      'https://staging.openbraininstitute.org/team',
      'https://www.linkedin.com/company/openbraininstitute/',
      'mailto:hello@openbraininstitute.org',
      '#top',
    ]);

    expect(pages).toEqual([
      'https://staging.openbraininstitute.org/',
      'https://staging.openbraininstitute.org/about',
      'https://staging.openbraininstitute.org/features',
      'https://staging.openbraininstitute.org/news',
      'https://staging.openbraininstitute.org/team',
    ]);
  });
});
