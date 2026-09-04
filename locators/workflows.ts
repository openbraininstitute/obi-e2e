/** Workflows hub, workspace nav, and the entity browse step. */

import type { Locator, Page } from '@playwright/test';

export function lowCredits(page: Page) {
  const notice = page.getByRole('alert').filter({ hasText: /credit/i });

  return {
    notice,
    action: notice.getByRole('button'),
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

    prerequisite: (name: string): Locator =>
      page.getByRole('button').filter({ hasText: name }).first(),

    useModel: page
      .getByRole('button', { name: 'Use model' })
      .or(page.getByRole('link', { name: 'Use model' })),

    useSelection: page.getByTestId('workflow-browse-use-selection').getByRole('button', {
      name: /^Use selection/,
    }),
  };
}
