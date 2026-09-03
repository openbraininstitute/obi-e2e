import type { Locator, Page } from '@playwright/test';

/** The notice the application shows when a project has no credits to spend. */
export function lowCredits(page: Page) {
  return {
    notice: page.getByTestId('low-credits-notice'),
    /** Offers to top the project up. Only a virtual lab admin sees it. */
    action: page.getByTestId('low-credits-action'),
  };
}

/** The workspace navigation, above every page inside a project. */
export function workspaceNav(page: Page) {
  return {
    workflows: page.getByTestId('workspace-workflows'),
    data: page.getByTestId('workspace-explore-data'),
    notebooks: page.getByTestId('workspace-notebooks'),
  };
}

/** The workflows hub: an activity, then a type, then the workflow itself. */
export function workflowsHub(page: Page) {
  return {
    categoryMenu: page.getByTestId('workflow-category-menu'),

    /** An activity card, keyed by the activity in the `?activity=` parameter. */
    category: (activity: string): Locator => page.getByTestId(`workflow-category-${activity}`),

    typeMenu: (activity: string): Locator => page.getByTestId(`workflow-types-menu-${activity}`),

    /**
     * A type card, keyed by the campaign type in its configure URL. A card the
     * deployment does not offer is absent; one behind a feature flag renders
     * disabled.
     */
    type: (type: string): Locator => page.getByTestId(`workflow-type-${type}`),
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
      page.locator('[data-testid^="workflow-prerequisite-"]').filter({ hasText: name }).first(),

    /** One entity, confirmed from its preview panel. */
    useModel: page.getByTestId('workflow-use-model'),

    /** Several entities, confirmed from the table footer. */
    useSelection: page.getByTestId('workflow-browse-use-selection').getByRole('button', {
      name: /^Use selection/,
    }),
  };
}
