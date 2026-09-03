import { pretendNoCredits } from '@fixtures/credits';
import { loadScanConfigFixture } from '@fixtures/scan-config';
import { addLocationsFromViewer, ScanConfigDriver } from '@fixtures/scan-config-driver';
import { PRIVATE } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/workflows';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import { morphologyLocations, morphologyViewer } from '@locators/viewer';
import { lowCredits } from '@locators/workflows';
import type { Locator, Page } from '@playwright/test';

// A build runs on the launch system, which takes a couple of minutes. The
// default test timeout is far shorter, so these tests set their own.
const RUN_TIMEOUT = 300_000;

// Scenario: scenarios/workflows/build-synaptome/scenario.md
const fixture = loadScanConfigFixture('build-synaptome.json');
/** The plainest configuration, used where a test needs any valid one. */
const simpleCase = firstCase(fixture);

test.describe.configure({ timeout: RUN_TIMEOUT + 120_000 });

/**
 * Asserts a panel holds exactly these files, in any order. Exactly, so a file
 * the application starts or stops producing fails here rather than passing
 * unnoticed.
 */
async function expectFiles(panel: Locator, names: string[]): Promise<void> {
  await expect(panel.locator('[data-file-name]')).toHaveCount(names.length);

  for (const name of names) {
    await expect(panel.locator(`[data-file-name="${name}"]`)).toBeVisible();
  }
}

/** Opens the editor on a chosen ME-model, or says why it could not. */
async function openEditor(page: Page, workspace: { labId: string; projectId: string }) {
  await openWorkflowsHub(page, workspace);

  const unavailable = await startWorkflow(page, fixture.activity, fixture.workflow.type);
  test.skip(unavailable !== null, unavailable ?? '');

  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');

  await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
}

test.describe('Synaptome build', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openEditor(page, workspace);
  });

  test('will not launch an incomplete configuration', { tag: PRIVATE }, async ({ page }) => {
    // The schema demands a campaign name and at least one synapse group, so an
    // editor that has only been given an ME-model cannot be launched.
    await expect(scanConfigEditor(page).submit).toBeDisabled();
  });

  test(
    'refuses to generate a campaign with no credits',
    { tag: PRIVATE },
    async ({ page, workspace }) => {
      const editor = scanConfigEditor(page);

      // The balance is fetched once when the editor opens, so the answer is put
      // in place and the page reloaded. The workflow session lives in the URL
      // and survives that.
      await pretendNoCredits(page, workspace.projectId);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(editor.submit).toBeVisible();

      await new ScanConfigDriver(page).apply(simpleCase);

      // The configuration is complete, so nothing about the form says no.
      await expect(editor.submit).toHaveText(simpleCase.expect.submitLabel);
      await expect(editor.submit).toBeEnabled();
      await editor.submit.click();

      // The project cannot pay for the run, so it is stopped before anything is
      // created: no campaign, and the button still offers this one.
      await expect(lowCredits(page).notice).toBeVisible();
      await expect(editor.tab('results')).toBeDisabled();
      await expect(editor.submit).toHaveText(simpleCase.expect.submitLabel);
    }
  );

  // One test per configuration, so they run in parallel and a failure names the
  // configuration that broke.
  for (const configuration of fixture.cases) {
    test(`builds: ${configuration.name}`, { tag: PRIVATE }, async ({ page }) => {
      const editor = scanConfigEditor(page);
      const results = scanConfigResults(page);

      await new ScanConfigDriver(page).apply(configuration);

      await expect(editor.submit).toHaveText(configuration.expect.submitLabel);
      await expect(editor.submit).toBeEnabled();
      await editor.submit.click();

      // A campaign was created: the results tab, disabled until one exists,
      // opens, and the button now offers a new campaign rather than relaunching
      // this one.
      await expect(editor.tab('results')).toBeEnabled();
      await expect(editor.submit).toHaveText('New build campaign');
      await editor.tab('results').click();

      // One coordinate per combination of swept values.
      await expect(results.coordinates).toHaveCount(configuration.expect.coordinateCount);

      const status = results.coordinates.first().getByTestId('scan-config-status');
      await expect(status).toHaveText(/^created$/i);

      // Before the run, the coordinate carries only the configuration obi-one
      // was given, and has produced nothing.
      const generated = configuration.expect.generated;
      if (generated) {
        await expectFiles(results.inputs, generated.inputs);
        await expectFiles(results.outputs, generated.outputs);
      }

      await expect(results.launch).toHaveText(/Launch builds/);
      await results.launch.click();

      // Running a build spends credits, so the application asks first.
      await expect(results.costConfirm).toBeVisible();
      await results.costConfirm.click();

      // The launch system takes a couple of minutes: the coordinate goes
      // pending, then running, then done.
      await expect(status).not.toHaveText(/^created$/i);
      await expect(status).toHaveText(/^done$/i, { timeout: RUN_TIMEOUT });

      const completed = configuration.expect.completed;
      if (completed) {
        await expectFiles(results.inputs, completed.inputs);
        await expectFiles(results.outputs, completed.outputs);
      }

      // The two outputs are different kinds of thing and the pane beside them
      // shows each differently: the logs are a stream, the synaptome is an
      // entity that was registered.
      await results.file('Task logs').click();
      await expect(results.logs).toContainText('Task execution completed.');
      await expect(results.preview.entity.card).toHaveCount(0);

      const built = configuration.expect.built;
      if (built) {
        await results.file(built.name).click();

        await expect(results.preview.entity.card).toBeVisible();
        await expect(results.preview.entity.name).toHaveText(built.name);
        // It is a registered entity, so it can be downloaded and opened in full.
        await expect(results.preview.entity.viewDetails).toBeVisible();
        await expect(results.preview.entity.download).toBeVisible();

        // What the build actually produced, read off its preview.
        for (const [label, shown] of Object.entries(built.properties)) {
          await expect(results.preview.entity.properties.filter({ hasText: label })).toContainText(
            shown
          );
        }
      }
    });
  }
});

