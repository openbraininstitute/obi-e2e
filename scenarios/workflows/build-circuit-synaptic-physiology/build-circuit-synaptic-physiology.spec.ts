import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { scanConfigWords } from '@fixtures/scan-config/activities';
import {
  campaignTags,
  campaignTimeout,
  registeredId,
  runCampaign,
  runForItsOutput,
} from '@fixtures/steps/campaign';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { scanConfigEditor } from '@locators/scan-config';
import type { Page } from '@playwright/test';

const fixture = loadSeed(import.meta.dir);
const words = scanConfigWords[fixture.activity];

/** The Paired neurons simulation of what the first configuration builds. */
const simulation = loadSeed(import.meta.dir, 'simulation.json');

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

test.describe.configure({ timeout: campaignTimeout(fixture) });

/** Starts the workflow and picks the circuit, leaving the form open. */
async function openEditor(page: Page): Promise<void> {
  await startWorkflow(page, fixture.activity, fixture.workflow);

  const missing = await chooseEntities(page, fixture.selection);
  test.skip(missing !== null, missing ?? '');

  await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
}

test.describe('Circuit synaptic physiology build', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await openWorkflowsHub(page, workspace);
  });

  test('The form will not launch until it is complete', { tag: CREDITS }, async ({ page }) => {
    await openEditor(page);

    await expect(scanConfigEditor(page).submit).toHaveText(words.generate);
    await expect(scanConfigEditor(page).submit).toBeDisabled();
  });

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

  test(
    'Simulate the circuit the build registered',
    { tag: CREDITS },
    async ({ page, workspace }) => {
      const [build] = fixture.cases;
      const [run] = simulation.cases;
      const [circuit] = simulation.selection.mode === 'single' ? simulation.selection.entities : [];
      if (!build || !run || !circuit) {
        throw new Error('The seed and simulation.json each need a configuration, and a circuit.');
      }

      // The build comes first, so the clock covers both runs.
      test.setTimeout(campaignTimeout(fixture) + campaignTimeout(simulation));

      await openEditor(page);
      await runForItsOutput(page, fixture, build);
      const circuitId = await registeredId(page, circuit);

      await openWorkflowsHub(page, workspace);
      await startWorkflow(page, simulation.activity, simulation.workflow);

      const missing = await chooseEntities(page, simulation.selection, circuitId);
      expect(
        missing,
        'The build registered the circuit, but Simulate does not offer it.'
      ).toBeNull();

      await runCampaign(page, simulation, run);
    }
  );
});
