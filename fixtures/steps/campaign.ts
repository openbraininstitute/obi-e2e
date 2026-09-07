/** Filling a scan config from its seed, generating the campaign, and following it. */

import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import { expect, type Locator, type Page } from '@playwright/test';

import { checkCompletedOutput, checkGeneratedFiles } from '../checks/campaign-output';
import type { ScanConfigCase, ScanConfigFixture } from '../scan-config';
import { scanConfigWords } from '../scan-config/activities';
import { ScanConfigDriver } from '../scan-config/driver';
import { PRIVATE_SPENDS, SLOW } from '../tags';

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

/** Statuses a coordinate stops at. */
const SETTLED = /^(done|error)$/i;

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
  return configuration.slow ? [...PRIVATE_SPENDS, SLOW] : PRIVATE_SPENDS;
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

  await editor.submit.click();

  // Generating opens the results by itself.
  await expect(editor.tab(words.resultsTab)).toBeEnabled();

  await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);

  // The scenario reads the first coordinate, whatever the campaign holds.
  const status = results.coordinates.first().getByTestId('scan-config-status');
  await expect(status).toHaveText(/^created$/i);

  await checkGeneratedFiles(page, configuration);

  // Back on the form, the button offers a new campaign rather than the same one again.
  await editor.tab(CONFIGURATION_TAB).click();
  await expect(editor.submit).toHaveText(words.newCampaign);

  await editor.tab(words.resultsTab).click();

  await expect(results.launch).toContainText(words.launch);

  // A case the lab cannot afford to run stops with the button offered, unpressed.
  if (configuration.launch === false) return;

  await results.launch.click();

  if (fixture.workflow.confirmsCost) {
    await expect(results.costConfirm).toBeVisible();
    await results.costConfirm.click();
  }

  /* The app swallows a refused launch: a 403 lands in the console only, never on the page. */
  await expect(
    status,
    'The launch never took. The project is most likely out of credits — the refusal is ' +
      'only visible as a console error, so check the trace for POST /task/launch.'
  ).not.toHaveText(/^created$/i);

  if (!isFollowed(configuration)) return;

  await waitForCampaign(status, runMinutes(configuration));
  await expect(status).toHaveText(/^done$/i);

  await checkCompletedOutput(page, configuration);
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
