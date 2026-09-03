import type { Page } from '@playwright/test';

/** The entity listing: its table and the toolbar above it. */
export function morphologyListing(page: Page) {
  const table = page.getByTestId('data-table-container');

  return {
    table,
    toolbar: page.getByTestId('data-grid-toolbar'),
    filters: page.getByRole('button', { name: 'Filters' }),
    columns: page.getByRole('button', { name: 'Columns' }),
    columnHeader: (name: string) => table.getByRole('columnheader', { name }),
    rows: table.getByRole('row'),
  };
}
