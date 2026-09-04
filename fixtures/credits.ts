/** Makes the app see a project with no credits. */

import type { Page } from '@playwright/test';

const BALANCE_ROUTE = '**/projects/*/accounting/balance';

export async function pretendNoCredits(page: Page, projectId: string): Promise<void> {
  await page.route(BALANCE_ROUTE, (route) =>
    route.fulfill({
      json: { data: { proj_id: projectId, balance: '0', reservation: '0' } },
    })
  );
}

export async function stopPretending(page: Page): Promise<void> {
  await page.unroute(BALANCE_ROUTE);
}
