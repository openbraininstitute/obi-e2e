/** Filling a scan config from its seed, generating the campaign, and following it. */

import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import { lowCredits } from '@locators/workflows';
import { expect, type Locator, type Page, type Request, type Response } from '@playwright/test';

import { checkCompletedOutput, checkGeneratedFiles } from '../checks/campaign-output';
import { NO_NAVIGATION } from '../interactions';
import { pageProblems } from '../run/page-problems';
import type { ScanConfigCase, ScanConfigFixture } from '../scan-config';
import { scanConfigWords } from '../scan-config/activities';
import { ScanConfigDriver } from '../scan-config/driver';
import { CREDITS, SLOW } from '../tags';

/** How long an ordinary run may take. */
const RUN_MINUTES = 5;

/**
 * How long a run marked `slow` may take.
 *
 * Generous on purpose: the point of the mark is that nobody wants to guess the
 * number. The job that runs these gets six hours, so this leaves it room.
 */
const SLOW_MINUTES = 240;

/** Filling the form either side of the run costs a few minutes of the clock. */
const FORM_MINUTES = 3;

/** The tab the form itself sits on. Every activity names it the same. */
const CONFIGURATION_TAB = 'configuration';

/** How often the page is asked again while a run is in flight. */
const POLL_INTERVAL = 15_000;

/**
 * How long the call behind a button may take.
 *
 * Generating a grid is server work, not an element appearing, and the two do
 * not belong on the same clock. A brain-region circuit was measured at 39s
 * against staging on 2026-09-08 — under the assertion default of 30s the run
 * reported it as a results tab that never enabled, and every wait downstream
 * of it failed the same way. The editor's own assertions keep the 30s.
 */
const CALL_TIMEOUT = 120_000;

/** Statuses a coordinate stops at. */
const SETTLED = /^(done|error)$/i;

/** The POST behind the Generate button. Each activity has a grid endpoint of its own. */
const GENERATES_THE_CAMPAIGN = /scan-config-generate-grid/;

/**
 * The POST behind the Launch button.
 *
 * Which service runs a campaign depends on the workflow: obi-one launches a
 * declared task, the small-scale simulator runs a batch of its own.
 */
const LAUNCHES_THE_CAMPAIGN = /\/declared\/task\/launch|\/circuit\/simulation\/run-batch/;

/** Whether this case is followed to the end at all. */
function isFollowed(configuration: ScanConfigCase): boolean {
  return configuration.expect.completed !== undefined;
}

/** How long this case's run may take. */
function runMinutes(configuration: ScanConfigCase): number {
  return configuration.slow ? SLOW_MINUTES : RUN_MINUTES;
}

/**
 * The tag one campaign case runs under.
 *
 * A case its seed marks `slow` sits out the nightly suite and runs in the job
 * that has hours to spare.
 */
export function campaignTags(configuration: ScanConfigCase): string[] {
  return configuration.slow ? [...CREDITS, SLOW] : CREDITS;
}

/** Time on the clock for the slowest case in a scenario. */
export function campaignTimeout(fixture: ScanConfigFixture): number {
  const slowest = Math.max(...fixture.cases.map(runMinutes));
  return (slowest + FORM_MINUTES) * 60_000;
}

/**
 * Fills the open form from one configuration, generates the campaign, launches
 * it, and follows it as far as the seed asks.
 *
 * A configuration that says what the finished run holds is followed to "done"
 * and read; one that says nothing only has to start; one marked `launch: false`
 * stops before it starts at all. See `waitForCampaign` for why the wait is a
 * reload rather than a stare.
 */
export async function runCampaign(
  page: Page,
  fixture: ScanConfigFixture,
  configuration: ScanConfigCase
): Promise<void> {
  const editor = scanConfigEditor(page);
  const results = scanConfigResults(page);
  const words = scanConfigWords[fixture.activity];

  await new ScanConfigDriver(page).apply(configuration);

  await expect(editor.submit).toHaveText(words.generate);
  await expect(editor.submit).toBeEnabled();

  const generated = callSent(page, GENERATES_THE_CAMPAIGN);
  await editor.submit.click(NO_NAVIGATION);
  await expectAccepted(page, generated, 'Generating the campaign');

  // Accepted, so the results open by themselves.
  await expect(editor.tab(words.resultsTab)).toBeEnabled();

  await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);

  // The scenario reads the first coordinate, whatever the campaign holds.
  const status = results.coordinates.first().getByTestId('scan-config-status');
  await expect(status).toHaveText(/^created$/i);

  await checkGeneratedFiles(page, configuration);

  // Back on the form, the button offers a new campaign rather than the same one again.
  await openTab(page, editor, CONFIGURATION_TAB);
  await expect(editor.submit).toHaveText(words.newCampaign);

  await openTab(page, editor, words.resultsTab);

  await expect(results.launch).toContainText(words.launch);

  // A case the lab cannot afford to run stops with the button offered, unpressed.
  if (configuration.launch === false) return;

  const launched = callSent(page, LAUNCHES_THE_CAMPAIGN);
  await results.launch.click(NO_NAVIGATION);

  if (fixture.workflow.confirmsCost) {
    await expect(results.costConfirm).toBeVisible();
    await results.costConfirm.click(NO_NAVIGATION);
  }

  await expectAccepted(page, launched, 'Launching the campaign');

  await expect(
    status,
    'The launch was accepted, but the coordinate never left "created".'
  ).not.toHaveText(/^created$/i);

  if (!isFollowed(configuration)) return;

  await waitForCampaign(status, runMinutes(configuration));
  await expect(status).toHaveText(/^done$/i);

  await checkCompletedOutput(page, configuration);
}

