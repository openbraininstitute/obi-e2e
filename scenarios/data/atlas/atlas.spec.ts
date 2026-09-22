import { NO_NAVIGATION } from '@fixtures/interactions';
import { AUTHENTICATED } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { atlasPanel, figure } from './locators';
import { mouseAtlasRoute } from './mouse';

const A_COUNT = /Neurons \[N\][\s~]*[\d,]+/;
const A_DENSITY = /Neurons \[\/mm3\][\s~]*[\d,]+/;

/**
 * How long the page gets to settle before a test reads it.
 *
 * Opening the whole mouse brain downloads an 8.7 MB composition summary and
 * folds it into a tree, and the viewer fetches and paints one mesh per region
 * in WebGL — on a two-core runner with no GPU, both on the main thread. The
 * counter is usually up in ten seconds, but the September runs hold passing
 * attempts of 85 and 101 seconds and every failure died at the 30-second
 * assertion clock with the skeleton still showing. Reading the page before it
 * has settled is what turned this scenario flaky, and a click sent while the
 * meshes are still being built hangs until the runner is free again.
 */
const SETTLES_WITHIN = 150_000;

test.describe('The atlas and its neuron counts', () => {
  test.beforeEach(async ({ page, workspace }) => {
    // Over the ninety-second budget at eight workers, for the reasons above.
    test.slow();

    await page.goto(await mouseAtlasRoute(workspace.labId, workspace.projectId));

    const atlas = atlasPanel(page);
    await expect(atlas.view).toBeVisible();
    // Both halves of the page, together, so a test starts on a page that has
    // nothing left to draw and the budget above is the whole wait. The spinner
    // is counted rather than expected hidden: it is simply gone once the meshes
    // are painted, and there is nothing to be strict about.
    await Promise.all([
      // Or the panel's own "failed", so a fetch the app gave up on is reported
      // the moment it shows rather than as the counter never arriving.
      expect(atlas.counter.or(atlas.compositionFailed)).toBeVisible({ timeout: SETTLES_WITHIN }),
      expect(atlas.viewLoading).toHaveCount(0, { timeout: SETTLES_WITHIN }),
    ]);
    if (await atlas.compositionFailed.isVisible()) {
      throw new Error(
        `The composition panel gave up: "${await atlas.compositionFailed.innerText()}".`
      );
    }
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

    await atlas.countOrDensity.click(NO_NAVIGATION);

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

      await atlas.countOrDensity.click(NO_NAVIGATION);
      await expect(atlas.counter).toHaveText(A_DENSITY);

      await atlas.countOrDensity.click(NO_NAVIGATION);

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
