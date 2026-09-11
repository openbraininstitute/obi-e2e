import type { Page } from "@playwright/test";

/** The four things a virtual lab is for, as the page heads them. */
export const PURPOSES = [
  "Explore",
  "Build",
  "Experiment",
  "Collaborate",
] as const;

export function missionLocators(page: Page) {
  return {
    heading: page.getByTestId("landing-mission-hero-heading"),
    headline: page.getByRole("heading", {
      name: /Our mission is to empower researchers and organizations/i,
      level: 1,
    }),
    heroImage: page.getByTestId("landing-mission-hero-image"),
    purpose: (name: string) =>
      page.getByTestId(
        `mission-purpose-${PURPOSES.indexOf(name as (typeof PURPOSES)[number])}`,
      ),
    statement: page.getByTestId("mission-statement-download"),
  };
}
