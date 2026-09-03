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
  const panel = page.getByTestId('column-filter-panel');

  return {
    panel,
    /** Exact, because "Filter Temperature" also matches "Filter Temperature dependent". */
    trigger: (column: string) =>
      page.getByRole('button', { name: `Filter ${column}`, exact: true }),

    operator: panel.getByTestId('column-filter-operator'),
    value: panel.getByTestId('column-filter-value'),
    min: panel.getByTestId('column-filter-min'),
    max: panel.getByTestId('column-filter-max'),

    search: panel.getByTestId('column-filter-search'),
    options: panel.getByTestId('column-filter-option'),
    optionCounts: panel.getByTestId('column-filter-option-count'),
    noOptions: panel.getByTestId('column-filter-no-options'),
    selectAll: panel.getByTestId('column-filter-select-all'),
    clear: panel.getByTestId('column-filter-clear'),

    apply: panel.getByTestId('column-filter-apply'),
    reset: panel.getByTestId('column-filter-reset'),
  };
}

/** What a filter offers, worked out from the controls the panel renders. */
export type FilterKind = 'facet' | 'range' | 'value' | 'choice';

export async function filterKind(panel: Locator): Promise<FilterKind> {
  // Order matters: a facet filter also renders a search box.
  if ((await panel.getByTestId('column-filter-search').count()) > 0) return 'facet';
  if ((await panel.getByTestId('column-filter-min').count()) > 0) return 'range';
  if ((await panel.getByTestId('column-filter-value').count()) > 0) return 'value';
  return 'choice';
}
