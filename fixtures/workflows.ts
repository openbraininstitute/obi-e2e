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
 * Why a step could not be reached, in the words a skip should use.
 * `null` means it was.
 */
export type WorkflowUnavailable = string | null;

/** Opens a workflow from the hub. */
export async function startWorkflow(
  page: Page,
  activity: string,
  workflow: { label: string; type: string }
): Promise<void> {
  const hub = workflowsHub(page);

  await expect(hub.category(activity), `The hub offers no ${activity} workflows.`).toBeVisible();

  // The hub renders before React attaches its handlers, so a first click can
  // land on nothing. Retry until the choice takes effect rather than waiting a
  // fixed time for hydration.
  await expect(async () => {
    await hub.category(activity).click();
    await expect(hub.typeMenu(activity)).toBeVisible({ timeout: 2_000 });
  }).toPass();

  const card = hub.type(activity, workflow.label);
  await expect(card, `The ${activity} workflows do not include "${workflow.label}".`).toBeVisible();

  // A workflow behind a feature flag renders disabled until the flag is on, so
  // this also catches a test that forgot to set it.
  await expect(
    card,
    `"${workflow.label}" is disabled, so it cannot be started. A workflow behind a feature ` +
      'flag needs that flag set before the page loads.'
  ).not.toHaveAttribute('aria-disabled', 'true');

  // Most workflows collect their entities first; one that has nothing to
  // collect opens its editor straight away, so either destination is a start.
  await expect(async () => {
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/workflows/${activity}/(new|configure)/`), {
      timeout: 5_000,
    });
  }).toPass();
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

  // A workflow with no browse step is already in its editor.
  if (selection.mode === 'none') return null;

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
