import { checkCompletedOutput } from '@fixtures/check-campaign-output';
import { enableFeature } from '@fixtures/feature-flags';
import {
  loadScanConfigFixture,
  notDeployedHere,
  runsOnThisDeployment,
} from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config-activities';
import { ScanConfigDriver } from '@fixtures/scan-config-driver';
import { PRIVATE } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/workflows';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';

// A build runs on the launch system, which takes a couple of minutes. The
// default test timeout is far shorter, so these tests set their own.
const RUN_TIMEOUT = 300_000;

// Scenario: scenarios/workflows/build-recording-array/scenario.md
const fixture = loadScanConfigFixture('extracellular-recording-array.json');
const words = scanConfigWords[fixture.activity];

// A workflow exists only on the deployments its fixture names, so a run pointed
// elsewhere skips the file rather than probing the hub and guessing.
test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: RUN_TIMEOUT + 120_000 });

test.describe('Extracellular recording array build', () => {
  // One test per configuration, so they run in parallel and a failure names the
  // configuration that broke.
  for (const configuration of fixture.cases) {
    test(
      `builds: ${configuration.name}`,
      { tag: PRIVATE },
      async ({ page, context, workspace, baseURL }) => {
        const editor = scanConfigEditor(page);
        const results = scanConfigResults(page);

        // The workflow is an experimental feature, off by default. Turning it on
        // is what a user does in the experimental-features panel; the test writes
        // the same cookie so the page renders with it from the first request.
        const flag = fixture.requires?.featureFlag;
        if (flag && baseURL) await enableFeature(context, flag, baseURL);

        await openWorkflowsHub(page, workspace);

        await startWorkflow(page, fixture.activity, fixture.workflow.type);

        const missing = await chooseEntities(page, fixture.selection);
        test.skip(missing !== null, missing ?? '');

        await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));

        await new ScanConfigDriver(page).apply(configuration);

        await expect(editor.submit).toHaveText(words.generate);
        await expect(editor.submit).toBeEnabled();
        await editor.submit.click();

        // A campaign was created: the results tab, disabled until one exists,
        // opens with one coordinate per grid point and the configuration obi-one
        // was given.
        await expect(editor.tab(words.resultsTab)).toBeEnabled();
        await expect(editor.submit).toHaveText(words.newCampaign);
        await editor.tab(words.resultsTab).click();

        await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);
        await expect(results.inputs.locator('[data-file-name]')).not.toHaveCount(0);

        const status = results.coordinates.first().getByTestId('scan-config-status');
        await expect(status).toHaveText(/^created$/i);

        await results.launch.click();

        // Running a build spends credits, so the application asks first.
        await expect(results.costConfirm).toBeVisible();
        await results.costConfirm.click();

        await expect(status).not.toHaveText(/^created$/i);

        // The launch system takes a couple of minutes: the coordinate goes
        // pending, then running, then done.
        await expect(status).toHaveText(/^done$/i, { timeout: RUN_TIMEOUT });

        await checkCompletedOutput(page, configuration);
      }
    );
  }
});
