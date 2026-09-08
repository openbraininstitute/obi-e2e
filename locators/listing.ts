/** The entity listing: search, columns, filters, rows, and pages. */

import type { Page } from '@playwright/test';

function startsWith(name: string): RegExp {
  return new RegExp(`^${name.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

export function listingError(page: Page) {
  return page
    .getByText(/An error occurred while fetching|don't have permission to access/i)
    .first();
}

export function entityListing(page: Page) {
  const table = page.getByTestId('data-table-container');
  const toolbar = page.getByTestId('data-grid-toolbar');

  return {
    table,
    toolbar,
    search: toolbar.getByRole('textbox', { name: 'Search' }),
    filters: page.getByRole('button', { name: 'Filters' }),
    columns: page.getByRole('button', { name: 'Columns' }),
    viewToggle: page.getByRole('button', { name: 'Toggle view' }),
    advancedFilters: page.getByTestId('advanced-filters-pane'),
    columnsMenu: page.getByRole('tooltip'),
    columnToggle: (name: string) =>
      page.getByRole('tooltip').getByRole('checkbox', { name, exact: true }),
    columnToggles: page.getByRole('tooltip').getByRole('checkbox'),
    columnFilter: (column: string) => page.getByRole('button', { name: `Filter ${column}` }),
    columnHeader: (column: string) => table.getByRole('columnheader', { name: startsWith(column) }),
    rows: table.getByRole('row'),
    cells: table.getByRole('gridcell'),
    resultCount: page.getByText(/[\d,]+ results/),

    pagination: page.getByRole('list').filter({ has: page.getByTitle('Next Page') }),
    pageSize: page.getByRole('combobox').filter({ hasText: '/ page' }),
    pageLink: (number: number) =>
      page
        .getByRole('list')
        .filter({ has: page.getByTitle('Next Page') })
        .getByRole('listitem')
        .filter({ hasText: new RegExp(`^${number}$`) }),
  };
}
