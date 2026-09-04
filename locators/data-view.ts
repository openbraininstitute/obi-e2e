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

  return {
    close: page.getByTitle('Close', { exact: true }),
    breadcrumbLink: (name: string) => page.getByRole('link', { name, exact: true }),

    mini,
    miniName: mini.getByRole('heading', { level: 1 }),
    miniProperty: (field: string) =>
      mini
        .getByTestId(`mini-detail-property-${field}`)
        .or(mini.getByText(propertyLabel(field)))
        .first(),
    miniDownload: mini.getByTitle('download'),
    viewDetails: mini.getByTitle('Go to details page'),

    section: (name: string) => page.getByTestId(name),
  };
}
