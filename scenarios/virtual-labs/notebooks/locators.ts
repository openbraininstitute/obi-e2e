import type { Page } from "@playwright/test";

/** The Notebooks page of a project. */
export function notebooksRoute(labId: string, projectId: string): string {
  return `/app/virtual-lab/${labId}/${projectId}/notebooks`;
}

/** The columns the listing shows, in order. */
export const COLUMNS = [
  "Name",
  "Description",
  "Scale",
  "Contributors",
  "Registration date",
] as const;

/** What the detail panel says about a notebook, by the property it names. */
export const PROPERTIES = {
  Scale: "notebook_scale",
  Contributors: "contribution",
  "Registration date": "creation_date",
} as const;

export function notebooks(page: Page) {
  const actions = page.getByTestId("notebook-mini-actions");

  return {
    layout: page.getByTestId("notebooks-layout"),
    openJupyter: page.getByTestId("open-jupyterhub-button"),

    scope: (name: "public" | "project") =>
      page.getByTestId(`scope-selector-tab-${name}`),
    row: (name: string) => page.getByTestId(`data-grid-row-${name}`),

    detail: {
      panel: page.getByTestId("mini-viewer"),
      name: page.getByTestId("mini-detail-name"),
      cells: page.getByTestId("notebook-cells-preview"),
      property: (key: string) =>
        page.getByTestId(`mini-detail-property-${key}`),
      actions,
      download: actions.getByTestId("notebook-download-button"),
      run: actions.getByTestId("notebook-run-default-button"),
      viewDetails: actions.getByTestId("notebook-view-details-link"),
    },
  };
}
