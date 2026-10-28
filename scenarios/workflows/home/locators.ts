import type { Page } from '@playwright/test';

/**
 * The categories the Workflows page offers, by the name it gives each.
 *
 * Not `validate`: core-web-app #2034 put it behind the `emodel-validation`
 * feature flag, off by default.
 */
export const CATEGORIES = ['build', 'simulate', 'process', 'optimize'] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * The models each category works with: what the card is called, and the type it
 * stands for.
 *
 * Matched by type rather than by label, because several cards read the same —
 * "Single neuron" heads both the ME-model and the ME-model circuit.
 *
 * `formerly` is the type a deployment that has not caught up still offers.
 */
export const TYPES: Record<
  'build' | 'simulate',
  readonly { label: string; type: string; formerly?: string }[]
> = {
  build: [
    // core-web-app #1993 gave the ion channel build a campaign type of its own.
    // Drop `formerly` once production has it.
    {
      label: 'Ion channel',
      type: 'ion-channel-build-campaign',
      formerly: 'ion-channel-modeling-campaign',
    },
    // core-web-app #2015 moved the single neuron build into the scan-config
    // editor, under a campaign type of its own. Drop `formerly` once production has it.
    { label: 'Single neuron', type: 'memodel-build-campaign', formerly: 'memodel' },
    {
      label: 'Electron microscopy circuit',
      type: 'em-synapse-mapping-campaign',
    },
  ],
  simulate: [
    { label: 'Single neuron', type: 'single-neuron-simulation' },
    { label: 'Synaptome', type: 'single-neuron-synaptome-simulation' },
  ],
};

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
