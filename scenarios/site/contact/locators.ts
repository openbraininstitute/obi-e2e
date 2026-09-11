import type { Page } from "@playwright/test";

export const SUPPORT_ADDRESS = "mailto:support@openbraininstitute.org";
export const GENERAL_ADDRESS = "mailto:info@openbraininstitute.org";

export function contactLocators(page: Page) {
  return {
    heading: page.getByTestId("landing-contact-hero-heading"),
    getInTouch: page.getByTestId("landing-contact-hero-next"),

    mailLinks: page.getByTestId(/contact-email-(support|general)/),
    support: page.getByTestId("contact-email-support"),
    general: page.getByTestId("contact-email-general"),
  };
}
