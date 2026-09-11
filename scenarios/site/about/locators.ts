import { by } from "@locators/helpers";
import type { Page } from "@playwright/test";

export function aboutLocators(page: Page) {
  return {
    heading: page.getByTestId("landing-about-hero-heading"),
    intro: page.getByText(
      /non-profit organization whose mission is to empower researchers/i,
    ),
    discoverOrigin: page.getByTestId("landing-about-hero-next"),
    heroImage: page.getByTestId("landing-about-hero-image"),

    section: (name: string | RegExp) => by.heading(page, name, 1),

    portalsHeading: by.heading(page, "Browse our portals", 1),
    portalCards: page.getByTestId("portal-cards").getByTestId("portal-card"),
  };
}
