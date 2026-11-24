/** The detail page's action menu is exactly the set its type is supposed to show. */

import type { DetailActions, DetailActionState } from '@fixtures/detail-actions';
import { expect, type Page } from '@playwright/test';

const TEST_ID = {
  copyId: 'data-view-action-copy-id',
  simulate: 'data-view-action-simulate',
  build: 'data-view-action-build',
  download: 'data-view-action-download',
  delete: 'data-view-action-delete',
} as const;

/**
 * The buttons on the open detail page equal `expected`.
 *
 * Presence is not enough: an action the type grew, or one it lost, both fail.
 * Enabled and disabled are different states, because a draft entity keeps
 * Simulate and Build on screen and refuses them.
 */
export async function expectDetailActions(
  page: Page,
  expected: DetailActions | null
): Promise<void> {
  const menu = page.getByTestId('data-view-actions');
  if (expected === null) {
    await expect(menu, 'This page should not have an action menu.').toHaveCount(0);
    return;
  }
  await expect(menu).toBeVisible();

  const found = await menu
    .locator('[data-testid^="data-view-action-"]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('data-testid')));
  const known = new Set<string>(Object.values(TEST_ID));
  const unexpected = [...new Set(found.filter((id) => id !== null && !known.has(id)))];
  expect(unexpected, `The detail menu has an action this check does not know.`).toEqual([]);

  for (const [name, state] of Object.entries(expected) as [
    keyof DetailActions,
    DetailActionState,
  ][]) {
    const action = menu.getByTestId(TEST_ID[name]);
    if (state === 'absent') {
      await expect(action, `${name} is on a page that should not offer it.`).toHaveCount(0);
      continue;
    }
    await expect(action, `${name} is missing.`).toHaveCount(1);
    if (state === 'enabled') await expect(action).toBeEnabled();
    else await expect(action).toBeDisabled();
  }
}