test.describe('Synaptome build, picking locations on the morphology', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openEditor(page, workspace);

    // Every test here needs somewhere to put the locations, which is what this
    // placement strategy is.
    const editor = scanConfigEditor(page);
    await editor.rootElement('morphology_locations').click();
    await editor.addEntry('morphology_locations').click();
    await editor.variant('ExplicitMorphologyLocations').click();
    await expect(morphologyLocations(page).panel).toBeVisible();
  });

  test('adds a location for each click on a neurite', { tag: PRIVATE }, async ({ page }) => {
    const locations = morphologyLocations(page);

    await expect(locations.rows).toHaveCount(0);
    await addLocationsFromViewer(page, 2);
    await expect(locations.rows).toHaveCount(2);

    // The section id is a SONATA index the viewer supplies, so it is filled in
    // and left read-only; the offset along it is the part a user sets.
    await expect(locations.sectionId(0)).not.toHaveValue('');
    await expect(locations.sectionId(0)).toBeDisabled();
    await expect(locations.offset(0)).toBeEnabled();
  });

  test('keeps the offset within its section', { tag: PRIVATE }, async ({ page }) => {
    const locations = morphologyLocations(page);
    await addLocationsFromViewer(page, 1);

    // An offset is a fraction of the way along a section, so it cannot leave
    // [0, 1]. The input clamps rather than storing a value obi-one would reject,
    // and reads back at the step's own precision.
    await locations.offset(0).fill('0.5');
    await locations.offset(0).blur();
    await expect(locations.offset(0)).toHaveValue('0.50');

    await locations.offset(0).fill('1.4');
    await locations.offset(0).blur();
    await expect(locations.offset(0)).toHaveValue('1.00');

    await locations.offset(0).fill('-0.3');
    await locations.offset(0).blur();
    await expect(locations.offset(0)).toHaveValue('0.00');
  });

  test('removes a location, and keeps the last one', { tag: PRIVATE }, async ({ page }) => {
    const locations = morphologyLocations(page);
    await addLocationsFromViewer(page, 2);

    await locations.remove(0).click();
    await expect(locations.rows).toHaveCount(1);

    // obi-one needs at least one location, so the last row offers no way out.
    await expect(locations.remove(0)).toHaveCount(0);
  });
});

test.describe('The morphology viewer', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openEditor(page, workspace);
    await expect(morphologyViewer(page).scene).toBeVisible();
  });

  test('draws the morphology as a dendrogram and back', { tag: PRIVATE }, async ({ page }) => {
    const viewer = morphologyViewer(page);

    await expect(viewer.mode.visualization).toHaveAttribute('aria-pressed', 'true');
    await expect(viewer.mode.dendrogram).toHaveAttribute('aria-pressed', 'false');

    await viewer.mode.dendrogram.click();
    await expect(viewer.mode.dendrogram).toHaveAttribute('aria-pressed', 'true');
    await expect(viewer.mode.visualization).toHaveAttribute('aria-pressed', 'false');

    await viewer.mode.visualization.click();
    await expect(viewer.mode.visualization).toHaveAttribute('aria-pressed', 'true');
  });

  test('turns the axons on and off', { tag: PRIVATE }, async ({ page }) => {
    const viewer = morphologyViewer(page);

    await viewer.settings.click();
    await expect(viewer.toggle.axons).toBeVisible();

    // A morphology opens without its axon, which is the part that leaves the
    // frame and dwarfs the dendrites.
    await expect(viewer.toggle.axons).not.toBeChecked();
    await viewer.toggle.axons.click();
    await expect(viewer.toggle.axons).toBeChecked();

    await viewer.toggle.axons.click();
    await expect(viewer.toggle.axons).not.toBeChecked();
  });

  test('puts a zoom slider on the scene when asked', { tag: PRIVATE }, async ({ page }) => {
    const viewer = morphologyViewer(page);

    // The scene opens without one: the pointer already zooms.
    await expect(viewer.zoomSlider).toHaveCount(0);

    await viewer.settings.click();
    await expect(viewer.toggle.zoomSlider).not.toBeChecked();
    await viewer.toggle.zoomSlider.click();
    await expect(viewer.toggle.zoomSlider).toBeChecked();

    await expect(viewer.zoomSlider).toBeVisible();

    await viewer.toggle.zoomSlider.click();
    await expect(viewer.zoomSlider).toHaveCount(0);
  });

  test('keeps the scale bar and the neuron opacity', { tag: PRIVATE }, async ({ page }) => {
    const viewer = morphologyViewer(page);

    await viewer.settings.click();
    await expect(viewer.toggle.scaleBar).toBeChecked();
    await expect(viewer.slider.neuronOpacity).toContainText('100%');
  });
});

function firstCase(loaded: typeof fixture) {
  const [first] = loaded.cases;
  if (!first) throw new Error(`${loaded.name} declares no configurations to run.`);
  return first;
}
