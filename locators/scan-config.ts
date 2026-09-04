import type { Locator, Page } from '@playwright/test';

/**
 * The scan-configuration editor, the form behind every
 * `/workflows/{activity}/configure/{type}` route.
 *
 * The editor is not hand-written: it renders whatever obi-one's `openapi.json`
 * describes, so every label is product data that a schema change can rewrite.
 * Each handle here is therefore a test id keyed on the schema's own property
 * key or type name, which is stable in a way the visible text is not. The ids
 * are guarded by a unit test in core-web-app
 * (`src/__tests__/scan-config/block-field-testids.test.tsx`).
 */
export function scanConfigEditor(page: Page) {
  return {
    /** `configuration` or, once a campaign exists, `results`. */
    tab: (id: string): Locator => page.getByTestId(`scan-config-tab-${id}`),

    /** Launches the campaign. Named per activity, so read its text to assert. */
    submit: page.getByTestId('scan-config-submit'),

    /** A root element in the left-hand list, keyed by its schema property. */
    rootElement: (key: string): Locator => page.getByTestId(`scan-config-root-element-${key}`),

    /** Adds one entry to a block dictionary. */
    addEntry: (rootElement: string): Locator =>
      page.getByTestId(`scan-config-add-entry-${rootElement}`),

    /** Picks which kind of block to add, keyed by its obi-one type. */
    variant: (type: string): Locator => page.getByTestId(`scan-config-variant-${type}`),

    /** One entry of a block dictionary, in the left-hand list. */
    entry: (rootElement: string, name: string): Locator =>
      page.getByTestId(`scan-config-entry-${rootElement}-${name}`),

    /**
     * The fields of one block. A dictionary mounts only the selected entry, so
     * the entry name is part of the id.
     */
    block: (rootElement: string, entry?: string): Locator =>
      page.getByTestId(
        entry === undefined
          ? `scan-config-block-${rootElement}`
          : `scan-config-block-${rootElement}-${entry}`
      ),

    /**
     * One choice in a dropdown, keyed by the value it writes into the
     * configuration rather than the text it shows.
     */
    option: (value: string): Locator => page.getByTestId(`scan-config-option-${value}`),

    /** Any mounted block of a dictionary, whichever entry is selected. */
    anyBlockOf: (rootElement: string): Locator =>
      page.locator(`[data-testid^="scan-config-block-${rootElement}-"]`),
  };
}

/**
 * The results of a launched campaign: one coordinate per combination of swept
 * values, the configuration each was generated from, and the control that runs
 * them.
 */
export function scanConfigResults(page: Page) {
  return {
    /** One card per coordinate in the campaign grid. */
    coordinates: page.locator('[data-testid^="scan-config-coordinate-"]'),

    /** A coordinate's execution status: `created` until it is launched. */
    status: page.getByTestId('scan-config-status'),

    /** Runs the selected coordinates. Opens a cost confirmation first. */
    launch: page.getByTestId('scan-config-launch'),

    costConfirm: page.getByTestId('scan-config-cost-confirm'),
    costCancel: page.getByTestId('scan-config-cost-cancel'),

    /** The files a coordinate was generated from. */
    inputs: page.getByTestId('scan-config-inputs'),

    /** The files a run produced. */
    outputs: page.getByTestId('scan-config-outputs'),

    /** One input or output file, by the name the panel shows. */
    file: (name: string): Locator => page.locator(`[data-file-name="${name}"]`),

    /** The pane showing whichever file is open. */
    fileView: page.getByTestId('scan-config-file-view'),

    /** The task's log stream, shown for the log file. */
    logs: page.getByTestId('scan-config-logs'),

    /** What the right-hand pane shows for the file that is open. */
    preview: {
      /** A registered entity: its name, what it is, and what can be done with it. */
      entity: {
        card: page.getByTestId('mini-viewer'),
        name: page.getByTestId('mini-detail-name'),
        viewDetails: page.getByTestId('mini-detail-view-details'),
        download: page.getByTestId('mini-detail-download'),
        /** One labelled property of the entity. */
        properties: page.locator('[data-testid^="mini-detail-property-"]'),
      },
    },
  };
}

/** One field inside a block. A property key is only unique within its block. */
export function scanConfigField(block: Locator, key: string): Locator {
  return block.getByTestId(`scan-config-field-${key}`);
}

/**
 * The control a field renders: its text box, checkbox, select or popover
 * trigger. Which of those it is follows from the field's `ui_element`.
 */
export function scanConfigControl(field: Locator): Locator {
  return field.getByTestId('scan-config-control');
}

/**
 * One value of a sweep. A field holds one of these when it takes a single
 * number, and one per value once it scans over several.
 */
export function scanConfigSweepValues(field: Locator): Locator {
  return field.getByTestId('scan-config-sweep-value');
}

/** The controls that turn one value into a list of them, and back. */
export function scanConfigSweep(field: Locator) {
  return {
    expand: field.getByTestId('scan-config-sweep-expand'),
    add: field.getByTestId('scan-config-sweep-add'),
    remove: field.getByTestId('scan-config-sweep-remove'),
  };
}

/**
 * The `ui_element` the field was rendered from. The editor records it on the
 * field wrapper, so a test dispatches on the same value the application did.
 */
export const UI_ELEMENT_ATTRIBUTE = 'data-scan-config-block-element-container-of';
