/**
 * The Microcircuit simulation of layer 4, from the project home to the launch
 * button, in one take.
 *
 * `video-recording.md` beside this file is the storyboard; each of its scenes
 * is one `test.step` here, named in the report. The path is the spec's own,
 * from `@fixtures/steps`; the viewer tour, the renames and the callouts are the
 * film's. The demo was shot with the `circuit-morphologies` feature flag on,
 * so the film turns it on. Like the demo, it stops before launching.
 * Run with `bun run test:video scenarios/workflows/simulate-microcircuit-layer-4`.
 */

import { clickUntil, NO_NAVIGATION } from '@fixtures/interactions';
import { film, hideActionLabel, lastFrame } from '@fixtures/recording';
import { callout } from '@fixtures/recording/callout';
import { focusOn, pullBack } from '@fixtures/recording/camera';
import { renameEntry } from '@fixtures/recording/steps';
import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { enableFeature } from '@fixtures/steps/feature-flags';
import {
  entityNameCell,
  openEntityListing,
  pickEntity,
  searchEntity,
  startWorkflow,
  useChosenEntities,
} from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import { circuitViewer, morphologyViewer, sceneLoading } from '@locators/viewer';
import { workflowBrowse, workflowsHub, workspaceNav } from '@locators/workflows';
import type { Page } from '@playwright/test';

/** How the film is shot: each action held this long on screen. */
const PACE = 2_000;
test.use(film({ pace: PACE }));

/** The flag the demo was shot with: morphologies for circuits past a small microcircuit. */
const MORPHOLOGIES_FLAG = 'circuit-morphologies';

/** The scene draws on the main thread; its veil goes once it can answer a click. */
const SCENE_READY_WITHIN = 90_000;

/** The demo's names for the blocks, in place of the ones the form gives. */
const RENAMES = [
  { root: 'neuron_sets', from: 'Neuron set 0', to: 'L4 INH' },
  { root: 'neuron_sets', from: 'Neuron set 1', to: 'L4 EXC' },
  { root: 'neuron_sets', from: 'Neuron set 2', to: 'L23 EXC' },
  { root: 'recordings', from: 'Recording 0', to: 'L4 EXC Rec' },
  { root: 'recordings', from: 'Recording 1', to: 'L23 EXC Rec' },
];

const fixture = loadSeed(import.meta.dir);
const circuitName = fixture.selection.mode === 'none' ? '' : fixture.selection.entities[0];

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

// The pace is spent on every action, so the film's clock is the spec's plus the holds.
test.describe.configure({ timeout: campaignTimeout(fixture) + 5 * 60_000 });

/** Colours the neurons by layer, then turns the column with the mouse, as the demo does. */
async function tourCircuitViewer(page: Page): Promise<void> {
  const viewer = circuitViewer(page);

  await expect(sceneLoading(page)).toBeHidden({ timeout: SCENE_READY_WITHIN });

  await clickUntil(viewer.colourBy, viewer.colourByOption('Layer'));
  await viewer.colourByOption('Layer').click(NO_NAVIGATION);
  await expect(viewer.colourBy).toContainText('Layer');

  const scene = await morphologyViewer(page).scene.boundingBox();
  if (!scene) throw new Error('The circuit viewer has no size, so the column cannot be turned.');
  const y = scene.y + scene.height / 2;
  await page.mouse.move(scene.x + scene.width * 0.35, y);
  await page.mouse.down();
  await page.mouse.move(scene.x + scene.width * 0.65, y - scene.height * 0.1, { steps: 30 });
  await page.mouse.up();
}

test(
  'Microcircuit simulation of layer 4, in one take',
  { tag: CREDITS },
  async ({ page, context, baseURL, workspace }) => {
    if (!baseURL) throw new Error('The film needs a base URL to set the feature flag on.');
    await enableFeature(context, MORPHOLOGIES_FLAG, baseURL);
    await hideActionLabel(page);

    await test.step('The project home', async () => {
      await page.goto(`/app/virtual-lab/${workspace.labId}/${workspace.projectId}`);
      await clickUntil(workspaceNav(page).workflows, workflowsHub(page).categoryMenu);
      await expect(workflowsHub(page).category(fixture.activity)).toBeVisible();
    });

    await test.step('Starting a microcircuit simulation', async () => {
      await callout(
        page,
        workflowsHub(page).category(fixture.activity),
        'Simulate runs a model. Microcircuit is the one for a column of the cortex.',
        { title: 'Workflows' }
      );
      await startWorkflow(page, fixture.activity, fixture.workflow);
    });

    await test.step('Picking the circuit', async () => {
      const { selection } = fixture;
      await openEntityListing(page, selection);

      // The spec's `chooseEntities`, taken apart so the camera can look closer
      // between its steps. The seed names one circuit.
      await focusOn(page, entityListing(page).search);
      const row = await searchEntity(page, circuitName);
      test.skip(row === null, `This project holds no "${circuitName}" to simulate.`);
      await expect(row!).toBeVisible();
      await pullBack(page);

      await focusOn(page, entityNameCell(row!, circuitName));
      const unpickable = await pickEntity(page, selection, circuitName, row!);
      test.skip(unpickable !== null, unpickable ?? '');
      await pullBack(page);

      await callout(
        page,
        workflowBrowse(page).useModel,
        "nbS1-HEX0, the column in the middle of the rat's hindlimb cortex. About 30,000 neurons.",
        { title: 'The circuit', side: 'top', align: 'end' }
      );
      await useChosenEntities(page, selection);
      await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
    });

    await test.step('The circuit viewer', async () => {
      await callout(
        page,
        circuitViewer(page).colourBy,
        'The neurons of the column. Colour them by layer to see the six layers.',
        { title: 'The viewer', align: 'end' }
      );
      await tourCircuitViewer(page);
    });

    // Filling the form and generating are one shared step, as in the spec: the
    // renames go in between, before it generates. The seed's case is not
    // launched, so the step ends with the launch button offered.
    for (const configuration of fixture.cases) {
      await test.step(`Filling the form, and generating the simulation: ${configuration.name}`, async () => {
        await callout(
          page,
          scanConfigEditor(page).submit,
          'Three groups of neurons by layer and type. We poke the layer 4 inhibitory ones at 150% of their threshold, and record the excitatory ones in layer 4 and layers 2 and 3.',
          { title: 'The form', side: 'top' }
        );
        await runCampaign(page, fixture, configuration, {
          afterFill: async () => {
            for (const { root, from, to } of RENAMES) await renameEntry(page, root, from, to);
            await pullBack(page);
          },
        });
        await callout(
          page,
          scanConfigResults(page).launch,
          'One simulation, ready to go. We stop here: launching it would spend credits.',
          { title: 'Ready to launch', side: 'top' }
        );
      });
    }

    await lastFrame(page, PACE);
  }
);
