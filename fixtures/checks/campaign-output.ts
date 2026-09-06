/** Checks the files a campaign shows, before and after it runs. */

import { scanConfigResults } from '@locators/scan-config';
import { expect, type Locator, type Page } from '@playwright/test';

import type { ScanConfigCase, ScanConfigView } from '../scan-config';

const LOG_FILE = 'Task logs';

async function checkFiles(panel: Locator, names: string[]): Promise<void> {
  await expect(panel.locator('[data-file-name]')).toHaveCount(names.length);

  for (const name of names) {
    await expect(panel.locator(`[data-file-name="${name}"]`)).toBeVisible();
  }
}

/** Checks the input and output files listed right after generation. */
export async function checkGeneratedFiles(
  page: Page,
  configuration: ScanConfigCase
): Promise<void> {
  const results = scanConfigResults(page);
  const generated = configuration.expect.generated;

  // A workflow nobody has run through names no files, so it only has to hold some.
  if (!generated) {
    await expect(results.inputs.locator('[data-file-name]')).not.toHaveCount(0);
    return;
  }

  await checkFiles(results.inputs, generated.inputs);
  await checkFiles(results.outputs, generated.outputs);
}

/** Checks the files a finished campaign holds, and what each one shows. */
export async function checkCompletedOutput(
  page: Page,
  configuration: ScanConfigCase
): Promise<void> {
  const completed = configuration.expect.completed;
  if (!completed) return;

  const results = scanConfigResults(page);

  await checkFiles(results.inputs, completed.inputs);
  await checkFiles(results.outputs, completed.outputs);

  if (completed.outputs.includes(LOG_FILE)) {
    await results.file(LOG_FILE).click();
    await expect(results.logs).toContainText('Task execution completed.');
    await expect(results.preview.entity.card).toHaveCount(0);
  }

  for (const [file, shown] of Object.entries(completed.views ?? {})) {
    await results.file(file).click();
    await checkView(page, shown);
  }
}

/** A list is the text a pane holds; a mapping is the card of the entity a run registered. */
async function checkView(page: Page, shown: ScanConfigView): Promise<void> {
  const results = scanConfigResults(page);

  if (Array.isArray(shown)) {
    for (const text of shown) {
      await expect(results.fileView).toContainText(text);
    }
    return;
  }

  const entity = results.preview.entity;

  // The file is labelled by what it is — "Skeletonized morphology" — while the
  // card heads itself with the entity's own name, so the two rarely match. The
  // outputs list has already asserted the label; the properties are the rest.
  await expect(entity.card).toBeVisible();
  await expect(entity.viewDetails).toBeVisible();
  await expect(entity.download).toBeVisible();

  for (const [label, text] of Object.entries(shown)) {
    await expect(entity.property(label)).toContainText(text);
  }
}
