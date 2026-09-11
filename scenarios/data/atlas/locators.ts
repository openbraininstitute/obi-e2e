import type { Page } from "@playwright/test";

export function atlasPanel(page: Page) {
  return {
    view: page.getByTestId("three-d-area"),
    resetCamera: page.getByTestId("atlas-reset-camera-button"),

    /** Reads "Neurons [N] ~ 24,030,000", or the density once switched. */
    counter: page.getByTestId("total-count-or-density"),
    countOrDensity: page.getByTestId("atlas-density-count-toggle"),

    composition: page.getByTestId("cell-composition-tree-container"),
  };
}

/** The figure the counter gives, without the label in front of it. */
export async function figure(page: Page): Promise<string> {
  const text = await atlasPanel(page).counter.innerText();
  return text.replace(/\s+/g, " ").trim();
}
