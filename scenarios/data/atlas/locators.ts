import type { Page } from '@playwright/test';

export function atlasPanel(page: Page) {
  const view = page.getByTestId('three-d-area');

  return {
    view,
    /**
     * The spinner the viewer shows while it fetches and paints the brain's
     * meshes. It carries no test id yet, so it is found by what antd renders
     * for a `Spin`; scoped to the 3D area so no other spinner counts.
     */
    viewLoading: view.getByRole('img', { name: 'loading' }),
    resetCamera: page.getByTestId('atlas-reset-camera-button'),

    /** Reads "Neurons [N] ~ 24,030,000", or the density once switched. */
    counter: page.getByTestId('total-count-or-density'),
    countOrDensity: page.getByTestId('atlas-density-count-toggle'),

    composition: page.getByTestId('cell-composition-tree-container'),
    /** What the panel shows instead of the counter when a fetch behind it failed. */
    compositionFailed: page.getByText(/loading data for .* failed/),
  };
}

/** The figure the counter gives, without the label in front of it. */
export async function figure(page: Page): Promise<string> {
  const text = await atlasPanel(page).counter.innerText();
  return text.replace(/\s+/g, ' ').trim();
}
