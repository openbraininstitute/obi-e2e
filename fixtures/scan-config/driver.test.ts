/**
 * Picking a value from a dropdown that is on its way out.
 *
 * The failure this pins is silent and expensive: the driver asserted the option
 * was visible, the assertion caught the frame where a closing list still is,
 * and the click that followed spent thirty seconds on an option nothing would
 * bring back — minutes into a campaign, on staging, for the recording array's
 * "Calculation Method" and the microcircuit's "Timestamps 0" alike.
 *
 * The markup is the shape core-webapp serves: the option is portalled to its own
 * child of `<body>`, the control names the list it owns, and every value the
 * control holds is marked with an id of its own.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import {
  scanConfigControl,
  scanConfigEditor,
  scanConfigField,
  scanConfigHeld,
} from '@locators/scan-config';
import { type Browser, chromium, type Page } from '@playwright/test';

import { ScanConfigDriver } from './driver';
import type { ScanConfigCase } from './index';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});

afterAll(async () => {
  await browser?.close();
});

const pickLineSource: ScanConfigCase = {
  name: 'one enum field',
  config: {
    initialize: {
      type: 'CreateExtracellularRecordingArrayScanConfig.Initialize',
      calculation_method: 'LineSource',
    },
  },
  expect: { coordinateCount: 1 },
};

/**
 * One enum field, whose list can be made to close under the pointer.
 *
 * The first `sabotagedOpens` opens close the moment the pointer reaches the
 * option — which is where a real closing animation put the app: shown when the
 * driver looked, gone when it clicked. The rest behave, so a run that reopens the
 * list gets there. Zero means a list that always works.
 */
function anEnumField(sabotagedOpens: number): string {
  return `
    <div id="scan-config-middle-content">
      <button data-testid="scan-config-root-element-initialize">Initialization</button>
      <div data-scan-config-block="block_single" data-testid="scan-config-block-initialize">
        <div
          data-testid="scan-config-field-calculation_method"
          data-scan-config-block-element="string_selection_enhanced"
        >
          <div data-testid="scan-config-control" data-scan-config-options="own">Select option</div>
        </div>
      </div>
    </div>
    <div id="list" style="display: none">
      <span data-testid="scan-config-option-LineSource" data-scan-config-option-of="own">LineSource</span>
    </div>
    <script>
      /*
       * Inside a function on purpose. setContent reuses the page's JS context, so
       * a second top-level "const control" throws before a line of this runs, and
       * the field then answers no click at all.
       */
      (() => {
        const control = document.querySelector('[data-testid="scan-config-control"]');
        const list = document.getElementById('list');
        const option = list.firstElementChild;
        let opens = 0;

        control.addEventListener('click', () => {
          const open = list.style.display !== 'none';
          list.style.display = open ? 'none' : 'block';
          if (!open) opens += 1;
        });

        // Playwright moves the pointer onto an element before it clicks it.
        option.addEventListener('mousemove', () => {
          if (opens <= ${sabotagedOpens}) list.style.display = 'none';
        });

        // What the app renders once a value is chosen: the value, marked.
        option.addEventListener('click', () => {
          control.innerHTML =
            '<span data-testid="scan-config-held_line-source">LineSource</span>';
          list.style.display = 'none';
        });
      })();
    </script>`;
}

function heldByTheField(value: string) {
  const field = scanConfigField(scanConfigEditor(page).block(), 'calculation_method');
  return scanConfigHeld(scanConfigControl(field), value);
}

describe('picking a value from a list', () => {
  test('takes the value when the list stays open', async () => {
    await page.setContent(anEnumField(0));

    await new ScanConfigDriver(page).apply(pickLineSource);

    expect(await heldByTheField('LineSource').count()).toBe(1);
  });

  /*
   * The regression. Visible-then-gone used to be read as "open", and the click
   * that followed the loop had nothing left to hit. Reopening costs the one click
   * attempt that misses, which is why this case is given longer.
   */
  test('opens the list again when the first one closed under the pointer', async () => {
    await page.setContent(anEnumField(1));

    await new ScanConfigDriver(page).apply(pickLineSource);

    expect(await heldByTheField('LineSource').count()).toBe(1);
  }, 30_000);
});

