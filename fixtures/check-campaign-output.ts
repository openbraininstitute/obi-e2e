import { scanConfigResults } from '@locators/scan-config';
import { expect, type Locator, type Page } from '@playwright/test';

import type { ScanConfigCase } from './scan-config';

/** The one output that is a log rather than a result. */
const LOG_FILE = 'Task logs';

/**
 * What a campaign coordinate carries, checked exactly.
 *
 * Exactly, because a file the application starts or stops producing should fail
 * here rather than pass unnoticed. A fixture that names no files says nothing,
 * so those checks are skipped: only names seen on a real run belong in one.
 */
async function checkFiles(panel: Locator, names: string[]): Promise<void> {
  await expect(panel.locator('[data-file-name]')).toHaveCount(names.length);

  for (const name of names) {
    await expect(panel.locator(`[data-file-name="${name}"]`)).toBeVisible();
  }
}

/** The files a coordinate carries the moment its campaign is generated. */
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

/**
 * What a finished run left behind: the files either side of it, and then each
 * output opened, because the two are different kinds of thing and the pane
 * beside them shows each differently.
 */
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
    // Nothing to hold it to yet, so this only says the run produced something.
    // Fill in `expect.completed` in the fixture from a real run.
    await expect(results.outputs.locator('[data-file-name]')).not.toHaveCount(0);
  }

  // A build keeps its own log file among the outputs and a simulation does not,
  // so this follows what the fixture says the run produced.
  if (completed?.outputs.includes(LOG_FILE)) {
    await results.file(LOG_FILE).click();
    await expect(results.logs).toContainText('Task execution completed.');
    await expect(results.preview.entity.card).toHaveCount(0);
  }

  // Each file the fixture describes, opened: a result is only a result once a
  // user can see it.
  for (const [file, shown] of Object.entries(completed?.views ?? {})) {
    await results.file(file).click();
    for (const text of shown) {
      await expect(results.fileView).toContainText(text);
    }
  }

  const built = configuration.expect.built;
  if (!built) return;

  // The entity the run registered: named, described by what it is made of, and
  // offering the two things a user can do with it.
  await results.file(built.name).click();
  await expect(results.preview.entity.card).toBeVisible();
  await expect(results.preview.entity.name).toHaveText(built.name);
  await expect(results.preview.entity.viewDetails).toBeVisible();
  await expect(results.preview.entity.download).toBeVisible();

  for (const [label, shown] of Object.entries(built.properties)) {
    await expect(results.preview.entity.property(label)).toContainText(shown);
  }
}
