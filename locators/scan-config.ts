/**
 * The scan config editor, the form behind /workflows/{activity}/configure/{type}.
 *
 * The editor is generated from obi-one's schema, so these locators use the
 * stable test IDs that core-webapp exposes instead of presentation details.
 */

import type { Locator, Page } from '@playwright/test';
import { kebabCase } from 'es-toolkit';

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
    /** Public or the project's own: a task result a run registered lives in the project. */
    scope: (name: 'public' | 'project'): Locator =>
      overlay.getByTestId(`scope-selector-tab-${name}`),
    row: (name: string): Locator => overlay.getByTestId(`data-grid-row-${name}`),
    /** The row of one entity. Its test id carries only the name, which two entities can share. */
    rowWithId: (id: string): Locator =>
      overlay.getByTestId(/^data-grid-row-/).and(overlay.locator(`[row-id="${cssEscape(id)}"]`)),
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

/**
 * One value a selection control holds, if it holds that one.
 *
 * core-web-app marks each value it holds with an id of its own, which is the only
 * exact answer to "does this field already hold what the fixture asked for":
 * antd draws each value of a multi-value control as its own tag, so the rendered
 * text reads back as one run of words — "AllTimestamps 0" — and a control showing
 * "Neuron set 10" cannot be told apart from one holding "Neuron set 1".
 *
 * Both sides build the id with the same `kebabCase`, so a value named in a
 * fixture reaches the element holding it.
 */
export function scanConfigHeld(control: Locator, value: string): Locator {
  return control.getByTestId(`scan-config-held_${kebabCase(value)}`);
}

export function scanConfigControl(field: Locator): Locator {
  return field.getByTestId('scan-config-control');
}

/** A number that can be left unset: its value, and the button back to unset. */
export function scanConfigOptionalNumber(field: Locator) {
  return {
    value: field.getByTestId('scan-config-optional-value'),
    clear: field.getByTestId('scan-config-optional-clear'),
  };
}

/** One protocol's card, by the type the fixture names it with. */
export function scanConfigProtocol(field: Locator, type: string) {
  const card = field.getByTestId(`scan-config-protocol-${type}`);

  return {
    card,
    select: field.getByTestId(`scan-config-protocol-select-${type}`),
    expand: field.getByTestId(`scan-config-protocol-expand-${type}`),
    settings: field.getByTestId(`scan-config-protocol-settings-${type}`),

    /** One remove button per feature, so counting these counts the features. */
    features: card.getByTestId(/^scan-config-feature-remove-/),
  };
}

/** The prefix an amplitude row's test id carries, ahead of the amplitude itself. */
const AMPLITUDE_ROW = 'scan-config-amplitude-row-';

/** The amplitudes in the open protocol settings panel. */
export function scanConfigAmplitudes(page: Page) {
  const list = page.getByTestId('scan-config-amplitudes');

  return {
    rows: list.getByTestId(new RegExp(`^${AMPLITUDE_ROW}`)),

    /** The amplitude a row is for, read off the id the row is found by. */
    amplitudeOf: async (row: Locator): Promise<string> =>
      ((await row.getAttribute('data-testid')) ?? '').slice(AMPLITUDE_ROW.length),

    extract: (row: Locator): Locator => row.getByTestId('scan-config-amplitude-extract'),

    validation: (row: Locator): Locator => row.getByTestId('scan-config-amplitude-validation'),
  };
}

/**
 * The e-type field: a search over entitycore's e-type taxonomy rather than a
 * browsable table, so it opens a dropdown of its own instead of the model
 * picker. core-web-app gives neither half a test id; the dropdown is portaled
 * out of the field and is only told apart by its search box.
 */
export function scanConfigETypePicker(field: Locator) {
  const page = field.page();
  const dropdown = page.getByRole('dialog').filter({ has: page.getByPlaceholder(SEARCH_E_TYPE) });

  return {
    open: field.getByRole('combobox'),
    search: dropdown.getByPlaceholder(SEARCH_E_TYPE),
    option: (label: string): Locator => dropdown.getByRole('button', { name: label, exact: true }),
  };
}

