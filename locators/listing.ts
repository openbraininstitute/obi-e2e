import type { Page } from '@playwright/test';

/** A name matched from its first character, with the regex characters in it escaped. */
function startsWith(name: string): RegExp {
  return new RegExp(`^${name.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

/**
 * The entity listing: its table, the toolbar above it, and the controls that
 * narrow what it shows. Shared because every data type renders the same grid.
 */
export function entityListing(page: Page) {
  const table = page.getByTestId('data-table-container');
  const toolbar = page.getByTestId('data-grid-toolbar');

  return {
    table,
    toolbar,
    search: toolbar.getByRole('textbox', { name: 'Search' }),
    filters: page.getByRole('button', { name: 'Filters' }),
    columns: page.getByRole('button', { name: 'Columns' }),
    /** Circuits only: swaps the flat listing for the hierarchy and back. */
    viewToggle: page.getByRole('button', { name: 'Toggle view' }),
    advancedFilters: page.getByTestId('advanced-filters-pane'),
    /**
     * The column chooser. It is an antd popover, which carries the tooltip
     * role, and it is the only one on the page while it is open.
     */
    columnsMenu: page.getByRole('tooltip'),
    columnToggle: (name: string) =>
      page.getByRole('tooltip').getByRole('checkbox', { name, exact: true }),
    /** Every toggle in the chooser, including its "Select all". */
    columnToggles: page.getByRole('tooltip').getByRole('checkbox'),
    /** The funnel beside a column header. Its name is "Filter <column>". */
    columnFilter: (column: string) => page.getByRole('button', { name: `Filter ${column}` }),
    /**
     * A column header, matched from the start of its name. Anchored, because
     * several columns share a prefix and a plain substring match would hit
     * both: "Temperature [°C]" and "Temperature dependent" are different
     * columns. Pass the full name, units included, to tell those two apart.
     */
    columnHeader: (column: string) => table.getByRole('columnheader', { name: startsWith(column) }),
    rows: table.getByRole('row'),
    /** Data cells only, so this ignores the grid's two header rows. */
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
