import { entitySlug, ExtendedEntitiesTypeDict } from '@fixtures/entity-types';
import { NO_NAVIGATION } from '@fixtures/interactions';
import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import { campaignTags, campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import type { Page } from '@playwright/test';

import { circuitDownloads } from './locators';

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

/** A circuit of one neuron is a synaptome, and its card opens it as one. */
const SYNAPTOME_PAGE = new RegExp(
  `/data/view/${entitySlug(ExtendedEntitiesTypeDict.SingleNeuronCircuit)}/`
);

/** What formatBytes prints in core-web-app: "512.3 KB". */
const FILE_SIZE = /\d+(\.\d+)? (Bytes|KB|MB|GB)/;

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));
test.describe.configure({ timeout: campaignTimeout(fixture) });

/** Starts the workflow and picks the parent circuit, leaving the form open. */
async function openEditor(page: Page): Promise<void> {
  await startWorkflow(page, fixture.activity, fixture.workflow);
  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');
  await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
}

test.describe('Circuit extraction from rCA1-CYLINDER-REF', () => {
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
      `Generate an extraction campaign and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page }) => {
        await openEditor(page);
        await runCampaign(page, fixture, configuration);

        // runCampaign leaves the card of the circuit the seed names open.
        const card = scanConfigResults(page).preview.entity;
        await expect(card.viewDetails).toHaveAttribute('href', SYNAPTOME_PAGE);

        await card.download.click(NO_NAVIGATION);
        const downloads = circuitDownloads(page);
        await expect(downloads.panel).toBeVisible();
        await expect(downloads.fullCircuit).toContainText('Download full circuit');
        await expect(downloads.fullCircuit).toContainText(FILE_SIZE);
      }
    );
  }
});
