import { expect, test } from 'bun:test';

import { film, GUIDE_WIDTH, HD, pageSize, parseSize, videoSize } from './index';

test('parseSize reads WIDTHxHEIGHT and refuses anything else', () => {
  expect(parseSize('2560x1440')).toEqual({ width: 2560, height: 1440 });
  expect(() => parseSize('big')).toThrow('WIDTHxHEIGHT');
});

test('every film is HD unless the command line says otherwise', () => {
  expect(videoSize(undefined)).toEqual(HD);
  expect(videoSize('2560x1440')).toEqual({ width: 2560, height: 1440 });
});

test('the page keeps the guide width and takes the video ratio, in even pixels', () => {
  expect(pageSize(HD)).toEqual({ width: GUIDE_WIDTH, height: 850 });
  expect(pageSize({ width: 1512, height: 982 })).toEqual({ width: 1512, height: 982 });
});

test('film lays the page out at the guide width and holds each action for the pace', () => {
  const page = pageSize(videoSize());
  expect(film({ pace: 1500 })).toEqual({
    viewport: page,
    video: { mode: 'on', size: page, show: { actions: { duration: 1500 } } },
  });
});
