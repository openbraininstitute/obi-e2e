import { checkCompletedOutput, checkGeneratedFiles } from '@fixtures/checks/campaign-output';
import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import { ScanConfigDriver } from '@fixtures/scan-config/driver';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { PRIVATE_SPENDS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import type { Page } from '@playwright/test';

const RUN_TIMEOUT = 300_000;

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

/** This workflow browses for nothing, so the form is where starting it lands. */
const FORM_URL = new RegExp(`/configure/${fixture.workflow.type}`);

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: RUN_TIMEOUT + 120_000 });

/** Starts the workflow, leaving the form open. */
async function openEditor(page: Page): Promise<void> {
  await startWorkflow(page, fixture.activity, fixture.workflow);

  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');

  await expect(page).toHaveURL(FORM_URL);
}

test.describe('Ion channel simulation', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openWorkflowsHub(page, workspace);
  });

  test(
    'The form will not launch until it is complete',
    { tag: PRIVATE_SPENDS },
    async ({ page }) => {
      await startWorkflow(page, fixture.activity, fixture.workflow);

      await expect(page).toHaveURL(FORM_URL);

      await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
      await expect(scanConfigEditor(page).submit).toBeDisabled();
    }
  );

  for (const configuration of fixture.cases) {
    test(
      `Generate a simulation campaign and launch it: ${configuration.name}`,
      { tag: PRIVATE_SPENDS },
      async ({ page }) => {
        const editor = scanConfigEditor(page);
        const results = scanConfigResults(page);

        await openEditor(page);

        await new ScanConfigDriver(page).apply(configuration);

        await expect(editor.submit).toHaveText(words.generate);
        await expect(editor.submit).toBeEnabled();

        await editor.submit.click();

        await expect(editor.tab(words.resultsTab)).toBeEnabled();
        await expect(editor.submit).toHaveText(words.newCampaign);

        await editor.tab(words.resultsTab).click();

        await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);

        // The scenario reads the first coordinate, whatever the campaign holds.
        const status = results.coordinates.first().getByTestId('scan-config-status');
        await expect(status).toHaveText(/^created$/i);

        await checkGeneratedFiles(page, configuration);

        await expect(results.launch).toContainText(words.launch);

        await results.launch.click();

        await expect(results.costConfirm).toBeVisible();

        await results.costConfirm.click();

        await expect(status).not.toHaveText(/^created$/i);
        await expect(status).toHaveText(/^done$/i, { timeout: RUN_TIMEOUT });

        await checkCompletedOutput(page, configuration);
      }
    );
  }
});
