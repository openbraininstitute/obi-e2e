import { DATA_TYPES, type DataSectionName } from '@fixtures/data-types';
import { routes } from '@fixtures/routes';
import { PRIVATE_READONLY } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { dataPage } from '@locators/data';

// Scenario: scenarios/data/data-types/scenario.md
test.describe('Data types', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.data(workspace.labId, workspace.projectId));

    // The page rewrites its own URL to add the scope, and the counters only
    // render once its data arrives. Interacting earlier loses the interaction.
    await page.waitForURL(/[?&]s=/);
    await expect(dataPage(page).typeCounter('cell_morphology')).toBeVisible();
  });

  for (const section of Object.keys(DATA_TYPES) as DataSectionName[]) {
    test(`lists every ${section} data type`, { tag: PRIVATE_READONLY }, async ({ page }) => {
      const data = dataPage(page);

      await data.section(section).click();
      await expect(data.section(section)).toHaveAttribute('aria-selected', 'true');

      for (const type of DATA_TYPES[section]) {
        const link = data.typeLink(type.slug);

        await expect(link).toBeVisible();
        await expect(link).toContainText(type.label);
      }
    });
  }
});
