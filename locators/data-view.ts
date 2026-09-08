/** The entity view page and its mini viewer. */

import type { Page } from '@playwright/test';

const PROPERTY_LABELS: Record<string, string> = {
  mtype: 'M Type',
  etype: 'E Type',
  me_model: 'ME Model',
  eModelScore: 'E Model score',
  temperature_celsius: 'Temperature',
};

function propertyLabel(field: string): RegExp {
  const label = PROPERTY_LABELS[field] ?? field.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2');
  const parts = label.match(/[a-z]+|[0-9]+/gi) ?? [label];
  return new RegExp(`^${parts.join('[^a-z0-9]*')}`, 'i');
}

export function dataView(page: Page) {
  const mini = page.getByTestId('mini-viewer');
  const actions = page.getByTestId('data-view-actions');

  return {
    close: page.getByTitle('Close', { exact: true }),
    breadcrumbLink: (name: string) => page.getByRole('link', { name, exact: true }),

    /** The action menu of the left panel, on the entity's own page. */
    actions,
    copyId: actions.getByTestId('data-view-action-copy-id'),
    simulate: actions.getByTestId('data-view-action-simulate'),
    download: actions.getByTestId('data-view-action-download'),
    delete: actions.getByTestId('data-view-action-delete'),

    mini,
    miniName: mini.getByTestId('mini-detail-name').or(mini.getByRole('heading', { level: 1 })),
    miniProperty: (field: string) =>
      mini
        .getByTestId(`mini-detail-property-${field}`)
        .or(mini.getByText(propertyLabel(field)))
        .first(),
    miniDownload: mini.getByTestId('mini-detail-download').or(mini.getByTitle('download')),
    viewDetails: mini
      .getByTestId('mini-detail-view-details')
      .or(mini.getByTitle('Go to details page')),

    section: (name: string) => page.getByTestId(name),
  };
}
