import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import {
  campaignTags,
  campaignTimeout,
  runCampaign,
  runForItsOutput,
} from '@fixtures/steps/campaign';
import { enableFeature } from '@fixtures/steps/feature-flags';
import { openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor } from '@locators/scan-config';
import type { Page } from '@playwright/test';

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

/** The extraction whose e-features the optimization aims at: a new project holds none. */
const targets = loadSeed(import.meta.dir, 'targets.json');
const [extraction] = targets.cases;

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));
test.skip(!runsOnThisDeployment(targets), notDeployedHere(targets));

// Every campaign case extracts its targets first, so the clock covers both runs.
test.describe.configure({ timeout: campaignTimeout(targets) + campaignTimeout(fixture) });

/** Starts a workflow that browses for nothing, so its form is where starting it lands. */
async function openForm(page: Page, of: typeof fixture): Promise<void> {
  await startWorkflow(page, of.activity, of.workflow);

  await expect(page).toHaveURL(new RegExp(`/configure/${of.workflow.type}`));
}

test.describe('E-model optimization', () => {
  test.beforeEach(async ({ page, context, workspace, baseURL }) => {
    // Before the hub loads: a deployment still gating the extraction renders its card disabled.
    const flag = targets.requires?.featureFlag;
    if (flag && baseURL) await enableFeature(context, flag, baseURL);

    await openWorkflowsHub(page, workspace);
  });

  test('The form will not launch until it is complete', { tag: CREDITS }, async ({ page }) => {
    await openForm(page, fixture);

    await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
    await expect(scanConfigEditor(page).submit).toBeDisabled();
  });

  for (const configuration of fixture.cases) {
    test(
      `Optimize an e-model against extracted e-features and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page, workspace }) => {
        if (!extraction) throw new Error('targets.json holds no extraction to run.');

        await openForm(page, targets);
        await runForItsOutput(page, targets, extraction);

        await openWorkflowsHub(page, workspace);
        await openForm(page, fixture);
        await runCampaign(page, fixture, configuration);
      }
    );
  }
});
