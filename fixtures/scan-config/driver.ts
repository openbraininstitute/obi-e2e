/** Fills the scan config editor from a fixture. */

import { entityName, type EntityTypeName } from '@api/entities';
import { EntityTypeDict } from '@fixtures/entity-types';
import {
  scanConfigAmplitudes,
  scanConfigControl,
  scanConfigEditor,
  scanConfigField,
  scanConfigHeld,
  scanConfigModelPicker,
  scanConfigOptionalNumber,
  scanConfigOptions,
  scanConfigProtocol,
  scanConfigSweep,
  scanConfigSweepValues,
  uiElementOf,
} from '@locators/scan-config';
import { morphologyLocations, morphologyViewer } from '@locators/viewer';
import { expect, type Locator, type Page } from '@playwright/test';

import { NO_NAVIGATION } from '../interactions';
import type { ScanConfigCase } from './index';
import { ScanConfigUiElement } from './ui-elements';

/** Types one configuration into the editor, field by field. */
/** More than this many unasked-for values means the list is not behaving as a list. */
const MAX_EXTRA_SELECTIONS = 20;

/** A control that holds several values at once, rather than one. */
const MULTIPLE_VALUE_CONTROL = '[data-scan-config-block-element$="__multiple"]';

/**
 * How long one attempt at opening a list waits before it is tried again.
 *
 * Short on purpose: the whole point of retrying is not to spend the assertion
 * timeout staring at a list the click never opened.
 */
const OPENS_WITHIN = 5_000;

export class ScanConfigDriver {
  private readonly editor: ReturnType<typeof scanConfigEditor>;

  constructor(private readonly page: Page) {
    this.editor = scanConfigEditor(page);
  }

  private readonly entryNames = new Map<string, string>();

  /** Fills every root element the configuration names. */
  async apply(configuration: ScanConfigCase): Promise<void> {
    for (const [rootElement, value] of Object.entries(configuration.config)) {
      if (rootElement === 'type') continue;
      if (!isRecord(value)) throw new Error(`Root element "${rootElement}" must be an object.`);

      if (typeof value.type === 'string') {
        await this.openRootElement(rootElement, this.editor.block());
        await this.fillBlock(this.editor.block(), value, rootElement);
        continue;
      }

      await this.openRootElement(rootElement, this.editor.addEntry(rootElement));
      await this.fillDictionary(rootElement, value);
    }
  }

  /**
   * Opens one root element, and clicks again if the editor did not follow.
   *
   * A popper closing under the pointer swallows the click, and clicking once
   * and then staring spends the whole assertion timeout on a menu that never
   * changed. Escape dismisses what is showing; the retry is what gets there.
   */
  private async openRootElement(rootElement: string, shows: Locator): Promise<void> {
    await expect(async () => {
      await this.page.keyboard.press('Escape');
      await this.editor.rootElement(rootElement).click(NO_NAVIGATION);
      await expect(shows).toBeVisible();
    }, `The editor never opened "${rootElement}".`).toPass();
  }

  /**
   * Presses "add" on one root element.
   *
   * The editor scrolls its middle column to the element it just opened, and a
   * click arriving during that scroll can sit in "scrolling into view if
   * needed" until the action timeout runs out. Scrolling first and clicking on
   * a short clock retries while the column is still; pressing "add" twice only
   * reopens the chooser.
   */
  private async addAnEntry(rootElement: string): Promise<void> {
    const add = this.editor.addEntry(rootElement);

    await expect(async () => {
      await add.scrollIntoViewIfNeeded({ timeout: 5_000 });
      await add.click({ ...NO_NAVIGATION, timeout: 5_000 });
      await expect(this.editor.variants.first()).toBeVisible({ timeout: 5_000 });
    }, `The editor never offered anything to add to "${rootElement}".`).toPass({ timeout: 60_000 });
  }

