import type { Page } from '@playwright/test';

/** A submenu entry, and the page it opens. */
export type Entry = { label: string; path: string; heading: string };

export const ABOUT_MENU: readonly Entry[] = [
  { label: 'About OBI', path: '/about', heading: 'About' },
  {
    label: 'Our story',
    path: '/the-real-digital-brain-story',
    heading: 'The Real Digital Brain Story',
  },
  { label: 'Mission', path: '/mission', heading: 'Mission' },
  { label: 'Team', path: '/team', heading: 'Team' },
];

/** The identity providers the sign-in page offers, by the broker each uses. */
export const SIGN_IN_PROVIDERS = ['github', 'google', 'microsoft'] as const;

export const PLATFORM_MENU: readonly Entry[] = [
  { label: 'Features', path: '/features', heading: 'Features' },
  { label: 'Showcases', path: '/showcases', heading: 'Showcases' },
  { label: 'Pricing', path: '/pricing', heading: 'Pricing' },
];

const ENTRY_IDS: Record<string, string> = {
  'About OBI': 'about',
  'Our story': 'the-real-digital-brain-story',
  Mission: 'mission',
  Team: 'team',
  Features: 'features',
  Showcases: 'showcases',
  Pricing: 'pricing',
};

export function siteMenu(page: Page) {
  const header = page.getByTestId('site-header');
  const menu = (slug: 'about' | 'pricing') => header.getByTestId(`header-desktop-menu-${slug}`);

  return {
    about: menu('about'),
    aboutButton: header.getByTestId('header-desktop-menu-about-toggle'),
    platform: menu('pricing'),
    platformButton: header.getByTestId('header-desktop-menu-pricing-toggle'),
    entry: (_within: 'About' | 'The Platform', label: string) =>
      header.getByTestId(`header-desktop-link-${ENTRY_IDS[label]}`),
    news: header.getByTestId('header-desktop-link-news'),
    contact: header.getByTestId('header-desktop-link-contact'),
    login: header.getByTestId('header-desktop-link-app-virtual-lab'),
  };
}
