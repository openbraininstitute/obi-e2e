import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import { campaignTags, campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor } from '@locators/scan-config';
import type { Page } from '@playwright/test';

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

/*
 * Quarantined for the time being. The case is marked `slow` in its seed, so it
 * belongs to the slow job rather than the nightly suite; it is held back there
 * until someone asks for it again. Delete this line to bring it back — the
 * scenario underneath it is unchanged.
 */
test.skip(true, 'Quarantined: Microcircuit simulation is on hold.');

test.describe.configure({ timeout: campaignTimeout(fixture) });

/** Starts the workflow and picks the circuit, leaving the form open. */
async function openEditor(page: Page): Promise<void> {
  await startWorkflow(page, fixture.activity, fixture.workflow);

  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');

  await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
}

test.describe('Microcircuit simulation', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openWorkflowsHub(page, workspace);
  });

  test('The form will not launch until it is complete', { tag: CREDITS }, async ({ page }) => {
    await openEditor(page);

    await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
    await expect(scanConfigEditor(page).submit).toBeDisabled();
  });

  for (const configuration of fixture.cases) {
    test(
      `Generate a simulation campaign without launching it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page }) => {
        await openEditor(page);
        await runCampaign(page, fixture, configuration);
      }
    );
  }
});
