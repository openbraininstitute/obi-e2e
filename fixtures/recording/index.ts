/**
 * What a film needs and a test does not.
 *
 * A scenario's `video-recording.ts` declares at its top how long each action
 * stays on screen and how large the picture is. Steps only a film takes — a
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

export const FULL_HD: Size = { width: 1920, height: 1080 };

/** How a scenario wants to be filmed. */
export type Film = {
  /** Milliseconds each action is held on screen before it runs. */
  pace: number;
  /** The window and the video, in pixels. Full HD unless the file says otherwise. */
  size?: Size;
};

/** `1920x1080`, as `E2E_VIDEO_SIZE` or a command line spells it. */
export function parseSize(spec: string): Size {
  const match = /^(\d{3,5})x(\d{3,5})$/.exec(spec.trim());
  if (!match) throw new Error(`A video size is WIDTHxHEIGHT, such as 1920x1080, not "${spec}".`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

/**
 * The size this recording runs at: the command line (`E2E_VIDEO_SIZE`), else
 * what the file declares, else Full HD. The command line wins because it is
 * the choice made for this one run; the file is the scenario's usual size.
 */
export function videoSize(declared?: Size, fromEnv = process.env.E2E_VIDEO_SIZE): Size {
  return fromEnv ? parseSize(fromEnv) : (declared ?? FULL_HD);
}

/**
 * The options a recording file passes to `test.use`: the window, and the video
 * with its holds. Each `test.step` of the film is its scene, and its title is
 * captioned on the picture while it plays.
 */
export function film(options: Film): { viewport: Size; video: PlaywrightWorkerOptions['video'] } {
  const size = videoSize(options.size);
  return {
    viewport: size,
    video: {
      mode: 'on',
      size,
      show: { actions: { duration: options.pace }, test: { level: 'step' } },
    },
  };
}

/**
 * Holds the final picture for one pace.
 *
 * Playwright holds before an action, never after the last one, and the video
 * ends with the test: the result the whole film led up to would show for the
 * length of its assertion. This is a hold for the viewer, not a wait for the
 * app, which is why it is the one `waitForTimeout` in the suite.
 */
export async function lastFrame(page: Page, pace: number): Promise<void> {
  await page.waitForTimeout(pace);
}
