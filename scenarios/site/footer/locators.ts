import type { Page } from "@playwright/test";

/** Every link in the footer, in the order it lists them. */
export const FOOTER_LINKS = [
  "About OBI",
  "Our story",
  "Mission",
  "Team",
  "Gallery",
  "Pricing",
  "News",
  "Contact",
  "Login",
  "Terms and conditions",
  "Financing policy",
  "Privacy policy",
] as const;

const FOOTER_LINK_IDS: Record<(typeof FOOTER_LINKS)[number], string> = {
  "About OBI": "about",
  "Our story": "the-real-digital-brain-story",
  Mission: "mission",
  Team: "team",
  Gallery: "gallery",
  Pricing: "pricing",
  News: "news",
  Contact: "contact",
  Login: "app-virtual-lab",
  "Terms and conditions": "terms",
  "Financing policy": "financing",
  "Privacy policy": "privacy",
};

/** The social accounts, and where each one goes. */
export const SOCIAL_ACCOUNTS = {
  LinkedIn: "https://www.linkedin.com/company/openbraininstitute/",
  X: "https://x.com/OpenBrainInst",
  YouTube: "https://www.youtube.com/@openbraininstitute",
  Bluesky: "https://bsky.app/profile/openbraininst.bsky.social",
} as const;

const SOCIAL_IDS: Record<string, string> = {
  [SOCIAL_ACCOUNTS.LinkedIn]: "linkedin",
  [SOCIAL_ACCOUNTS.X]: "x",
  [SOCIAL_ACCOUNTS.YouTube]: "youtube",
  [SOCIAL_ACCOUNTS.Bluesky]: "bluesky",
};

export function siteFooter(page: Page) {
  const footer = page.getByTestId("site-footer");

  return {
    name: footer.getByRole("heading", {
      name: "Open Brain Institute",
      exact: true,
    }),
    copyright: footer.getByText("Copyright © 2026 - Open Brain Institute"),
    link: (label: (typeof FOOTER_LINKS)[number]) =>
      footer.getByTestId(`footer-link-${FOOTER_LINK_IDS[label]}`),
    social: (url: string) =>
      footer.getByTestId(`footer-social-${SOCIAL_IDS[url]}`),
    newsletterHeading: footer.getByRole("heading", {
      name: "Subscribe to our newsletter",
    }),
    email: footer.getByTestId("footer-newsletter-email"),
    privacy: footer.getByTestId("footer-privacy-checkbox"),
    subscribe: footer.getByTestId("footer-newsletter-submit"),
  };
}
