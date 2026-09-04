/** Steps the workflow scenarios share. */

import { entityListing } from '@locators/listing';
import { workflowBrowse, workflowsHub, workspaceNav } from '@locators/workflows';
import { expect, type Locator, type Page } from '@playwright/test';

import { routes } from './routes';
import type { ScanConfigSelection } from './scan-config';

type Workspace = { labId: string; projectId: string };

const APPEARS_TIMEOUT = 15_000;

async function appears(locator: Locator): Promise<boolean> {
  return locator
    .waitFor({ state: 'visible', timeout: APPEARS_TIMEOUT })
    .then(() => true)
    .catch(() => false);
}

/** Opens the hub, through the nav when the first load lands elsewhere. */
export async function openWorkflowsHub(page: Page, workspace: Workspace): Promise<void> {
  await page.goto(routes.workflows(workspace.labId, workspace.projectId), {
    waitUntil: 'domcontentloaded',
  });

  await expect(async () => {
    if (!page.url().endsWith('/workflows')) {
      const nav = workspaceNav(page);
      const link = (await nav.workflows.count())
        ? nav.workflows
        : page.getByRole('link', { name: /^Workflows/ }).first();
      await link.click();
    }
    expect(page.url()).toMatch(/\/workflows$/);
  }).toPass();

  await expect(workflowsHub(page).categoryMenu).toBeVisible();
}

/** Why a step could not run, or null when it ran. */
export type WorkflowUnavailable = string | null;

/** Opens a workflow from the hub. */
export async function startWorkflow(
  page: Page,
  activity: string,
  workflow: { label: string; type: string }
): Promise<void> {
  const hub = workflowsHub(page);

  await expect(hub.category(activity), `The hub offers no ${activity} workflows.`).toBeVisible();

  await expect(async () => {
    await hub.category(activity).click();
    await expect(hub.typeMenu(activity)).toBeVisible({ timeout: 2_000 });
  }).toPass();

  const card = hub.type(activity, workflow.label);
  await expect(card, `The ${activity} workflows do not include "${workflow.label}".`).toBeVisible();

  await expect(
    card,
    `"${workflow.label}" is disabled, so it cannot be started. A workflow behind a feature ` +
      'flag needs that flag set before the page loads.'
  ).not.toHaveAttribute('aria-disabled', 'true');

  await expect(async () => {
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/workflows/${activity}/(new|configure)/`), {
      timeout: 5_000,
    });
  }).toPass();
}

/** Picks what the workflow works from. Returns a reason when the project has none. */
export async function chooseEntities(
  page: Page,
  selection: ScanConfigSelection
): Promise<WorkflowUnavailable> {
  const browse = workflowBrowse(page);
  const listing = entityListing(page);

  if (selection.mode === 'none') return null;

  if (selection.scope) {
    await browse.scope(selection.scope).click();
  }

  if (selection.mode === 'multiple' && selection.prerequisite) {
    await browse.prerequisite(selection.prerequisite).click();
  }

  await expect(listing.table).toBeVisible();

  for (const name of selection.entities) {
    await listing.search.fill(name);
    await expect(listing.resultCount).toBeVisible();

    const row = listing.rows.filter({ hasText: name }).first();
    if (!(await appears(row))) {
      return `This project holds no "${name}" to build from.`;
    }

    const checkbox = row.getByRole('checkbox');
    if (selection.mode === 'multiple' && (await checkbox.count()) > 0) {
      await checkbox.first().check();
    } else {
      await row.getByRole('gridcell').filter({ hasText: name }).first().click();
    }
  }

  await (selection.mode === 'single' ? browse.useModel : browse.useSelection).click();
  await expect(page).toHaveURL(/\/configure\//);
  return null;
}
