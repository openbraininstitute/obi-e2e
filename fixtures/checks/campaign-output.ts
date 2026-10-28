/** Checks the files a campaign shows, before and after it runs. */

import { scanConfigResults } from '@locators/scan-config';
import { expect, type Locator, type Page } from '@playwright/test';

import { NO_NAVIGATION } from '../interactions';
import type { ScanConfigCase, ScanConfigView } from '../scan-config';

const LOG_FILE = 'Task Log';

/**
 * How long a file list may take to settle once the run has finished. The
 * outputs are fetched one by one after "done", and a circuit's polls for its
 * visualization for twenty seconds.
 */
const FILES_SETTLE_WITHIN = 60_000;

/**
 * A seed names a file exactly, or by its start with a trailing `*`: the
 * recording array obi-one registers is named after the circuit's id, which
 * differs on every deployment.
 */
const PREFIX = '*';

function fileSelector(name: string): string {
  return name.endsWith(PREFIX)
    ? `[data-file-name^="${name.slice(0, -PREFIX.length)}"]`
    : `[data-file-name="${name}"]`;
}

/**
 * Opens every shut group in a panel.
 *
 * A simulation folds its files into groups — "Circuit", "Simulation",
 * "Simulation Result" — that start shut and render no file row until opened;
 * a build lists its files flat, and then there is nothing to open. A group's
 * button is the only one in the panel that says whether it is expanded.
 *
 * Picked by the attribute, not its value: a locator re-resolves on every use,
 * so one filtered to the shut groups points at the next shut group as soon as
 * the clicked one opens, and the check that it opened then reads the wrong one.
 */
async function openGroups(panel: Locator): Promise<void> {
  for (const group of await panel.locator('button[aria-expanded]').all()) {
    if ((await group.getAttribute('aria-expanded')) === 'true') continue;
    await group.click(NO_NAVIGATION);
    await expect(group).toHaveAttribute('aria-expanded', 'true');
  }
}

async function checkFiles(panel: Locator, names: string[]): Promise<void> {
  const files = panel.locator('[data-file-name]');

  // Comparing the names, not the count, so a changed output prints what changed.
  // A bounded retry: `toPass()` alone retries until the test runs out of clock,
  // so a list that will never match held an optimization's page for half an hour.
  // The groups are opened inside the retry: a result's group arrives, shut,
  // once the run's files are in.
  await expect(async () => {
    await openGroups(panel);
    const shown = await files.evaluateAll((items) =>
      items.map((item) => item.getAttribute('data-file-name') ?? '')
    );
    expect(shown.map((file) => asNamed(file, names)).toSorted()).toEqual(names.toSorted());
  }).toPass({ timeout: FILES_SETTLE_WITHIN });

  for (const name of names) {
    await expect(panel.locator(fileSelector(name))).toBeVisible();
  }
}

/** The name the seed gives a shown file: its prefix entry when one covers it, else itself. */
export function asNamed(file: string, names: string[]): string {
  return (
    names.find((name) => name.endsWith(PREFIX) && file.startsWith(name.slice(0, -PREFIX.length))) ??
    file
  );
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
    await results.file(LOG_FILE).click(NO_NAVIGATION);
    await expect(results.logs).toContainText('Task execution completed.');
    await expect(results.preview.entity.card).toHaveCount(0);
  }

  for (const [file, shown] of Object.entries(completed.views ?? {})) {
    await results.file(file).click(NO_NAVIGATION);
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
