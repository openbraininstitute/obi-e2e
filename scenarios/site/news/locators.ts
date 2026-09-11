import type { Page } from "@playwright/test";

/** How many articles the page lists before anything is loaded. */
export const FIRST_PAGE = 10;

export function newsLocators(page: Page) {
  const cards = page.getByTestId(/^news-card-/);

  return {
    heading: page.getByTestId("landing-news-hero-heading"),
    cards,
    readMore: cards.getByRole("link", { name: /Read more about / }),
    articleTitles: cards.getByRole("heading", { level: 1 }),
    images: cards.getByRole("img"),
    loadMore: page.getByTestId("news-load-more"),
  };
}
