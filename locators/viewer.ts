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