  private async fillDictionary(
    rootElement: string,
    entries: Record<string, unknown>
  ): Promise<void> {
    for (const [key, entry] of Object.entries(entries)) {
      if (!isRecord(entry) || typeof entry.type !== 'string') {
        throw new Error(`Entry "${rootElement}.${key}" must carry a "type".`);
      }

      await this.addAnEntry(rootElement);

      const title = typeof entry.$variant === 'string' ? entry.$variant : undefined;
      const variant = this.editor.variant(entry.type);
      const offered = await variant
        .waitFor({ state: 'visible' })
        .then(() => true)
        .catch(() => false);
      if (!offered) {
        // Reading the page can fail too, when the page is what went wrong.
        const choices = await this.editor.variants.allInnerTexts().catch(() => []);
        throw new Error(
          `The "${rootElement}" chooser offers no "${title ?? entry.type}". It offers: ` +
            `${choices.join(', ') || 'nothing, and could not be read at all'}. ` +
            'Name the one to pick with "$variant" in the fixture.'
        );
      }
      /*
       * The editor disables a variant the circuit does not support, and it
       * reads support from a call of its own. When that call fails the card
       * stays disabled for good, with nothing on the page to say so, and a
       * plain click reports thirty seconds of "element is not enabled".
       */
      await expect(
        variant,
        `The "${title ?? entry.type}" card is offered but disabled, so it cannot be picked. ` +
          'The editor disables a variant the circuit does not support — check whether the ' +
          'circuit properties call failed.'
      ).toBeEnabled();

      await variant.click(NO_NAVIGATION);

      const created = await this.selectedEntryName(rootElement);
      this.entryNames.set(`${rootElement}/${key}`, created);

      await this.fillBlock(this.editor.block(), entry, rootElement);
    }
  }

  private async selectedEntryName(rootElement: string): Promise<string> {
    let name = '';

    await expect(async () => {
      const entries = this.editor.entriesOf(rootElement);
      const count = await entries.count();
      expect(count).toBeGreaterThan(0);
      name = (await entries.nth(count - 1).innerText()).trim();
      expect(name).not.toBe('');
    }).toPass();

    return name;
  }

  private async fillBlock(
    block: Locator,
    values: Record<string, unknown>,
    rootElement: string
  ): Promise<void> {
    await expect(block).toBeVisible();

    for (const [key, value] of Object.entries(values)) {
      if (key === 'type' || key === '$variant') continue;

      const field = scanConfigField(block, key);
      if ((await field.count()) === 0) {
        const offered = await block
          .locator('[title]')
          .allInnerTexts()
          .catch(() => []);
        throw new Error(
          `The editor renders no field "${key}" in block "${rootElement}". ` +
            `It renders: ${offered.join(', ') || 'nothing'}.`
        );
      }

      const uiElement = await uiElementOf(field.first());
      await this.setField(field.first(), uiElement, value, `${rootElement}.${key}`);
    }
  }

  private async setField(
    field: Locator,
    uiElement: string | null,
    value: unknown,
    at: string
  ): Promise<void> {
    switch (uiElement) {
      case ScanConfigUiElement.StringInput:
        await scanConfigControl(field).fill(String(value));
        return;

      case ScanConfigUiElement.BooleanInput: {
        const checkbox = field.getByRole('checkbox');
        if (value === true) await checkbox.check(NO_NAVIGATION);
        else await checkbox.uncheck(NO_NAVIGATION);
        return;
      }

      case ScanConfigUiElement.FloatParameterSweep:
      case ScanConfigUiElement.IntParameterSweep:
        await this.setSweep(field, value, at);
        return;

      case ScanConfigUiElement.FloatOptional:
        await this.setOptionalNumber(field, value);
        return;

      case ScanConfigUiElement.StringSelectionEnhanced:
      case ScanConfigUiElement.Reference:
      case ScanConfigUiElement.EntityPropertyDropdown:
        await this.setSelection(field, value, at);
        return;

      case ScanConfigUiElement.ModelSelectorSingle:
        await this.pickModel(field, value, at);
        return;

      case ScanConfigUiElement.SelectEFeaturesByProtocol:
        await this.selectProtocols(field, value, at);
        return;

      case ScanConfigUiElement.MorphologyLocationSelection:
        await this.setMorphologyLocations(value, at);
        return;

      case ScanConfigUiElement.MorphologySectionTypeSelection:
        throw new Error(
          `${at}: section types are labelled by obi-one at run time, so a fixture cannot set ` +
            'them by SWC code. Leave the field out to keep the schema default.'
        );

      // What the browse step already chose arrives filled in, and a fixture that
      // names nothing leaves it that way.
      case ScanConfigUiElement.ModelIdentifier:
        return;

      case ScanConfigUiElement.ModelIdentifierMultiple:
        if (value === null || value === undefined) return;
        await this.pickEntities(field, value, at);
        return;

      default:
        throw new Error(
          `${at}: the editor rendered ui_element "${uiElement ?? 'none'}", which this driver ` +
            'does not know how to set. Add a case rather than skipping it.'
        );
    }
  }

