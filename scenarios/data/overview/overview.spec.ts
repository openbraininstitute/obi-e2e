import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { dataPage } from '@locators/data';

test.describe('Data page', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.data(workspace.labId, workspace.projectId));

    await page.waitForURL(/[?&]s=/);
    await expect(dataPage(page).typeCounter('cell_morphology')).toBeVisible();
  });

  test('See the experimental data types', { tag: AUTHENTICATED }, async ({ page }) => {
    const data = dataPage(page);

    await expect(data.layout).toBeVisible();
    await expect(data.scope.public).toBeVisible();
    await expect(data.scope.project).toBeVisible();

    for (const section of ['experimental', 'models', 'simulations'] as const) {
      await expect(data.section(section)).toBeVisible();
    }

    await expect(data.dataType(/^Morphology/)).toBeVisible();
    await expect(data.typeCounter('cell_morphology')).toContainText(/\d/);
  });

  test('Switch to the model data types', { tag: AUTHENTICATED }, async ({ page }) => {
    const data = dataPage(page);

    await data.section('models').click();

    await expect(data.dataType(/^E-model/)).toBeVisible();
    await expect(data.dataType(/^Morphology/)).toBeHidden();
  });

  test("Switch to my project's data", { tag: AUTHENTICATED }, async ({ page, workspace }) => {
    const data = dataPage(page);

    await data.scope.project.click();

    await expect(data.scope.project).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(
      new RegExp(`${routes.data(workspace.labId, workspace.projectId)}`)
    );
    await expect(data.typeList).toBeVisible();
  });
});
