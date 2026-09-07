import { DATA_TYPES, type DataSectionName } from '@fixtures/data-types';
import { routes } from '@fixtures/routes';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';
import { dataPage } from '@locators/data';

test.describe('Data types', () => {
  test.beforeEach(async ({ page, workspace }) => {
    await page.goto(routes.data(workspace.labId, workspace.projectId));

    await page.waitForURL(/[?&]s=/);
    await expect(dataPage(page).typeCounter('cell_morphology')).toBeVisible();
  });

  for (const section of Object.keys(DATA_TYPES) as DataSectionName[]) {
    test(
      `See the data types of each section: ${section}`,
      { tag: AUTHENTICATED },
      async ({ page }) => {
        const data = dataPage(page);

        await data.section(section).click();
        await expect(data.section(section)).toHaveAttribute('aria-selected', 'true');

        for (const type of DATA_TYPES[section]) {
          const link = data.typeLink(type.slug);

          await expect(link).toBeVisible();
          await expect(link).toContainText(type.label);
        }
      }
    );
  }
});
