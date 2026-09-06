import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import { campaignTags, campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { enableFeature } from '@fixtures/steps/feature-flags';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { PRIVATE_SPENDS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor } from '@locators/scan-config';
import type { BrowserContext, Page } from '@playwright/test';

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: campaignTimeout(fixture) });

type Workspace = { labId: string; projectId: string };

/**
 * Turns the feature on, opens the hub and picks the circuit, leaving the form
 * open. The flag is set before the first load, because the hub renders the card
 * disabled otherwise.
 */
async function openEditor(
  page: Page,
  context: BrowserContext,
  workspace: Workspace,
  baseURL: string | undefined
): Promise<void> {
  const flag = fixture.requires?.featureFlag;
  if (flag && baseURL) await enableFeature(context, flag, baseURL);

  await openWorkflowsHub(page, workspace);

  await startWorkflow(page, fixture.activity, fixture.workflow);

  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');

  await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
}

test.describe('Brain region simulation', () => {
  test(
    'The form will not launch until it is complete',
    { tag: PRIVATE_SPENDS },
    async ({ page, context, workspace, baseURL }) => {
      await openEditor(page, context, workspace, baseURL);

      await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
      await expect(scanConfigEditor(page).submit).toBeDisabled();
    }
  );

  for (const configuration of fixture.cases) {
    test(
      `Generate a simulation campaign and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page, context, workspace, baseURL }) => {
        await openEditor(page, context, workspace, baseURL);
        await runCampaign(page, fixture, configuration);
      }
    );
  }
});
