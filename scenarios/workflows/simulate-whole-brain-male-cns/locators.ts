/** What only this scenario addresses. */

import type { Locator, Page } from '@playwright/test';

/**
 * The switch in the circuit viewer's settings that draws the cells as
 * morphologies. Offered only with the `circuit-morphologies` feature flag, and
 * disabled until obi-one has built the circuit's morphology pack.
 */
export function morphologiesSwitch(page: Page): Locator {
  return page.getByTestId('viewer-toggle-morphologies');
}

/** The card a listing row opens on the Data page. */
export function entityCard(page: Page) {
  return {
    card: page.getByTestId('mini-viewer'),
    name: page.getByTestId('mini-detail-name'),
    neurons: page.getByTestId('mini-detail-property-number_neurons'),
  };
}

/**
 * The circuit viewer's node table: each column's filter, a list of values to
 * tick. The table is an AG grid; a header carries no test id, so it is found by
 * its words, and its filter button by its label. The open filter is a popup of
 * its own, with a search box, "Clear", and one checkbox per value.
 */
export function nodeTableFilter(scope: Locator) {
  const page = scope.page();

  return {
    open: (column: string): Locator =>
      scope
        .getByRole('columnheader')
        .filter({ hasText: new RegExp(`^\\s*${column}\\s*$`) })
        .getByRole('button', { name: 'Filter' }),
    search: page.getByPlaceholder('Search…'),
    clear: page.getByRole('button', { name: 'Clear', exact: true }),
    value: (value: string): Locator => page.getByRole('checkbox', { name: value, exact: true }),
    /** What the scene says it shows, once the table holds fewer than every neuron. */
    selected: page.getByText(/of [\d,]+ neurons selected/),
    /** The header box that ticks every row the table shows. */
    tickAll: scope.getByRole('button', { name: 'Tick every row' }),
    ticked: scope.getByText(/^Nodes: [\d,]+\/[\d,]+ selected/),
    showAll: page.getByRole('button', { name: 'Show every neuron again' }),
  };
}

/**
 * The spike file's 3D player and statistics, in the panel beside the results.
 *
 * core-web-app gives none of it a test id yet. The panel is marked with
 * `data-results-side-panel`; the button that opens it is named by the panes
 * it holds, and the bar a shut column leaves is labelled "Open …".
 */
export function spikePlayer(page: Page) {
  const panel = page.locator('[data-results-side-panel]');

  return {
    open: page.getByRole('button', { name: '3D Player · Statistics', exact: true }),
    panel,
    /** The panel's viewer settings: opacity, soma size and spike afterglow. */
    settings: panel.getByTestId('viewer-settings'),
    /** In the open settings: an antd slider from 5% to 100%, with its value written beside its label. */
    opacity: page.getByTestId('viewer-slider-neuron-opacity'),
    /** The scene's own play button, which reads "Pause" while the replay runs. */
    play: panel.getByRole('button', { name: 'Play', exact: true }),
    pause: panel.getByRole('button', { name: 'Pause', exact: true }),
    /** The bar the raster column leaves once it is shut. */
    reopenRaster: page.getByRole('button', { name: 'Open Raster and Neuron Table' }),
  };
}

/**
 * The raster of a spike file: the canvas it draws on, the chip a zoom window
 * shows ("21.8–160.6 ms · 59,230 cells"), and a stimulus's card. The canvas
 * has no test id or role; it is the first one in the pane.
 */
export function raster(view: Locator) {
  return {
    // The first canvas: the axes, the size of the whole raster. The renderer
    // adds the plot's own canvases after it.
    canvas: view.locator('canvas').first(),
    zoomWindow: view.getByText(/ms · [\d,]+ cells/),
    /** The card a stimulus marker shows on hover. */
    stimulusCard: view.page().getByText('Click to set the raster to this window'),
  };
}
