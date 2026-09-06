import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { campaignTags, campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { expect, test } from '@fixtures/test';

const fixture = loadSeed(import.meta.dir);

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: campaignTimeout(fixture) });

test.describe('Electron microscopy circuit build', () => {
  for (const configuration of fixture.cases) {
    test(
      `Generate a build campaign and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page, workspace }) => {
        await openWorkflowsHub(page, workspace);

        await startWorkflow(page, fixture.activity, fixture.workflow);

        const missing = await chooseEntities(page, fixture.selection);
        test.skip(missing !== null, missing ?? '');

        await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));

        await runCampaign(page, fixture, configuration);
      }
    );
  }
});
