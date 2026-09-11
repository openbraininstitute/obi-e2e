import type { Page } from "@playwright/test";

export const STORY_PATH = "/the-real-digital-brain-story";

/** How many chapters the story is told in. */
export const CHAPTERS = 23;

export function storyLocators(page: Page) {
  return {
    heading: page.getByTestId(
      "landing-the-real-digital-brain-story-hero-heading",
    ),
    discoverStory: page.getByTestId(
      "landing-the-real-digital-brain-story-hero-next",
    ),
    heroImage: page.getByTestId(
      "landing-the-real-digital-brain-story-hero-image",
    ),
    chapters: page.getByTestId(/^story-chapter-\d+$/),
  };
}
