import type { Locator, Page } from '@playwright/test';

/**
 * The popover behind the funnel in a column header.
 *
 * Everything here is found by test id rather than by role or placeholder, so a
 * copy change in the application cannot silently break these tests. The ids are
 * added in `core-web-app` on branch `test/scan-config-field-testids`.
 *
 * The popover closes whenever the listing re-renders, which it does while
 * loading and again after a filter is applied. Open it only once the listing
 * has settled, and be ready to open it twice.
 */
export function columnFilter(page: Page) {
  const panel = page.getByRole('dialog');

  return {
    panel,
    /** Exact, because "Filter Temperature" also matches "Filter Temperature dependent". */
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

/** What a filter offers, worked out from the controls the panel renders. */
export type FilterKind = 'facet' | 'range' | 'value' | 'choice';

export async function filterKind(panel: Locator): Promise<FilterKind> {
  if ((await panel.getByPlaceholder('Search…').count()) > 0) return 'facet';
  if ((await panel.getByPlaceholder('Min').count()) > 0) return 'range';
  if ((await panel.getByPlaceholder('Enter text to match').count()) > 0) return 'value';
  return 'choice';
}
