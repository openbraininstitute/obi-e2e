/** Workflows hub, workspace nav, and the entity browse step. */

import type { Locator, Page } from '@playwright/test';

export function lowCredits(page: Page) {
  const marked = page.getByTestId('low-credits-notice');
  const notice = marked.or(
    page
      .getByRole('alert')
      .filter({ hasText: /credit/i })
      .filter({ hasNot: marked })
  );

  return {
    notice,
    action: notice.getByTestId('low-credits-action').or(notice.getByRole('button')),
  };
}

export function workspaceNav(page: Page) {
  return {
    workflows: page.getByRole('link', { name: /^Workflows/ }),
    data: page.getByRole('link', { name: /^Data/ }),
    notebooks: page.getByRole('link', { name: /^Notebooks/ }),
  };
}

function categoryLabel(activity: string): string {
  return activity === 'process' ? 'Process data' : activity;
}

export function workflowsHub(page: Page) {
  return {
    categoryMenu: page.getByTestId('workflow-category-menu'),

    category: (activity: string): Locator =>
      page.getByTestId('workflow-category-menu').getByRole('button', {
        name: new RegExp(`^${categoryLabel(activity)}\\b`, 'i'),
      }),

    typeMenu: (activity: string): Locator => page.getByTestId(`workflow-types-menu-${activity}`),

    type: (activity: string, label: string): Locator =>
      page
        .getByTestId(`workflow-types-menu-${activity}`)
        .getByRole('button')
        .filter({
          hasText: new RegExp(`${label.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}(Start|$)`),
        }),
  };
}

export function workflowBrowse(page: Page) {
  return {
    scope: (name: 'public' | 'project'): Locator => page.getByTestId(`scope-selector-tab-${name}`),

    // A prerequisite is a card, and different workflows draw it as a radio or a button.
    prerequisite: (name: string): Locator =>
      page.getByRole('radio').or(page.getByRole('button')).filter({ hasText: name }).first(),

    // The role fallbacks hold until the test id ships to staging; the disabled
    // form is a button, the enabled one an asChild link carrying the same id.
    useModel: page
      .getByTestId('workflow-use-model')
      .or(page.getByRole('button', { name: 'Use model' }))
      .or(page.getByRole('link', { name: 'Use model' })),

    useSelection: page.getByTestId('workflow-browse-use-selection').getByRole('button', {
      name: /^Use selection/,
    }),
  };
}
