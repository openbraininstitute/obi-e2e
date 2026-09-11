import type { Page } from '@playwright/test';

/** The categories the Workflows page offers, by the name it gives each. */
export const CATEGORIES = ['build', 'simulate', 'process', 'optimize', 'validate'] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * The models each category works with: what the card is called, and the type it
 * stands for.
 *
 * Matched by type rather than by label, because several cards read the same —
 * "Single neuron" heads both the ME-model and the ME-model circuit.
 */
export const TYPES = {
  build: [
    { label: 'Ion channel', type: 'ion-channel-modeling-campaign' },
    { label: 'Single neuron', type: 'memodel' },
    {
      label: 'Electron microscopy circuit',
      type: 'em-synapse-mapping-campaign',
    },
  ],
  simulate: [
    { label: 'Single neuron', type: 'single-neuron-simulation' },
    { label: 'Synaptome', type: 'single-neuron-synaptome-simulation' },
  ],
} as const;

/** The columns the activity table shows, in order. */
export const ACTIVITY_COLUMNS = [
  'Name',
  'Category',
  'Type',
  'Date',
  'Created by',
  'Status',
  'Actions',
] as const;

export function activityTable(page: Page) {
  const table = page.getByTestId('workflow-activities-table');

  return {
    table,
    filters: page.getByTestId('workflow-category-and-type-selector'),
    column: (name: string) => table.getByRole('columnheader', { name }),
  };
}

export function workflowType(page: Page, type: string) {
  return page.getByTestId(`workflow-type-${type}`);
}
