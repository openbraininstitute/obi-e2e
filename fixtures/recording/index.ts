/**
 * What a film needs and a test does not.
 *
 * A scenario's `video-recording.ts` declares at its top how long each action
 * stays on screen. Steps only a film takes — a
 * scene the scientist wants shown that no case checks — live in this folder
 * too, never in `fixtures/steps`: a spec imports nothing from here (oxlint
 * refuses it), so a film can grow without the suite paying for it.
 *
 * Playwright draws the recording's cursor itself (`video.show.actions`): before
 * every click, fill or keypress it moves a pointer to the target, highlights
 * it, captions the action, and holds for `pace` milliseconds, so the viewer
 * sees the page that the last action produced and where the next one lands.
 * The hold is Playwright's, awaited inside the action, so no test code sleeps.
 */

import type { Page, PlaywrightWorkerOptions } from '@playwright/test';

export type Size = { width: number; height: number };

/** The video every film is delivered at: HD, 16:9, the ratio most screens show. */
export const HD: Size = { width: 1920, height: 1080 };

/**
 * How wide the page is laid out, in CSS pixels. The video guide
 * (VideoRecording_Guidelines, 2025-12-12) records a 14-inch MacBook Pro at its
 * default scale, 1512 wide, and checks that the side menu takes about a
 * quarter of the width. Laid out 1920 wide, the menu keeps its 336 pixels and
 * falls to 17.5%; at 1512 it is 22%.
 */
export const GUIDE_WIDTH = 1512;

/** How a scenario wants to be filmed. */
export type Film = {
  /** Milliseconds each action is held on screen before it runs. */
  pace: number;
};

/** `1920x1080`, as `E2E_VIDEO_SIZE` spells it. */
export function parseSize(spec: string): Size {
  const match = /^(\d{3,5})x(\d{3,5})$/.exec(spec.trim());
  if (!match) throw new Error(`A video size is WIDTHxHEIGHT, such as 1920x1080, not "${spec}".`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

/**
 * The size of the delivered video: `E2E_VIDEO_SIZE` for one run, else HD. One
 * size for every film, so no two have different ratios; a storyboard does not
 * choose its own.
 */
export function videoSize(fromEnv = process.env.E2E_VIDEO_SIZE): Size {
  return fromEnv ? parseSize(fromEnv) : HD;
}

/**
 * The page a film records: the guide's width, and the height that gives the
 * video's ratio (1512x850 for HD). Playwright records it at that size and
 * never scales up, so `bun run test:video` scales it to the video's size
 * when it encodes the file. Even, because H.264 in yuv420p needs it.
 */
export function pageSize(video: Size): Size {
  const height = Math.round((GUIDE_WIDTH * video.height) / video.width / 2) * 2;
  return { width: GUIDE_WIDTH, height };
}

/**
 * The options a recording file passes to `test.use`: the window, and the video
 * with its holds. Nothing else is drawn over the page: the film is the screen
 * as a scientist sees it, plus the pointer and the callouts.
 */
export function film(options: Film): { viewport: Size; video: PlaywrightWorkerOptions['video'] } {
  const page = pageSize(videoSize());
  return {
    viewport: page,
    video: {
      mode: 'on',
      size: page,
      show: { actions: { duration: options.pace } },
    },
  };
}

/**
 * Keeps the picture as it is for `ms`.
 *
 * A hold for the viewer, not a wait for the app: nothing in the suite waits
 * on a clock for a page to answer, and this is the one `waitForTimeout` in
 * it. A film spends it on its last picture and on each callout's words.
 */
export async function hold(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * Keeps Playwright's action label off the picture.
 *
 * `show.actions` draws three things before each action: the pointer, the
 * highlight on the target, and a label naming the action, "Click", at a
 * corner. The first two are what a viewer follows; the label is not the
 * screen and has no option of its own. The screencast's overlays share the
 * label's shadow root and are re-added on every new document, so one overlay
 * holding a style rule hides it for the whole film.
 *
 * ponytail: the label's element name, `x-pw-title`, is Playwright's own (read
 * from 1.62). A rename brings the label back, nothing worse.
 */
export async function hideActionLabel(page: Page): Promise<void> {
  await page.screencast.showOverlay('<style>x-pw-title { display: none !important; }</style>');
}

/**
 * Holds the final picture for one pace: Playwright holds before an action,
 * never after the last one, and the video ends with the test, so the result
 * the whole film led up to would show for the length of its assertion.
 */
export async function lastFrame(page: Page, pace: number): Promise<void> {
  await hold(page, pace);
}
