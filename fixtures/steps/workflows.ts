/** Steps the workflow scenarios share. */

import { entityListing } from '@locators/listing';
import { workflowBrowse, workflowsHub, workspaceNav } from '@locators/workflows';
import { expect, type Locator, type Page } from '@playwright/test';

import { NO_NAVIGATION } from '../interactions';
import { routes } from '../routes';
import type { ScanConfigSelection } from '../scan-config';

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

/**
 * The tick box of one row.
 *
 * The grid pins its selection column into a row of its own, so the row holding
 * the name holds no checkbox. Both carry the same `row-index`, which is what
 * ties the two halves back together.
 */
function selectionCheckbox(
  listing: ReturnType<typeof entityListing>,
  rowIndex: string | null
): Locator {
  return listing.table
    .locator(`[role="row"][row-index="${rowIndex ?? ''}"]`)
    .getByRole('checkbox')
    .first();
}

/**
 * Picks a row, and picks it again when the grid drops the click.
 *
 * The search is debounced, so a row that matched a moment ago can be a node the
 * grid is about to replace; a click on it leaves no selection behind. Picking
 * an already-picked row changes nothing, so the retry is safe.
 */
async function pickRow(
  name: string,
  pick: () => Promise<void>,
  took: () => Promise<void>
): Promise<void> {
  await expect(async () => {
    await pick();
    await took();
  }, `Selecting "${name}" did not take: the listing kept it unselected.`).toPass({
    timeout: 45_000,
  });
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
    await hub.category(activity).click(NO_NAVIGATION);
    await expect(hub.typeMenu(activity)).toBeVisible({ timeout: 2_000 });
  }).toPass();

  const card = hub.type(activity, workflow.label);
  await expect(card, `The ${activity} workflows do not include "${workflow.label}".`).toBeVisible();

  await expect(
    card,
    `"${workflow.label}" is disabled, so it cannot be started. A workflow behind a feature ` +
      'flag needs that flag set before the page loads.'
  ).not.toHaveAttribute('aria-disabled', 'true');

  /*
   * Clicked once, never retried. The card opens a route of its own, and a
   * retry that fires while that navigation is still in flight finds the hub
   * gone and waits out the action timeout for a card that has left the page,
   * over and over, until the test runs out of clock. A slow route compile
   * turned four Synaptome tests into eight-minute timeouts that way. The
   * hydration this used to guard against is already settled: the category
   * click above only opened its menu because React was listening.
   */
  await card.click();
  await page.waitForURL(new RegExp(`/workflows/${activity}/(new|configure)/`));
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
    await browse.scope(selection.scope).click(NO_NAVIGATION);
  }

  if (selection.mode === 'multiple' && selection.prerequisite) {
    await browse.prerequisite(selection.prerequisite).click(NO_NAVIGATION);
  }

  await expect(listing.table).toBeVisible();

  for (const name of selection.entities) {
    await listing.search.fill(name);
    await expect(listing.resultCount).toBeVisible();

    const row = listing.rows.filter({ hasText: name }).first();
    if (!(await appears(row))) {
      return `This project holds no "${name}" to build from.`;
    }

    if (selection.mode === 'multiple') {
      const checkbox = selectionCheckbox(listing, await row.getAttribute('row-index'));
      if ((await checkbox.count()) === 0) {
        return `The "${name}" listing offers nothing to tick, so nothing can be selected.`;
      }
      await pickRow(
        name,
        () => checkbox.check(NO_NAVIGATION),
        () => expect(checkbox).toBeChecked({ timeout: 5_000 })
      );
      continue;
    }

    await pickRow(
      name,
      () => row.getByRole('gridcell').filter({ hasText: name }).first().click(NO_NAVIGATION),
      () => expect(browse.useModel).toBeVisible({ timeout: 5_000 })
    );
  }

  await (selection.mode === 'single' ? browse.useModel : browse.useSelection).click();

  // The editor is a route, so this waits on the navigation clock rather than
  // the shorter one an assertion gets.
  await page.waitForURL(/\/configure\//);
  return null;
}
