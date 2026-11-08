import { expect, test } from 'bun:test';

import { film, FULL_HD, parseSize, videoSize } from './index';

test('parseSize reads WIDTHxHEIGHT and refuses anything else', () => {
  expect(parseSize('2560x1440')).toEqual({ width: 2560, height: 1440 });
  expect(() => parseSize('big')).toThrow('WIDTHxHEIGHT');
});

test('the command line wins over the file, and the file over Full HD', () => {
  const declared = { width: 1280, height: 720 };
  expect(videoSize(declared, '2560x1440')).toEqual({ width: 2560, height: 1440 });
  expect(videoSize(declared, undefined)).toEqual(declared);
  expect(videoSize(undefined, undefined)).toEqual(FULL_HD);
});

test('film sizes the window like the video and holds each action for the pace', () => {
  const size = { width: 1280, height: 720 };
  expect(film({ pace: 1500, size })).toEqual({
    viewport: size,
    video: { mode: 'on', size, show: { actions: { duration: 1500 } } },
  });
});
