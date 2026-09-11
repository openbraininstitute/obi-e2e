import type { Page } from "@playwright/test";

/** The plans, in the order the page offers them. */
export const PLANS = ["Free", "Pro", "Enterprise", "Education"] as const;

export type Plan = (typeof PLANS)[number];

export const SUBSCRIPTION_ADDRESS =
  "mailto:subscription@openbraininstitute.org";

export function pricingLocators(page: Page) {
  const card = (plan: Plan) =>
    page.getByTestId(`pricing-plan-${plan.toLowerCase()}`);

  return {
    heading: page.getByTestId("landing-pricing-hero-heading"),
    intro: page.getByText(/flexible subscription plans and different pricing/i),
    discoverPlans: page.getByTestId("landing-pricing-hero-next"),
    card,
    planCards: page.getByTestId(
      /^pricing-plan-(free|pro|enterprise|education)$/,
    ),
    contactUs: (plan: Plan) =>
      page.getByTestId(`pricing-plan-${plan.toLowerCase()}-contact`),
  };
}