  /** A number that can be left unset: null clears it. Not a sweep — there is nothing to expand. */
  private async setOptionalNumber(field: Locator, value: unknown): Promise<void> {
    if (value === undefined) return;

    const number = scanConfigOptionalNumber(field);

    if (value === null) {
      await number.clear.click(NO_NAVIGATION);
      return;
    }

    await number.value.fill(String(value));
  }

  private async setSweep(field: Locator, value: unknown, at: string): Promise<void> {
    if (value === null || value === undefined) return;

    if (!Array.isArray(value)) {
      await scanConfigSweepValues(field).first().fill(String(value));
      return;
    }

    if (typeof value[0] !== 'number') {
      throw new Error(`${at}: a sweep takes numbers, got ${JSON.stringify(value[0])}`);
    }

    const sweep = scanConfigSweep(field);
    await sweep.expand.click(NO_NAVIGATION);
    for (let index = 1; index < value.length; index += 1) {
      await sweep.add.click(NO_NAVIGATION);
    }

    const inputs = scanConfigSweepValues(field);
    await expect(inputs).toHaveCount(value.length);
    for (const [index, entry] of value.entries()) {
      await inputs.nth(index).fill(String(entry));
    }
  }

  private async setMorphologyLocations(value: unknown, at: string): Promise<void> {
    if (!Array.isArray(value)) {
      throw new Error(`${at}: explicit locations must be a list, one entry per location`);
    }

    const rows = morphologyLocations(this.page);
    await addLocationsFromViewer(this.page, value.length);
    await expect(rows.rows).toHaveCount(value.length);

    for (const [index, entry] of value.entries()) {
      if (!isRecord(entry) || typeof entry.offset !== 'number') {
        throw new Error(`${at}[${index}]: needs an "offset" between 0 and 1`);
      }
      await rows.offset(index).fill(String(entry.offset));
    }
  }

  /**
   * Picks entities in the editor's own catalogue.
   *
   * Some workflows have no browse step — e-feature extraction chooses its
   * recordings here — so the field opens the same catalogue the browse page
   * shows, and confirms a whole selection at once.
   */
  private async pickEntities(field: Locator, value: unknown, at: string): Promise<void> {
    if (!Array.isArray(value)) {
      throw new Error(`${at}: needs a list of entities to pick, one entry each`);
    }

    const wanted = await Promise.all(
      value.map((entry, index) => entityToPick(entry, `${at}[${index}]`))
    );

    const picker = scanConfigModelPicker(this.page);
    await field.getByTestId('scan-config-select-model').first().click(NO_NAVIGATION);

    const catalogue = picker.panel;
    await expect(catalogue).toBeVisible();

    for (const entity of wanted) {
      await catalogue.getByTestId('data-grid-search').fill(entity.name);
      await tickRow(picker, entity, at);
    }
    await expect(picker.confirm).toBeEnabled();

    await confirmPicker(picker, at);

    for (const entity of wanted) {
      await expect(field).toContainText(entity.name);
    }
  }

