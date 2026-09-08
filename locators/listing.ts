/** The entity listing: search, columns, filters, rows, and pages. */

import type { Page } from '@playwright/test';

function startsWith(name: string): RegExp {
  return new RegExp(`^${name.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

export function listingError(page: Page) {
  return page
    .getByTestId('data-grid-error')
    .or(page.getByText(/An error occurred while fetching|don't have permission to access/i))
    .first();
}

export function entityListing(page: Page) {
  const table = page.getByTestId('data-table-container');
  const toolbar = page.getByTestId('data-grid-toolbar');
  const pagination = page.getByTestId('data-grid-pagination');
  const chooser = page.getByTestId('column-chooser-panel');
  const columnsMenu = chooser.or(page.getByRole('tooltip').filter({ hasNot: chooser }));

  return {
    table,
    toolbar,
    search: toolbar
      .getByTestId('data-grid-search')
      .or(toolbar.getByRole('textbox', { name: 'Search' })),
    filters: page
      .getByTestId('toolbar-pill-filters')
      .or(page.getByRole('button', { name: 'Filters' })),
    columns: page
      .getByTestId('toolbar-pill-columns')
      .or(page.getByRole('button', { name: 'Columns' })),
    viewToggle: page
      .getByTestId('view-toggle')
      .or(page.getByRole('button', { name: 'Toggle view' })),
    advancedFilters: page.getByTestId('advanced-filters-pane'),
    columnsMenu,
    columnToggle: (name: string) =>
      columnsMenu
        .getByTestId(`column-chooser-option-${name}`)
        .or(columnsMenu.getByRole('checkbox', { name, exact: true })),
    columnToggles: columnsMenu.getByRole('checkbox'),
    columnFilter: (column: string) =>
      page
        .getByTestId(`column-filter-trigger-${column}`)
        .or(page.getByRole('button', { name: `Filter ${column}` })),
    columnHeader: (column: string) => table.getByRole('columnheader', { name: startsWith(column) }),
    rows: table.getByRole('row'),
    cells: table.getByRole('gridcell'),
    resultCount: page.getByTestId('data-grid-result-count').or(page.getByText(/[\d,]+ results/)),

    pagination,
    pageSize: page
      .getByTestId('data-grid-page-size')
      .or(page.getByRole('combobox').filter({ hasText: '/ page' })),
    pageLink: (number: number) =>
      pagination.getByRole('listitem').filter({ hasText: new RegExp(`^${number}$`) }),
  };
}
