import type { Page } from '@playwright/test';

/** The categories the picker offers, as it labels them. */
export const CATEGORY_OPTIONS = [
  'Build',
  'Simulate',
  'Process data',
  'Optimize',
  'Validate',
] as const;

/** The types "Build" offers, and the group each sits under. */
export const BUILD_TYPES = [
  { group: 'Subcellular', type: 'Ion channel' },
  { group: 'Cellular', type: 'Single neuron' },
  { group: 'Circuit', type: 'Electron microscopy circuit' },
] as const;

/** The types "Simulate" offers. */
export const SIMULATE_TYPES = ['Ion channel', 'Single neuron', 'Synaptome'] as const;

export function activityFilters(page: Page) {
  const selector = page.getByTestId('workflow-category-and-type-selector');

  return {
    selector,
    table: page.getByTestId('workflow-activities-table'),

    category: page.getByTestId('workflow-category-filter'),
    type: page.getByTestId('workflow-type-filter'),

    option: (label: string) => page.getByRole('option', { name: label, exact: true }),
    options: page.getByRole('option'),
    // Exact, or "Cellular" also picks out "Subcellular".
    group: (label: string) => page.getByRole('group', { name: label, exact: true }),
  };
}
