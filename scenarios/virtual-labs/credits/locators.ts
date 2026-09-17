import type { Page } from '@playwright/test';

/** The Credits page of a project. */
export function creditsRoute(labId: string, projectId: string): string {
  return `/app/virtual-lab/${labId}/${projectId}/credits`;
}

/** The columns the history heads, in order. */
export const HISTORY_COLUMNS = ['Category', 'Type', 'Member', 'Date'] as const;

/** The last column carries the cost, but is not marked up as a header. */
export const COST_COLUMN = 'Cost (Credits)';

/** A balance as the panel writes it: a label, then an amount. */
export function balanceOf(label: string): RegExp {
  return new RegExp(`${label}\\s*[\\d,]+\\.\\d{2}`);
}

export function credits(page: Page) {
  const panel = page.getByTestId('project-credits');

  return {
    panel,

    buy: page.getByTestId('buy-credits-btn'),
    transfer: page.getByTestId('transfer-credits-button'),
    pricing: page.getByTestId('credits-pricing-button'),

    historyHeading: page.getByTestId('credits-history-heading'),
    history: page.getByTestId('credits-history'),
    column: (name: string) => panel.getByRole('columnheader', { name }),
    entries: panel
      .getByRole('grid')
      .getByRole('row')
      .filter({ has: page.getByRole('gridcell') }),
  };
}
