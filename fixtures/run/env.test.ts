import { expect, test } from 'bun:test';

import { workersFor } from './env';

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
