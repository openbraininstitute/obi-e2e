import type { BrowserContext } from '@playwright/test';

/**
 * The application keeps experimental features in one cookie, read during server
 * rendering so a flagged feature never flashes in and out. A test that needs a
 * flagged workflow sets the same cookie rather than clicking through the
 * experimental-features panel.
 *
 * Unknown keys are ignored and missing ones fall back to their default, so
 * setting one flag leaves the rest alone.
 */
const FEATURE_FLAGS_COOKIE = 'feature-flags';

export async function enableFeature(
  context: BrowserContext,
  key: string,
  baseURL: string
): Promise<void> {
  await context.addCookies([
    {
      name: FEATURE_FLAGS_COOKIE,
      value: JSON.stringify({ [key]: true }),
      url: baseURL,
    },
  ]);
}
