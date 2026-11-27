/** The download panel a circuit's card opens. */
import type { Page } from '@playwright/test';

export function circuitDownloads(page: Page) {
  const panel = page.getByTestId('circuit-download-panel');
  return {
    panel,
    /**
     * The "Download full circuit" row, which shows the compressed circuit's size
     * and format once the circuit holds one. core-web-app gives the row no test
     * id yet; its element id is the only handle, and it is unique in the panel.
     */
    fullCircuit: panel.locator('#download-header'),
  };
}
