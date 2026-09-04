/**
 * The number of toggles the listing's column chooser shows: one per column it
 * knows about, plus the "Select all" it adds itself.
 *
 * Derived from the two lists rather than written down, so moving a column from
 * one to the other does not also need a number changed, and a column added to
 * the application fails the count instead of passing unnoticed.
 */
export function toggleCount(shown: string[], hidden: string[]): number {
  return shown.length + hidden.length + 1;
}
