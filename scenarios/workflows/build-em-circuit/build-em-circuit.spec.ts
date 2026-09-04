import { checkCompletedOutput } from '@fixtures/check-campaign-output';
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

const fixture = loadScanConfigFixture('em-synapse-mapping.json');
const words = scanConfigWords[fixture.activity];

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: RUN_TIMEOUT + 120_000 });

test.describe('Electron microscopy circuit build', () => {
  for (const configuration of fixture.cases) {
    test(`builds: ${configuration.name}`, { tag: PRIVATE_SPENDS }, async ({ page, workspace }) => {
      const editor = scanConfigEditor(page);
      const results = scanConfigResults(page);

      await openWorkflowsHub(page, workspace);

      await startWorkflow(page, fixture.activity, fixture.workflow);

      const missing = await chooseEntities(page, fixture.selection);
      test.skip(missing !== null, missing ?? '');

      await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));

      await new ScanConfigDriver(page).apply(configuration);

      await expect(editor.submit).toHaveText(words.generate);
      await expect(editor.submit).toBeEnabled();
      await editor.submit.click();

      await expect(editor.tab(words.resultsTab)).toBeEnabled();
      await expect(editor.submit).toHaveText(words.newCampaign);
      await editor.tab(words.resultsTab).click();

      await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);
      await expect(results.inputs.locator('[data-file-name]')).not.toHaveCount(0);

      const status = results.coordinates.first().getByTestId('scan-config-status');
      await expect(status).toHaveText(/^created$/i);

      await results.launch.click();

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