const SEARCH_E_TYPE = /^Search e-type/;

/**
 * What each section list's card is headed with. The card shows nothing else
 * that names it.
 *
 * ponytail: copied from obi-one's schema (`base_parameters.choices`), so a
 * relabelled section list breaks the lookup until this is updated. A test id
 * on the card, keyed by the choice's name, retires the table.
 */
const SECTION_LIST_LABELS: Record<string, string> = {
  all: 'All sections',
  myelinated: 'Myelinated',
  somadend: 'Soma and dendrites',
  somatic: 'Somatic',
  axonal: 'Axonal',
  apical: 'Apical',
  basal: 'Basal',
  alldend: 'All dendrites',
  allnoaxon: 'All sections without axon',
  somaxon: 'Soma and axon',
  allact: 'All active sections',
};

/** The card title a section list shows, or a failure naming the ones known. */
export function sectionListLabel(name: string): string {
  const label = SECTION_LIST_LABELS[name];
  if (label === undefined) {
    throw new Error(
      `"${name}" is not a section list the Mechanisms section offers. It offers: ` +
        `${Object.keys(SECTION_LIST_LABELS).join(', ')}.`
    );
  }
  return label;
}

/** An ion channel model as the Mechanisms section shows it: its name, and its id when known. */
export type MechanismModel = { name: string; id?: string };

/**
 * The Mechanisms section of the e-model optimisation form.
 *
 * Hand-built rather than generated from the schema. Its inner tabs carry test
 * ids; the cards and rows past them get theirs from core-web-app's
 * `test/emodel-optimisation-testids`, keyed by what the seed already holds: a
 * section list by its schema name, a model by its entity id, a parameter by its
 * NMODL name. Until that ships, each falls back to the words it shows, matched
 * exactly because "All sections" also heads "All sections without axon", and
 * "gNaTg" is a parameter of the same channel as "gNaTgbar". Both halves of each
 * `.or()` are the same element.
 */
export function scanConfigEModelMechanisms(page: Page) {
  const middle = page.getByTestId('scan-config-middle-content');
  const named = (text: string): Locator => page.getByText(text, { exact: true });

  /** A card or a row button, by the title it shows. */
  const button = (title: string): Locator =>
    middle.getByRole('button').filter({ has: named(title) });

  /** A row in one of the drawers, by the name it shows. */
  const row = (name: string): Locator => middle.getByRole('listitem').filter({ has: named(name) });

  /** The marked element when the model's id is known, else the one showing its name. */
  const byModel = (prefix: string, model: MechanismModel, fallback: Locator): Locator =>
    model.id === undefined ? fallback : middle.getByTestId(`${prefix}${model.id}`).or(fallback);

  return {
    tab: (key: string): Locator => page.getByTestId(`scan-config-emodel-mechanisms-tab-${key}`),

    /** Opens the drawer of one section list. It toggles: pressed means open. */
    sectionList: (name: string): Locator =>
      middle
        .getByTestId(`scan-config-emodel-section-list-${name}`)
        .or(button(sectionListLabel(name))),

    /** Region Assignment: the box that assigns one model to the open section list. */
    assign: (model: MechanismModel): Locator =>
      byModel('scan-config-emodel-assign-', model, row(model.name)).getByRole('checkbox'),

    /** Parameters Selection: the model whose parameters the third drawer lists. */
    model: (model: MechanismModel): Locator =>
      byModel('scan-config-emodel-model-', model, button(model.name)),

    parameter: (name: string) => {
      const parameter = middle.getByTestId(`scan-config-emodel-parameter-${name}`).or(row(name));
      return {
        row: parameter,
        include: parameter.getByRole('checkbox'),
        mode: (mode: 'Fixed' | 'Bounds'): Locator => parameter.getByRole('radio', { name: mode }),
        value: parameter.getByPlaceholder('Value', { exact: true }),
        min: parameter.getByPlaceholder('Min', { exact: true }),
        max: parameter.getByPlaceholder('Max', { exact: true }),
      };
    },
  };
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
