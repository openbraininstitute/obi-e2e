/**
 * The Whole brain simulation of the male CNS, start to finish, in one take.
 *
 * `video-recording.md` beside this file is the storyboard; each of its scenes
 * is one `test.step` here, named in the report. The path is the spec's own,
 * from `@fixtures/steps`; the tours, the renames and the callouts are the
 * film's. The demo was shot with the `circuit-morphologies` feature flag on,
 * so the film turns it on.
 * Run with `bun run test:video scenarios/workflows/simulate-whole-brain-male-cns`.
 */

import { openGroups } from '@fixtures/checks/campaign-output';
import { clickUntil, NO_NAVIGATION } from '@fixtures/interactions';
import { film, hideActionLabel, lastFrame } from '@fixtures/recording';
import { callout } from '@fixtures/recording/callout';
import { focusOn, pullBack } from '@fixtures/recording/camera';
import { renameEntry } from '@fixtures/recording/steps';
import { routes } from '@fixtures/routes';
import { loadSeed, notDeployedHere, runsOnThisDeployment } from '@fixtures/scan-config';
import { campaignTimeout, runCampaign } from '@fixtures/steps/campaign';
import { enableFeature } from '@fixtures/steps/feature-flags';
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
import { circuitViewer, sceneLoading } from '@locators/viewer';
import { workflowsHub } from '@locators/workflows';
import type { Page } from '@playwright/test';

import { entityCard, morphologiesSwitch, nodeTableFilter, raster, spikePlayer } from './locators';

/** How the film is shot: each action held this long on screen. */
const PACE = 2_000;
test.use(film({ pace: PACE }));

/** The flag the demo was shot with: morphologies for circuits past a small microcircuit. */
const MORPHOLOGIES_FLAG = 'circuit-morphologies';

/** The scene draws on the main thread; its veil goes once it can answer a click. */
const SCENE_READY_WITHIN = 90_000;

const SPIKES = 'drosophila';

/**
 * Where the raster's plot starts inside its canvas: core-web-app's `MARGIN`
 * in `spike-viewer/renderer/axis-overlay.ts`. The stimulus marker sits on the
 * plot's top edge, within 18 px of it.
 */
const PLOT_MARGIN = { top: 36, left: 56 };

/** The demo's names for the blocks, in place of the ones the form gives. */
const RENAMES = [
  { root: 'neuron_sets', from: 'Neuron set 0', to: 'front leg ppk 23' },
  { root: 'neuron_sets', from: 'Neuron set 1', to: 'fru dsx' },
  { root: 'stimuli', from: 'Stimulus 0', to: 'Front leg sine' },
];

/** The demo's filters on the viewer's node table, one after the other. */
const TABLE_FILTERS = [
  { column: 'Entry nerve', value: 'ProLN' },
  { column: 'Receptor type', value: 'putative_ppk23' },
];

/** The courtship neurons the form records, shown on their own in the table. */
const COURTSHIP_FILTER = { column: 'Fru dsx', value: 'coexpress_low' };

/** The neuron opacity the demo dims the 3D player to, in percent. */
const DIMMED_OPACITY = 25;

const fixture = loadSeed(import.meta.dir);
const circuitName = fixture.selection.mode === 'none' ? '' : fixture.selection.entities[0];

test.skip(!runsOnThisDeployment(fixture), notDeployedHere(fixture));

// The pace is spent on every action, so the film's clock is the spec's plus the holds.
test.describe.configure({ timeout: campaignTimeout(fixture) + 8 * 60_000 });