/**
 * The call a button sends, watched from before the click.
 *
 * The app swallows what these answer — a 403 refusing a launch reaches the
 * console and nothing else, a 500 refusing to generate leaves the results tab
 * disabled and nothing on the page — so a run that watches only the editor
 * reports every backend refusal as an element that never moved. The call is
 * where the reason is.
 */
function callSent(page: Page, url: RegExp): Promise<CallOutcome> {
  const matches = (request: Request) => request.method() === 'POST' && url.test(request.url());

  const answered = page
    .waitForResponse((response) => matches(response.request()), { timeout: CALL_TIMEOUT })
    .then((response): CallOutcome => ({ response }))
    .catch(() => null);

  // A request the browser drops answers nothing, so the response wait alone
  // reports it as a button that sent nothing at all.
  const dropped = page
    .waitForEvent('requestfailed', { predicate: matches, timeout: CALL_TIMEOUT })
    .then((request): CallOutcome => ({ dropped: request.failure()?.errorText ?? 'failed' }))
    .catch(() => null);

  return Promise.race([answered, dropped]);
}

/** What a call did: answered, dropped by the browser, or never sent. */
type CallOutcome = { response: Response } | { dropped: string } | null;

/** Fails naming what the service said, rather than what the editor did not do. */
async function expectAccepted(page: Page, call: Promise<CallOutcome>, what: string): Promise<void> {
  const outcome = await call;

  if (outcome === null) {
    // The app refused before sending: no credits shows a notice and stops here.
    throw new Error(`${what} sent no request${await whatTheAppSaid(page)}.${alsoSeen(page)}`);
  }

  if ('dropped' in outcome) {
    // The app catches this one and puts it in a notification.
    throw new Error(
      `${what} never reached the service: ${outcome.dropped}` +
        `${await whatTheAppSaid(page)}.${alsoSeen(page)}`
    );
  }

  if (!outcome.response.ok()) {
    const said = await outcome.response
      .text()
      .then((body) => body.replaceAll(/\s+/g, ' ').trim())
      .catch(() => '');
    throw new Error(
      `${what} was refused: ${outcome.response.status()} ${outcome.response.url()} ${said}`
    );
  }
}

async function whatTheAppSaid(page: Page): Promise<string> {
  const notice = lowCredits(page)
    .notice.or(page.getByRole('alert').filter({ hasText: /\S/ }))
    .first();

  const said = await notice
    .innerText()
    .then((text) => text.trim().replaceAll(/\s+/g, ' '))
    .catch(() => '');

  return said === '' ? '' : `, and said "${said}"`;
}

function alsoSeen(page: Page): string {
  const problems = pageProblems(page);
  return problems.length === 0 ? '' : `\nThe page also saw:\n${problems.join('\n')}`;
}

/**
 * Moves to one of the editor's tabs.
 *
 * The pointer is left wherever the last click landed, and a tooltip that opens
 * under it is drawn into a popper that can cover the tab bar and swallow every
 * click until the action gives up — thirty seconds spent being told that
 * "virtual" intercepts pointer events. Escape closes whatever is showing, and
 * what it dismissed stays shut until the pointer leaves and comes back, which
 * the click itself does.
 */
async function openTab(
  page: Page,
  editor: ReturnType<typeof scanConfigEditor>,
  id: string
): Promise<void> {
  await page.keyboard.press('Escape');
  await editor.tab(id).click(NO_NAVIGATION);
}

/**
 * Waits for a coordinate to stop moving.
 *
 * The wait stays on the page it launched from. A campaign is held in the
 * editor's own state rather than in the URL, so reloading loses it: the page
 * comes back on the configuration tab with no coordinates to read. That rules
 * out the usual trick of polling a fresh page, and it is why a run longer than
 * the `@slow` job can hold has to be picked up from the Workflows activity
 * table instead of followed from here.
 *
 * `toPass` rather than a single long `toHaveText`, so a run that ends in
 * "error" is reported as that instead of as a timeout with nothing to say.
 */
export async function waitForCampaign(status: Locator, minutes: number): Promise<void> {
  await expect(async () => {
    const text = (await status.innerText()).trim();
    expect(text, `The campaign is still "${text}".`).toMatch(SETTLED);
  }).toPass({ timeout: minutes * 60_000, intervals: [POLL_INTERVAL] });
}
