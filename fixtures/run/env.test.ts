import { expect, test } from 'bun:test';

import { creditsFor, suiteOf, workersFor } from './env';

test('a machine gets as many workers as it has cores', () => {
  expect(workersFor({ cpus: 2, memoryGB: 16 })).toBe(2);
  expect(workersFor({ cpus: 4, memoryGB: 16 })).toBe(4);
});

test('memory limits a machine with more cores than it can feed', () => {
  expect(workersFor({ cpus: 8, memoryGB: 3 })).toBe(2);
  expect(workersFor({ cpus: 16, memoryGB: 1 })).toBe(1);
});

test('a large machine stops at the ceiling', () => {
  expect(workersFor({ cpus: 64, memoryGB: 256 })).toBe(8);
});

test('a local dev server gets a lower ceiling than a deployment', () => {
  expect(workersFor({ cpus: 64, memoryGB: 256, servedLocally: true })).toBe(2);
  expect(workersFor({ cpus: 1, memoryGB: 256, servedLocally: true })).toBe(1);
});

test('never fewer than one', () => {
  expect(workersFor({ cpus: 0, memoryGB: 0 })).toBe(1);
});

test('the suite comes from the project the command line selects', () => {
  expect(suiteOf(['playwright', 'test', '--project=slow'])).toBe('slow');
  expect(suiteOf(['playwright', 'test', '--project', 'slow'])).toBe('slow');
  expect(suiteOf(['playwright', 'test'])).toBe('regular');
  expect(suiteOf(['playwright', 'test', '--project=credits'])).toBe('regular');
});

test('a suite CI names no amount for falls back to its default', () => {
  expect(creditsFor('regular', undefined)).toBe(2_000);
  expect(creditsFor('slow', undefined)).toBe(500);
  // GitHub passes an unset repository variable through as an empty string.
  expect(creditsFor('slow', '')).toBe(500);
});

test('an amount from CI wins over the default', () => {
  expect(creditsFor('regular', '6000')).toBe(6_000);
  expect(creditsFor('slow', '2500')).toBe(2_500);
});

test('an amount that is not a positive number is refused', () => {
  expect(() => creditsFor('slow', '0')).toThrow('E2E_SLOW_PROJECT_CREDITS');
  expect(() => creditsFor('regular', 'plenty')).toThrow('E2E_PROJECT_CREDITS');
});
