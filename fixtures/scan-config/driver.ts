/** Fills the scan config editor from a fixture. */

import {
  scanConfigControl,
  scanConfigEditor,
  scanConfigField,
  scanConfigModelPicker,
  scanConfigOptions,
  scanConfigSweep,
  scanConfigSweepValues,
  uiElementOf,
} from '@locators/scan-config';
import { morphologyLocations, morphologyViewer } from '@locators/viewer';
import { expect, type Locator, type Page } from '@playwright/test';

import type { ScanConfigCase } from './index';
import { ScanConfigUiElement } from './ui-elements';

/** Types one configuration into the editor, field by field. */
/** More than this many unasked-for values means the list is not behaving as a list. */
const MAX_EXTRA_SELECTIONS = 20;

/**
 * Nothing in the editor navigates.
 *
 * A click otherwise waits for navigations the page has in flight, and this page
 * keeps some: the whole-brain option click and the microcircuit variant click
 * each spent their action timeout being told "waiting for scheduled navigations
 * to finish" after the click had already landed. Playwright says this option
 * becomes the default.
 */
const NO_NAVIGATION = { noWaitAfter: true } as const;

/** A control that holds several values at once, rather than one. */
const MULTIPLE_VALUE_CONTROL = '[data-scan-config-block-element$="__multiple"]';

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
      await expect(shows).toBeVisible({ timeout: 5_000 });
    }, `The editor never opened "${rootElement}".`).toPass();
  }

  private async fillDictionary(
    rootElement: string,
    entries: Record<string, unknown>
  ): Promise<void> {
    for (const [key, entry] of Object.entries(entries)) {
      if (!isRecord(entry) || typeof entry.type !== 'string') {
        throw new Error(`Entry "${rootElement}.${key}" must carry a "type".`);
      }

      await this.editor.addEntry(rootElement).click(NO_NAVIGATION);

      const title = typeof entry.$variant === 'string' ? entry.$variant : undefined;
      const variant = this.editor.variant(entry.type, title);
      const offered = await variant
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false);
      if (!offered) {
        throw new Error(
          `The "${rootElement}" chooser offers no "${title ?? entry.type}". It offers: ` +
            `${(await this.editor.variants.allInnerTexts()).join(', ')}. ` +
            'Name the one to pick with "$variant" in the fixture.'
        );
      }
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
      case ScanConfigUiElement.FloatOptional:
        await this.setSweep(field, value, at);
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
      throw new Error(`${at}: needs a list of { "name": … }, one per entity to pick`);
    }

    const picker = scanConfigModelPicker(this.page);
    await field.getByRole('button', { name: /^Add / }).first().click(NO_NAVIGATION);

    const catalogue = picker.panel;
    await expect(catalogue).toBeVisible();

    const names = value.map((entry, index) => {
      if (!isRecord(entry) || typeof entry.name !== 'string') {
        throw new Error(`${at}[${index}]: needs a { "name": … } naming the entity to pick`);
      }
      return entry.name;
    });

    await expect(async () => {
      for (const name of names) {
        await catalogue.getByRole('textbox', { name: 'Search' }).fill(name);
        await tickRow(catalogue, name, at);
      }
      await expect(picker.confirm).toBeEnabled({ timeout: 3_000 });
    }, `${at}: the picks never held.`).toPass({ timeout: 45_000 });

    await confirmPicker(picker, at);

    for (const entry of value) {
      await expect(field).toContainText((entry as { name: string }).name);
    }
  }

  /**
   * Ticks the protocols to extract e-features from.
   *
   * Which protocols are offered comes from the chosen recordings, so a fixture
   * names the ones its recordings hold and the run fails if they stop holding
   * them. Ticking one takes that protocol's whole feature set.
   */
  private async selectProtocols(field: Locator, value: unknown, at: string): Promise<void> {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`${at}: needs a list of the protocol names to extract from`);
    }

    for (const [index, protocol] of value.entries()) {
      if (typeof protocol !== 'string') {
        throw new Error(`${at}[${index}]: a protocol is named by the label on its card`);
      }

      const box = field.getByRole('checkbox', { name: `Extract features from ${protocol}` });
      await expect(
        box,
        `The chosen recordings offer no "${protocol}" protocol for ${at}.`
      ).toBeVisible();
      await box.check(NO_NAVIGATION);
    }
  }

  private async pickModel(field: Locator, value: unknown, at: string): Promise<void> {
    if (!isRecord(value) || typeof value.name !== 'string') {
      throw new Error(`${at}: needs a { "name": … } naming the entity to pick`);
    }

    const picker = scanConfigModelPicker(this.page);
    await field.getByRole('button', { name: /^Select / }).click(NO_NAVIGATION);

    const catalogue = picker.panel;
    await expect(catalogue).toBeVisible();

    const name = value.name;
    await catalogue.getByRole('textbox', { name: 'Search' }).fill(name);

    await expect(async () => {
      await tickRow(catalogue, name, at);
      await expect(picker.confirm).toBeEnabled({ timeout: 3_000 });
    }, `${at}: "${name}" never stayed picked.`).toPass({ timeout: 30_000 });

    await confirmPicker(picker, at);
  }

  private async setSelection(field: Locator, value: unknown, at: string): Promise<void> {
    const option = this.optionValue(value, at);
    if (option === null) return;

    const control = scanConfigControl(field);

    /*
     * A field that already holds what the fixture asks for is left alone. A
     * reference with one thing to reference arrives filled in, and opening a
     * list to pick what is already picked only risks toggling it shut: the
     * option is not in the page to be clicked, so every attempt looks for
     * something that was never going to be there. Exact text, so "Neuron set 1"
     * is never read as a match for "Neuron set 10"; anything less certain falls
     * through and is chosen the long way.
     */
    if ((await control.innerText().catch(() => '')).trim() === option) return;

    /*
     * Two components render a list here — a reference field is an antd Select,
     * the enhanced string selection is a button — and neither can be asked
     * reliably whether it is already open. So every attempt starts from a known
     * state instead: Escape closes whatever is showing, one click opens this
     * one, and the option has to be genuinely visible before it is clicked.
     * Retrying an attempt that toggled the list shut is what used to hang.
     */
    const options = await scanConfigOptions(control);
    const wanted = options.option(option);

    await expect(async () => {
      await this.page.keyboard.press('Escape');
      await control.click({ ...NO_NAVIGATION, force: true, timeout: 3_000 });

      /*
       * Forced, like the click that opened the list. An antd list is a portal
       * that re-aligns itself whenever an ancestor scrolls, so asking to scroll
       * it into view moves it, which re-aligns it, which asks again: the option
       * is reported "not stable" until the attempt runs out. The list is open
       * and the option filtered on being visible, so there is nothing left for
       * the actionability checks to establish — and a click that lands on
       * nothing still fails the assertion below.
       */
      await wanted.click({ ...NO_NAVIGATION, force: true, timeout: 5_000 });

      await expect(control).not.toHaveText(/^Select /, { timeout: 3_000 });
    }, `${at}: "${option}" never became selectable`).toPass({ timeout: 30_000 });

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
      await extra.first().click({ ...NO_NAVIGATION, force: true, timeout: 5_000 });
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
  await expect(async () => {
    await picker.confirm.click({ ...NO_NAVIGATION, timeout: 5_000 });
    await expect(picker.overlay).toHaveCount(0, { timeout: 5_000 });
  }, `${at}: the picker never closed.`).toPass();
}

async function tickRow(catalogue: Locator, name: string, at: string): Promise<void> {
  const row = catalogue.getByRole('row').filter({ hasText: name }).first();
  await expect(row, `No "${name}" to pick for ${at}.`).toBeVisible({ timeout: 5_000 });

  await catalogue
    .locator(`[role="row"][row-index="${await row.getAttribute('row-index')}"]`)
    .getByRole('checkbox')
    .first()
    .check({ ...NO_NAVIGATION, timeout: 5_000 });
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
