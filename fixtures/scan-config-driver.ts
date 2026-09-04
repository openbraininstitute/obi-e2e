/** Fills the scan config editor from a fixture. */

import {
  scanConfigControl,
  scanConfigEditor,
  scanConfigField,
  scanConfigModelPicker,
  scanConfigSweep,
  scanConfigSweepValues,
  uiElementOf,
} from '@locators/scan-config';
import { morphologyLocations, morphologyViewer } from '@locators/viewer';
import { expect, type Locator, type Page } from '@playwright/test';

import type { ScanConfigCase } from './scan-config';
import { ScanConfigUiElement } from './scan-config-ui-elements';

/** Types one configuration into the editor, field by field. */
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

      await this.editor.rootElement(rootElement).click();

      if (typeof value.type === 'string') {
        await this.fillBlock(this.editor.block(), value, rootElement);
        continue;
      }

      await this.fillDictionary(rootElement, value);
    }
  }

  private async fillDictionary(
    rootElement: string,
    entries: Record<string, unknown>
  ): Promise<void> {
    for (const [key, entry] of Object.entries(entries)) {
      if (!isRecord(entry) || typeof entry.type !== 'string') {
        throw new Error(`Entry "${rootElement}.${key}" must carry a "type".`);
      }

      await this.editor.addEntry(rootElement).click();

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
      await variant.click();

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
        if (value === true) await checkbox.check();
        else await checkbox.uncheck();
        return;
      }

      case ScanConfigUiElement.FloatParameterSweep:
      case ScanConfigUiElement.IntParameterSweep:
      case ScanConfigUiElement.FloatOptional:
        await this.setSweep(field, value, at);
        return;

      case ScanConfigUiElement.StringSelectionEnhanced:
        await this.setPopoverSelection(field, value, at);
        return;

      case ScanConfigUiElement.Reference:
      case ScanConfigUiElement.EntityPropertyDropdown:
        await this.setSelection(field, value, at);
        return;

      case ScanConfigUiElement.ModelSelectorSingle:
        await this.pickModel(field, value, at);
        return;

      case ScanConfigUiElement.MorphologyLocationSelection:
        await this.setMorphologyLocations(value, at);
        return;

      case ScanConfigUiElement.MorphologySectionTypeSelection:
        throw new Error(
          `${at}: section types are labelled by obi-one at run time, so a fixture cannot set ` +
            'them by SWC code. Leave the field out to keep the schema default.'
        );

      case ScanConfigUiElement.ModelIdentifier:
      case ScanConfigUiElement.ModelIdentifierMultiple:
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
    await sweep.expand.click();
    for (let index = 1; index < value.length; index += 1) {
      await sweep.add.click();
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

  private async setPopoverSelection(field: Locator, value: unknown, at: string): Promise<void> {
    const option = this.optionValue(value, at);
    if (option === null) return;

    await scanConfigControl(field).click();
    await this.editor.option(option).click();
  }

  private async pickModel(field: Locator, value: unknown, at: string): Promise<void> {
    if (!isRecord(value) || typeof value.name !== 'string') {
      throw new Error(`${at}: needs a { "name": … } naming the entity to pick`);
    }

    const picker = scanConfigModelPicker(this.page);
    await field.getByRole('button', { name: /^Select / }).click();

    const catalogue = picker.panel;
    await expect(catalogue).toBeVisible();

    await catalogue.getByRole('textbox', { name: 'Search' }).fill(value.name);
    await expect(
      catalogue.getByRole('row').filter({ hasText: value.name }).first(),
      `No "${value.name}" to pick for ${at}.`
    ).toBeVisible();

    await catalogue.getByRole('checkbox').last().check();

    await expect(picker.confirm).toBeEnabled();
    await picker.confirm.click();
    await expect(picker.overlay).toHaveCount(0);
  }

  private async setSelection(field: Locator, value: unknown, at: string): Promise<void> {
    const option = this.optionValue(value, at);
    if (option === null) return;

    const control = scanConfigControl(field);

    await expect(async () => {
      const choice = this.page
        .getByTestId(`scan-config-option-${option}`)
        .or(this.page.getByTitle(option, { exact: true }))
        .filter({ visible: true })
        .first();

      if ((await choice.count()) === 0) {
        await control.click({ timeout: 3_000 });
        throw new Error(`${at}: the dropdown did not open`);
      }

      await choice.click({ force: true, timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
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
