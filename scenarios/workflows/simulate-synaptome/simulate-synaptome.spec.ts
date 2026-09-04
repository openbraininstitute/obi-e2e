import { checkCompletedOutput, checkGeneratedFiles } from '@fixtures/check-campaign-output';
import {
  loadScanConfigFixture,
  notDeployedHere,
  runsOnThisDeployment,
} from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config-activities';
import { ScanConfigDriver } from '@fixtures/scan-config-driver';
import { PRIVATE_SPENDS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/workflows';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';

const RUN_TIMEOUT = 300_000;

// Scenario: scenarios/workflows/simulate-synaptome/scenario.md
const fixture = loadScanConfigFixture('simulate-synaptome.json');
const words = scanConfigWords[fixture.activity];

// A workflow exists only on the deployments its fixture names, so a run pointed
// elsewhere skips the file rather than probing the hub and guessing.
test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: RUN_TIMEOUT + 120_000 });

test.describe('Synaptome simulation', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openWorkflowsHub(page, workspace);

    await startWorkflow(page, fixture.activity, fixture.workflow);

    const missing = await chooseEntities(page, fixture.selection);
    test.skip(missing !== null, missing ?? '');

    await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
  });

  test('will not launch an incomplete configuration', { tag: PRIVATE_SPENDS }, async ({ page }) => {
    // The schema demands a campaign name, so an editor that has only been given
    // an entity cannot be launched.
    await expect(scanConfigEditor(page).submit).toBeDisabled();
  });

  // One test per configuration, so they run in parallel and a failure names the
  // configuration that broke.
  for (const configuration of fixture.cases) {
    test(`simulates: ${configuration.name}`, { tag: PRIVATE_SPENDS }, async ({ page }) => {
      const editor = scanConfigEditor(page);
      const results = scanConfigResults(page);

      await new ScanConfigDriver(page).apply(configuration);

      await expect(editor.submit).toHaveText(words.generate);
      await expect(editor.submit).toBeEnabled();
      await editor.submit.click();

      // A campaign was created: its results tab, disabled until one exists,
      // opens, and the button now offers a new campaign.
      await expect(editor.tab(words.resultsTab)).toBeEnabled();
      await expect(editor.submit).toHaveText(words.newCampaign);
      await editor.tab(words.resultsTab).click();

      // One coordinate per combination of swept values: a stimulus given two
      // amplitudes is two simulations.
      await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);

      const status = results.coordinates.first().getByTestId('scan-config-status');
      await expect(status).toHaveText(/^created$/i);

      // Before the run, the coordinate carries the configuration the simulator
      // was given and has produced nothing.
      await checkGeneratedFiles(page, configuration);

      await expect(results.launch).toContainText(words.launch);
      await results.launch.click();

      // Spending credits is confirmed first, where the workflow can price it.
      if (fixture.workflow.confirmsCost) {
        await expect(results.costConfirm).toBeVisible();
        await results.costConfirm.click();
      }

      await expect(status).not.toHaveText(/^created$/i);
      await expect(status).toHaveText(/^done$/i, { timeout: RUN_TIMEOUT });

      await checkCompletedOutput(page, configuration);
    });
  }
});
