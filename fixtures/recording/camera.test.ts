import { expect, test } from 'bun:test';

import { shotFor, union, unscaled, WHOLE_SCREEN } from './camera';

const viewport = { width: 1920, height: 1080 };

test('a small subject is framed as close as the picture allows, and centred', () => {
  const search = { x: 700, y: 430, width: 340, height: 40 };
  const shot = shotFor(search, viewport, 'normal');
  expect(shot.scale).toBeCloseTo((1920 * 0.4) / 340, 5);
  // The subject's centre lands on the picture's centre.
  expect(870 * shot.scale + shot.x).toBeCloseTo(960, 5);
  expect(450 * shot.scale + shot.y).toBeCloseTo(540, 5);
});

test('a tiny subject stops at the scale past which pixels show', () => {
  expect(shotFor({ x: 10, y: 10, width: 30, height: 20 }, viewport, 'close').scale).toBe(2.4);
});

test('a wide subject still gets a move worth seeing', () => {
  const row = { x: 40, y: 500, width: 1800, height: 48 };
  expect(shotFor(row, viewport, 'normal').scale).toBe(1.15);
});

test('the camera never leaves the page: a subject in a corner is framed against the edge', () => {
  const corner = shotFor({ x: 0, y: 0, width: 200, height: 100 }, viewport, 'normal');
  expect(corner.x).toBe(0);
  expect(corner.y).toBe(0);
  const far = shotFor({ x: 1800, y: 1000, width: 100, height: 60 }, viewport, 'normal');
  expect(far.x).toBeCloseTo(1920 * (1 - far.scale), 5);
  expect(far.y).toBeCloseTo(1080 * (1 - far.scale), 5);
});

test('union holds every box; unscaled undoes a shot', () => {
  const boxes = [
    { x: 10, y: 20, width: 100, height: 10 },
    { x: 50, y: 5, width: 20, height: 100 },
  ];
  expect(union(boxes)).toEqual({ x: 10, y: 5, width: 100, height: 100 });
  const shot = { scale: 2, x: -100, y: -50 };
  const seen = { x: 2 * 300 - 100, y: 2 * 200 - 50, width: 80, height: 40 };
  expect(unscaled(seen, shot)).toEqual({ x: 300, y: 200, width: 40, height: 20 });
  expect(unscaled(seen, WHOLE_SCREEN)).toEqual(seen);
});
