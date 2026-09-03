import type { Page } from '@playwright/test';

export type DataSection = 'experimental' | 'models' | 'simulations';

/**
 * The Data page frame: scope, section tabs and the data type list. Shared
 * because every data scenario starts by reaching a type through it.
 */
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
    /** The entity counter carries the entity's snake_case name. */
    typeCounter: (entity: string) => page.getByTestId(`entity-link-counter-${entity}`),
    dataType: (name: string | RegExp) => typeList.getByRole('button', { name }),
  };
}
