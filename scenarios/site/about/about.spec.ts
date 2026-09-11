import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { aboutLocators } from './locators';

/** Each section, and the words its prose opens with. */
const SECTIONS = [
  ['2025: The Open Brain Institute', /Founded in 2025 by Henry Markram/i],
  ['Our Foundations: Blue Brain', /The Blue Brain Project was a pioneering scientific initiative/i],
  [
    'We thank all Blue Brain collaborators and contributors',
    /To all who contributed, we express our deepest gratitude/i,
  ],
] as const;

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('Open the About page', { tag: VISITOR }, async ({ page }) => {
    const about = aboutLocators(page);

    await expect(about.heading).toBeVisible();
    await expect(about.intro).toBeVisible();
    await expect(about.discoverOrigin).toBeVisible();
    await expect(about.heroImage).toBeVisible();
  });

  test("The page tells the institute's story in sections", { tag: VISITOR }, async ({ page }) => {
    const about = aboutLocators(page);

    for (const [section, prose] of SECTIONS) {
      await expect(about.section(section)).toBeVisible();
      await expect(page.getByText(prose)).toBeVisible();
    }
  });

  test('Browse our portals lists the legacy portals', { tag: VISITOR }, async ({ page }) => {
    const about = aboutLocators(page);

    await about.portalsHeading.scrollIntoViewIfNeeded();
    await expect(about.portalsHeading).toBeVisible();

    await expect(about.portalCards).toHaveCount(8);

    for (const title of await about.portalCards.allInnerTexts()) {
      expect(title.replace(/^Portal/, '').trim()).not.toBe('');
    }

    const hrefs = await about.portalCards.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    );
    for (const href of hrefs) {
      expect(href).toBeTruthy();
    }
  });

  /*
   * The contributors list is a run of unmarked elements: no test id, no role,
   * and no container that can be addressed without leaning on its classes. It
   * needs `data-testid="contributors-list"` in core-web-app before the count
   * before and after "Load more" can be compared.
   */
  test.fixme('Load more shows more contributors', { tag: VISITOR }, async () => {
    // Step: Note how many contributors are named
    // Step: Click "Load more"
    // Expect: More contributors are named than were noted
  });
});