/** Colours the cells three ways, shows the settings, and narrows the table twice. */
async function tourCircuitViewer(page: Page): Promise<void> {
  const viewer = circuitViewer(page);
  const table = nodeTableFilter(page.getByRole('tabpanel', { name: 'configuration' }));

  await expect(sceneLoading(page)).toBeHidden({ timeout: SCENE_READY_WITHIN });

  for (const colour of ['Synapse Class', 'Cell Sub Class', 'Cell Type']) {
    await clickUntil(viewer.colourBy, viewer.colourByOption(colour));
    await viewer.colourByOption(colour).click(NO_NAVIGATION);
    await expect(viewer.colourBy).toContainText(colour);
  }

  // The switch is there, but this point-neuron circuit has no morphologies to draw.
  await clickUntil(viewer.settings, viewer.dialog);
  await expect(morphologiesSwitch(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer.dialog).toBeHidden();

  for (const { column, value } of TABLE_FILTERS) {
    await page.keyboard.press('Escape');
    await clickUntil(table.open(column), table.search);
    await table.clear.click(NO_NAVIGATION);
    await table.search.fill(value);
    await table.value(value).click(NO_NAVIGATION);
    await expect(table.value(value)).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(table.selected).toBeVisible();
  }

  await table.tickAll.click(NO_NAVIGATION);
  await expect(table.ticked).toHaveText(/^Nodes: [1-9][\d,]*\//);

  // Showing every neuron again lets the ticks go as well.
  await table.showAll.click(NO_NAVIGATION);
  await expect(table.selected).toBeHidden();

  await page.keyboard.press('Escape');
  await clickUntil(table.open(COURTSHIP_FILTER.column), table.search);
  await table.clear.click(NO_NAVIGATION);
  await table.search.fill(COURTSHIP_FILTER.value);
  await table.value(COURTSHIP_FILTER.value).click(NO_NAVIGATION);
  await page.keyboard.press('Escape');
  await expect(table.selected).toBeVisible();

  await table.showAll.click(NO_NAVIGATION);
  await expect(table.selected).toBeHidden();
}

/**
 * The raster of the spikes: zoomed into a window and back, ordered two ways,
 * two cells ticked and let go, the cells that fired kept, ordered by firing
 * rate, and the stimulus's details shown.
 */
async function tourSpikes(page: Page): Promise<void> {
  const results = scanConfigResults(page);
  const { chart, fileView } = results;
  const plot = raster(fileView);

  await openGroups(results.outputs);
  await clickUntil(results.file(SPIKES), fileView.filter({ hasText: /\d+ spikes/ }));

  const box = await plot.canvas.boundingBox();
  if (!box) throw new Error('The raster has no size, so it cannot be zoomed.');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.15, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, y + box.height * 0.2, { steps: 20 });
  await page.mouse.up();
  await expect(plot.zoomWindow).toBeVisible();
  await page.mouse.dblclick(box.x + box.width * 0.5, y);
  await expect(plot.zoomWindow).toBeHidden();

  for (const order of ['cell_class', 'Node id']) {
    await clickUntil(chart.orderBy, chart.option(order));
    await chart.option(order).click(NO_NAVIGATION);
    await expect(chart.orderBy).toContainText(order);
  }

  await chart.spiking.click(NO_NAVIGATION);
  await expect(chart.spiking).toHaveAttribute('aria-pressed', 'true');
  await expect(fileView).toContainText(/\d+ of \d+ spikes/);

  // Ticked among the cells that fired, so the raster shows their spikes.
  await chart.nodes.select(0).click(NO_NAVIGATION);
  await chart.nodes.select(1).click(NO_NAVIGATION);
  await expect(chart.nodes.selection).toHaveText(/^Nodes: 2\//);
  await chart.nodes.select(0).click(NO_NAVIGATION);
  await chart.nodes.select(1).click(NO_NAVIGATION);
  await expect(chart.nodes.selection).toHaveText(/^Nodes: 0\//);

  await clickUntil(chart.orderBy, chart.option('Firing rate (Hz)'));
  await chart.option('Firing rate (Hz)').click(NO_NAVIGATION);
  await expect(chart.orderBy).toContainText('Firing rate');

  // The stimulus's marker is drawn, not written: it sits on the plot's top
  // edge at the stimulus's start, 0 ms here, so at the plot's top-left corner.
  // Its card comes up on hover.
  const corner = await plot.canvas.boundingBox();
  if (!corner) throw new Error('The raster has no size, so its stimulus cannot be pointed at.');
  // Slid along the top edge, over the marker and its name, until the card comes up.
  const top = corner.y + PLOT_MARGIN.top + 9;
  for (let x = PLOT_MARGIN.left - 10; x <= PLOT_MARGIN.left + 90; x += 6) {
    await page.mouse.move(corner.x + x, top, { steps: 2 });
    if (await plot.stimulusCard.isVisible()) break;
  }
  await expect(plot.stimulusCard).toBeVisible();
}

/**
 * The spike file's 3D player, as the demo walks it: the panel opened beside
 * the raster, the replay played, the raster column dragged shut so the scene
 * has the page, its settings opened, and the raster brought back.
 */
async function tourSpikePlayer(page: Page): Promise<void> {
  const player = spikePlayer(page);
  const view = scanConfigResults(page).fileView;
  const { orderBy, spiking } = scanConfigResults(page).chart;
  const allCells = view.getByRole('button', { name: 'All', exact: true });

  // The spike tour left only the cells that fired; the demo opens the player on all of them.
  await allCells.click(NO_NAVIGATION);
  await expect(spiking).toHaveAttribute('aria-pressed', 'false');

  await player.open.click(NO_NAVIGATION);
  // The scene, and under it the firing rate of the population.
  await expect(player.panel).not.toContainText(/neurons selected/);
  await expect(player.panel).toContainText('Rate (Hz)');
  await expect(sceneLoading(page)).toBeHidden({ timeout: SCENE_READY_WITHIN });

  await player.play.click(NO_NAVIGATION);
  await expect(player.pause).toBeVisible();

  // The rule between the columns is a bare grab bar, no role and no id: it
  // sits just before the panel's edge, and dragging it to the left shuts the
  // raster column into a bar.
  const edge = await player.panel.boundingBox();
  if (!edge) throw new Error('The 3D player panel has no size, so its rule cannot be dragged.');
  const y = edge.y + edge.height / 2;
  await page.mouse.move(edge.x - 4, y);
  await page.mouse.down();
  await page.mouse.move(8, y, { steps: 30 });
  await page.mouse.up();
  // A shut column slides off the page and its bar fades in; both stay in the
  // DOM, faded rather than hidden, so where the raster's controls are is what
  // says which column is up.
  await expect(orderBy).not.toBeInViewport();
  await expect(player.reopenRaster).toBeVisible();

  await clickUntil(player.settings, page.getByRole('dialog'));
  await expect(page.getByRole('dialog')).toContainText('Spike afterglow');

  // One click on the slider's track, at the mark for the demo's opacity: the
  // slider runs from 5% to 100% (core-web-app, viewer-controls-menu.tsx).
  const track = await player.opacity.getByRole('slider').locator('..').boundingBox();
  if (!track) throw new Error('The opacity slider has no size, so it cannot be set.');
  await page.mouse.click(
    track.x + (track.width * (DIMMED_OPACITY - 5)) / 95,
    track.y + track.height / 2
  );
  await expect(player.opacity).toContainText(`${DIMMED_OPACITY}%`);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  await player.reopenRaster.click(NO_NAVIGATION);
  await expect(orderBy).toBeInViewport();

  // The table keeps the cells that fired, and the scene follows it.
  await spiking.click(NO_NAVIGATION);
  await expect(spiking).toHaveAttribute('aria-pressed', 'true');
  await expect(player.panel).toContainText(/of [\d,]+ neurons selected/);
  await expect(view).toContainText(/\d+ of \d+ spikes/);
}

test(
  'Whole brain simulation of the male CNS, in one take',
  { tag: CREDITS },
  async ({ page, context, baseURL, workspace }) => {
    if (!baseURL) throw new Error('The film needs a base URL to set the feature flag on.');
    await enableFeature(context, MORPHOLOGIES_FLAG, baseURL);
    await hideActionLabel(page);

    await test.step('The fly circuits', async () => {
      const card = entityCard(page);

      await page.goto(routes.dataEntity(workspace.labId, workspace.projectId, 'circuit'));
      const row = await searchEntity(page, circuitName);
      test.skip(row === null, `This deployment holds no "${circuitName}".`);
      await clickUntil(entityNameCell(row!, circuitName), card.card);
      await expect(card.name).toContainText(circuitName);
      await expect(card.neurons).toContainText(/164/);

      await callout(
        page,
        card.neurons,
        'The male fly CNS. 164,606 neurons and about 25 million synapses.',
        { title: 'The circuit', align: 'end' }
      );
    });

    await test.step('The Workflows page', async () => {
      await openWorkflowsHub(page, workspace);
      await callout(
        page,
        workflowsHub(page).category(fixture.activity),
        'Simulate runs a model. Whole brain is the one for a full connectome.',
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

      await useChosenEntities(page, selection);
      await expect(page).toHaveURL(new RegExp(`/configure/${fixture.workflow.type}/`));
    });

    await test.step('The circuit viewer', async () => {
      await callout(
        page,
        circuitViewer(page).colourBy,
        'Every neuron of the fly. Colour them by anything the connectome knows about them.',
        { title: 'The viewer', align: 'end' }
      );
      await tourCircuitViewer(page);
    });

    // Filling the form and running the simulations are one shared step, as in
    // the spec: the renames go in between, before it generates. The seed holds
    // one configuration; a second would find the button reading "New
    // simulation campaign" and fail there: that path is not driven yet.
    for (const configuration of fixture.cases) {
      await test.step(`Filling the form, and running the simulations: ${configuration.name}`, async () => {
        await callout(
          page,
          scanConfigEditor(page).submit,
          'Two groups of neurons: the ppk23 taste neurons of the front leg, and the fru dsx courtship neurons. We poke the first at 1, 2 and 8 nA and record the second.',
          { title: 'The form', side: 'top' }
        );
        await runCampaign(page, fixture, configuration, {
          afterFill: async () => {
            for (const { root, from, to } of RENAMES) await renameEntry(page, root, from, to);
            await pullBack(page);
          },
        });
      });
    }

    await test.step('The spikes', async () => {
      // One status per simulation; the first is the one the campaign step followed.
      await callout(
        page,
        scanConfigResults(page).coordinates.first().getByTestId('scan-config-status'),
        'One simulation per amplitude. Each one runs the whole fly for one second, in about a minute and a half.',
        { title: 'The simulations' }
      );
      await tourSpikes(page);
    });

    await test.step('The 3D player', async () => {
      await callout(
        page,
        spikePlayer(page).open,
        'The spikes played back on the neurons, with the firing rate next to them.',
        { title: 'The 3D player', align: 'end' }
      );
      await tourSpikePlayer(page);
    });

    await lastFrame(page, PACE);
  }
);
