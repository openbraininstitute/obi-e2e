/**
 * Steps only a film takes: tours of what a page offers, so a viewer sees that
 * clicking this shows that. No case checks any of it; a spec never imports
 * this file. Each tour leaves the page as it found it where the form could
 * care, and asserts what it opened, which is what makes the film wait for it.
 */

import { openGroups } from '@fixtures/checks/campaign-output';
import { clickUntil, NO_NAVIGATION } from '@fixtures/interactions';
import { focusOn } from '@fixtures/recording/camera';
import { scanConfigEditor, scanConfigEntryRename, scanConfigResults } from '@locators/scan-config';
import { circuitViewer, nodesTable, sceneLoading } from '@locators/viewer';
import { expect, type Locator, type Page } from '@playwright/test';

/** The scene draws on the main thread; its veil goes once it can answer a click. */
const SCENE_READY_WITHIN = 90_000;

/**
 * The circuit viewer on the configuration tab: colour the cells by m-type,
 * open the populations menu and the viewer settings, pick one node in the
 * table and let it go again, so the form is left as the spec expects it.
 */
export async function tourCircuitViewer(page: Page): Promise<void> {
  const viewer = circuitViewer(page);
  const nodes = nodesTable(page.getByRole('tabpanel', { name: 'configuration' }));

  await expect(sceneLoading(page)).toBeHidden({ timeout: SCENE_READY_WITHIN });

  await clickUntil(viewer.colourBy, viewer.colourByOption('Mtype'));
  await viewer.colourByOption('Mtype').click(NO_NAVIGATION);
  await expect(viewer.colourBy).toContainText('Mtype');

  await clickUntil(viewer.populations, viewer.dialog);
  await expect(viewer.dialog).toContainText('Show');
  await page.keyboard.press('Escape');
  await expect(viewer.dialog).toBeHidden();

  await clickUntil(viewer.settings, viewer.dialog);
  await expect(viewer.dialog).toContainText('Zoom slider');
  await page.keyboard.press('Escape');
  await expect(viewer.dialog).toBeHidden();

  await nodes.select(0).click(NO_NAVIGATION);
  await expect(nodes.selection).toHaveText(/^Nodes: 1\//);
  await nodes.select(0).click(NO_NAVIGATION);
  await expect(nodes.selection).toHaveText(/^Nodes: 0\//);
}

/** One file of a finished campaign, and a word the viewer should see in it. */
export type FileToShow = { file: string; shows: string };

/**
 * The pane once it shows `text`: the one element, so a word the file repeats
 * still makes a strict locator. A file is fetched when clicked, which is why
 * the click waits for its content rather than for the pane alone.
 */
function paneShowing(page: Page, text: string | RegExp): Locator {
  return scanConfigResults(page).fileView.filter({ hasText: text });
}

/** Opens each input file in turn, so its content is seen. */
export async function tourInputFiles(page: Page, inputs: FileToShow[]): Promise<void> {
  const results = scanConfigResults(page);

  // A simulation folds its files into groups that start shut.
  await openGroups(results.inputs);
  for (const { file, shows } of inputs) {
    await clickUntil(results.file(file), paneShowing(page, shows));
  }
}

/** A recording's traces: grouped by m-type, then one cell picked in the table. */
export async function tourRecording(page: Page, file: string): Promise<void> {
  const results = scanConfigResults(page);
  const { chart } = results;

  await openGroups(results.outputs);
  await clickUntil(results.file(file), paneShowing(page, 'cells recorded'));

  await clickUntil(chart.groupBy, chart.option('mtype'));
  await chart.option('mtype').click(NO_NAVIGATION);
  await expect(chart.groupBy).toContainText('mtype');

  await chart.nodes.select(0).click(NO_NAVIGATION);
  await expect(chart.nodes.selection).toHaveText(/^Nodes: 1\//);
}

/** A population's spikes: ordered by firing rate, then only the cells that fired. */
export async function tourSpikes(page: Page, file: string): Promise<void> {
  const results = scanConfigResults(page);
  const { chart } = results;

  await openGroups(results.outputs);
  await clickUntil(results.file(file), paneShowing(page, /\d+ spikes/));

  await clickUntil(chart.orderBy, chart.option('Firing rate (Hz)'));
  await chart.option('Firing rate (Hz)').click(NO_NAVIGATION);
  await expect(chart.orderBy).toContainText('Firing rate');

  await chart.spiking.click(NO_NAVIGATION);
  await expect(chart.spiking).toHaveAttribute('aria-pressed', 'true');
  await expect(results.fileView).toContainText(/\d+ of \d+ spikes/);
}

/**
 * Gives a block the name a scientist gave it in a demo: the camera moves in on
 * its tab, then the pencil, the new name, Enter. The form names a block "Neuron
 * set 0" and so on; references to it follow the new name.
 */
export async function renameEntry(
  page: Page,
  root: string,
  from: string,
  to: string
): Promise<void> {
  const editor = scanConfigEditor(page);
  const entry = editor.entry(root, from);

  if (!(await entry.isVisible())) await editor.rootElement(root).click(NO_NAVIGATION);
  await focusOn(page, entry);

  const rename = scanConfigEntryRename(entry);
  await rename.edit.click(NO_NAVIGATION);
  await rename.name.fill(to);
  await rename.name.press('Enter');
  await expect(editor.entry(root, to)).toBeVisible();
}
