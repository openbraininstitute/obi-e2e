/** Checks the files a campaign shows, before and after it runs. */

import { scanConfigResults } from '@locators/scan-config';
import { expect, type Locator, type Page } from '@playwright/test';

import type { ScanConfigCase } from './scan-config';

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
  const generated = configuration.expect.generated;
  if (!generated) return;

  const results = scanConfigResults(page);
  await checkFiles(results.inputs, generated.inputs);
  await checkFiles(results.outputs, generated.outputs);
}

/** Checks the files, the previews, and the entity a finished campaign built. */
export async function checkCompletedOutput(
  page: Page,
  configuration: ScanConfigCase
): Promise<void> {
  const results = scanConfigResults(page);
  const completed = configuration.expect.completed;

  if (completed) {
    await checkFiles(results.inputs, completed.inputs);
    await checkFiles(results.outputs, completed.outputs);
  } else {
    await expect(results.outputs.locator('[data-file-name]')).not.toHaveCount(0);
  }

  if (completed?.outputs.includes(LOG_FILE)) {
    await results.file(LOG_FILE).click();
    await expect(results.logs).toContainText('Task execution completed.');
    await expect(results.preview.entity.card).toHaveCount(0);
  }

  for (const [file, shown] of Object.entries(completed?.views ?? {})) {
    await results.file(file).click();
    for (const text of shown) {
      await expect(results.fileView).toContainText(text);
    }
  }

  const built = configuration.expect.built;
  if (!built) return;

  await results.file(built.name).click();
  await expect(results.preview.entity.card).toBeVisible();
  await expect(results.preview.entity.name).toHaveText(built.name);
  await expect(results.preview.entity.viewDetails).toBeVisible();
  await expect(results.preview.entity.download).toBeVisible();

  for (const [label, shown] of Object.entries(built.properties)) {
    await expect(results.preview.entity.property(label)).toContainText(shown);
  }
}
