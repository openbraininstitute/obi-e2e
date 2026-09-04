import type { ScanConfigActivity } from './scan-config';

/**
 * The words each activity puts on the same controls, and what it calls its
 * results.
 *
 * The application keeps one message per activity so the wording reads naturally
 * — a build generates builds, a simulation generates simulations — which means
 * a test cannot hard-code any of it. Mirrors `messages` in core-web-app
 * (`src/i18n/en/scan-config.ts`) and `ScanConfigTabs`
 * (`src/features/scan-config/types.ts`).
 */
export type ScanConfigWords = {
  /** Id of the tab holding what the campaign produced. */
  resultsTab: string;
  /** Launches the campaign. */
  generate: string;
  /** Replaces it once a campaign exists. */
  newCampaign: string;
  /** Runs the selected coordinates. */
  launch: string;
};

export const scanConfigWords: Record<ScanConfigActivity, ScanConfigWords> = {
  build: {
    resultsTab: 'results',
    generate: 'Generate build(s)',
    newCampaign: 'New build campaign',
    launch: 'Launch builds',
  },
  simulate: {
    resultsTab: 'simulations',
    generate: 'Generate simulation(s)',
    newCampaign: 'New simulation campaign',
    launch: 'Launch simulations',
  },
  extract: {
    resultsTab: 'extractions',
    generate: 'Generate extraction(s)',
    newCampaign: 'New extraction campaign',
    launch: 'Launch extractions',
  },
  process: {
    resultsTab: 'skeletonizations',
    generate: 'Generate skeletonization(s)',
    newCampaign: 'New skeletonization campaign',
    launch: 'Launch skeletonizations',
  },
};
