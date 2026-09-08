/**
 * What the page complained about while a test ran.
 *
 * CI keeps no traces, so a call the app swallows — a 403 that refuses a launch,
 * a 500 that refuses to generate — reaches the report only as an element that
 * never moved, and every one of those reads as a flaky locator. A nightly lost
 * a whole scenario to "the results tab never enabled" that was obi-one
 * answering `exceeds the maximum allowed: 100`. Recording the calls as they
 * happen costs nothing and gives a failure its own evidence.
 */

import type { Page, TestInfo } from '@playwright/test';

/** Enough to name a cause. More than this is a wall nobody reads. */
const MAX_PROBLEMS = 25;

/** How much of a refusal's body is worth keeping. */
const REASON_LENGTH = 300;

/** Bundles, fonts and images say nothing about why a test failed. */
const NOT_WORTH_REPORTING = /\/(?:_next|__nextjs)\/|\.(?:png|jpe?g|svg|woff2?|css|js)(?:\?|$)/;

type Problem = { line: string };

const watched = new WeakMap<Page, Problem[]>();

/** Everything this page has complained about so far, newest last. */
export function pageProblems(page: Page): string[] {
  return (watched.get(page) ?? []).map((problem) => problem.line);
}

/** Starts recording. One call per page, before the test uses it. */
export function watchPage(page: Page): void {
  const problems: Problem[] = [];
  watched.set(page, problems);

  const add = (line: string): Problem | null => {
    if (problems.length >= MAX_PROBLEMS) return null;
    const problem = { line };
    problems.push(problem);
    return problem;
  };

  page.on('response', (response) => {
    const status = response.status();
    if (status < 400 || NOT_WORTH_REPORTING.test(response.url())) return;

    const problem = add(`${response.request().method()} ${response.url()} → ${status}`);
    if (!problem) return;

    // The reason is in the body, and it arrives after the line is already down.
    void response
      .text()
      .catch(() => '')
      .then((body) => {
        problem.line += ` ${body.replaceAll(/\s+/g, ' ').trim().slice(0, REASON_LENGTH)}`;
        return body;
      });
  });

  page.on('requestfailed', (request) => {
    if (NOT_WORTH_REPORTING.test(request.url())) return;
    add(`${request.method()} ${request.url()} → ${request.failure()?.errorText ?? 'failed'}`);
  });

  page.on('pageerror', (error) => add(`uncaught: ${error.message}`));
}

/** Puts what the page complained about into the report, when the test failed. */
export async function attachPageProblems(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) return;

  const lines = pageProblems(page);
  if (lines.length === 0) return;

  await testInfo.attach('page-problems.txt', {
    body: lines.join('\n'),
    contentType: 'text/plain',
  });
}