  /**
   * Ticks the protocols to extract e-features from.
   *
   * Which protocols and amplitudes are offered comes from the chosen recordings.
   * The amplitudes are set rather than left alone because an extraction launched
   * with none is accepted and then fails in the service with "either targets or
   * autotargets should be set".
   */
  private async selectProtocols(field: Locator, value: unknown, at: string): Promise<void> {
    const protocols = isRecord(value) ? value.protocols : null;
    if (!Array.isArray(protocols) || protocols.length === 0) {
      throw new Error(`${at}: needs "protocols", one entry per protocol to extract from`);
    }

    for (const [index, entry] of protocols.entries()) {
      const where = `${at}.protocols[${index}]`;
      if (!isRecord(entry) || typeof entry.type !== 'string') {
        throw new Error(`${where}: needs the protocol's "type", such as "IDRestProtocol"`);
      }

      // A card is labelled without the type's suffix: IDRestProtocol reads "IDRest".
      const label = entry.type.replace(/Protocol$/, '');
      const protocol = scanConfigProtocol(field, entry.type);

      await expect(
        protocol.select,
        `The chosen recordings offer no "${label}" protocol for ${where}.`
      ).toBeVisible();
      await protocol.select.check(NO_NAVIGATION);

      await this.checkProtocolFeatures(protocol, label, entry.features, where);
      await this.setProtocolAmplitudes(protocol, label, entry.extraction_amplitudes, where);
    }
  }

  /** Counts the features a ticked protocol carries. The editor fills them in, so nothing is set. */
  private async checkProtocolFeatures(
    protocol: ReturnType<typeof scanConfigProtocol>,
    label: string,
    features: unknown,
    at: string
  ): Promise<void> {
    if (!Array.isArray(features)) return;

    if ((await protocol.expand.getAttribute('aria-expanded')) === 'false') {
      await protocol.expand.click(NO_NAVIGATION);
    }

    await expect(
      protocol.features,
      `${at}: "${label}" carries a different set of features than the fixture expects.`
    ).toHaveCount(features.length);
  }

  /**
   * Ticks the amplitudes one protocol is extracted at, unticking the rest.
   *
   * Each pair is `[amplitude, forValidation]`: the second box marks an amplitude
   * for validation rather than extraction.
   */
  private async setProtocolAmplitudes(
    protocol: ReturnType<typeof scanConfigProtocol>,
    label: string,
    amplitudes: unknown,
    at: string
  ): Promise<void> {
    if (!Array.isArray(amplitudes)) return;

    const wanted = new Map(
      amplitudes.map((pair, index) => {
        if (!Array.isArray(pair) || typeof pair[0] !== 'number') {
          throw new Error(
            `${at}.extraction_amplitudes[${index}]: needs [amplitude, forValidation]`
          );
        }
        return [String(pair[0]), pair[1] === true];
      })
    );

    await protocol.settings.click(NO_NAVIGATION);

    const panel = scanConfigAmplitudes(this.page);

    await expect(
      panel.rows,
      `${at}: "${label}" offers no amplitudes, so this extraction has nothing to run on.`
    ).not.toHaveCount(0);

    const offered = new Set<string>();

    for (const row of await panel.rows.all()) {
      const amplitude = await panel.amplitudeOf(row);
      offered.add(amplitude);

      const forValidation = wanted.get(amplitude);
      const extract = panel.extract(row);

      if (forValidation === undefined) {
        await extract.uncheck(NO_NAVIGATION);
        continue;
      }

      await extract.check(NO_NAVIGATION);
      const validation = panel.validation(row);
      if (forValidation) await validation.check(NO_NAVIGATION);
      else await validation.uncheck(NO_NAVIGATION);
    }

    const missing = [...wanted.keys()].filter((amplitude) => !offered.has(amplitude));
    if (missing.length > 0) {
      throw new Error(
        `${at}: the chosen recordings no longer hold ${missing.join(', ')} nA for "${label}". ` +
          `They offer ${[...offered].join(', ') || 'nothing'}.`
      );
    }

    // The open panel covers the next protocol's card.
    await this.page.keyboard.press('Escape');
  }

  private async pickModel(field: Locator, value: unknown, at: string): Promise<void> {
    if (!isRecord(value) || typeof value.name !== 'string') {
      throw new Error(`${at}: needs a { "name": … } naming the entity to pick`);
    }

    const picker = scanConfigModelPicker(this.page);
    await field.getByTestId('scan-config-select-model').first().click(NO_NAVIGATION);

    const catalogue = picker.panel;
    await expect(catalogue).toBeVisible();

    const name = value.name;
    await catalogue.getByRole('textbox', { name: 'Search' }).fill(name);

    await tickRow(picker, { name }, at);
    await expect(
      picker.confirm,
      `${at}: "${name}" was selected but the picker cannot confirm it.`
    ).toBeEnabled();

    await confirmPicker(picker, at);
  }

