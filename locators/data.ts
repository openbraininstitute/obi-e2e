/** The Data page: scope tabs, sections, and type links. */

import type { Page } from '@playwright/test';

export type DataSection = 'experimental' | 'models' | 'simulations';

export function dataPage(page: Page) {
  const typeList = page.getByTestId('data-type-items-container');

  return {
    layout: page.getByTestId('data-layout'),
    scope: {
      public: page.getByTestId('scope-selector-tab-public'),
      project: page.getByTestId('scope-selector-tab-project'),
    },
    speciesSelector: page.getByTestId('species-selector'),
    sectionTabs: page.getByTestId('data-type-tabs-container'),
    section: (name: DataSection) => page.getByTestId(`data-type-tab-${name}`),
    typeList,
    typeCounter: (entity: string) => page.getByTestId(`entity-link-counter-${entity}`),
    typeLink: (slug: string) =>
      page.getByTestId(`entity-link-counter-${slug.replaceAll('-', '_')}`),
    dataType: (name: string | RegExp) => typeList.getByRole('button', { name }),
  };
}
