import { entityListing } from '@locators/listing';
import { workflowBrowse, workflowsHub, workspaceNav } from '@locators/workflows';
import { expect, type Locator, type Page } from '@playwright/test';

import { routes } from './routes';
import type { ScanConfigSelection } from './scan-config';

type Workspace = { labId: string; projectId: string };

/**
 * Whether an element turns up at all.
 *
 * Deciding that a deployment lacks something is a claim about the page having
 * settled, so it is worth a short wait. Long enough for a rendered page,
 * short enough that a genuine absence does not cost the run.
 */
const APPEARS_TIMEOUT = 15_000;

async function appears(locator: Locator): Promise<boolean> {
  return locator
    .waitFor({ state: 'visible', timeout: APPEARS_TIMEOUT })
    .then(() => true)
    .catch(() => false);
}

/**
 * Opens the workflows hub.
 *
 * A first arrival is routed through `/app/virtual-lab/sync`, which can land on
 * the project home instead of the page that was asked for. Reaching it from the
 * nav afterwards is what a user does, and it always arrives.
 */
export async function openWorkflowsHub(page: Page, workspace: Workspace): Promise<void> {
  await page.goto(routes.workflows(workspace.labId, workspace.projectId), {
    waitUntil: 'domcontentloaded',
  });

  await expect(async () => {
    if (!page.url().endsWith('/workflows')) {
      const nav = workspaceNav(page);
      // A deployment that predates the nav test ids still renders the link.
      const link = (await nav.workflows.count())
        ? nav.workflows
        : page.getByRole('link', { name: /^Workflows/ }).first();
      await link.click();
    }
    expect(page.url()).toMatch(/\/workflows$/);
  }).toPass();

  await expect(workflowsHub(page).categoryMenu).toBeVisible();
}

/**
 * Why a workflow could not be started, in the words a skip should use.
 * `null` means it started.
 */
export type WorkflowUnavailable = string | null;

/**
 * Starts a workflow from the hub.
 *
 * @returns `null` once the workflow is open, or why it could not be started:
 * a workflow behind a feature flag renders disabled, and one a deployment does
 * not have — because it predates the workflow, or the test ids that address it
 * — is absent altogether. Either is a skip for the caller, not a failure.
 */
export async function startWorkflow(
  page: Page,
  activity: string,
  type: string
): Promise<WorkflowUnavailable> {
  const hub = workflowsHub(page);

  // These tests address the hub by test ids that ship with the scan-config
  // change. A deployment without them cannot be driven at all, which is a
  // different thing from a workflow it chooses not to offer. Both look like an
  // absent element, so each waits: an element that is merely still rendering
  // must not be read as one that will never arrive.
  if (!(await appears(hub.category(activity)))) {
    return (
      'This deployment predates the workflow test ids these tests address ' +
      `(no workflow-category-${activity}).`
    );
  }

  // The hub renders before React attaches its handlers, so a first click can
  // land on nothing. Retry until the choice takes effect rather than waiting a
  // fixed time for hydration.
  await expect(async () => {
    await hub.category(activity).click();
    await expect(hub.typeMenu(activity)).toBeVisible({ timeout: 2_000 });
  }).toPass();

  const card = hub.type(type);
  if (!(await appears(card))) {
    return `"${type}" is not among the ${activity} workflows this deployment offers.`;
  }
  if ((await card.getAttribute('aria-disabled')) === 'true') {
    return `"${type}" is disabled in this deployment, so it cannot be started.`;
  }

  await expect(async () => {
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/workflows/${activity}/new/`), { timeout: 5_000 });
  }).toPass();

  return null;
}

/**
 * Picks the entities the editor initialises from.
 *
 * @returns `null` once the editor is open, or why it could not be reached: a
 * project without the source data has no row to choose.
 */
export async function chooseEntities(
  page: Page,
  selection: ScanConfigSelection
): Promise<WorkflowUnavailable> {
  const browse = workflowBrowse(page);
  const listing = entityListing(page);

  // The tab is chosen before the prerequisite, because it reloads the tables
  // beneath it.
  if (selection.scope) {
    await browse.scope(selection.scope).click();
  }

  if (selection.mode === 'multiple' && selection.prerequisite) {
    await browse.prerequisite(selection.prerequisite).click();
  }

  await expect(listing.table).toBeVisible();

  for (const name of selection.entities) {
    // The table pages at thirty rows, so the entity is searched for rather than
    // looked for on whichever page happens to be showing.
    await listing.search.fill(name);
    await expect(listing.resultCount).toBeVisible();

    const row = listing.rows.filter({ hasText: name }).first();
    if (!(await appears(row))) {
      return `This project holds no "${name}" to build from.`;
    }

    // Several entities are ticked in the table; one is opened for preview. The
    // name cell rather than the row, because a click on the description opens
    // its tooltip instead.
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
