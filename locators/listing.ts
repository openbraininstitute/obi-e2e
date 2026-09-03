import type { Page } from '@playwright/test';

/**
 * The entity listing: its table, the toolbar above it, and the controls that
 * narrow what it shows. Shared because every data type renders the same grid.
 */
export function entityListing(page: Page) {
  const table = page.getByTestId('data-table-container');

  return {
    table,
    toolbar: page.getByTestId('data-grid-toolbar'),
    search: page.getByPlaceholder(/Search for entities/i),
    filters: page.getByRole('button', { name: 'Filters' }),
    columns: page.getByRole('button', { name: 'Columns' }),
    advancedFilters: page.getByTestId('advanced-filters-pane'),
    /** The funnel beside a column header. Its name is "Filter <column>". */
    columnFilter: (column: string) => page.getByRole('button', { name: `Filter ${column}` }),
    columnHeader: (name: string | RegExp) => table.getByRole('columnheader', { name }),
    rows: table.getByRole('row'),
    /** Data cells only, so this ignores the grid's two header rows. */
    cells: table.getByRole('gridcell'),
    resultCount: page.getByText(/[\d,]+ results/),
  };
}
