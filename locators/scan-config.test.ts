/**
 * The two scan-config locators that a page-wide lookup gets wrong.
 *
 * Both fail silently: the run reports an element that never appeared, minutes
 * into a campaign, so they are worth pinning to a page that cannot change. The
 * markup here is what main.preview actually serves, taken from a trace.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import { type Browser, chromium, type Page } from '@playwright/test';

import {
  scanConfigControl,
  scanConfigEditor,
  scanConfigField,
  scanConfigOptions,
} from './scan-config';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});

afterAll(async () => {
  await browser?.close();
});

describe('the block being edited', () => {
  /*
   * The column and the block list inside it both carried
   * `scan-config-middle-content` until core-web-app dropped the inner one, so
   * the scope still has to hold when two nested elements answer to it.
   */
  const twoColumnsOneBlock = `
    <div id="scan-config-controls-middle" data-testid="scan-config-middle-content">
      <div id="scan-config-middle-content" data-testid="scan-config-middle-content">
        <div data-scan-config-block="block_single" data-testid="scan-config-block-info">
          <div data-testid="scan-config-field-campaign_name">Campaign Name</div>
        </div>
      </div>
    </div>`;

  test('is found by the name the app gives it, not by a bare "scan-config-block"', async () => {
    await page.setContent(twoColumnsOneBlock);
    const editor = scanConfigEditor(page);

    expect(await editor.block().count()).toBe(1);
    // What the locator used to ask for, and what the app has never rendered.
    expect(await page.getByTestId('scan-config-block').count()).toBe(0);
  });

  // `isVisible()` throws on a strict-mode violation, which is the thing at risk
  // here: two elements answering to the column id must still leave one block.
  test('stays strict while two elements share the column id', async () => {
    await page.setContent(twoColumnsOneBlock);
    const editor = scanConfigEditor(page);

    expect(await editor.block().isVisible()).toBe(true);
    expect(await scanConfigField(editor.block(), 'campaign_name').innerText()).toBe(
      'Campaign Name'
    );
  });

  test('is found for a dictionary entry, which is named after the entry too', async () => {
    await page.setContent(`
      <div data-testid="scan-config-middle-content">
        <div data-scan-config-block="block_single" data-testid="scan-config-block-neuron_sets-Neuron set 1">entry</div>
      </div>`);

    expect(await scanConfigEditor(page).block().isVisible()).toBe(true);
  });

  /*
   * What a deployment behind main.preview serves: the block's test id shipped
   * before the column's, so scoping the block to the column finds nothing and
   * every field lookup fails minutes into a campaign. Measured against
   * staging.openbraininstitute.org.
   */
  test('is found on a deployment whose column carries no test id', async () => {
    await page.setContent(`
      <div id="scan-config-middle-content">
        <div data-scan-config-block="block_single" data-testid="scan-config-block-info">
          <div data-testid="scan-config-field-campaign_name">Campaign Name</div>
        </div>
      </div>`);

    expect(await scanConfigEditor(page).block().isVisible()).toBe(true);
  });

  // The dictionary and union wrappers carry `data-scan-config-block` as well, so
  // the block root is the element that carries both marks.
  test('is the block root, not the dictionary wrapper around it', async () => {
    await page.setContent(`
      <div id="scan-config-middle-content">
        <div data-scan-config-block="block_dictionary">
          <div data-scan-config-block="block_single" data-testid="scan-config-block-neuron_sets-Neuron set 1">entry</div>
        </div>
      </div>`);

    const block = scanConfigEditor(page).block();
    expect(await block.count()).toBe(1);
    expect(await block.getAttribute('data-scan-config-block')).toBe('block_single');
  });
});

describe('the options one control offers', () => {
  /*
   * Two reference fields, each offering "Distribution 1", each with its dropdown
   * portalled to its own child of <body> — antd does not nest them in the field.
   * Picking by visibility alone matched both.
   */
  const twoDropdownsSameLabel = `
    <div data-testid="scan-config-middle-content">
      <div data-scan-config-block="block_single" data-testid="scan-config-block-synaptic_models">
        <div data-testid="scan-config-field-delay_distribution">
          <div data-testid="scan-config-control" data-scan-config-options="delay"></div>
        </div>
        <div data-testid="scan-config-field-conductance_distribution">
          <div data-testid="scan-config-control" data-scan-config-options="conductance"></div>
        </div>
      </div>
    </div>
    <div>
      <span data-testid="scan-config-option-Distribution 1" data-scan-config-option-of="delay">Distribution 1</span>
    </div>
    <div>
      <span data-testid="scan-config-option-Distribution 1" data-scan-config-option-of="conductance">Distribution 1</span>
    </div>`;

  async function optionFor(field: string, label: string) {
    const block = scanConfigEditor(page).block();
    const control = scanConfigControl(scanConfigField(block, field));
    return (await scanConfigOptions(control)).option(label);
  }

  test('are the ones that control owns, so a shared label is not ambiguous', async () => {
    await page.setContent(twoDropdownsSameLabel);

    // Both are in the page, which is why the unscoped lookup was not strict.
    expect(await page.getByTestId('scan-config-option-Distribution 1').count()).toBe(2);

    const delay = await optionFor('delay_distribution', 'Distribution 1');
    const conductance = await optionFor('conductance_distribution', 'Distribution 1');

    expect(await delay.count()).toBe(1);
    expect(await conductance.count()).toBe(1);
    expect(await delay.getAttribute('data-scan-config-option-of')).toBe('delay');
    expect(await conductance.getAttribute('data-scan-config-option-of')).toBe('conductance');
  });

  test('can be clicked, rather than resolving to two elements', async () => {
    await page.setContent(twoDropdownsSameLabel);

    const delay = await optionFor('delay_distribution', 'Distribution 1');
    await delay.click({ timeout: 2_000 });
  });

  test('fall back to the page when a deployment marks no owner', async () => {
    await page.setContent(`
      <div data-testid="scan-config-middle-content">
        <div data-scan-config-block="block_single" data-testid="scan-config-block-initialize">
          <div data-testid="scan-config-field-calculation_method">
            <div data-testid="scan-config-control"></div>
          </div>
        </div>
      </div>
      <div><span data-testid="scan-config-option-LineSource">LineSource</span></div>`);

    const option = await optionFor('calculation_method', 'LineSource');
    expect(await option.count()).toBe(1);
  });

  test('leave out an option that is only in a closed list', async () => {
    await page.setContent(`
      <div data-testid="scan-config-middle-content">
        <div data-scan-config-block="block_single" data-testid="scan-config-block-synaptic_models">
          <div data-testid="scan-config-field-delay_distribution">
            <div data-testid="scan-config-control" data-scan-config-options="delay"></div>
          </div>
        </div>
      </div>
      <div style="display: none">
        <span data-testid="scan-config-option-Distribution 1" data-scan-config-option-of="delay">Distribution 1</span>
      </div>`);

    const option = await optionFor('delay_distribution', 'Distribution 1');
    expect(await option.count()).toBe(0);
  });
});
