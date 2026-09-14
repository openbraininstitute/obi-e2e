/**
 * The scan config editor, the form behind /workflows/{activity}/configure/{type}.
 *
 * The editor is generated from obi-one's schema, so these locators use the
 * stable test IDs that core-webapp exposes instead of presentation details.
 */

import type { Locator, Page } from '@playwright/test';

/** Both attribute names: older deployments use the second, newer ones the first. */
export const UI_ELEMENT_ATTRIBUTES = [
  'data-scan-config-block-element-container-of',
  'data-scan-config-block-element',
] as const;

/** The ui_element a part was rendered from. */
export async function uiElementOf(part: Locator): Promise<string | null> {
  for (const name of UI_ELEMENT_ATTRIBUTES) {
    const value = await part.getAttribute(name);
    if (value !== null) return value;
  }
  return null;
}

/** Letters and digits only, so a key and a label can be compared. */
export function normalizeLabel(text: string): string {
  return text.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
}

export function scanConfigEditor(page: Page) {
  const middle = page.getByTestId('scan-config-middle-content');

  return {
    tab: (id: string): Locator => page.getByTestId(`scan-config-tab-${id}`),

    submit: page.getByTestId('scan-config-submit'),

    rootElement: (key: string): Locator => page.getByTestId(`scan-config-root-element-${key}`),

    addEntry: (rootElement: string): Locator =>
      page.getByTestId(`scan-config-add-entry-${rootElement}`),

    variant: (type: string): Locator => middle.getByTestId(`scan-config-variant-${type}`),

    variants: middle.getByTestId(/^scan-config-variant-/),

    entry: (rootElement: string, name: string): Locator =>
      page.getByTestId(`scan-config-entry-${rootElement}-${name}`),

    entriesOf: (rootElement: string): Locator =>
      page.getByTestId(new RegExp(`^scan-config-entry-${rootElement}-`)),

    /**
     * The block being edited.
     *
     * The app names a block after what it holds — `scan-config-block-{root
     * element}`, and a dictionary entry's block after the entry as well — so
     * there is no fixed id to ask for. A property key is only unique inside its
     * block, which is why the id carries the block at all.
     *
     * Not scoped to the middle column: the column's own test id is newer than
     * the block's, and a deployment that has one and not the other then matches
     * nothing, so every field lookup in the campaign fails. That is not
     * hypothetical — it is what `staging.openbraininstitute.org` serves today,
     * and production lags further still. The editor edits one block at a time
     * and `data-scan-config-block` marks the root of it, so the pair is enough
     * on its own. Both marks sit on the same element, which keeps it strict —
     * the dictionary and union wrappers carry the attribute too, but they carry
     * no `scan-config-block-` id.
     */
    block: (): Locator =>
      page.getByTestId(/^scan-config-block-/).and(page.locator('[data-scan-config-block]')),

    option: (value: string): Locator => page.getByTestId(`scan-config-option-${value}`),
  };
}

export function scanConfigResults(page: Page) {
  const results = page.getByTestId('scan-config-results');
  const mini = page.getByTestId('mini-viewer');
  const view = page.getByTestId('scan-config-file-view');

  return {
    coordinates: page.getByTestId(/^scan-config-coordinate-/),

    status: results.getByTestId('scan-config-status'),

    launch: results.getByTestId('scan-config-launch'),

    costConfirm: page.getByTestId('scan-config-cost-confirm'),
    costCancel: page.getByTestId('scan-config-cost-cancel'),

    inputs: page.getByTestId('scan-config-inputs'),
    outputs: page.getByTestId('scan-config-outputs'),

    file: (name: string): Locator => page.locator(`[data-file-name="${name}"]`),

    fileView: view,

    logs: view,

    preview: {
      entity: {
        card: mini,
        name: mini.getByTestId('mini-detail-name'),
        viewDetails: mini.getByTestId('mini-detail-view-details'),
        download: mini.getByTestId('mini-detail-download'),
        property: (label: string): Locator =>
          mini
            .getByText(new RegExp(`^${label.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
            .locator('..'),
      },
    },
  };
}

export function scanConfigModelPicker(page: Page) {
  const overlay = page.getByTestId('scan-config-model-picker');

  return {
    open: page.getByTestId('scan-config-select-model'),
    overlay,
    panel: overlay.getByTestId('data-table-container'),
    row: (name: string): Locator => overlay.getByTestId(`data-grid-row-${name}`),
    selectionControl: (rowId: string): Locator =>
      overlay.getByTestId(`data-grid-selection-${rowId}`),
    confirm: overlay.getByTestId('scan-config-confirm-model'),
    cancel: overlay.getByTestId('scan-config-cancel-model'),
  };
}

/** A field inside a block, found by its property key. */
export function scanConfigField(block: Locator, key: string): Locator {
  return block.getByTestId(`scan-config-field-${key}`);
}

export function scanConfigControl(field: Locator): Locator {
  return field.getByTestId('scan-config-control');
}

/** Quotes a value so it can sit inside an attribute selector. */
export function cssEscape(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

/** The options one control offers. */
export async function scanConfigOptions(control: Locator) {
  const page = control.page();

  /*
   * Which list these options belong to.
   *
   * A label is not unique on the page: "Distribution 1" is offered by every
   * reference field that can point at one, and antd portals each open dropdown
   * into its own child of `<body>` rather than into the field. A page-wide
   * lookup therefore matches the list that is open now together with one a
   * field opened a moment ago, and picking between them by visibility alone is
   * a race against the closing animation. The control names its own list and
   * each option says which list it came from, so ask for the pair.
   *
   * A deployment that exposes no marker falls back to the page-wide lookup.
   */
  const owner = await control.getAttribute('data-scan-config-options');
  const ownedByThisControl =
    owner === null ? null : page.locator(`[data-scan-config-option-of="${cssEscape(owner)}"]`);

  return {
    option: (value: string): Locator => {
      const offered = page.getByTestId(`scan-config-option-${value}`);
      return (ownedByThisControl ? offered.and(ownedByThisControl) : offered).filter({
        visible: true,
      });
    },

    /**
     * What this dropdown holds besides the value that was asked for.
     *
     * Scoped to the dropdown the picked option sits in — antd portals each one
     * into its own child of `<body>` — so a list that was open a moment ago is
     * out of reach.
     */
    chosenBesides: (value: string, picked: Locator): Locator =>
      picked
        .locator('xpath=ancestor::*[parent::body]')
        .locator(
          `[data-selected="true"]:not([data-testid="scan-config-option-${cssEscape(value)}"])`
        ),
  };
}

export function scanConfigSweepValues(field: Locator): Locator {
  return field.getByTestId('scan-config-sweep-value');
}

export function scanConfigSweep(field: Locator) {
  return {
    expand: field.getByTestId('scan-config-sweep-expand'),
    add: field.getByTestId('scan-config-sweep-add'),
    remove: field.getByTestId('scan-config-sweep-remove'),
  };
}
