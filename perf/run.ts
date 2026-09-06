#!/usr/bin/env bun

/**
 * Audits the marketing site with Lighthouse CI: the home page, and every page
 * it links to on the same host outside the app.
 *
 * Usage: bun perf/run.ts [baseUrl] [lhci flags…]
 *   bun run perf                                      staging, or E2E_BASE_URL
 *   E2E_ENV=production bun run perf                   production
 *   bun run perf --collect.numberOfRuns=1             a quick look, one run per page
 *
 * Run it from the repository root: the config writes to perf/report.
 */

import * as path from 'node:path';

import { baseURL } from '@fixtures/run/env';

/** Pinned, so a Lighthouse upgrade never moves the numbers unnoticed. */
export const LHCI = '@lhci/cli@0.15.1';

/** Paths that belong to the app, not to the marketing site. */
const NOT_MARKETING = ['/app', '/api', '/_next'];

function underAppPath(pathname: string): boolean {
  return NOT_MARKETING.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The pages to audit: the base URL itself, and the same-host pages it links to. */
export function marketingPages(base: string, hrefs: string[]): string[] {
  const origin = new URL(base).origin;
  const pages = new Set([`${origin}/`]);

  for (const href of hrefs) {
    if (!URL.canParse(href, base)) continue;

    const url = new URL(href, base);
    if (url.origin !== origin || underAppPath(url.pathname)) continue;
    if (path.posix.extname(url.pathname)) continue;

    url.hash = '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    pages.add(url.href);
  }

  return [...pages].toSorted();
}

/** Fetches the home page and reads the links off it. */
export async function discoverPages(base: string): Promise<string[]> {
  const response = await fetch(base);
  if (!response.ok) throw new Error(`GET ${base} answered ${response.status}.`);

  const hrefs: string[] = [];
  const links = new HTMLRewriter().on('a[href]', {
    element(anchor) {
      const href = anchor.getAttribute('href');
      if (href) hrefs.push(href);
    },
  });
  await links.transform(response).text();

  const pages = marketingPages(base, hrefs);
  if (pages.length < 2) {
    throw new Error(
      `Found no pages linked from ${base}. Is the navigation rendered on the server?`
    );
  }
  return pages;
}

if (import.meta.main) {
  const flags = Bun.argv.slice(2);
  const base = flags[0] && !flags[0].startsWith('-') ? (flags.shift() as string) : baseURL;

  const pages = await discoverPages(base);
  console.log(`Auditing ${pages.length} pages:\n${pages.map((page) => `  ${page}`).join('\n')}`);

  const lhci = Bun.spawn(
    [
      'npx',
      '--yes',
      LHCI,
      'autorun',
      `--config=${path.join(import.meta.dir, 'lighthouserc.json')}`,
      ...pages.map((page) => `--collect.url=${page}`),
      ...flags,
    ],
    { stdout: 'inherit', stderr: 'inherit' }
  );
  process.exit(await lhci.exited);
}
