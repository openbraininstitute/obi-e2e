import { VISITOR } from '@fixtures/tags';
import { expect, test } from '@fixtures/test';

import { CHAPTERS, STORY_PATH, storyLocators } from './locators';

const FIRST_CHAPTER = '01. A Two-Decade Odyssey to Recreate the Brain';

test.describe('Our story', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(STORY_PATH);
  });

  test('Open the story', { tag: VISITOR }, async ({ page }) => {
    const story = storyLocators(page);

    await expect(story.heading).toBeVisible();
    await expect(story.discoverStory).toBeVisible();
    await expect(story.heroImage).toBeVisible();
  });

  test('The story is told in numbered chapters', { tag: VISITOR }, async ({ page }) => {
    const story = storyLocators(page);

    await expect(story.chapters.first()).toHaveText(FIRST_CHAPTER);
    await expect(story.chapters).toHaveCount(CHAPTERS);

    const titles = await story.chapters.allInnerTexts();
    titles.forEach((title, index) => {
      const number = String(index + 1).padStart(2, '0');
      expect(title.trim().startsWith(`${number}. `)).toBe(true);
      expect(title.trim().replace(/^\d\d\.\s*/, '')).not.toBe('');
    });
  });
});
