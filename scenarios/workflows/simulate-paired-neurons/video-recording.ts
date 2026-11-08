/**
 * The Paired neurons simulation, start to finish, in one take.
 *
 * `video-recording.md` beside this file is the storyboard; each of its scenes
 * is one `test.step` here, captioned on the picture while it plays. The path
 * is the spec's own, from `@fixtures/steps`; the tours of the viewer and of
 * the results are the film's, from `@fixtures/recording`. Run with
 * `bun run test:video scenarios/workflows/simulate-paired-neurons`.
 */

import { film, lastFrame } from '@fixtures/recording';
import {
  tourCircuitViewer,
  tourInputFiles,
  tourRecording,
  tourSpikes,
} from '@fixtures/recording/steps';
import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { chooseEntities, openWorkflowsHub, startWorkflow } from '@fixtures/steps/workflows';
import { CREDITS } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

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
  await test.step('The Workflows page', async () => {
    await openWorkflowsHub(page, workspace);
    await startWorkflow(page, fixture.activity, fixture.workflow);
  });

  await test.step('The circuit', async () => {
    const missing = await chooseEntities(page, fixture.selection);
    test.skip(missing !== null, missing ?? '');
    await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
  });

  await test.step('The circuit viewer', () => tourCircuitViewer(page));

  // The form, the campaign and the results are one shared step, as in the
  // spec. The seed holds one configuration; a second would find the button
  // reading "New simulation campaign" and fail there: that path is not driven yet.
  for (const configuration of fixture.cases) {
    await test.step(`The form, the campaign and the results: ${configuration.name}`, () =>
      runCampaign(page, fixture, configuration));
  }

  await test.step('The input files', () => tourInputFiles(page, INPUTS));
  await test.step('The recording', () => tourRecording(page, RECORDING));
  await test.step('The spikes', () => tourSpikes(page, SPIKES));

  await lastFrame(page, PACE);
});
