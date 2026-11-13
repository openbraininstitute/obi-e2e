/** The morphology viewer, and the location rows beside it. */

import type { Locator, Page } from '@playwright/test';

/** The phases the veil names itself after, whichever one it is in. */
const SCENE_IS_BUSY = /Loading visualization|Downloading nodes|Drawing morphologies/;

/**
 * The veil over a scene that is not ready yet.
 */
export function sceneLoading(page: Page): Locator {
  return page
    .getByTestId('visualization-loading')
    .or(page.getByRole('status', { name: SCENE_IS_BUSY }));
}

export function morphologyViewer(page: Page) {
  return {
    scene: page.getByTestId('viewer-scene'),

    mode: {
      visualization: page.getByTestId('viewer-mode-visualization'),
      dendrogram: page.getByTestId('viewer-mode-dendrogram'),
      image: page.getByTestId('viewer-mode-image'),
    },

    settings: page.getByTestId('viewer-settings'),

    toggle: {
      axons: page.getByTestId('viewer-toggle-axons'),
      scaleBar: page.getByTestId('viewer-toggle-scale-bar'),
      zoomSlider: page.getByTestId('viewer-toggle-zoom-slider'),
      locationLabels: page.getByTestId('viewer-toggle-location-labels'),
      electrodes: page.getByTestId('viewer-toggle-electrodes'),
    },

    slider: {
      neuronOpacity: page.getByTestId('viewer-slider-neuron-opacity'),
      locationMarkerSize: page.getByTestId('viewer-slider-location-marker-size'),
      electrodeSize: page.getByTestId('viewer-slider-electrode-size'),
    },

    zoomSlider: page.getByTestId('viewer-zoom-slider'),

    resetView: page.getByTestId('viewer-reset-view'),
    captureImage: page.getByTestId('viewer-capture-image'),
    fullScreen: page.getByTestId('viewer-full-screen'),
  };
}

export function morphologyLocations(page: Page) {
  const rows = page.getByTestId('scan-config-location');

  return {
    panel: page.getByTestId('scan-config-locations'),
    rows,
    row: (index: number): Locator => rows.nth(index),
    sectionId: (index: number): Locator =>
      rows.nth(index).getByTestId('scan-config-location-section'),
    offset: (index: number): Locator => rows.nth(index).getByTestId('scan-config-location-offset'),
    remove: (index: number): Locator => rows.nth(index).getByTestId('scan-config-location-remove'),
  };
}

/**
 * The circuit viewer: the scene a circuit simulation form shows, with its
 * toolbar. The toolbar's menus are popovers, each a `dialog` while open.
 */
export function circuitViewer(page: Page) {
  const list = page.getByTestId('color-by-dropdown-list');

  return {
    colourBy: page.getByTestId('color-by-dropdown-trigger'),
    /** One way of colouring, by the name the list shows: "Mtype", "Layer", "Etype". */
    colourByOption: (name: string): Locator => list.getByRole('button', { name, exact: true }),
    populations: page.getByTestId('populations-menu-trigger'),
    settings: page.getByTestId('viewer-settings'),
    /** The one open popover. */
    dialog: page.getByRole('dialog'),
  };
}

/**
 * The table of a population's nodes: under the viewer on the configuration
 * tab, and under a chart in a campaign's results. `scope` says which.
 *
 * The grid pins its selection column into a row of its own ahead of the row
 * holding the values; both carry the same `row-index`. Clicking the pinned
 * cell selects the node, and the count above the table says how many are.
 */
export function nodesTable(scope: Locator) {
  const row = (index: number): Locator => scope.locator(`[role="row"][row-index="${index}"]`);

  return {
    // A large circuit writes its count with a comma: "Nodes: 2/164,606 selected".
    selection: scope.getByText(/^Nodes: [\d,]+\/[\d,]+ selected/),
    // The pinned selection cell comes first; the row's own cells follow it.
    select: (index: number): Locator => row(index).getByRole('gridcell').first(),
  };
}
