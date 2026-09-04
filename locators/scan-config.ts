/**
 * The scan config editor, the form behind /workflows/{activity}/configure/{type}.
 *
 * The editor is generated from obi-one's schema, so its labels can change. It
 * marks every part it renders with the ui_element it came from, so these
 * locators use that attribute, then find the control inside by role and name.
 */

import type { Locator, Page } from '@playwright/test';

/** Both attribute names: older deployments use the second, newer ones the first. */
export const UI_ELEMENT_ATTRIBUTES = [
  'data-scan-config-block-element-container-of',
  'data-scan-config-block-element',
] as const;

const RENDERED_PART = UI_ELEMENT_ATTRIBUTES.map((name) => `[${name}]`).join(', ');

/** The ui_element a part was rendered from. */
export async function uiElementOf(part: Locator): Promise<string | null> {
  for (const name of UI_ELEMENT_ATTRIBUTES) {
    const value = await part.getAttribute(name);
    if (value !== null) return value;
  }
  return null;
}

const ROOT_ELEMENT_LABELS: Record<string, string> = {
  initialize: 'Initialization',
};

function rootElementLabel(key: string): string {
  const label = ROOT_ELEMENT_LABELS[key] ?? key.replaceAll('_', ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Letters and digits only, so a key and a label can be compared. */
export function normalizeLabel(text: string): string {
  return text.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
}

export function scanConfigEditor(page: Page) {
  const middle = page.locator('#scan-config-middle-content');

  return {
    tab: (id: string): Locator =>
      page
        .getByTestId(`scan-config-tab-${id}`)
        .or(page.getByRole('button', { name: id, exact: true })),

    submit: page.getByTestId('scan-config-submit').or(
      page.locator('#scan-config-controls-left').getByRole('button', {
        name: /^(Generate|Build|Run|Process)/,
      })
    ),

    rootElement: (key: string): Locator =>
      page
        .getByTestId(`scan-config-root-element-${key}`)
        .or(
          page
            .locator('[data-scan-config-menu="left-menu-top-item"]')
            .filter({ hasText: rootElementLabel(key) })
        )
        .first(),

    addEntry: (rootElement: string): Locator =>
      page
        .getByTestId(`scan-config-add-entry-${rootElement}`)
        .or(
          page
            .locator(`[data-scan-config-menu="${rootElement}-menu-block-dictionary-sub-entry"]`)
            .getByRole('button', { name: /^Add\b/ })
        )
        .first(),

    variant: (type: string, title?: string): Locator =>
      middle
        .getByTestId(`scan-config-variant-${type}`)
        .or(
          middle
            .locator('[data-scan-config-block-element-item="block_dictionary_item"] > span')
            .filter({
              hasText:
                title === undefined
                  ? variantPattern(type)
                  : new RegExp(`^${title.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            })
        )
        .first(),

    variants: middle.locator(
      '[data-scan-config-block-element-item="block_dictionary_item"] > span'
    ),

    entry: (rootElement: string, name: string): Locator =>
      page
        .getByTestId(`scan-config-entry-${rootElement}-${name}`)
        .or(
          page
            .locator(`#${rootElement}-menu-block-dictionary-sub-entry__container`)
            .getByRole('button', { name, exact: true })
        )
        .first(),

    entriesOf: (rootElement: string): Locator =>
      page
        .locator(`#${rootElement}-menu-block-dictionary-sub-entry__container`)
        .getByRole('button'),

    block: (): Locator => middle.locator('[data-scan-config-block="block_single"]'),

    option: (value: string): Locator =>
      page
        .getByTestId(`scan-config-option-${value}`)
        .or(page.getByRole('option', { name: value, exact: true }))
        .first(),
  };
}

function variantPattern(type: string): RegExp {
  const words = type.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2');
  return new RegExp(`^${words.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export function scanConfigResults(page: Page) {
  const results = page.locator('#scan-config-results');
  const mini = page.getByTestId('mini-viewer');
  const view = page
    .getByTestId('scan-config-file-view')
    .or(page.locator('#scan-config-results-right-column'))
    .first();

  return {
    coordinates: page.locator('[data-testid^="scan-config-coordinate-"]'),

    status: results.getByRole('status'),

    launch: results.getByRole('button', { name: /^Launch/ }),

    costConfirm: page.getByRole('dialog').getByRole('button', { name: /^(Launch|Confirm|Yes)/ }),
    costCancel: page.getByRole('dialog').getByRole('button', { name: /^(Cancel|No)/ }),

    inputs: page.getByTestId('scan-config-inputs'),
    outputs: page.getByTestId('scan-config-outputs'),

    file: (name: string): Locator => page.locator(`[data-file-name="${name}"]`),

    fileView: view,

    logs: view,

    preview: {
      entity: {
        card: mini,
        name: mini.getByRole('heading', { level: 1 }),
        viewDetails: mini.getByTitle('Go to details page'),
        download: mini.getByTitle('download'),
        property: (label: string): Locator =>
          mini
            .getByText(new RegExp(`^${label.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
            .locator('..'),
      },
    },
  };
}

export function scanConfigModelPicker(page: Page) {
  const overlay = page.locator('#scan-config-model-selection-overlay');

  return {
    open: page.getByRole('button', { name: /^Select / }),
    overlay,
    panel: overlay.getByTestId('data-table-container'),
    confirm: overlay.getByRole('button', { name: /^Confirm/ }),
    cancel: overlay.getByRole('button', { name: 'Cancel' }),
  };
}

/** A field inside a block, found by its property key. */
export function scanConfigField(block: Locator, key: string): Locator {
  return block
    .getByTestId(`scan-config-field-${key}`)
    .or(block.locator(RENDERED_PART).filter({ hasText: fieldPattern(key) }))
    .first();
}

function fieldPattern(key: string): RegExp {
  const parts = key.match(/[a-z]+|[0-9]+/gi) ?? [key];
  return new RegExp(`^${parts.join('[^a-z0-9]*')}`, 'i');
}

export function scanConfigControl(field: Locator): Locator {
  return field.getByTestId('scan-config-control').or(field.locator(RENDERED_PART)).last();
}

export function scanConfigSweepValues(field: Locator): Locator {
  const marked = field.getByTestId('scan-config-sweep-value');
  return marked.or(field.getByRole('spinbutton'));
}

export function scanConfigSweep(field: Locator) {
  return {
    expand: field
      .getByTestId('scan-config-sweep-expand')
      .or(field.getByRole('button', { name: 'Scan over several values' }))
      .first(),
    add: field
      .getByTestId('scan-config-sweep-add')
      .or(field.getByRole('button', { name: /^Add/ }))
      .first(),
    remove: field
      .getByTestId('scan-config-sweep-remove')
      .or(field.getByRole('button', { name: /^Remove/ }))
      .first(),
  };
}
