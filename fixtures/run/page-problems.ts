/**
 * What the page complained about while a test ran.
 *
 * CI keeps no traces, so a call the app swallows — a 403 that refuses a launch,
 * a 500 that refuses to generate — reaches the report only as an element that
 * never moved, and every one of those reads as a flaky locator. A nightly lost
 * a whole scenario to "the results tab never enabled" that was obi-one
 * answering `exceeds the maximum allowed: 100`. Recording the calls as they
 * happen costs nothing and gives a failure its own evidence.
 *
 * The terminal prints only the first lines of an attachment. The whole list is
 * in the HTML report.
 */

import type { Page, TestInfo } from '@playwright/test';

/** Enough to name a cause. More than this is a wall nobody reads. */
const MAX_PROBLEMS = 25;

/** How much of a refusal's body is worth keeping. */
const REASON_LENGTH = 300;

/** What the app logs on every page, whether or not anything is wrong. */
const KNOWN_NOISE = /antd: compatible/;

/**
 * A deploy mid-run leaves the open page asking for chunks that are no longer
 * served, and every locator on it then times out. One reload fetches the HTML
 * the new bundle names.
 */
const STALE_BUNDLE = /ChunkLoadError|Loading (?:CSS )?chunk \S+ failed/;

/** Bundles, fonts and images say nothing about why a test failed. */
const NOT_WORTH_REPORTING = /\/(?:_next|__nextjs)\/|\.(?:png|jpe?g|svg|woff2?|css|js)(?:\?|$)/;

/** A backend call. Anything else the page fetches is the app itself. */
const BACKEND = /\/api\//;

/**
 * A backend call this slow is the likely reason a step ran out of clock: a
 * listing whose count never changed, a results tab that never enabled.
 */
const SLOW_MS = 15_000;

/** A campaign task's record or log stream, which says why a run ended in "error". */
const TASK_LOG = /\/declared\/task\/[^/?]+(?:\/stream)?(?:\?|$)/;

/** The attachment the report reads the evidence back from. */
export const PAGE_PROBLEMS = 'page-problems.txt';

type Problem = { line: string };

const watched = new WeakMap<Page, Problem[]>();

/** Everything this page has complained about so far, oldest first. */
export function pageProblems(page: Page): string[] {
  return (watched.get(page) ?? []).map((problem) => problem.line);
}

/** Starts recording. One call per page, before the test uses it. */
export function watchPage(page: Page): void {
  const problems: Problem[] = [];
  watched.set(page, problems);

  const seen = new Set<string>();

  const add = (line: string): Problem | null => {
    if (problems.length >= MAX_PROBLEMS || seen.has(line)) return null;
    seen.add(line);
    const problem = { line };
    problems.push(problem);
    return problem;
  };

  page.on('response', (response) => {
    const status = response.status();

    // A task answers 200 while reporting that it failed; its log says why.
    if (status < 400 && TASK_LOG.test(response.url())) {
      void response
        .text()
        .catch(() => '')
        .then((body) => {
          const error = taskError(body);
          if (error) add(`task error: ${error}`);
          return body;
        });
      return;
    }

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

  page.on('requestfinished', (request) => {
    if (!BACKEND.test(request.url())) return;
    const took = request.timing().responseEnd;
    if (took >= SLOW_MS) {
      add(`slow: ${request.method()} ${request.url()} took ${(took / 1000).toFixed(1)} s`);
    }
  });

  page.on('requestfailed', (request) => {
    if (NOT_WORTH_REPORTING.test(request.url())) return;
    add(`${request.method()} ${request.url()} → ${request.failure()?.errorText ?? 'failed'}`);
  });

  // Once: a second failure against fresh HTML is not a stale bundle.
  let reloaded = false;
  const reloadOnce = (text: string): void => {
    if (reloaded || !STALE_BUNDLE.test(text) || page.isClosed()) return;
    reloaded = true;
    add('the bundle changed under the page; reloading once');
    void page.reload().catch(() => {});
  };

  page.on('pageerror', (error) => {
    add(`uncaught: ${error.message}`);
    reloadOnce(error.message);
  });

  // A crashed tab makes every later step fail for a reason of its own.
  page.on('crash', () => add('the browser tab crashed'));

  // The browser's own account is often the clearest one: a 500 that loses its
  // CORS header reaches the app as nothing but "Failed to fetch".
  page.on('console', (message) => {
    if (message.type() !== 'error') return;

    const text = message.text().replaceAll(/\s+/g, ' ').trim();
    if (text === '' || KNOWN_NOISE.test(text)) return;

    add(`console: ${text.slice(0, REASON_LENGTH)}`);
    reloadOnce(text);
  });
}

/** Puts what the page complained about into the report, when the test failed. */
export async function attachPageProblems(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) return;

  const lines = pageProblems(page);
  if (lines.length === 0) return;

  await testInfo.attach(PAGE_PROBLEMS, {
    body: lines.join('\n'),
    contentType: 'text/plain',
  });
}

/** The first error a task logged, from its stream (a JSON object a line) or its record. */
export function taskError(body: string): string | undefined {
  const entries: Record<string, unknown>[] = [];
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) collect(item);
    } else if (value !== null && typeof value === 'object') {
      entries.push(value as Record<string, unknown>);
      for (const item of Object.values(value)) collect(item);
    }
  };

  for (const chunk of [body, ...body.split('\n')]) {
    try {
      collect(JSON.parse(chunk.replace(/^data:\s*/, '')));
    } catch {
      // Not JSON on its own: a partial line, or the whole of a stream.
    }
  }

  const failed = entries.find(
    (entry) => entry.level === 'ERROR' && typeof entry.message === 'string'
  );
  const message = failed?.message as string | undefined;
  // The first line only says how many things failed; the next ones say which.
  return message
    ?.split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('For further information'))
    .join(' · ')
    .slice(0, REASON_LENGTH);
}

