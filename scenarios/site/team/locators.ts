import type { Page } from "@playwright/test";

/** The three groups the team is split into, as the page heads them. */
export const GROUPS = ["Board", "Executive board", "The team"] as const;

export function teamLocators(page: Page) {
  return {
    heading: page.getByTestId("landing-team-hero-heading"),
    discoverTeam: page.getByTestId("landing-team-hero-next"),
    group: (name: string) =>
      page.getByRole("heading", { name, exact: true, level: 1 }),
    memberPhoto: (name: string) =>
      page.getByTestId(
        `team-member-${name.toLowerCase().replaceAll(" ", "-")}-photo`,
      ),
    photos: page.getByTestId(/^team-member-.+-photo$/),
  };
}

/** The names the page captions its member photos with. */
export async function memberNames(page: Page): Promise<string[]> {
  return teamLocators(page).photos.evaluateAll((images) =>
    images.map((image) => image.getAttribute("alt") ?? "").filter(Boolean),
  );
}
