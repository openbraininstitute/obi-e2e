/**
 * The Paired neurons simulation, start to finish, in one take.
 *
 * `video-recording.md` beside this file is the storyboard; each of its scenes
 * is one `test.step` here, named in the report. The path
 * is the spec's own, from `@fixtures/steps`; the tours of the viewer and of
 * the results, and the callouts, are the film's, from `@fixtures/recording`.
 * Run with `bun run test:video scenarios/workflows/simulate-paired-neurons`.
 */

import { film, hideActionLabel, lastFrame } from '@fixtures/recording';
import { callout } from '@fixtures/recording/callout';
import { focusOn, pullBack } from '@fixtures/recording/camera';
import {
  tourCircuitViewer,
  tourInputFiles,
  tourRecording,
  tourSpikes,
} from '@fixtures/recording/steps';
import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import {
  entityNameCell,
  openEntityListing,
  openWorkflowsHub,
  pickEntity,
  searchEntity,
  startWorkflow,
  useChosenEntities,
} from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { entityListing } from '@locators/listing';
import { scanConfigEditor, scanConfigResults } from '@locators/scan-config';
import { circuitViewer } from '@locators/viewer';
import { workflowsHub } from '@locators/workflows';

/** How the film is shot: each action held this long on screen, in Full HD unless E2E_VIDEO_SIZE says otherwise. */
const PACE = 2_000;
test.use(film({ pace: PACE, size: { width: 1920, height: 1080 } }));

/** The files the tours open, as the campaign names them. */
const INPUTS = [
  { file: 'Node sets', shows: 'Mosaic' },
  { file: 'OBI-ONE Config', shows: 'obi_one_version' },
];
const RECORDING = 'Recording 0';
const SPIKES = 'S1nonbarrel_neurons';

const fixture = loadSeed(import.meta.dir);

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

// The pace is spent on every action, so the film's clock is the spec's plus the holds.
test.describe.configure({ timeout: campaignTimeout(fixture) + 5 * 60_000 });

test('Paired neurons simulation, in one take', { tag: CREDITS }, async ({ page, workspace }) => {
  await hideActionLabel(page);

  await test.step('The Workflows page', async () => {
    await openWorkflowsHub(page, workspace);
    await callout(
      page,
      workflowsHub(page).category(fixture.activity),
      'Workflows are grouped by what they do. Simulate runs a model: one neuron, a pair, a microcircuit, a brain region.',
      { title: 'Workflows' }
    );
    await startWorkflow(page, fixture.activity, fixture.workflow);
  });

  await test.step('The circuit', async () => {
    const { selection } = fixture;
    await openEntityListing(page, selection);

    // The spec's `chooseEntities`, taken apart so the camera can look closer
    // between its steps. The seed names one circuit.
    const entities = selection.mode === 'none' ? [] : selection.entities;
    for (const name of entities) {
      await focusOn(page, entityListing(page).search);
      const row = await searchEntity(page, name);
      test.skip(row === null, `This project holds no "${name}" to simulate.`);
      await expect(row!).toBeVisible();
      await pullBack(page);

      await focusOn(page, entityNameCell(row!, name));
      const unpickable = await pickEntity(page, selection, name, row!);
      test.skip(unpickable !== null, unpickable ?? '');
      await pullBack(page);
    }

    await useChosenEntities(page, selection);
    await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
  });

  await test.step('The circuit viewer', async () => {
    await callout(
      page,
      circuitViewer(page).colourBy,
      'The two neurons of the circuit, drawn from their morphologies. Colour them by any property, show the other populations, pick a node in the table.',
      { title: 'The circuit viewer', align: 'end' }
    );
    await tourCircuitViewer(page);
  });

  // The form, the campaign and the results are one shared step, as in the
  // spec. The seed holds one configuration; a second would find the button
  // reading "New simulation campaign" and fail there: that path is not driven yet.
  for (const configuration of fixture.cases) {
    await test.step(`The form, the campaign and the results: ${configuration.name}`, async () => {
      await callout(
        page,
        scanConfigEditor(page).submit,
        'obi-one describes the form, section by section. The button enables once every section is complete.',
        { title: 'The form', side: 'top' }
      );
      await runCampaign(page, fixture, configuration);
    });
  }

  await test.step('The input files', async () => {
    await callout(
      page,
      scanConfigResults(page).status,
      'Each coordinate is one simulation. Its status goes from created to running to done, and its files arrive as it runs.',
      { title: 'The campaign' }
    );
    await tourInputFiles(page, INPUTS);
  });

  await test.step('The recording', async () => {
    await tourRecording(page, RECORDING);
    await callout(
      page,
      scanConfigResults(page).chart.groupBy,
      'The soma voltage of each cell. Group by a property to compare classes; pick a row to see one cell alone.',
      { title: 'The recording' }
    );
  });

  await test.step('The spikes', () => tourSpikes(page, SPIKES));

  await lastFrame(page, PACE);
});