/** `entitycore` for `https://…/api/entitycore/brain-atlas?page=1`, and the rest. */
function describeCall(url: string): { service: string; path: string } {
  const [service = '', ...rest] = (new URL(url).pathname.split('/api/')[1] ?? '').split('/');
  return { service: service || 'the app', path: `/${rest.join('/')}` };
}

const CALL = /^(GET|POST|PUT|PATCH|DELETE) (\S+) → (.*)$/;

/**
 * The one line most likely to explain a failure, in plain words, or nothing.
 *
 * The test's own error says what it waited for; this says what the backend did
 * meanwhile. Ranked by how surely each kind explains a failure: a task's own
 * error, a 5xx, a crashed tab, a call that got no answer, a refusal, a slow
 * call. Left out on purpose: navigations the page cancelled (`ERR_ABORTED`),
 * 404s and uncaught errors, which a healthy run has too, so naming them would
 * mislead the way a bare locator timeout does.
 */
export function causeOf(lines: readonly string[]): string | undefined {
  const blockedByCors = lines.some((line) => line.includes('blocked by CORS policy'));
  const ranked: { rank: number; text: string }[] = [];

  for (const line of lines) {
    if (line.startsWith('task error: ')) {
      ranked.push({ rank: 0, text: `The task failed: ${line.slice('task error: '.length)}` });
      continue;
    }
    if (line === 'the browser tab crashed') {
      ranked.push({ rank: 2, text: 'The browser tab crashed.' });
      continue;
    }

    const slow = line.match(/^slow: (\S+) (\S+) took (.+)$/);
    if (slow) {
      const [, method = '', url = '', took = ''] = slow;
      const { service, path } = describeCall(url);
      ranked.push({ rank: 5, text: `${service} took ${took} to answer ${method} ${path}` });
      continue;
    }

    const call = line.match(CALL);
    if (!call) continue;
    const [, method = '', url = '', outcome = ''] = call;
    if (!BACKEND.test(url)) continue;
    const { service, path } = describeCall(url);
    const status = outcome.match(/^(\d{3})\s*(.*)$/);

    if (status) {
      const code = Number(status[1]);
      if (code === 404) continue;
      const reason = status[2] ? `: ${status[2]}` : '';
      ranked.push({
        rank: code >= 500 ? 1 : 4,
        text: `${service} answered ${code} to ${method} ${path}${reason}`,
      });
    } else if (!outcome.includes('ERR_ABORTED')) {
      const cors = blockedByCors
        ? '; the browser blocked it (CORS), which is how a service that is down or failing looks from the page'
        : '';
      ranked.push({
        rank: 3,
        text: `${service} did not answer ${method} ${path} (${outcome}${cors})`,
      });
    }
  }

  return ranked.toSorted((left, right) => left.rank - right.rank)[0]?.text;
}
