import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { atlasPanel, figure } from './locators';
import { mouseAtlasRoute } from './mouse';

const A_COUNT = /Neurons \[N\][\s~]*[\d,]+/;
const A_DENSITY = /Neurons \[\/mm3\][\s~]*[\d,]+/;

test.describe('The atlas and its neuron counts', () => {
  test.beforeEach(async ({ page, workspace }) => {
    // Draws the whole mouse brain in WebGL and reads its cell composition:
    // over the ninety-second budget at eight workers.
    test.slow();

    await page.goto(await mouseAtlasRoute(workspace.labId, workspace.projectId));
    await expect(atlasPanel(page).view).toBeVisible();
  });

  test(
    "The 3D view opens with the region's neuron count",
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const atlas = atlasPanel(page);

      await expect(atlas.view).toBeVisible();
      await expect(atlas.counter).toBeVisible();
      await expect(atlas.counter).toHaveText(A_COUNT);
      await expect(atlas.resetCamera).toBeVisible();
    }
  );

  test('The switch turns the count into a density', { tag: AUTHENTICATED }, async ({ page }) => {
    const atlas = atlasPanel(page);

    await expect(atlas.counter).toHaveText(A_COUNT);
    const noted = await figure(page);

    await atlas.countOrDensity.click();

    await expect(atlas.countOrDensity).toHaveAttribute('aria-checked', 'true');
    await expect(atlas.counter).toHaveText(A_DENSITY);
    expect(await figure(page)).not.toBe(noted);
  });

  test(
    'The switch turns the density back into a count',
    { tag: AUTHENTICATED },
    async ({ page }) => {
      const atlas = atlasPanel(page);

      await expect(atlas.counter).toHaveText(A_COUNT);
      const noted = await figure(page);

      await atlas.countOrDensity.click();
      await expect(atlas.counter).toHaveText(A_DENSITY);

      await atlas.countOrDensity.click();

      await expect(atlas.countOrDensity).toHaveAttribute('aria-checked', 'false');
      await expect(atlas.counter).toHaveText(A_COUNT);
      expect(await figure(page)).toBe(noted);
    }
  );

  test('The region is broken down by cell type', { tag: AUTHENTICATED }, async ({ page }) => {
    const atlas = atlasPanel(page);

    await expect(atlas.composition).toBeVisible();
    await expect(atlas.composition).toContainText('M-TYPES');

    // Each cell type is listed with the number of cells beside it.
    await expect(atlas.composition).toHaveText(/[A-Z][\w-]*\s*[\d,]+/);
  });
});
