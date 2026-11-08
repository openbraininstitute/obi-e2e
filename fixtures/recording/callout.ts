/**
 * A callout: a few words beside an element, drawn into the recording.
 *
 * Playwright's screencast takes HTML and shows it over the page until it is
 * disposed, so the panel is plain HTML and CSS. Its look and motion are the
 * morph popover from beui.dev (components/motion/popover), translated: the
 * full-size panel reveals from the corner nearest its anchor through an
 * `inset()` clip, with the surface fading in over the first part of the
 * travel, and retraces the same clip on the way out. Motion's non-bouncing
 * spring of 260 ms becomes a decelerating curve of the same length; the exit
 * is 200 ms, eased out, as there. Enter, hold and exit are one CSS timeline,
 * so a callout is one overlay, shown once and removed once.
 *
 * An arrow points from the panel to the middle of the anchor, as the Dock's
 * menus point at their icon: a square turned 45°, bordered on its two outward
 * sides, sitting over the panel's edge. It is the panel's sibling, so the
 * clip that reveals the panel leaves it whole.
 */

import type { Locator, Page } from '@playwright/test';

import { hold } from './index';

type Side = 'top' | 'bottom';
type Align = 'start' | 'end';

export type CalloutOptions = {
  /** A heading above the words. */
  title?: string;
  /** Which side of the anchor the panel sits on. Below it by default. */
  side?: Side;
  /** Which edge of the anchor the panel lines up with. Its left edge by default. */
  align?: Align;
  /** How long the words stay, in milliseconds, between the entrance and the exit. */
  duration?: number;
};

const SIDE_OFFSET = 14;
const RADIUS = 16;
/** The arrow's square. Turned 45°, its tip reaches `ARROW / √2` beyond the panel's edge. */
const ARROW = 14;
const ENTER_MS = 260;
const EXIT_MS = 200;
const DEFAULT_DURATION = 4_000;
/** Motion's `{ type: 'spring', duration: 0.26, bounce: 0 }`: a fast start that settles without overshoot. */
const ENTER_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** beui's EASE_OUT. */
const EXIT_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** The clip that hides `inset` percent of the panel from the edges away from the anchor. */
function clipAt(side: Side, align: Align, inset: number): string {
  const top = side === 'top' ? inset : 0;
  const right = align === 'start' ? inset : 0;
  const bottom = side === 'bottom' ? inset : 0;
  const left = align === 'end' ? inset : 0;
  return `inset(${top}% ${right}% ${bottom}% ${left}% round ${RADIUS}px)`;
}

/**
 * Shows `text` beside `anchor` for `duration`, then takes it away. Resolves
 * once the callout is gone, so the next action starts on a clean page.
 *
 * The panel is anchored by the edges nearest the element — `right` and
 * `bottom` when it sits to the end or above — so it needs no measuring of its
 * own size, which an overlay cannot do before it is shown.
 */
export async function callout(
  page: Page,
  anchor: Locator,
  text: string,
  options: CalloutOptions = {}
): Promise<void> {
  const { title, side = 'bottom', align = 'start', duration = DEFAULT_DURATION } = options;

  const box = await anchor.boundingBox();
  if (!box)
    throw new Error(
      `The callout "${text}" has nothing to point at: its anchor is not on the page.`
    );
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('A callout needs a viewport to place itself in.');

  const vertical =
    side === 'bottom'
      ? `top:${Math.round(box.y + box.height + SIDE_OFFSET)}px`
      : `bottom:${Math.round(viewport.height - box.y + SIDE_OFFSET)}px`;
  const horizontal =
    align === 'start'
      ? `left:${Math.round(box.x)}px`
      : `right:${Math.round(viewport.width - box.x - box.width)}px`;

  // The arrow's tip sits under the middle of the anchor, measured from the
  // panel's edge nearest it, and never closer to a corner than its rounding.
  const arrowEdge = align === 'start' ? 'left' : 'right';
  const arrowOffset = `clamp(${RADIUS}px, ${Math.round(box.width / 2 - ARROW / 2)}px, calc(100% - ${RADIUS + ARROW}px))`;

  const total = ENTER_MS + duration + EXIT_MS;
  const enterEnd = (ENTER_MS / total) * 100;
  const exitStart = ((ENTER_MS + duration) / total) * 100;
  const fadeEnd = enterEnd * 0.15;

  const html = `<style>
@keyframes callout-clip {
  0% { clip-path: ${clipAt(side, align, 92)}; animation-timing-function: ${ENTER_EASE}; }
  ${enterEnd.toFixed(3)}%, ${exitStart.toFixed(3)}% { clip-path: ${clipAt(side, align, 0)}; animation-timing-function: ${EXIT_EASE}; }
  100% { clip-path: ${clipAt(side, align, 92)}; }
}
@keyframes callout-fade {
  0% { opacity: 0; }
  ${fadeEnd.toFixed(3)}%, ${exitStart.toFixed(3)}% { opacity: 1; }
  100% { opacity: 0; }
}
.callout {
  position: absolute; ${vertical}; ${horizontal};
  max-width: 360px;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.14));
  animation: callout-fade ${total}ms linear forwards;
}
.callout-panel {
  box-sizing: border-box;
  padding: 14px 18px;
  border: 1px solid #e2e8f0;
  border-radius: ${RADIUS}px;
  background: #ffffff;
  color: #0f172a;
  font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
  animation: callout-clip ${total}ms linear forwards;
}
.callout-title { font-weight: 600; margin-bottom: 4px; }
.callout-text { color: #334155; }
.callout-arrow {
  position: absolute;
  ${side === 'bottom' ? 'top' : 'bottom'}: -${ARROW / 2 + 1}px;
  ${arrowEdge}: ${arrowOffset};
  width: ${ARROW}px;
  height: ${ARROW}px;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  border-top: 1px solid #e2e8f0;
  transform: rotate(${side === 'bottom' ? 45 : 225}deg);
  z-index: 1;
}
</style>
<div class="callout"><div class="callout-arrow"></div><div class="callout-panel">${
    title ? `<div class="callout-title">${escapeHtml(title)}</div>` : ''
  }<div class="callout-text">${escapeHtml(text)}</div></div></div>`;

  const shown = await page.screencast.showOverlay(html);
  try {
    await hold(page, total);
  } finally {
    await shown.dispose();
  }
}
