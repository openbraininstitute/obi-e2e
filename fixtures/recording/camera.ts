/**
 * The camera: a film's way of looking closer at one part of the page.
 *
 * `focusOn` moves in on an element with room around it, so the viewer sees
 * where it sits; `pullBack` returns to the whole screen. Ordinary steps carry
 * on while the camera is wherever the storyboard left it, so a search box can
 * be typed into close up. A step may only act inside the frame: Playwright
 * clicks and types correctly on a scaled page, but it cannot reach what the
 * camera has pushed off-screen, and says so ("outside of the viewport").
 *
 * The move is a transform on the body, on one eased curve, through the Web
 * Animations API, which a reduced-motion stylesheet cannot switch off. The
 * browser renders the scaled page afresh, so text stays crisp. Playwright's
 * pointer and highlights live in the top layer and read their positions from
 * the scaled page, so they follow on their own; so do the callouts.
 */

import type { Locator, Page } from '@playwright/test';

export type Framing = 'close' | 'normal' | 'wide';
export type Box = { x: number; y: number; width: number; height: number };
export type Size = { width: number; height: number };
/** Where the camera is: the page scaled by `scale` about its top-left corner, then shifted by `x`, `y`. */
export type Shot = { scale: number; x: number; y: number };

/** How much of the picture the subject fills, by framing. */
const FILL: Record<Framing, number> = { close: 0.55, normal: 0.4, wide: 0.28 };

/** Beyond this the viewer's canvas and the grid's text show their pixels. */
const MAX_SCALE = 2.4;

/** A move smaller than this does not read as one. A wide subject, such as a table row, gets this much. */
const MIN_SCALE = 1.15;

const MOVE_MS = 900;
const RETURN_MS = 700;
/** Ease in and out, cubic: slow at both ends, as a camera on a dolly. */
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

export const WHOLE_SCREEN: Shot = { scale: 1, x: 0, y: 0 };

/** The smallest box holding every box. */
export function union(boxes: Box[]): Box {
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * The shot that frames `subject`: scaled so it fills its share of the picture,
 * centred, and never past the page's edges, which the move would otherwise
 * leave blank.
 */
export function shotFor(subject: Box, viewport: Size, framing: Framing): Shot {
  const fill = FILL[framing];
  const fits = Math.min(
    (viewport.width * fill) / subject.width,
    (viewport.height * fill) / subject.height
  );
  const scale = clamp(fits, MIN_SCALE, MAX_SCALE);
  const centreX = subject.x + subject.width / 2;
  const centreY = subject.y + subject.height / 2;
  return {
    scale,
    x: clamp(viewport.width / 2 - centreX * scale, viewport.width * (1 - scale), 0),
    y: clamp(viewport.height / 2 - centreY * scale, viewport.height * (1 - scale), 0),
  };
}

/** A box as the browser reports it under `shot`, back in the page's own coordinates. */
export function unscaled(box: Box, shot: Shot): Box {
  return {
    x: (box.x - shot.x) / shot.scale,
    y: (box.y - shot.y) / shot.scale,
    width: box.width / shot.scale,
    height: box.height / shot.scale,
  };
}

/** Where the camera is now. Kept on the body, so a new document starts from the whole screen. */
async function currentShot(page: Page): Promise<Shot> {
  return page.evaluate((whole) => {
    const kept = document.body.dataset.camera;
    return kept ? (JSON.parse(kept) as typeof whole) : whole;
  }, WHOLE_SCREEN);
}

/** Moves the camera to `shot` over `ms`, and resolves once it has settled. */
async function moveTo(page: Page, shot: Shot, ms: number): Promise<void> {
  await page.evaluate(
    async ({ shot: target, ms: duration, ease, whole }) => {
      const body = document.body;
      // oxlint-disable-next-line unicorn/consistent-function-scoping -- runs in the page, which sees nothing outside this function
      const transformOf = (s: typeof target) => `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
      const from = body.dataset.camera ? (JSON.parse(body.dataset.camera) as typeof target) : whole;
      body.style.transformOrigin = '0 0';
      body.style.willChange = 'transform';
      // The scaled page overflows the window; nothing may scroll it into a corner.
      document.documentElement.style.overflow = 'hidden';
      const move = body.animate(
        [{ transform: transformOf(from) }, { transform: transformOf(target) }],
        {
          duration,
          easing: ease,
          fill: 'forwards',
        }
      );
      await move.finished;
      move.commitStyles();
      move.cancel();
      body.style.willChange = '';
      if (target.scale === 1) {
        body.style.transform = '';
        document.documentElement.style.overflow = '';
        delete body.dataset.camera;
      } else {
        body.dataset.camera = JSON.stringify(target);
      }
    },
    { shot, ms, ease: EASE, whole: WHOLE_SCREEN }
  );
}

/**
 * Moves in on `subject`, one element or several framed together, with room
 * around it. Resolves once the move has settled, so the next step starts on
 * a still picture.
 */
export async function focusOn(
  page: Page,
  subject: Locator | Locator[],
  options: { framing?: Framing } = {}
): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('The camera needs a viewport to frame.');

  const shot = await currentShot(page);
  const boxes: Box[] = [];
  for (const target of Array.isArray(subject) ? subject : [subject]) {
    const box = await target.boundingBox();
    if (!box) throw new Error(`The camera has nothing to focus on: ${target} is not on the page.`);
    boxes.push(unscaled(box, shot));
  }

  await moveTo(page, shotFor(union(boxes), viewport, options.framing ?? 'normal'), MOVE_MS);
}

/** Returns to the whole screen. Resolves once the move has settled. */
export async function pullBack(page: Page): Promise<void> {
  await moveTo(page, WHOLE_SCREEN, RETURN_MS);
}
