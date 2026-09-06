import { afterEach, expect, test } from 'bun:test';

import { LOG_FORMATS, logFormat } from './logger';

const original = { format: process.env.E2E_LOG_FORMAT, ci: process.env.CI };

afterEach(() => {
  if (original.format === undefined) delete process.env.E2E_LOG_FORMAT;
  else process.env.E2E_LOG_FORMAT = original.format;
  if (original.ci === undefined) delete process.env.CI;
  else process.env.CI = original.ci;
});

test('both formats are offered', () => {
  expect([...LOG_FORMATS]).toEqual(['text', 'json']);
});

test('an explicit format wins', () => {
  process.env.E2E_LOG_FORMAT = 'json';
  expect(logFormat()).toBe('json');

  process.env.E2E_LOG_FORMAT = 'text';
  expect(logFormat()).toBe('text');
});

test('a format that does not exist is rejected by name', () => {
  process.env.E2E_LOG_FORMAT = 'pretty';
  expect(() => logFormat()).toThrow(/E2E_LOG_FORMAT must be one of text, json, got "pretty"/);
});
