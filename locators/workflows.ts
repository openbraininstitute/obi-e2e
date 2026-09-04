import type { Locator, Page } from '@playwright/test';

/** The notice the application shows when a project has no credits to spend. */
export function lowCredits(page: Page) {
  const notice = page.getByRole('alert').filter({ hasText: /credit/i });

  return {
    notice,
    action: notice.getByRole('button'),
  };
}

/** The workspace navigation, above every page inside a project. */
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

/**
 * The `/new` step, where a workflow collects the entities it starts from. The
 * table itself is the shared entity listing, so use {@link entityListing} for
 * its rows, search and result count.
 */
export function workflowBrowse(page: Page) {
  return {
    /** Public entities or the project's own. The browse step opens on public. */
    scope: (name: 'public' | 'project'): Locator => page.getByTestId(`scope-selector-tab-${name}`),

    /**
     * A workflow that scopes its tables asks for one of these first. The test id
     * carries the dataset id, which differs per environment, so the card is
     * narrowed to prerequisites and then found by the name the fixture uses.
     */
    prerequisite: (name: string): Locator =>
      page.getByRole('button').filter({ hasText: name }).first(),

    useModel: page
      .getByRole('button', { name: 'Use model' })
      .or(page.getByRole('link', { name: 'Use model' })),

    /** Several entities, confirmed from the table footer. */
    useSelection: page.getByTestId('workflow-browse-use-selection').getByRole('button', {
      name: /^Use selection/,
    }),
  };
}
