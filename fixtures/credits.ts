import type { Page } from '@playwright/test';

/**
 * The application polls the project's balance and refuses to generate a
 * campaign when it is empty, so the two outcomes a user can meet — a project
 * that can pay for a run and one that cannot — are both worth a test.
 *
 * The empty case is arranged by answering that one request rather than by
 * draining the project, which would take the rest of the suite down with it and
 * could not be undone.
 */
const BALANCE_ROUTE = '**/projects/*/accounting/balance';

export async function pretendNoCredits(page: Page, projectId: string): Promise<void> {
  await page.route(BALANCE_ROUTE, (route) =>
    route.fulfill({
      json: { data: { proj_id: projectId, balance: '0', reservation: '0' } },
    })
  );
}

/** Stops answering the balance request, so the project's real balance applies. */
export async function stopPretending(page: Page): Promise<void> {
  await page.unroute(BALANCE_ROUTE);
}
