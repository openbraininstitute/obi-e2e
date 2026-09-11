import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { FIRST_PAGE, newsLocators } from './locators';

test.describe('News page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/news');
  });

  test('Open the News page', { tag: VISITOR }, async ({ page }) => {
    const news = newsLocators(page);

    await expect(news.heading).toBeVisible();
    await expect(news.readMore).toHaveCount(FIRST_PAGE);
  });

  test(
    'Every article is titled, pictured and can be opened',
    { tag: VISITOR },
    async ({ page }) => {
      const news = newsLocators(page);

      await expect(news.articleTitles).toHaveCount(FIRST_PAGE);
      for (const title of await news.articleTitles.allInnerTexts()) {
        expect(title.trim()).not.toBe('');
      }

      await expect(news.readMore).toHaveCount(FIRST_PAGE);

      expect(await news.images.count()).toBeGreaterThanOrEqual(FIRST_PAGE);
    }
  );

  test('Load more articles adds to the list', { tag: VISITOR }, async ({ page }) => {
    const news = newsLocators(page);

    await expect(news.readMore).toHaveCount(FIRST_PAGE);

    await news.loadMore.scrollIntoViewIfNeeded();
    await news.loadMore.click();

    await expect(news.readMore).not.toHaveCount(FIRST_PAGE);
    expect(await news.readMore.count()).toBeGreaterThan(FIRST_PAGE);
  });
});
