/** The words each activity uses in the editor. */

import type { ScanConfigActivity } from './index';

export type ScanConfigWords = {
  resultsTab: string;
  generate: string;
  newCampaign: string;
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
