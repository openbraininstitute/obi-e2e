import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import { addLocationsFromViewer, ScanConfigDriver } from '@fixtures/scan-config/driver';
import { campaignTags, campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { pretendNoCredits } from '@fixtures/steps/credits';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { PRIVATE_SPENDS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor } from '@locators/scan-config';
import { morphologyLocations, morphologyViewer } from '@locators/viewer';
import { lowCredits } from '@locators/workflows';
import type { Page } from '@playwright/test';

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];
const simpleCase = firstCase(fixture);

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: campaignTimeout(fixture) });

/** Starts the workflow and picks the ME-model, leaving the form open. */
async function openEditor(page: Page): Promise<void> {
  await startWorkflow(page, fixture.activity, fixture.workflow);

  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');

  await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
}

/** Adds an Explicit Morphology Locations strategy, so its panel shows. */
async function addExplicitLocations(page: Page): Promise<void> {
  const editor = scanConfigEditor(page);

  await editor.rootElement('morphology_locations').click();
  await editor.addEntry('morphology_locations').click();
  await editor.variant('ExplicitMorphologyLocations').click();

  await expect(morphologyLocations(page).panel).toBeVisible();
}

test.describe('Synaptome build', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openWorkflowsHub(page, workspace);
  });

  test(
    'The form will not launch until it is complete',
    { tag: PRIVATE_SPENDS },
    async ({ page }) => {
      await openEditor(page);

      await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
      await expect(scanConfigEditor(page).submit).toBeDisabled();
    }
  );

  test(
    'A project with no credits cannot generate a campaign',
    { tag: PRIVATE_SPENDS },
    async ({ page, workspace }) => {
      const editor = scanConfigEditor(page);

      await openEditor(page);
      await pretendNoCredits(page, workspace.projectId);
      await page.reload({ waitUntil: 'domcontentloaded' });

      await expect(editor.submit).toBeVisible();

      await new ScanConfigDriver(page).apply(simpleCase);

      await expect(editor.submit).toHaveText(words.generate);
      await expect(editor.submit).toBeEnabled();

      await editor.submit.click();

      await expect(lowCredits(page).notice).toBeVisible();
      await expect(editor.tab(words.resultsTab)).toBeDisabled();
      await expect(editor.submit).toHaveText(words.generate);
    }
  );

  for (const configuration of fixture.cases) {
    test(
      `Generate a build campaign and launch it: ${configuration.name}`,
      { tag: campaignTags(configuration) },
      async ({ page }) => {
        await openEditor(page);
        await runCampaign(page, fixture, configuration);
      }
    );
  }

  test('Clicking a neurite adds a location', { tag: PRIVATE_SPENDS }, async ({ page }) => {
    const locations = morphologyLocations(page);

    await openEditor(page);
    await addExplicitLocations(page);

    await expect(locations.rows).toHaveCount(0);

    await addLocationsFromViewer(page, 2);

    await expect(locations.rows).toHaveCount(2);
    await expect(locations.sectionId(0)).not.toHaveValue('');
    await expect(locations.sectionId(0)).toBeDisabled();
    await expect(locations.offset(0)).toBeEnabled();
  });

  test('An offset stays inside its section', { tag: PRIVATE_SPENDS }, async ({ page }) => {
    const locations = morphologyLocations(page);

    await openEditor(page);
    await addExplicitLocations(page);
    await addLocationsFromViewer(page, 1);

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

  test('A synapse group keeps its last location', { tag: PRIVATE_SPENDS }, async ({ page }) => {
    const locations = morphologyLocations(page);

    await openEditor(page);
    await addExplicitLocations(page);
    await addLocationsFromViewer(page, 2);

    await locations.remove(0).click();

    await expect(locations.rows).toHaveCount(1);
    await expect(locations.remove(0)).toHaveCount(0);
  });

  test(
    'Look at the morphology as a dendrogram and back',
    { tag: PRIVATE_SPENDS },
    async ({ page }) => {
      const viewer = morphologyViewer(page);

      await openEditor(page);
      await expect(viewer.scene).toBeVisible();

      await expect(viewer.mode.visualization).toHaveAttribute('aria-pressed', 'true');
      await expect(viewer.mode.dendrogram).toHaveAttribute('aria-pressed', 'false');

      await viewer.mode.dendrogram.click();

      await expect(viewer.mode.dendrogram).toHaveAttribute('aria-pressed', 'true');
      await expect(viewer.mode.visualization).toHaveAttribute('aria-pressed', 'false');

      await viewer.mode.visualization.click();

      await expect(viewer.mode.visualization).toHaveAttribute('aria-pressed', 'true');
    }
  );

  test('Turn the axon on and off', { tag: PRIVATE_SPENDS }, async ({ page }) => {
    const viewer = morphologyViewer(page);

    await openEditor(page);
    await expect(viewer.scene).toBeVisible();

    await viewer.settings.click();

    await expect(viewer.toggle.axons).toBeVisible();
    await expect(viewer.toggle.axons).not.toBeChecked();

    await viewer.toggle.axons.click();

    await expect(viewer.toggle.axons).toBeChecked();

    await viewer.toggle.axons.click();

    await expect(viewer.toggle.axons).not.toBeChecked();
  });

  test('Add a zoom slider to the viewer', { tag: PRIVATE_SPENDS }, async ({ page }) => {
    const viewer = morphologyViewer(page);

    await openEditor(page);
    await expect(viewer.scene).toBeVisible();

    await expect(viewer.zoomSlider).toHaveCount(0);

    await viewer.settings.click();

    await expect(viewer.toggle.zoomSlider).not.toBeChecked();

    await viewer.toggle.zoomSlider.click();

    await expect(viewer.toggle.zoomSlider).toBeChecked();
    await expect(viewer.zoomSlider).toBeVisible();

    await viewer.toggle.zoomSlider.click();

    await expect(viewer.zoomSlider).toHaveCount(0);
  });

  test(
    'The viewer opens with a scale bar and a solid neuron',
    { tag: PRIVATE_SPENDS },
    async ({ page }) => {
      const viewer = morphologyViewer(page);

      await openEditor(page);
      await expect(viewer.scene).toBeVisible();

      await viewer.settings.click();

      await expect(viewer.toggle.scaleBar).toBeChecked();
      await expect(viewer.slider.neuronOpacity).toContainText('100%');
    }
  );
});

function firstCase(loaded: typeof fixture) {
  const [first] = loaded.cases;
  if (!first) throw new Error(`${loaded.name} declares no configurations to run.`);
  return first;
}
