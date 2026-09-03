import { routes } from '../../../fixtures/routes';
import { expect, test } from '../../../fixtures/test';
import { dataPage } from '../../../locators/data';

// Scenario: scenarios/data-page/scenario.md
test.describe('Data page', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.data(workspace.labId, workspace.projectId));

    // The page rewrites its own URL to add the scope shortly after loading, and
    // the counters only render once its data arrives. Interacting before both
    // have happened loses the interaction.
    await page.waitForURL(/[?&]s=/);
    await expect(dataPage(page).typeCounter('cell_morphology')).toBeVisible();
  });

  test(
    'shows the experimental data types and their counts',
    { tag: ['@private', '@readonly'] },
    async ({ page }) => {
      const data = dataPage(page);

      await expect(data.layout).toBeVisible();
      await expect(data.scope.public).toBeVisible();
      await expect(data.scope.project).toBeVisible();

      for (const section of ['experimental', 'models', 'simulations'] as const) {
        await expect(data.section(section)).toBeVisible();
      }

      await expect(data.dataType(/^Morphology/)).toBeVisible();
      // The counter reads "6225 of 6225". Assert it carries a number rather than
      // a fixed one, because staging data changes.
      await expect(data.typeCounter('cell_morphology')).toContainText(/\d/);
    }
  );

  test('switches to the model data types', { tag: ['@private', '@readonly'] }, async ({ page }) => {
    const data = dataPage(page);

    await data.section('models').click();

    await expect(data.dataType(/^E-model/)).toBeVisible();
    await expect(data.dataType(/^Morphology/)).toBeHidden();
  });

  test(
    "switches to the project's own data",
    { tag: ['@private', '@readonly'] },
    async ({ page, workspace }) => {
      const data = dataPage(page);

      await data.scope.project.click();

      await expect(data.scope.project).toHaveAttribute('aria-selected', 'true');
      await expect(page).toHaveURL(
        new RegExp(`${routes.data(workspace.labId, workspace.projectId)}`)
      );
      await expect(data.typeList).toBeVisible();
    }
  );
});
