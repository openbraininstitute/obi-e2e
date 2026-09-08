/** The filter popover of a listing column. */

import type { Locator, Page } from '@playwright/test';

export function columnFilter(page: Page) {
  const panel = page.getByTestId('column-filter-panel').or(page.getByRole('dialog'));

  return {
    panel,
    trigger: (column: string) =>
      page
        .getByTestId(`column-filter-trigger-${column}`)
        .or(page.getByRole('button', { name: `Filter ${column}`, exact: true })),

    operator: panel.getByTestId('column-filter-operator').or(panel.getByRole('combobox')),
    value: panel
      .getByTestId('column-filter-value')
      .or(panel.getByPlaceholder('Enter text to match'))
      .first(),
    min: panel.getByTestId('column-filter-min').or(panel.getByPlaceholder('Min')),
    max: panel.getByTestId('column-filter-max').or(panel.getByPlaceholder('Max')),

    search: panel.getByTestId('column-filter-search').or(panel.getByPlaceholder('Search…')),
    options: panel.getByTestId('column-filter-option').or(panel.locator('label')),
    optionCount: (option: Locator) => option.getByTestId('column-filter-option-count'),
    selectAll: panel
      .getByTestId('column-filter-select-all')
      .or(panel.getByRole('button', { name: 'Select all' })),
    clear: panel
      .getByTestId('column-filter-clear')
      .or(panel.getByRole('button', { name: 'Clear' })),

    apply: panel
      .getByTestId('column-filter-apply')
      .or(panel.getByRole('button', { name: 'Apply' })),
    reset: panel
      .getByTestId('column-filter-reset')
      .or(panel.getByRole('button', { name: 'Reset' })),
  };
}

export type FilterKind = 'facet' | 'range' | 'value' | 'choice';

/** Which kind of filter the open panel shows. */
export async function filterKind(panel: Locator): Promise<FilterKind> {
  const has = async (id: string, fallback: Locator): Promise<boolean> =>
    (await panel.getByTestId(id).count()) > 0 || (await fallback.count()) > 0;

  if (await has('column-filter-search', panel.getByPlaceholder('Search…'))) return 'facet';
  if (await has('column-filter-min', panel.getByPlaceholder('Min'))) return 'range';
  if (await has('column-filter-value', panel.getByPlaceholder('Enter text to match')))
    return 'value';
  return 'choice';
}
