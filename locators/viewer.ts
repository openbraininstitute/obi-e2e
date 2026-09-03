import type { Locator, Page } from '@playwright/test';

/**
 * The 3D preview beside the scan-configuration editor: the scene itself, the
 * pill that switches how it draws, and the settings behind the equaliser.
 *
 * Every handle is a test id: the buttons are icons whose only text is a
 * tooltip, and several of those labels change with the state they toggle
 * (`Full screen` becomes `Exit full screen`).
 */
export function morphologyViewer(page: Page) {
  return {
    /** The surface a click lands on. Clicking a neurite adds a location. */
    scene: page.getByTestId('viewer-scene'),

    mode: {
      visualization: page.getByTestId('viewer-mode-visualization'),
      dendrogram: page.getByTestId('viewer-mode-dendrogram'),
      image: page.getByTestId('viewer-mode-image'),
    },

    /** Opens and closes the settings popover. */
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

    /** Only on the scene once its toggle is turned on. */
    zoomSlider: page.getByTestId('viewer-zoom-slider'),

    resetView: page.getByTestId('viewer-reset-view'),
    captureImage: page.getByTestId('viewer-capture-image'),
    fullScreen: page.getByTestId('viewer-full-screen'),
  };
}

/**
 * The locations a user picked on the morphology, one row each. The section id
 * is read-only because it comes from the viewer; the offset along it is not.
 */
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