  private async setSelection(field: Locator, value: unknown, at: string): Promise<void> {
    const option = this.optionValue(value, at);
    if (option === null) return;

    const control = scanConfigControl(field);

    /*
     * Opening a control is swallowed the same way opening a root element is:
     * every field is wrapped in a tooltip trigger, and a tooltip drawn under the
     * pointer takes the click. Clicking once and then waiting spends the whole
     * assertion timeout on a list that never opened — the recording array's
     * "Calculation Method" sat at "Select option" for thirty seconds that way.
     * Escape dismisses whatever is showing; the retry is what gets there.
     *
     * The option is clicked inside the retry, because a list that is closing
     * stays visible for the length of its animation. Asserting visibility here
     * and clicking after the loop reads that frame as "open" and then spends the
     * whole click timeout on an option already on its way out: hidden, for the
     * microcircuit's "Timestamps 0", and gone along with its owner id for the
     * recording array's "LineSource". What the retry waits for is the mark the
     * control puts on the value, which only a click that landed can produce.
     *
     * The ownership marker is resolved inside the retry because opening can
     * remount a schema-driven field, which mints a new one.
     */
    let options = await scanConfigOptions(control);
    let wanted = options.option(option);

    const held = scanConfigHeld(control, option);

    await expect(async () => {
      // A field arrives filled in when it has one thing to reference, and a list
      // that adds rather than replaces would drop the value on a second click.
      if ((await held.count()) > 0) return;

      await this.page.keyboard.press('Escape');
      await control.click(NO_NAVIGATION);

      options = await scanConfigOptions(control);
      wanted = options.option(option);
      await expect(wanted).toBeVisible({ timeout: OPENS_WITHIN });
      await wanted.click({ ...NO_NAVIGATION, timeout: OPENS_WITHIN });

      await expect(held).toHaveCount(1, { timeout: OPENS_WITHIN });
    }, `${at}: "${option}" could not be picked from the control.`).toPass();

    await this.keepOnly(field, options.chosenBesides(option, wanted));

    await expect(control).not.toHaveText(/^Select /);
  }

  /**
   * Leaves a multi-value list holding only what the fixture asked for.
   *
   * A field that takes one value or several renders as a list that adds rather
   * than replaces, and the app picks its first option as soon as the field is
   * empty. Asking for one value therefore left two — the whole-brain drive was
   * generated for "All" as well as the sugar set it named, which is a sweep
   * over two coordinates and, for the "All" one, every neuron of the
   * connectome. Clicking a selected option again is how such a list drops it.
   *
   * A single-value list has closed by now, or holds exactly what was asked
   * for, so there is nothing here for it to do.
   */
  private async keepOnly(field: Locator, extra: Locator): Promise<void> {
    // Only a list that takes several values; a single-value one has closed by now.
    const multiple = field
      .locator(MULTIPLE_VALUE_CONTROL)
      .or(field.and(this.page.locator(MULTIPLE_VALUE_CONTROL)));
    if ((await multiple.count()) === 0) return;

    for (let dropped = 0; dropped < MAX_EXTRA_SELECTIONS; dropped += 1) {
      if ((await extra.count()) === 0) return;
      await extra.first().click({ ...NO_NAVIGATION, force: true });
    }

    expect(await extra.count(), 'The list kept offering values that were never asked for.').toBe(0);
  }

  private optionValue(value: unknown, at: string): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;

    if (isRecord(value) && typeof value.block_name === 'string') {
      const dictionary = String(value.block_dict_name ?? '');
      const created = this.entryNames.get(`${dictionary}/${value.block_name}`);
      if (!created) {
        throw new Error(
          `${at}: references "${dictionary}.${value.block_name}", which the fixture never adds. ` +
            'A referenced block must appear earlier in the configuration.'
        );
      }
      return created;
    }

