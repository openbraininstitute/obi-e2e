import { expect, test } from 'bun:test';

import { excludedEnvironmentTag, PRIVATE, PRODUCTION_ONLY, STAGING_ONLY } from './tags';

test('a run excludes the other deployment', () => {
  expect(excludedEnvironmentTag('staging').source).toBe('@production\\b');
  expect(excludedEnvironmentTag('production').source).toBe('@staging\\b');
});

test('an untagged test is excluded by neither', () => {
  const title = `a test ${PRIVATE.join(' ')}`;
  expect(excludedEnvironmentTag('staging').test(title)).toBe(false);
  expect(excludedEnvironmentTag('production').test(title)).toBe(false);
});

test('a deployment-specific test is excluded by the other one only', () => {
  const staging = `a test ${[...PRIVATE, STAGING_ONLY].join(' ')}`;
  expect(excludedEnvironmentTag('production').test(staging)).toBe(true);
  expect(excludedEnvironmentTag('staging').test(staging)).toBe(false);

  const production = `a test ${[...PRIVATE, PRODUCTION_ONLY].join(' ')}`;
  expect(excludedEnvironmentTag('staging').test(production)).toBe(true);
  expect(excludedEnvironmentTag('production').test(production)).toBe(false);
});
