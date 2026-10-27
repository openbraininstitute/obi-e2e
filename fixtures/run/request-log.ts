/**
 * Every backend call a test sends, written down for the cost report.
 *
 * Off unless `E2E_REQUEST_LOG` is set: the suite is measured now and then,
 * not every night. One line per response, appended to one file by every
 * worker — `appendFileSync` on a line under the pipe buffer is atomic, so the
 * workers need no lock. `scripts/request-report.ts` turns the file into tables.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Page, TestInfo } from '@playwright/test';

export const REQUEST_LOG = process.env.E2E_REQUEST_LOG
  ? path.resolve('test-results', 'requests.jsonl')
  : null;

/** What the page itself asks a backend for. The app's own bundles say nothing about the backend. */
const BACKEND = /\/api\/(?<service>[^/?]+)/;

export type LoggedRequest = {
  test: string;
  file: string;
  /** The page that sent it, path only: the ids in it are the run's own. */
  page: string;
  service: string;
  method: string;
  url: string;
  status: number;
  /** Decoded body length. Not the bytes on the wire: entitycore gzips. */
  bytes: number;
  /** From the request leaving to the body arriving, in milliseconds. */
  ms: number;
  fromCache: boolean;
};

/** Starts recording the page's backend calls. One call per page. */
export function logRequests(page: Page, testInfo: TestInfo): void {
  if (!REQUEST_LOG) return;
  fs.mkdirSync(path.dirname(REQUEST_LOG), { recursive: true });

  page.on('response', (response) => {
    const url = response.url();
    const service = BACKEND.exec(url)?.groups?.service;
    if (!service) return;

    void response
      .body()
      .then((body) => body.length)
      .catch(() => 0)
      .then((bytes) => {
        const timing = response.request().timing();
        const line: LoggedRequest = {
          test: testInfo.titlePath.slice(1).join(' › '),
          file: testInfo.file.slice(testInfo.project.testDir.length + 1),
          page: pathOf(page.url()),
          service,
          method: response.request().method(),
          url: url.replace(/^https?:\/\/[^/]+/, ''),
          status: response.status(),
          bytes,
          ms: timing.responseEnd >= 0 ? Math.round(timing.responseEnd) : -1,
          fromCache: response.fromServiceWorker(),
        };
        fs.appendFileSync(REQUEST_LOG, `${JSON.stringify(line)}\n`);
        return bytes;
      });
  });
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
