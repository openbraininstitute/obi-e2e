/**
 * The atlas, fetched once per worker instead of once per page.
 *
 * Every listing and the Data page download the brain atlas — the regions of
 * each atlas and the region hierarchies, 1.9 MB decoded apiece — and nothing
 * survives a reload: the app keeps them in React Query memory only, and each
 * test opens a fresh browser context. A nightly at 2 workers sent 1 122 such
 * requests and 113 MB for data that is static per deployment; at 8 workers it
 * was two thirds of every byte entitycore served (docs/entitycore-cost.md).
 *
 * This answers them from memory after the worker's first fetch. A Playwright
 * worker is a process, so the module-level map is one cache per worker, and
 * the first page of each worker still goes to the service: what a test sees is
 * exactly what entitycore sent, headers included. Only a 200 is kept, so an
 * outage still reaches the page as the error it was. Two pages of one worker
 * asking at once both fetch; a lock would save one request per worker per run.
 */

import type { Page, Route } from '@playwright/test';

/** The two routes whose answer depends on nothing but the deployment. */
const STATIC_ATLAS =
  /\/api\/entitycore\/(?:brain-atlas\/[^/]+\/regions|brain-region-hierarchy\/[^/]+\/hierarchy)(?:\?|$)/;

/** Headers that describe the bytes on the wire, which a fulfilled body no longer has. */
const WIRE_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding']);

type Cached = { status: number; headers: Record<string, string>; body: Buffer };

const cache = new Map<string, Cached>();

/** What this worker's cache did so far. For a check, not for the tests. */
export const atlasCacheStats = { hits: 0, misses: 0 };

/** Serves the atlas from this worker's cache, filling it from the first fetch. */
export async function cacheAtlas(page: Page): Promise<void> {
  await page.route(STATIC_ATLAS, serve);
}

/**
 * Lets go of the routes once the test is over.
 *
 * A test that ends while a page is still loading leaves `serve` mid-fetch, and
 * the fetch then fails with "Test ended" outside any test — which Playwright
 * counts as an error of the run, so a run with every test green still exits 1.
 * Dropping the routes with their errors ignored is what Playwright asks for.
 */
export async function releaseAtlas(page: Page): Promise<void> {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}

async function serve(route: Route): Promise<void> {
  const request = route.request();
  if (request.method() !== 'GET') return route.fallback();

  const url = request.url();
  const hit = cache.get(url);
  if (hit) {
    atlasCacheStats.hits += 1;
    return route.fulfill(hit);
  }

  atlasCacheStats.misses += 1;
  const response = await route.fetch();
  const status = response.status();
  const body = await response.body();
  const headers = Object.fromEntries(
    Object.entries(response.headers()).filter(([name]) => !WIRE_HEADERS.has(name.toLowerCase()))
  );

  if (status === 200) cache.set(url, { status, headers, body });
  return route.fulfill({ status, headers, body });
}
