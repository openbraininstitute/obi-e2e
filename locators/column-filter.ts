/** The filter popover of a listing column. */

import type { Locator, Page } from '@playwright/test';

export function columnFilter(page: Page) {
  const panel = page.getByRole('dialog');

  return {
    panel,
    trigger: (column: string) =>
      page.getByRole('button', { name: `Filter ${column}`, exact: true }),

    operator: panel.getByRole('combobox'),
    value: panel.getByPlaceholder('Enter text to match'),
    min: panel.getByPlaceholder('Min'),
    max: panel.getByPlaceholder('Max'),

    search: panel.getByPlaceholder('Search…'),
    options: panel.locator('label'),
    selectAll: panel.getByRole('button', { name: 'Select all' }),
    clear: panel.getByRole('button', { name: 'Clear' }),

    apply: panel.getByRole('button', { name: 'Apply' }),
    reset: panel.getByRole('button', { name: 'Reset' }),
  };
}

export type FilterKind = 'facet' | 'range' | 'value' | 'choice';

/** Which kind of filter the open panel shows. */
export async function filterKind(panel: Locator): Promise<FilterKind> {
  if ((await panel.getByPlaceholder('Search…').count()) > 0) return 'facet';
  if ((await panel.getByPlaceholder('Min').count()) > 0) return 'range';
  if ((await panel.getByPlaceholder('Enter text to match').count()) > 0) return 'value';
  return 'choice';
}
