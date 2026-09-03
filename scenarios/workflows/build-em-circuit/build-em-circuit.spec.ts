import { loadScanConfigFixture } from '@fixtures/scan-config';
import { ScanConfigDriver } from '@fixtures/scan-config-driver';
import { PRIVATE } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/workflows';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';

// A build runs on the launch system, which takes a couple of minutes. The
// default test timeout is far shorter, so these tests set their own.
const RUN_TIMEOUT = 300_000;

// Scenario: scenarios/workflows/build-em-circuit/scenario.md
const fixture = loadScanConfigFixture('em-synapse-mapping.json');

test.describe.configure({ timeout: RUN_TIMEOUT + 120_000 });

test.describe('Electron microscopy circuit build', () => {
  // One test per configuration, so they run in parallel and a failure names the
  // configuration that broke.
  for (const configuration of fixture.cases) {
    test(`builds: ${configuration.name}`, { tag: PRIVATE }, async ({ page, workspace }) => {
      const editor = scanConfigEditor(page);
      const results = scanConfigResults(page);

      await openWorkflowsHub(page, workspace);

      const unavailable = await startWorkflow(page, fixture.activity, fixture.workflow.type);
      test.skip(unavailable !== null, unavailable ?? '');

      // The morphologies come from an electron microscopy dense reconstruction
      // dataset, which a project without that data does not have.
      const missing = await chooseEntities(page, fixture.selection);
      test.skip(missing !== null, missing ?? '');

      await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));

      await new ScanConfigDriver(page).apply(configuration);

      await expect(editor.submit).toHaveText(configuration.expect.submitLabel);
      await expect(editor.submit).toBeEnabled();
      await editor.submit.click();

      // A campaign was created: the results tab, disabled until one exists,
      // opens with one coordinate per grid point and the configuration obi-one
      // was given.
      await expect(editor.tab('results')).toBeEnabled();
      await expect(editor.submit).toHaveText('New build campaign');
      await editor.tab('results').click();

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

      // This workflow has never been run through end to end, so there is no
      // list of files to hold it to yet. Fill in `expect.completed` in its
      // fixture from a real run, as the synaptome build does.
      await expect(results.outputs.locator('[data-file-name]')).not.toHaveCount(0);
    });
  }
});
