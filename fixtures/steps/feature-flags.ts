import type { BrowserContext } from '@playwright/test';

const FEATURE_FLAGS_COOKIE = 'feature-flags';

/** Turns a feature flag on with a cookie, before the page loads. */
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
