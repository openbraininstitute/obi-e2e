import { atlas, type SpeciesChoice } from '@locators/atlas';
import { expect, type Page } from '@playwright/test';

/**
 * Picks a species in the atlas selector.
 *
 * Every step waits on the state it needs, and nothing is retried by hand. The
 * selector is a skeleton with no test id while hierarchies load, so the first
 * wait is for the real control; choosing a species starts that load again, so
 * the last wait is for the control to come back wearing the new name. An open
 * list is closed before the trigger is pressed: Radix parks pointer events
 * off the page while its list is open, so a trigger pressed under an open list
 * is "intercepted" by <html> for as long as anyone cares to retry — a nightly
 * spent forty-five seconds a test doing exactly that.
 */
export async function chooseSpecies(page: Page, name: SpeciesChoice): Promise<void> {
  const controls = atlas(page);
  /*
   * `includeHidden`, because an open Radix list marks everything outside its
   * portal aria-hidden — the trigger included — and a role query stops seeing
   * it the moment the click succeeds.
   */
  const trigger = controls.speciesSelector.getByRole('combobox', { includeHidden: true });

  await expect(trigger).toBeEnabled();

  if ((await trigger.getAttribute('aria-expanded')) === 'true') {
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }

  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  await controls.speciesOption(name).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await expect(controls.speciesSelector).toContainText(name);
}

/** Every species, through the selector — for pages that reach it without `?s=all`. */
export async function showAllSpecies(page: Page): Promise<void> {
  await chooseSpecies(page, 'All');
}