    throw new Error(`${at}: cannot select from ${JSON.stringify(value)}`);
  }
}

/**
 * Confirms a picker, and clicks again if the overlay is still there.
 *
 * Confirm can be re-disabled between the check that it is enabled and the
 * click, which leaves the overlay open and the run staring at it for the whole
 * assertion timeout. Once it has closed there is nothing left to click.
 */
async function confirmPicker(
  picker: ReturnType<typeof scanConfigModelPicker>,
  at: string
): Promise<void> {
  await picker.confirm.click(NO_NAVIGATION);
  await expect(picker.overlay, `${at}: the picker never closed.`).toHaveCount(0);
}

type PickedEntity = { name: string; id?: string };

/**
 * The entity a fixture entry points at, by name or by id.
 *
 * An id is read into a name because the catalogue searches by name, and kept
 * because two entities can share one.
 */
async function entityToPick(entry: unknown, at: string): Promise<PickedEntity> {
  if (isRecord(entry) && typeof entry.name === 'string') return { name: entry.name };

  if (isRecord(entry) && typeof entry.id_str === 'string') {
    const type = entityTypeOf(entry.type, at);
    return { id: entry.id_str, name: await entityName(type, entry.id_str) };
  }

  throw new Error(
    `${at}: needs a { "name": … } naming the entity, or a { "id_str": …, "type": … } ` +
      'such as "ElectricalCellRecordingFromID"'
  );
}

/** The entity behind a `…FromID` reference: "ElectricalCellRecordingFromID" is a recording. */
function entityTypeOf(type: unknown, at: string): EntityTypeName {
  const named = typeof type === 'string' ? type.replace(/FromID$/, '') : '';
  if (!(named in EntityTypeDict)) {
    throw new Error(
      `${at}: "type" must name an entity, such as "ElectricalCellRecordingFromID", ` +
        `got ${JSON.stringify(type)}`
    );
  }
  return named as EntityTypeName;
}

async function tickRow(
  picker: ReturnType<typeof scanConfigModelPicker>,
  entity: PickedEntity,
  at: string
): Promise<void> {
  const { name, id } = entity;

  // The grid pins its selection column into a row of its own, so an id matches both halves.
  const row = id ? picker.rowWithId(id).first() : picker.row(name);
  await expect(row, `No exact "${name}" row to pick for ${at}.`).toBeVisible();

  const rowId = id ?? (await row.getAttribute('row-id'));
  if (!rowId) {
    throw new Error(`The "${name}" row for ${at} has no stable selection ID.`);
  }

  const control = picker.selectionControl(rowId);
  await expect(control, `No selection control for "${name}" in ${at}.`).toBeVisible();
  await control.click(NO_NAVIGATION);
  await expect(row, `The "${name}" row in ${at} was not selected.`).toHaveAttribute(
    'aria-selected',
    'true'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Clicks the 3D viewer until that many locations sit on the neuron. */
export async function addLocationsFromViewer(page: Page, count: number): Promise<void> {
  const scene = morphologyViewer(page).scene;
  await expect(scene).toBeVisible();

  const box = await scene.boundingBox();
  if (!box) throw new Error('The 3D viewer has no size, so there is nothing to click.');

  const rows = morphologyLocations(page).rows;
  let placed = await rows.count();

  for (const y of [0.35, 0.45, 0.3, 0.55, 0.25, 0.6, 0.4, 0.65]) {
    for (const x of [0.45, 0.55, 0.4, 0.6, 0.35, 0.65, 0.5, 0.3]) {
      if (placed >= count) return;

      await page.mouse.click(box.x + box.width * x, box.y + box.height * y);

      const landed = await expect(async () => {
        expect(await rows.count()).not.toBe(placed);
      })
        .toPass({ timeout: 1_500 })
        .then(() => true)
        .catch(() => false);

      if (landed) placed = await rows.count();
    }
  }

  if (placed < count) {
    throw new Error(
      `Only ${placed} of ${count} locations could be placed: no more of the sampled points ` +
        'landed on a neurite.'
    );
  }
}