describe('the value a control is asked for', () => {
  async function held(markup: string, value: string): Promise<number> {
    await page.setContent(`
      <div id="scan-config-middle-content">
        <div data-scan-config-block="block_single" data-testid="scan-config-block-stimuli">
          <div data-testid="scan-config-field-timestamps">
            <div data-testid="scan-config-control">${markup}</div>
          </div>
        </div>
      </div>`);

    const field = scanConfigField(scanConfigEditor(page).block(), 'timestamps');
    return scanConfigHeld(scanConfigControl(field), value).count();
  }

  // The id core-web-app writes is this one, built from the same kebabCase.
  test('is found under the id the app marks it with', async () => {
    const markup = '<span data-testid="scan-config-held_timestamps-0">Timestamps 0</span>';

    expect(await held(markup, 'Timestamps 0')).toBe(1);
    expect(await held(markup, 'Timestamps 1')).toBe(0);
  });

  /*
   * The case the rendered text cannot answer: a list that takes several draws
   * each value as its own tag, and the text reads back as "AllTimestamps 0".
   */
  test('is found among several the control holds at once', async () => {
    const markup =
      '<span data-testid="scan-config-held_all">All</span>' +
      '<span data-testid="scan-config-held_timestamps-0">Timestamps 0</span>';

    expect(await held(markup, 'All')).toBe(1);
    expect(await held(markup, 'Timestamps 0')).toBe(1);
  });

  test('is not there while the control holds nothing', async () => {
    expect(await held('Select option', 'Timestamps 0')).toBe(0);
  });

  // Never mistaken for the value it is a prefix of, which whole-text matching was.
  test('is not the value it is a prefix of', async () => {
    const markup = '<span data-testid="scan-config-held_neuron-set-10">Neuron set 10</span>';

    expect(await held(markup, 'Neuron set 1')).toBe(0);
  });
});
/**
 * The neuron IDs field.
 *
 * The markup is the shape core-web-app serves: "No IDs" and an Edit button, a
 * code editor that appears on Edit and answers the keyboard only once focused,
 * and an Apply button that turns what was typed into "N ID(s)".
 */
function aNeuronIdsField(): string {
  return `
    <div id="scan-config-middle-content">
      <button data-testid="scan-config-root-element-initialize">Initialization</button>
      <div data-scan-config-block="block_single" data-testid="scan-config-block-initialize">
        <div
          data-testid="scan-config-field-neuron_ids"
          data-scan-config-block-element-container-of="neuron_ids"
        >
          <label for="neuron_ids">Neuron IDs</label><span id="summary">No IDs</span><button id="edit" type="button">Edit</button>
          <div id="box" hidden>
            <div id="editor" role="textbox" aria-label="Editor content" tabindex="0" contenteditable="true"></div>
            <button id="apply" type="button">Apply</button>
          </div>
        </div>
      </div>
    </div>
    <script>
      (() => {
        const box = document.getElementById('box');
        document.getElementById('edit').addEventListener('click', () => {
          box.hidden = false;
        });
        document.getElementById('apply').addEventListener('click', () => {
          const ids = document.getElementById('editor').innerText.split(/[\\s,]+/).filter(Boolean);
          document.getElementById('summary').textContent =
            ids.length === 0 ? 'No IDs' : ids.length + (ids.length === 1 ? ' ID' : ' IDs');
          box.hidden = true;
        });
      })();
    </script>`;
}
function neuronIdsCase(ids: unknown): ScanConfigCase {
  return {
    name: 'neuron ids',
    config: { initialize: { type: 'Initialize', neuron_ids: ids } },
    expect: { coordinateCount: 1 },
  };
}
function theNeuronIdsField() {
  return scanConfigField(scanConfigEditor(page).block(), 'neuron_ids');
}
describe('typing neuron IDs', () => {
  test('applies one ID and the field reads "1 ID"', async () => {
    await page.setContent(aNeuronIdsField());
    await new ScanConfigDriver(page).apply(neuronIdsCase([0]));
    expect(await theNeuronIdsField().innerText()).toContain('1 ID');
  });
  test('applies several IDs and the field reads how many', async () => {
    await page.setContent(aNeuronIdsField());
    await new ScanConfigDriver(page).apply(neuronIdsCase([0, 5, 12]));
    expect(await theNeuronIdsField().innerText()).toContain('3 IDs');
  });
  test('refuses a list that holds no IDs, naming the field', async () => {
    await page.setContent(aNeuronIdsField());
    // Caught rather than handed to `rejects`, which under Bun waits seconds past the throw.
    const error = await new ScanConfigDriver(page)
      .apply(neuronIdsCase([]))
      .then(() => null)
      .catch((thrown: unknown) => thrown);
    expect(String(error)).toContain('initialize.neuron_ids: needs a list of neuron IDs');
  });
});
