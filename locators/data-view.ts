import type { Page } from '@playwright/test';

/**
 * The two ways out of a details page, and the panels on the way in.
 *
 * The breadcrumb and the close button are not interchangeable. The breadcrumb
 * clears the grid's session state on the way back, so the listing starts fresh;
 * the close button is a plain link and leaves it alone.
 */
export function dataView(page: Page) {
  return {
    close: page.getByTestId('data-view-close'),
    breadcrumb: page.getByTestId('data-view-breadcrumb'),
    breadcrumbLink: (name: string) =>
      page.getByTestId('data-view-breadcrumb').getByRole('link', { name }),

    /** The panel that opens beside the listing when a row is clicked. */
    mini: page.getByTestId('mini-viewer'),
    miniName: page.getByTestId('mini-detail-name'),
    /** A property in the mini panel, by the field the application names it with. */
    miniProperty: (field: string) => page.getByTestId(`mini-detail-property-${field}`),
    miniDownload: page.getByTestId('mini-detail-download'),
    viewDetails: page.getByTestId('mini-detail-view-details'),

    /** Sections of the full details page. Which ones exist varies by type. */
    section: (name: string) => page.getByTestId(name),
  };
}
